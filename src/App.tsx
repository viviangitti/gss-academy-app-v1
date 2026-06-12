import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Onboarding from './components/Onboarding';
import Home from './pages/Home';
import Library from './pages/Library';
import TrainingHub from './pages/TrainingHub';
import Objections from './pages/Objections';
import Scripts from './pages/Scripts';
import Techniques from './pages/Techniques';
import News from './pages/News';
import Favorites from './pages/Favorites';
import RolePlay from './pages/RolePlay';
import RolePlayVoice from './pages/RolePlayVoice';
import FollowUps from './pages/FollowUps';
import Boost from './pages/Boost';
import Rescue from './pages/Rescue';
import PreMeeting from './pages/PreMeeting';
import MessageCoach from './pages/MessageCoach';
import MeetingAnalysis from './pages/MeetingAnalysis';
import LostSales from './pages/LostSales';
import History from './pages/History';
import Privacy from './pages/Privacy';
import Install from './pages/Install';
import Feedback from './pages/Feedback';
import Sales from './pages/Sales';
import AICoach from './pages/AICoach';
import Profile from './pages/Profile';
import Controladoria from './pages/Controladoria';
import Offers from './pages/Offers';
import OffersAdmin from './pages/OffersAdmin';
import CompetitorIntel from './pages/CompetitorIntel';
import CompetitorAdmin from './pages/CompetitorAdmin';
import Urgency from './pages/Urgency';
import CommercialConditions from './pages/CommercialConditions';
import CommercialConditionsAdmin from './pages/CommercialConditionsAdmin';
import Playbook from './pages/Playbook';
import MarketingChat from './pages/MarketingChat';
import BrandGuide from './pages/BrandGuide';
import CampaignAnalysis from './pages/CampaignAnalysis';
import CopyGenerator from './pages/CopyGenerator';
import CampaignReview from './pages/CampaignReview';
import CopyReview from './pages/CopyReview';
import PreLaunch from './pages/PreLaunch';
import ContentToday from './pages/ContentToday';
import GestorPanel from './pages/GestorPanel';
import CoachVoice from './pages/CoachVoice';
import Auth from './pages/Auth';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { getRemoteProfile, saveRemoteProfile } from './services/firestore/profile';
import { pullData } from './services/firestore/sync';
import { loadData, saveData, KEYS } from './services/storage';
import type { UserProfile } from './types';
import type { Sale } from './services/goal';
import type { HistoryEntry } from './services/history';
import type { Favorite } from './services/favorites';
import type { LostSale } from './services/lostSales';
import type { DayData } from './services/day';
import { ErrorBoundary } from './components/ErrorBoundary';
import RequireAdmin from './components/RequireAdmin';
import './App.css';

