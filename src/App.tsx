import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Onboarding from './components/Onboarding';
import AppTour from './components/AppTour';
import Home from './pages/Home';
import Auth from './pages/Auth';
// Demais páginas carregadas sob demanda (code-splitting) — acelera a 1ª abertura.
const Library = lazy(() => import('./pages/Library'));
const TrainingHub = lazy(() => import('./pages/TrainingHub'));
const Objections = lazy(() => import('./pages/Objections'));
const Scripts = lazy(() => import('./pages/Scripts'));
const Techniques = lazy(() => import('./pages/Techniques'));
const News = lazy(() => import('./pages/News'));
const Favorites = lazy(() => import('./pages/Favorites'));
const RolePlay = lazy(() => import('./pages/RolePlay'));
const RolePlayVoice = lazy(() => import('./pages/RolePlayVoice'));
const FollowUps = lazy(() => import('./pages/FollowUps'));
const Boost = lazy(() => import('./pages/Boost'));
const Negociacoes = lazy(() => import('./pages/Negociacoes'));
const Maestria = lazy(() => import('./pages/Maestria'));
const CriarConteudo = lazy(() => import('./pages/CriarConteudo'));
const RaioX = lazy(() => import('./pages/RaioX'));
const Rescue = lazy(() => import('./pages/Rescue'));
const MyReport = lazy(() => import('./pages/MyReport'));
const AppMap = lazy(() => import('./pages/AppMap'));
const PreMeeting = lazy(() => import('./pages/PreMeeting'));
const MessageCoach = lazy(() => import('./pages/MessageCoach'));
const MeetingAnalysis = lazy(() => import('./pages/MeetingAnalysis'));
const LostSales = lazy(() => import('./pages/LostSales'));
const History = lazy(() => import('./pages/History'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Install = lazy(() => import('./pages/Install'));
const Feedback = lazy(() => import('./pages/Feedback'));
const Sales = lazy(() => import('./pages/Sales'));
const AICoach = lazy(() => import('./pages/AICoach'));
const Profile = lazy(() => import('./pages/Profile'));
const Offers = lazy(() => import('./pages/Offers'));
const OffersAdmin = lazy(() => import('./pages/OffersAdmin'));
const CompetitorIntel = lazy(() => import('./pages/CompetitorIntel'));
const CompetitorAdmin = lazy(() => import('./pages/CompetitorAdmin'));
const Urgency = lazy(() => import('./pages/Urgency'));
const CommercialConditions = lazy(() => import('./pages/CommercialConditions'));
const CommercialConditionsAdmin = lazy(() => import('./pages/CommercialConditionsAdmin'));
const Playbook = lazy(() => import('./pages/Playbook'));
const MarketingChat = lazy(() => import('./pages/MarketingChat'));
const BrandGuide = lazy(() => import('./pages/BrandGuide'));
const CampaignAnalysis = lazy(() => import('./pages/CampaignAnalysis'));
const CopyGenerator = lazy(() => import('./pages/CopyGenerator'));
const CampaignReview = lazy(() => import('./pages/CampaignReview'));
const CopyReview = lazy(() => import('./pages/CopyReview'));
const PreLaunch = lazy(() => import('./pages/PreLaunch'));
const ContentToday = lazy(() => import('./pages/ContentToday'));
const GestorPanel = lazy(() => import('./pages/GestorPanel'));
const CoachVoice = lazy(() => import('./pages/CoachVoice'));
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
  const [introDismissed, setIntroDismissed] = useState(false);
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

  // Tour guiado de boas-vindas — só no PRIMEIRO acesso da conta (controle no perfil/Firestore).
  // Renderizado SOBRE a Início real (coach-marks), por isso não é mais um return antecipado.
  const showTour = !profile.introSeen && !introDismissed;
  const dismissTour = () => {
    const updated = { ...profile, introSeen: true };
    saveData(KEYS.PROFILE, updated);
    if (user) saveRemoteProfile(user.uid, updated).catch(() => {});
    setIntroDismissed(true);
  };

  // Todos os perfis (vendas, marketing, ambos) vêem o app completo.
  // Marketing/ambos têm acesso adicional ao hub de marketing dentro do mesmo app.
  return (
    <BrowserRouter>
      <TitleManager />
      <div className="app">
        <Header />
        <main className="app-content">
          <Suspense fallback={<PageFallback />}>
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
            <Route path="/negociacoes" element={<Negociacoes />} />
            <Route path="/maestria" element={<Maestria />} />
            <Route path="/criar-conteudo" element={<CriarConteudo />} />
            <Route path="/raio-x" element={<RaioX />} />
            <Route path="/rescue" element={<Rescue />} />
            <Route path="/meu-raiox" element={<MyReport />} />
            <Route path="/mapa" element={<AppMap />} />
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
          </Suspense>
        </main>
        <BottomNav />
        {showTour && <AppTour onClose={dismissTour} />}
      </div>
    </BrowserRouter>
  );
}

const ROUTE_TITLES: Record<string, string> = {
  '/':                  'GSS — Painel Controle',
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
  '/boost':             'GSS — Cliente em atendimento',
  '/negociacoes':       'GSS — Negociações',
  '/maestria':          'GSS — Maestria',
  '/criar-conteudo':    'GSS — Criar conteúdo',
  '/raio-x':            'GSS — Raio X',
  '/rescue':            'GSS — Rescue',
  '/meu-raiox':         'GSS — Meu Raio-X',
  '/mapa':              'GSS — Mapa do app',
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

function PageFallback() {
  return (
    <div className="app-loading" style={{ minHeight: '70vh' }}>
      <div className="app-loading-logo">GSS</div>
    </div>
  );
}

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
