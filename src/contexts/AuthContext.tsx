import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthChange, type AuthUser } from '../services/auth';
import { firebaseEnabled } from '../services/firebase';
import { resetChat } from '../services/gemini';
import { getRemoteProfile, saveRemoteProfile } from '../services/firestore/profile';
import { loadData, saveData, KEYS } from '../services/storage';
import type { UserProfile } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  firebaseEnabled: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  firebaseEnabled: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(firebaseEnabled);

  useEffect(() => {
    if (!firebaseEnabled) {
      setLoading(false);
      return;
    }

    const unsub = onAuthChange(async u => {
      if (!u) {
        resetChat();
        setUser(null);
        setLoading(false);
        return;
      }

      // Tenta carregar perfil remoto do Firestore
      try {
        const remote = await getRemoteProfile(u.uid);

        if (remote) {
          // Perfil já existe — sincroniza para o localStorage
          saveData(KEYS.PROFILE, remote);
        } else {
          // Novo usuário (Google ou email) — cria perfil mínimo com dados do Auth
          const local = loadData<UserProfile>(KEYS.PROFILE, {
            name: '', role: '', company: '', segment: '', monthlyGoal: 0,
          });

          const minimal: UserProfile = {
            name: u.displayName || local.name || '',
            role: local.role || '',
            company: local.company || '',
            segment: local.segment || '',
            monthlyGoal: local.monthlyGoal || 0,
            email: u.email || '',
            uid: u.uid,
            teamId: null,
            isAdmin: false,
            createdAt: Date.now(),
          };

          saveData(KEYS.PROFILE, minimal);
          await saveRemoteProfile(u.uid, minimal);
        }
      } catch {
        // Offline — usa dados locais, não bloqueia o login
      }

      setUser(u);
      setLoading(false);
    });

    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, firebaseEnabled }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