function AppContent() {
  const { user, loading, firebaseEnabled } = useAuth();
  const [profileReady, setProfileReady] = useState(!firebaseEnabled);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem('gss_onboarding_done')
  );
  const [sessionExpired, setSessionExpired] = useState(false);
  const prevUserRef = useRef<typeof user | undefined>(undefined);

  // Detect session expiry: user transitions from logged-in to null
  useEffect(() => {
    if (loading) return;
    if (prevUserRef.current !== undefined && prevUserRef.current !== null && user === null) {
      // User was logged in and is now signed out — check if they had a profile
      const profile = localStorage.getItem('gss_profile');
      if (profile) {
        try {
          const parsed = JSON.parse(profile);
          if (parsed.name) {
            setSessionExpired(true);
          }
        } catch {
          // ignore malformed data
        }
      }
    }
    prevUserRef.current = user;
  }, [user, loading]);

  // Quando usuário loga, garantimos que o perfil local reflete o remoto
  useEffect(() => {
    if (!firebaseEnabled) {
      setProfileReady(true);
      return;
    }
    if (!user) {
      setProfileReady(true);
      return;
    }
    (async () => {
      const uid = user.uid;

      // 1. Perfil
      const remote = await getRemoteProfile(uid);
      if (remote) {
        // Preserva userAccessType local se o Firestore ainda não tem
        const local = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
        const mergedAccessType = remote.userAccessType || local.userAccessType;
        const merged: UserProfile = {
          ...remote,
          userAccessType: mergedAccessType,
          // isMarketing não controla mais roteamento — mantém como está no remote
        };
        saveData(KEYS.PROFILE, merged);
      } else {
        const local = loadData<UserProfile>(KEYS.PROFILE, {
          name: user.displayName || '',
          role: '',
          company: '',
          segment: '',
          monthlyGoal: 0,
        });
        const merged: UserProfile = {
          ...local,
          name: local.name || user.displayName || '',
          email: user.email || '',
          uid,
          createdAt: Date.now(),
        };
        await saveRemoteProfile(uid, merged);
        saveData(KEYS.PROFILE, merged);
      }

      // 2. Dados do app — puxa do Firestore se existir, senão mantém localStorage
      const [sales, history, favorites, lostSales, dayArr] = await Promise.all([
        pullData<Sale>(uid, 'sales'),
        pullData<HistoryEntry>(uid, 'history'),
        pullData<Favorite>(uid, 'favorites'),
        pullData<LostSale>(uid, 'lostSales'),
        pullData<DayData>(uid, 'day'),
      ]);

      if (sales) localStorage.setItem('gss_sales', JSON.stringify(sales));
      if (history) localStorage.setItem('gss_history', JSON.stringify(history));
      if (favorites) localStorage.setItem('gss_favorites', JSON.stringify(favorites));
      if (lostSales) localStorage.setItem('gss_lost_sales', JSON.stringify(lostSales));
      if (dayArr?.[0]) {
        // Merge: só sobrescreve se Firestore for mais recente que o localStorage
        const remoteDay = dayArr[0];
        const localRaw = localStorage.getItem('gss_day');
        const localDay = localRaw ? JSON.parse(localRaw) : null;
        const today = new Date().toISOString().split('T')[0];
        // Se o local tem dados do dia de hoje, mantém o local (pode ser mais atualizado)
        if (!localDay || localDay.date !== today) {
          localStorage.setItem('gss_day', JSON.stringify(remoteDay));
        }
      }

      setProfileReady(true);
    })();
  }, [user, firebaseEnabled]);

  if (loading || !profileReady) {
    return (
      <div className="app-loading">
        <div className="app-loading-logo">GSS</div>
      </div>
    );
  }

  // Se Firebase está ativo e não há usuário logado → tela de auth
  if (firebaseEnabled && !user) {
    return <Auth sessionExpired={sessionExpired} />;
  }

  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }

  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });

  // Controladoria → só tela de metas
  if (profile.isControladoria) {
    return (
      <BrowserRouter>
        <TitleManager />
        <div className="app">
          <Header />
          <main className="app-content">
            <Routes>
              <Route path="*" element={<Controladoria />} />
              <Route path="/perfil" element={<Profile />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    );
  }

  // Todos os perfis (vendas, marketing, ambos) vêem o app completo.
  // Marketing/ambos têm acesso adicional ao hub de marketing dentro do mesmo app.
  return (
    <BrowserRouter>
      <TitleManager />
      <div className="app">
        <Header />
        <main className="app-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/biblioteca" element={<Library />} />
            <Route path="/objecoes" element={<Objections />} />
            <Route path="/scripts" element={<Scripts />} />
            <Route path="/tecnicas" element={<Techniques />} />
            <Route path="/noticias" element={<News />} />
            <Route path="/favoritos" element={<Favorites />} />
            <Route path="/treino-hub" element={<TrainingHub />} />
            <Route path="/treino" element={<RolePlay />} />
            <Route path="/treino-voz" element={<RolePlayVoice />} />
            <Route path="/follow-ups" element={<FollowUps />} />
            <Route path="/boost" element={<Boost />} />
            <Route path="/rescue" element={<Rescue />} />
            <Route path="/pre-reuniao" element={<PreMeeting />} />
            <Route path="/coach-mensagem" element={<MessageCoach />} />
            <Route path="/analise-reuniao" element={<MeetingAnalysis />} />
            <Route path="/vendas-perdidas" element={<LostSales />} />
            <Route path="/historico" element={<History />} />
            <Route path="/privacidade" element={<Privacy />} />
            <Route path="/instalar" element={<Install />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/vendas" element={<Sales />} />
            <Route path="/ia-coach" element={<AICoach />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/controladoria" element={<Controladoria />} />
            <Route path="/ofertas" element={<Offers />} />
            <Route path="/ofertas-admin" element={<RequireAdmin allowMarketing><OffersAdmin /></RequireAdmin>} />
            <Route path="/concorrencia" element={<CompetitorIntel />} />
            <Route path="/concorrencia-admin" element={<RequireAdmin allowMarketing><CompetitorAdmin /></RequireAdmin>} />
            <Route path="/gatilhos" element={<Urgency />} />
            <Route path="/condicoes" element={<CommercialConditions />} />
            <Route path="/condicoes-admin" element={<RequireAdmin allowMarketing><CommercialConditionsAdmin /></RequireAdmin>} />
            <Route path="/playbook" element={<Playbook />} />
            <Route path="/marketing-hub" element={<Navigate to="/biblioteca" replace />} />
            <Route path="/marketing-chat" element={<MarketingChat />} />
            <Route path="/guia-marca" element={<BrandGuide />} />
            <Route path="/analise-campanha" element={<CampaignAnalysis />} />
            <Route path="/gerador-copy" element={<CopyGenerator />} />
            <Route path="/pos-campanha" element={<CampaignReview />} />
            <Route path="/revisar-copy" element={<CopyReview />} />
            <Route path="/pre-lancamento" element={<PreLaunch />} />
            <Route path="/conteudo-dia" element={<ContentToday />} />
            <Route path="/painel-gestor" element={<GestorPanel />} />
            <Route path="/coach-voz" element={<CoachVoice />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

const ROUTE_TITLES: Record<string, string> = {
  '/':                  'GSS — Início',
  '/noticias':          'GSS — Notícias',
  '/biblioteca':        'GSS — Painel',
  '/objecoes':          'GSS — Objeções',
  '/scripts':           'GSS — Scripts',
  '/tecnicas':          'GSS — Técnicas',
  '/favoritos':         'GSS — Favoritos',
  '/treino-hub':        'GSS — Treino',
  '/treino':            'GSS — Role-play',
  '/treino-voz':        'GSS — Treino falado',
  '/follow-ups':        'GSS — Follow-ups',
  '/boost':             'GSS — Boost',
  '/rescue':            'GSS — Rescue',
  '/pre-reuniao':       'GSS — Pré-reunião',
  '/coach-mensagem':    'GSS — Revisar Mensagem',
  '/analise-reuniao':   'GSS — Pós-reunião',
  '/vendas-perdidas':   'GSS — Vendas Perdidas',
  '/historico':         'GSS — Histórico',
  '/vendas':            'GSS — Vendas',
  '/ia-coach':          'GSS — Coaching',
  '/perfil':            'GSS — Perfil',
  '/ofertas':           'GSS — Ofertas',
  '/concorrencia':      'GSS — Inteligência Competitiva',
  '/condicoes':         'GSS — Condições Comerciais',
  '/condicoes-admin':   'GSS — Campanhas e Condições',
  '/playbook':          'GSS — Playbook',
  '/marketing-hub':     'GSS — Marketing',
  '/marketing-chat':    'GSS — Copiloto de Marketing',
  '/guia-marca':        'GSS — Guia de Marca',
  '/analise-campanha':  'GSS — Análise de Campanha',
  '/gerador-copy':      'GSS — Gerador de Copy',
  '/pos-campanha':      'GSS — Pós-campanha',
  '/revisar-copy':      'GSS — Revisar Copy',
  '/pre-lancamento':    'GSS — Pré-lançamento',
  '/conteudo-dia':      'GSS — Conteúdo do Dia',
  '/painel-gestor':     'GSS — Painel do Gestor',
  '/coach-voz':         'GSS — Coach por Voz',
  '/gatilhos':          'GSS — Gatilhos',
  '/feedback':          'GSS — Feedback',
  '/instalar':          'GSS — Instalar App',
  '/privacidade':       'GSS — Privacidade',
};

function TitleManager() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = ROUTE_TITLES[pathname] ?? 'GSS';
  }, [pathname]);
  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
