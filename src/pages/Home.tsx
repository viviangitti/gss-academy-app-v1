import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Target, Newspaper, ExternalLink, Star, ArrowRight, Plus, Check, X, Clock, CheckSquare, TrendingUp, Award, Activity, MessageCircle } from 'lucide-react';
import { loadData, KEYS } from '../services/storage';
import { fetchNews } from '../services/news';
import { getFavorites } from '../services/favorites';
import { getDay, addMeeting, removeMeeting, addTask, toggleTask, removeTask } from '../services/day';
import { getStats, addSale, getDailyAccumulation } from '../services/goal';
import { getWeekStats } from '../services/history';
import { markActive, getWelcomeBackMessage } from '../services/notifications';
import type { WeekStats } from '../services/history';
import { SEGMENTS } from '../types';
import type { UserProfile, NewsItem } from '../types';
import type { Favorite } from '../services/favorites';
import type { DayData } from '../services/day';
import type { GoalStats } from '../services/goal';
import './Home.css';

const TIPS = [
  'Comece cada dia revisando suas metas de comissão.',
  'Escute mais do que fala. O cliente que fala, compra.',
  'Faça o acompanhamento em até 24h. Velocidade fecha negócios.',
  'Prepare pelo menos 3 respostas para cada objeção comum.',
  'Rituais diários criam consistência. Consistência gera comissão.',
  'Pergunte "O que te impede de fechar hoje?" para acelerar decisões.',
  'Comemore cada pequena vitória — celebrar faz parte do processo.',
  'Revise seus números toda sexta-feira para ajustar a rota.',
  'Antes de qualquer reunião, use o modo Pré-reunião do app.',
  'Conheça as objeções do seu segmento como a palma da mão.',
];

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
}

