import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Newspaper, ExternalLink, ArrowRight, Plus, Check, X, TrendingUp, MessageCircle, Dumbbell, Megaphone, Sparkles, Share2, Users, Mic, Rocket, ChevronUp, ChevronDown } from 'lucide-react';
import { loadData, KEYS } from '../services/storage';
import { fetchNews } from '../services/news';
import { getFavorites } from '../services/favorites';
import { getDay, addTask, toggleTask, removeTask, moveTask } from '../services/day';
import { getStats, addSale, getDailyAccumulation } from '../services/goal';
import { getWeekStats } from '../services/history';
import { markActive, getWelcomeBackMessage } from '../services/notifications';
import { getDueFollowUps } from '../services/followups';
import type { FollowUp } from '../services/followups';
import DailyBriefing from '../components/DailyBriefing';
import type { WeekStats } from '../services/history';
import { SEGMENTS } from '../types';
import type { UserProfile, NewsItem } from '../types';
import type { Favorite } from '../services/favorites';
import type { DayData } from '../services/day';
import type { GoalStats } from '../services/goal';
import './Home.css';


function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
}

export default function Home() {
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [dueToday, setDueToday] = useState<FollowUp[]>([]);
  const [dueOverdue, setDueOverdue] = useState<FollowUp[]>([]);
  const [segmentLabel, setSegmentLabel] = useState('');
  const [favs, setFavs] = useState<Favorite[]>([]);
  const [day, setDay] = useState<DayData>({ date: '', meetings: [], tasks: [] });
  const [newTask, setNewTask] = useState('');
  const [goal, setGoal] = useState(0);
  const [stats, setStats] = useState<GoalStats | null>(null);
  const [weekStats, setWeekStats] = useState<WeekStats | null>(null);
  const [welcomeBack, setWelcomeBack] = useState<string | null>(null);
  const [showAddSale, setShowAddSale] = useState(false);   // inline form (Meta do mês)
  const [showQuickSale, setShowQuickSale] = useState(false); // FAB modal
  const [saleForm, setSaleForm] = useState({ amount: '', commission: '', client: '' });
  const [saleError, setSaleError] = useState(false);
  const [quickSaleError, setQuickSaleError] = useState(false);
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

    const due = getDueFollowUps();
    setDueToday(due.today);
    setDueOverdue(due.overdue);

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

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    setDay(addTask(newTask.trim()));
    setNewTask('');
  };

  const handleRegisterSale = () => {
    const amount = Number(saleForm.amount);
    const commission = Number(saleForm.commission);
    if (!amount || !saleForm.client.trim()) {
      setSaleError(true);
      return;
    }
    addSale(amount, commission || 0, saleForm.client);
    refreshStats(goal);
    setSaleForm({ amount: '', commission: '', client: '' });
    setSaleError(false);
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

      {/* Briefing do dia — meta, follow-ups, comissão em jogo, munição do mês */}
      <DailyBriefing />

      {/* Acabou um atendimento? Registra ganho OU perda — a IA aprende com os dois */}
      {profile.userAccessType !== 'marketing' && (
        <div className="home-outcome card" data-tour="outcome">
          <p className="home-outcome-q">Acabou um atendimento? Como foi?</p>
          <div className="home-outcome-btns">
            <button className="home-outcome-btn won" onClick={() => { setShowQuickSale(true); setQuickSaleError(false); }}>
              <Check size={18} /> Vendi!
            </button>
            <button className="home-outcome-btn lost" onClick={() => navigate('/vendas-perdidas')}>
              <X size={18} /> Não fechou
            </button>
          </div>
          <p className="home-outcome-note">Registrar os dois faz a IA aprender e melhora seu Raio-X.</p>
        </div>
      )}

      {welcomeBack && (
        <div className="welcome-back card" onClick={() => setWelcomeBack(null)}>
          <span>👋 {welcomeBack}</span>
          <X size={14} />
        </div>
      )}

      {/* Notícias em destaque */}
      {news.length > 0 && (
        <button className="home-news-hero card" onClick={() => navigate('/noticias')}>
          <div className="home-news-hero-top">
            <span className="home-news-hero-badge"><Newspaper size={12} /> Notícias</span>
            {segmentLabel && <span className="home-news-hero-segment">{segmentLabel}</span>}
          </div>
          <p className="home-news-hero-title">{news[0].title}</p>
          <div className="home-news-hero-footer">
            <span>Ver todas as notícias</span>
            <ExternalLink size={13} />
          </div>
        </button>
      )}

      {/* Follow-ups de hoje — onde está o dinheiro (aparece pra quem usa o recurso) */}
      {(dueToday.length > 0 || dueOverdue.length > 0) && (
        <button className="home-fu-card card" onClick={() => navigate('/follow-ups')}>
          <div className="home-fu-badge">{dueToday.length + dueOverdue.length}</div>
          <div className="home-fu-text">
            <strong>
              {dueOverdue.length > 0
                ? `${dueOverdue.length} follow-up${dueOverdue.length > 1 ? 's' : ''} atrasado${dueOverdue.length > 1 ? 's' : ''}!`
                : 'Follow-ups de hoje'}
            </strong>
            <span>
              {[...dueOverdue, ...dueToday].slice(0, 2).map(f => f.clientName).join(', ')}
              {dueToday.length + dueOverdue.length > 2 ? ` +${dueToday.length + dueOverdue.length - 2}` : ''}
              {' — toque pra ver'}
            </span>
          </div>
          <ArrowRight size={18} />
        </button>
      )}

      {/* Boost — SOS de argumentação */}
      {profile.userAccessType !== 'marketing' && (
        <button className="home-boost-card card" data-tour="boost" onClick={() => navigate('/boost')}>
          <div className="home-boost-icon"><Rocket size={22} /></div>
          <div className="home-boost-text">
            <strong>Boost 🚀</strong>
            <span>Cliente travou? 3 caminhos prontos em segundos</span>
          </div>
          <ArrowRight size={18} />
        </button>
      )}

      {/* Falar com o Coach — voz-primeiro */}
      <button className="home-voice-card card" onClick={() => navigate('/coach-voz')}>
        <div className="home-voice-orb"><Mic size={22} /></div>
        <div className="home-voice-text">
          <strong>Falar com o Coach</strong>
          <span>Converse por voz — tire dúvidas falando</span>
        </div>
        <ArrowRight size={18} />
      </button>

      {/* Meta de vendas — oculta para marketing puro */}
      {profile.userAccessType !== 'marketing' && stats && goal > 0 && (
        <div className="day-section">
          <div className="day-section-header">
            <h3 className="section-title">Meta do mês</h3>
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
                placeholder={saleError && !saleForm.client.trim() ? 'Cliente obrigatório!' : 'Cliente'}
                value={saleForm.client}
                onChange={e => { setSaleForm({ ...saleForm, client: e.target.value }); setSaleError(false); }}
                className={`sale-client-input${saleError && !saleForm.client.trim() ? ' input-error' : ''}`}
              />
              <input
                type="number"
                placeholder={saleError && !Number(saleForm.amount) ? 'Valor obrigatório!' : 'Venda R$'}
                value={saleForm.amount}
                onChange={e => { setSaleForm({ ...saleForm, amount: e.target.value }); setSaleError(false); }}
                className={`sale-amount-input${saleError && !Number(saleForm.amount) ? ' input-error' : ''}`}
              />
              <input
                type="number"
                placeholder="Vendas R$"
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
                <span className="goal-value">{formatBRL(stats.monthSales)}</span>
                <span className="goal-of">de {formatBRL(stats.goal)} em vendas</span>
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
                <span className="goal-chart-label">Vendas acumuladas no mês</span>
              </div>
            )}
          </div>

          {/* Mini-goal chips — metas adicionais de todos os segmentos */}
          {(profile.customGoals || []).some(cg => cg.label && cg.target > 0) && (
            <div className="goal-chips">
              {(profile.customGoals || []).filter(cg => cg.label && cg.target > 0).map((cg, i) => (
                <div key={i} className="goal-chip">
                  <span className="goal-chip-icon">{cg.icon || '🎯'}</span>
                  <span className="goal-chip-label">{cg.label}</span>
                  <span className="goal-chip-value">{formatBRL(cg.target)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Progresso semanal */}
      {weekStats && (
        <div className="day-section">
          <div className="day-section-header">
            <h3 className="section-title">Essa semana</h3>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/historico')}>Ver histórico</button>
          </div>
          <div className="week-stats card">
            <div className="week-stat">
              <span className="week-stat-value">{weekStats.messages}</span>
              <span className="week-stat-label">Mensagens</span>
            </div>
            <div className="week-stat">
              <span className="week-stat-value">{weekStats.simulations}</span>
              <span className="week-stat-label">Treinos</span>
            </div>
            <div className="week-stat">
              <span className="week-stat-value">
                {weekStats.averageSimScore !== null ? weekStats.averageSimScore.toFixed(1) : '—'}
              </span>
              <span className="week-stat-label">Nota média</span>
            </div>
          </div>
        </div>
      )}


      {/* ── Painel do Gestor (só gestor/admin) ── */}
      {(profile.isGestor || profile.isAdmin) && (
        <button className="home-content-card home-gestor-card card" onClick={() => navigate('/painel-gestor')}>
          <div className="home-content-icon home-gestor-icon"><Users size={20} /></div>
          <div className="home-content-text">
            <strong>Painel do Gestor</strong>
            <span>Veja o engajamento da equipe em conteúdo</span>
          </div>
          <ArrowRight size={16} className="home-train-arrow" />
        </button>
      )}

      {/* ── Conteúdo do Dia (social selling) ── */}
      <button className="home-content-card card" onClick={() => navigate('/conteudo-dia')}>
        <div className="home-content-icon"><Sparkles size={20} /></div>
        <div className="home-content-text">
          <strong>Conteúdo do Dia <Share2 size={13} /></strong>
          <span>Poste nas suas redes e ganhe pontos</span>
        </div>
        <ArrowRight size={16} className="home-train-arrow" />
      </button>

      {/* ── Acesso rápido: Vendas + Marketing (ambos) ou só um dos lados ── */}
      {profile.userAccessType === 'ambos' ? (
        <div className="home-dual-section">
          <div className="home-dual-label">Acesso rápido</div>
          <div className="home-dual-grid">
            <button className="home-dual-card home-dual-vendas card" onClick={() => navigate('/treino-hub')}>
              <div className="home-dual-icon"><Dumbbell size={18} /></div>
              <strong>Treino</strong>
              <span>Role-play, reuniões e mais</span>
            </button>
            <button className="home-dual-card home-dual-mkt card" onClick={() => navigate('/biblioteca')}>
              <div className="home-dual-icon"><Megaphone size={18} /></div>
              <strong>Marketing</strong>
              <span>Copy, guia e análise</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          <button className="home-train-card card" onClick={() => navigate('/treino-hub')}>
            <div className="home-train-icon"><Dumbbell size={18} /></div>
            <div className="home-train-text">
              <strong>Treino</strong>
              <span>Role-play, objeções, reuniões e mensagens</span>
            </div>
            <ArrowRight size={16} className="home-train-arrow" />
          </button>
          {profile.userAccessType === 'marketing' && (
            <button className="home-train-card home-mkt-card card" onClick={() => navigate('/biblioteca')}>
              <div className="home-train-icon home-mkt-icon"><Megaphone size={18} /></div>
              <div className="home-train-text">
                <strong>Painel Marketing</strong>
                <span>Copiloto, benchmarks, ofertas e concorrência</span>
              </div>
              <ArrowRight size={16} className="home-train-arrow" />
            </button>
          )}
        </>
      )}

      {/* Tarefas */}
      <div className="day-section">
        <div className="day-section-header">
          <h3 className="section-title">
            Tarefas do dia
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
          {day.tasks.map((t, i) => (
            <div key={t.id} className={`task-row ${t.done ? 'done' : ''} ${t.fromYesterday ? 'from-yesterday' : ''}`}>
              <button className="task-check" onClick={() => setDay(toggleTask(t.id))} aria-label={t.done ? 'Desmarcar tarefa' : 'Concluir tarefa'}>
                {t.done && <Check size={13} />}
              </button>
              <span className="task-text">{t.text}</span>
              {t.fromYesterday && <span className="yesterday-badge">ontem</span>}
              <div className="task-reorder">
                <button className="task-move" onClick={() => setDay(moveTask(t.id, -1))} disabled={i === 0} aria-label="Subir tarefa">
                  <ChevronUp size={14} />
                </button>
                <button className="task-move" onClick={() => setDay(moveTask(t.id, 1))} disabled={i === day.tasks.length - 1} aria-label="Descer tarefa">
                  <ChevronDown size={14} />
                </button>
              </div>
              <button className="task-remove" onClick={() => setDay(removeTask(t.id))} aria-label="Remover tarefa">
                <X size={12} />
              </button>
            </div>
          ))}
          <div className="task-add-row">
            <input type="text" placeholder="Adicionar tarefa..." value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTask()} className="task-input" />
            <button className="task-add-btn" onClick={handleAddTask} disabled={!newTask.trim()} aria-label="Adicionar tarefa">
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>

      {favs.length > 0 && (
        <div className="home-favs">
          <div className="news-section-header">
            <h3 className="section-title">Favoritos</h3>
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

      {/* FAB: Registrar venda rápida — oculto para marketing puro */}
      {profile.userAccessType !== 'marketing' && (
        <button className="fab-sale" onClick={() => { setShowQuickSale(true); setQuickSaleError(false); }} title="Registrar venda" aria-label="Registrar venda">
          <TrendingUp size={22} />
        </button>
      )}

      {/* Modal de venda rápida */}
      {showQuickSale && (
        <div className="quick-sale-overlay" onClick={() => setShowQuickSale(false)}>
          <div className="quick-sale-sheet" onClick={e => e.stopPropagation()}>
            <div className="quick-sale-handle" />
            <h3 className="quick-sale-title"><TrendingUp size={18} /> Registrar venda</h3>
            <div className="quick-sale-fields">
              <div className="quick-sale-field">
                <label>Vendas R$ <span className="required">*</span></label>
                <input
                  type="number"
                  placeholder={quickSaleError && !saleForm.commission ? 'Obrigatório!' : 'Ex: 800'}
                  value={saleForm.commission}
                  onChange={e => { setSaleForm({ ...saleForm, commission: e.target.value }); setQuickSaleError(false); }}
                  autoFocus
                  inputMode="numeric"
                  className={quickSaleError && !saleForm.commission ? 'input-error' : undefined}
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
                if (!saleForm.commission) {
                  setQuickSaleError(true);
                  return;
                }
                const commission = Number(saleForm.commission);
                const amount = Number(saleForm.amount) || commission;
                addSale(amount, commission, saleForm.client || 'Venda');
                refreshStats(goal);
                setSaleForm({ amount: '', commission: '', client: '' });
                setQuickSaleError(false);
                setShowQuickSale(false);
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