export default function Home() {
  const navigate = useNavigate();
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);
  const [greeting, setGreeting] = useState('');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [segmentLabel, setSegmentLabel] = useState('');
  const [favs, setFavs] = useState<Favorite[]>([]);
  const [day, setDay] = useState<DayData>({ date: '', meetings: [], tasks: [] });
  const [newMeeting, setNewMeeting] = useState({ time: '', title: '' });
  const [newTask, setNewTask] = useState('');
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [goal, setGoal] = useState(0);
  const [stats, setStats] = useState<GoalStats | null>(null);
  const [weekStats, setWeekStats] = useState<WeekStats | null>(null);
  const [welcomeBack, setWelcomeBack] = useState<string | null>(null);
  const [showAddSale, setShowAddSale] = useState(false);
  const [saleForm, setSaleForm] = useState({ amount: '', commission: '', client: '' });
  const [showFeedbackBanner, setShowFeedbackBanner] = useState(false);

  const refreshStats = (g: number) => {
    setStats(getStats(g));
  };

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');

    const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '', monthlyGoal: 0 });
    if (profile.segment) {
      setSegmentLabel(SEGMENTS.find(s => s.value === profile.segment)?.label || '');
      fetchNews(profile.segment).then(items => setNews(items.slice(0, 3)));
    }
    const g = profile.monthlyGoal || 0;
    setGoal(g);
    refreshStats(g);

    setFavs(getFavorites().sort((a, b) => b.addedAt - a.addedAt).slice(0, 3));
    setDay(getDay());

    const ws = getWeekStats();
    if (ws.totalInteractions > 0) setWeekStats(ws);

    setWelcomeBack(getWelcomeBackMessage());
    markActive();

    // Lembrete semanal de feedback — mostra se faz 7+ dias sem feedback ou sem dispensar
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const lastAction = Number(localStorage.getItem('gss_feedback_last_action') || 0);
    if (Date.now() - lastAction > WEEK_MS) {
      setShowFeedbackBanner(true);
    }
  }, []);

  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '', monthlyGoal: 0 });
  const name = profile.name ? `, ${profile.name.split(' ')[0]}` : '';

  const handleAddMeeting = () => {
    if (!newMeeting.title.trim() || !newMeeting.time) return;
    setDay(addMeeting(newMeeting));
    setNewMeeting({ time: '', title: '' });
    setShowNewMeeting(false);
  };

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    setDay(addTask(newTask.trim()));
    setNewTask('');
  };

  const handleRegisterSale = () => {
    const amount = Number(saleForm.amount);
    const commission = Number(saleForm.commission);
    if (!amount || !saleForm.client.trim()) return;
    addSale(amount, commission || 0, saleForm.client);
    refreshStats(goal);
    setSaleForm({ amount: '', commission: '', client: '' });
    setShowAddSale(false);
  };

  const pendingTasks = day.tasks.filter(t => !t.done).length;
  const totalTasks = day.tasks.length;
  const pendingFromYesterday = day.tasks.filter(t => t.fromYesterday && !t.done);

  const chartData = stats && goal > 0 ? getDailyAccumulation() : [];
  const maxVal = Math.max(goal, ...chartData.map(d => d.accumulated), 1);

  const dismissFeedbackBanner = () => {
    localStorage.setItem('gss_feedback_last_action', String(Date.now()));
    setShowFeedbackBanner(false);
  };

  const goToFeedback = () => {
    localStorage.setItem('gss_feedback_last_action', String(Date.now()));
    setShowFeedbackBanner(false);
    navigate('/feedback');
  };

  return (
    <div className="home">

      {/* Banner semanal de feedback */}
      {showFeedbackBanner && (
        <div className="feedback-banner card">
          <MessageCircle size={18} className="feedback-banner-icon" />
          <div className="feedback-banner-text">
            <strong>Como está o app?</strong>
            <span>Leva 1 minuto — seu feedback melhora a ferramenta para toda a equipe.</span>
          </div>
          <button className="feedback-banner-cta" onClick={goToFeedback}>Avaliar</button>
          <button className="feedback-banner-close" onClick={dismissFeedbackBanner} aria-label="Fechar">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="greeting-card card">
        <h2>{greeting}{name}!</h2>
        <p className="greeting-date">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {welcomeBack && (
        <div className="welcome-back card" onClick={() => setWelcomeBack(null)}>
          <span>👋 {welcomeBack}</span>
          <X size={14} />
        </div>
      )}

      <button className="premeeting-btn" onClick={() => navigate('/pre-reuniao')}>
        <Zap size={18} />
        <span>Vou entrar numa reunião</span>
      </button>

      {/* Meta de comissão */}
      {stats && goal > 0 && (
        <div className="day-section">
          <div className="day-section-header">
            <h3 className="section-title"><Award size={16} /> Meta de comissão do mês</h3>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/vendas')}>
                Ver extrato
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => setShowAddSale(!showAddSale)}>
                <Plus size={12} /> Registrar
              </button>
            </div>
          </div>

          {showAddSale && (
            <div className="new-sale card">
              <input
                type="text"
                placeholder="Cliente"
                value={saleForm.client}
                onChange={e => setSaleForm({ ...saleForm, client: e.target.value })}
                className="sale-client-input"
              />
              <input
                type="number"
                placeholder="Venda R$"
                value={saleForm.amount}
                onChange={e => setSaleForm({ ...saleForm, amount: e.target.value })}
                className="sale-amount-input"
              />
              <input
                type="number"
                placeholder="Comissão R$"
                value={saleForm.commission}
                onChange={e => setSaleForm({ ...saleForm, commission: e.target.value })}
                className="sale-amount-input"
              />
              <button className="btn btn-primary btn-sm" onClick={handleRegisterSale}>
                <Check size={14} />
              </button>
            </div>
          )}

          <div className="goal-card card">
            <div className="goal-numbers">
              <div>
                <span className="goal-value">{formatBRL(stats.monthCommission)}</span>
                <span className="goal-of">de {formatBRL(stats.goal)} em comissão</span>
              </div>
              <span className={`goal-pace goal-pace-${stats.pace}`}>
                {stats.pace === 'adiantado' && '🔥 Adiantado'}
                {stats.pace === 'no_ritmo' && '✅ No ritmo'}
                {stats.pace === 'atras' && '⚠️ Atrás'}
              </span>
            </div>

            <div className="goal-progress-bar">
              <div className="goal-progress-fill" style={{ width: `${stats.progress}%` }} />
            </div>

            <div className="goal-stats-row">
              <div>
                <span className="goal-stat-label">Progresso</span>
                <span className="goal-stat-value">{Math.round(stats.progress)}%</span>
              </div>
              <div>
                <span className="goal-stat-label">Dias restantes</span>
                <span className="goal-stat-value">{stats.daysLeft}</span>
              </div>
              <div>
                <span className="goal-stat-label">Por dia</span>
                <span className="goal-stat-value">{formatBRL(stats.dailyTarget)}</span>
              </div>
            </div>

            {chartData.length > 1 && (
              <div className="goal-chart">
                <svg viewBox={`0 0 ${chartData.length * 20} 60`} preserveAspectRatio="none">
                  <polyline
                    points={chartData.map((d, i) => `${i * 20},${60 - (d.accumulated / maxVal) * 55}`).join(' ')}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="0" y1={60 - (goal / maxVal) * 55}
                    x2={chartData.length * 20} y2={60 - (goal / maxVal) * 55}
                    stroke="var(--text-soft)" strokeWidth="1" strokeDasharray="3 3"
                  />
                </svg>
                <span className="goal-chart-label">Comissão acumulada no mês</span>
              </div>
            )}
          </div>
        </div>
      )}

      {stats && goal === 0 && (
        <div className="goal-setup card" onClick={() => navigate('/perfil')}>
          <TrendingUp size={18} />
          <div>
            <strong>Defina sua meta de comissão</strong>
            <p>Configure no perfil para acompanhar seu progresso.</p>
          </div>
          <ArrowRight size={14} />
        </div>
      )}

      {/* Progresso semanal */}
      {weekStats && (
        <div className="day-section">
          <div className="day-section-header">
            <h3 className="section-title"><Activity size={16} /> Essa semana</h3>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/historico')}>Ver histórico</button>
          </div>
          <div className="week-stats card">
            <div className="week-stat">
              <span className="week-stat-value">{weekStats.messages}</span>
              <span className="week-stat-label">Mensagens</span>
            </div>
            <div className="week-stat">
              <span className="week-stat-value">{weekStats.meetings}</span>
              <span className="week-stat-label">Reuniões</span>
            </div>
            <div className="week-stat">
              <span className="week-stat-value">
                {weekStats.averageSimScore !== null ? weekStats.averageSimScore.toFixed(1) : weekStats.simulations}
              </span>
              <span className="week-stat-label">
                {weekStats.averageSimScore !== null ? 'Nota média' : 'Treinos'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Reuniões de hoje */}
      <div className="day-section">
        <div className="day-section-header">
          <h3 className="section-title"><Clock size={16} /> Reuniões de hoje</h3>
          <button className="btn btn-outline btn-sm" onClick={() => setShowNewMeeting(!showNewMeeting)}>
            <Plus size={12} /> Nova
          </button>
        </div>

        {showNewMeeting && (
          <div className="new-meeting card">
            <input type="time" value={newMeeting.time} onChange={e => setNewMeeting({ ...newMeeting, time: e.target.value })} className="meeting-time-input" />
            <input type="text" placeholder="Cliente / reunião" value={newMeeting.title} onChange={e => setNewMeeting({ ...newMeeting, title: e.target.value })} className="meeting-title-input" />
            <button className="btn btn-primary btn-sm" onClick={handleAddMeeting}><Check size={14} /></button>
          </div>
        )}

        {day.meetings.length === 0 && !showNewMeeting ? (
          <div className="day-empty">Nenhuma reunião agendada para hoje.</div>
        ) : (
          <div className="meetings-list">
            {day.meetings.map(m => (
              <div key={m.id} className="meeting-item card">
                <span className="meeting-time">{m.time}</span>
                <span className="meeting-title">{m.title}</span>
                <button className="meeting-remove" onClick={() => setDay(removeMeeting(m.id))}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tarefas */}
      <div className="day-section">
        <div className="day-section-header">
          <h3 className="section-title">
            <CheckSquare size={16} /> Tarefas
            {totalTasks > 0 && <span className="task-counter">{totalTasks - pendingTasks}/{totalTasks}</span>}
          </h3>
        </div>

        {pendingFromYesterday.length > 0 && (
          <div className="yesterday-hint">
            {pendingFromYesterday.length} tarefa{pendingFromYesterday.length > 1 ? 's' : ''} de ontem {pendingFromYesterday.length > 1 ? 'continuam' : 'continua'} pendente.
          </div>
        )}

        <div className="tasks-card card">
          {day.tasks.length === 0 && (
            <div className="day-empty" style={{ padding: '14px 0', borderStyle: 'none' }}>
              Nenhuma tarefa. Adicione abaixo.
            </div>
          )}
          {day.tasks.map(t => (
            <div key={t.id} className={`task-row ${t.done ? 'done' : ''} ${t.fromYesterday ? 'from-yesterday' : ''}`}>
              <button className="task-check" onClick={() => setDay(toggleTask(t.id))}>
                {t.done && <Check size={12} />}
              </button>
              <span className="task-text">{t.text}</span>
              {t.fromYesterday && <span className="yesterday-badge">ontem</span>}
              <button className="task-remove" onClick={() => setDay(removeTask(t.id))}>
                <X size={12} />
              </button>
            </div>
          ))}
          <div className="task-add-row">
            <input type="text" placeholder="Adicionar tarefa..." value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTask()} className="task-input" />
            <button className="task-add-btn" onClick={handleAddTask} disabled={!newTask.trim()}>
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="tip-card card">
        <div className="tip-icon"><Target size={18} /></div>
        <p className="tip-text">{tip}</p>
      </div>

      {favs.length > 0 && (
        <div className="home-favs">
          <div className="news-section-header">
            <h3 className="section-title"><Star size={16} /> Seus favoritos</h3>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/favoritos')}>Ver todos</button>
          </div>
          {favs.map(f => (
            <button key={`${f.type}-${f.id}`} className="home-fav-item card" onClick={() => {
              const route = f.type === 'objection' ? '/objecoes'
                : f.type === 'script' ? '/scripts'
                : f.type === 'technique' ? '/tecnicas'
                : '/scripts';
              navigate(route);
            }}>
              <span>{f.label}</span>
              <ArrowRight size={14} />
            </button>
          ))}
        </div>
      )}

      {news.length > 0 && (
        <div className="home-news">
          <div className="news-section-header">
            <h3 className="section-title"><Newspaper size={16} /> {segmentLabel}</h3>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/noticias')}>Ver mais</button>
          </div>
          {news.map((item, i) => (
            <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className="home-news-item card">
              <h4>{item.title}</h4>
              <ExternalLink size={12} />
            </a>
          ))}
        </div>
      )}

      {/* FAB: Registrar venda rápida */}
      <button className="fab-sale" onClick={() => setShowAddSale(true)} title="Registrar venda">
        <TrendingUp size={22} />
      </button>

      {/* Modal de venda rápida */}
      {showAddSale && (
        <div className="quick-sale-overlay" onClick={() => setShowAddSale(false)}>
          <div className="quick-sale-sheet" onClick={e => e.stopPropagation()}>
            <div className="quick-sale-handle" />
            <h3 className="quick-sale-title"><TrendingUp size={18} /> Registrar venda</h3>
            <div className="quick-sale-fields">
              <div className="quick-sale-field">
                <label>Comissão R$ <span className="required">*</span></label>
                <input
                  type="number"
                  placeholder="Ex: 800"
                  value={saleForm.commission}
                  onChange={e => setSaleForm({ ...saleForm, commission: e.target.value })}
                  autoFocus
                  inputMode="numeric"
                />
              </div>
              <div className="quick-sale-field">
                <label>Valor da venda R$</label>
                <input
                  type="number"
                  placeholder="Ex: 10000"
                  value={saleForm.amount}
                  onChange={e => setSaleForm({ ...saleForm, amount: e.target.value })}
                  inputMode="numeric"
                />
              </div>
              <div className="quick-sale-field">
                <label>Cliente</label>
                <input
                  type="text"
                  placeholder="Nome do cliente"
                  value={saleForm.client}
                  onChange={e => setSaleForm({ ...saleForm, client: e.target.value })}
                />
              </div>
            </div>
            <button
              className="btn btn-primary quick-sale-btn"
              onClick={() => {
                if (!saleForm.commission) return;
                const commission = Number(saleForm.commission);
                const amount = Number(saleForm.amount) || commission;
                addSale(amount, commission, saleForm.client || 'Venda');
                refreshStats(goal);
                setSaleForm({ amount: '', commission: '', client: '' });
                setShowAddSale(false);
              }}
            >
              <Check size={16} /> Confirmar venda
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
