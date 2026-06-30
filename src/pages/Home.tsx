import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, Check, X, TrendingUp, MessageCircle, ChevronUp, ChevronDown, Tag, Swords, Newspaper, Car } from 'lucide-react';
import { loadData, KEYS } from '../services/storage';
import { getFavorites } from '../services/favorites';
import { getDay, addTask, toggleTask, removeTask, moveTask } from '../services/day';
import { getStats, addSale, getDailyAccumulation, getModelProgress } from '../services/goal';
import { archiveIfNeeded } from '../services/goalHistory';
import { markActive, getWelcomeBackMessage } from '../services/notifications';
import { getDueFollowUps } from '../services/followups';
import { getStockForCompany } from '../services/firestore/stock';
import type { StockVehicle } from '../services/firestore/stock';
import QuickSaleSheet from '../components/QuickSaleSheet';
import ConditionReminder from '../components/ConditionReminder';
import type { FollowUp } from '../services/followups';
import type { UserProfile } from '../types';
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
  const [dueToday, setDueToday] = useState<FollowUp[]>([]);
  const [dueOverdue, setDueOverdue] = useState<FollowUp[]>([]);
  const [favs, setFavs] = useState<Favorite[]>([]);
  const [day, setDay] = useState<DayData>({ date: '', meetings: [], tasks: [] });
  const [newTask, setNewTask] = useState('');
  const [goal, setGoal] = useState(0);
  const [stats, setStats] = useState<GoalStats | null>(null);
  const [welcomeBack, setWelcomeBack] = useState<string | null>(null);
  const [stock, setStock] = useState<StockVehicle[]>([]);
  const [showAddSale, setShowAddSale] = useState(false);   // inline form (Meta do mês)
  const [showQuickSale, setShowQuickSale] = useState(false); // FAB modal
  const [saleForm, setSaleForm] = useState({ amount: '', model: '', client: '' });
  const [saleError, setSaleError] = useState(false);
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
    archiveIfNeeded(profile);   // congela o mês anterior se virou
    const g = profile.monthlyGoal || 0;
    setGoal(g);
    refreshStats(g);

    setFavs(getFavorites().sort((a, b) => b.addedAt - a.addedAt).slice(0, 3));
    setDay(getDay());

    const due = getDueFollowUps();
    setDueToday(due.today);
    setDueOverdue(due.overdue);

    setWelcomeBack(getWelcomeBackMessage());
    markActive();

    // Estoque parado (gestor cadastra; time vê) — isolado por concessionária
    getStockForCompany(profile.company).then(setStock).catch(() => { /* offline */ });

    // Lembrete diário de feedback — mostra se faz 1+ dia sem avaliar ou sem dispensar
    const DAY_MS = 24 * 60 * 60 * 1000;
    const lastAction = Number(localStorage.getItem('gss_feedback_last_action') || 0);
    if (Date.now() - lastAction > DAY_MS) {
      setShowFeedbackBanner(true);
    }
  }, []);

  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '', monthlyGoal: 0 });
  const name = profile.name ? `, ${profile.name.split(' ')[0]}` : '';
  const goalUnit = (profile.segment || '').startsWith('automotivo') ? 'carros' : 'vendas';
  const isStockManager = profile.isGestor === true || profile.isAdmin === true;

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    setDay(addTask(newTask.trim()));
    setNewTask('');
  };

  const handleRegisterSale = () => {
    if (!saleForm.model.trim()) {
      setSaleError(true);
      return;
    }
    addSale({ amount: Number(saleForm.amount) || 0, model: saleForm.model.trim(), client: saleForm.client.trim() || 'Venda' });
    refreshStats(goal);
    setSaleForm({ amount: '', model: '', client: '' });
    setSaleError(false);
    setShowAddSale(false);
  };

  const pendingTasks = day.tasks.filter(t => !t.done).length;
  const totalTasks = day.tasks.length;
  const pendingFromYesterday = day.tasks.filter(t => t.fromYesterday && !t.done);

  const chartData = stats && goal > 0 ? getDailyAccumulation() : [];
  const maxVal = Math.max(goal, ...chartData.map(d => d.accumulated), 1);
  const modelProgress = getModelProgress(profile.modelGoals || []);

  const dismissFeedbackBanner = () => {
    localStorage.setItem('gss_feedback_last_action', String(Date.now()));
    setShowFeedbackBanner(false);
  };

  const goToFeedback = () => {
    localStorage.setItem('gss_feedback_last_action', String(Date.now()));
    setShowFeedbackBanner(false);
    navigate('/feedback');
  };

  // Veículos destacados (gestor cadastra, time vê) — dividido por categoria.
  // Só veículos REAIS aparecem; sem nenhum, o vendedor vê "aguardando seu gestor".
  const antigos = stock.filter(v => !v.isExample && (v.category || 'antigo') !== 'premiacao');
  const premiados = stock.filter(v => !v.isExample && v.category === 'premiacao');

  const renderStockSection = (title: string, list: StockVehicle[], emptyTitle: string, emptySub: string) => {
    return (
      <div className="day-section">
        <div className="day-section-header">
          <h3 className="section-title">{title}</h3>
          {isStockManager && (
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/estoque-admin')}>
              {list.length > 0 ? 'Gerenciar' : 'Cadastrar'}
            </button>
          )}
        </div>
        {list.length === 0 ? (
          isStockManager ? (
            <button className="home-content-card card" onClick={() => navigate('/estoque-admin')}>
              <div className="home-content-icon"><Car size={20} /></div>
              <div className="home-content-text">
                <strong>{emptyTitle}</strong>
                <span>{emptySub}</span>
              </div>
              <ArrowRight size={16} className="home-train-arrow" />
            </button>
          ) : (
            <div className="stock-empty card">
              <div className="stock-icon"><Car size={18} /></div>
              <div className="stock-info">
                <strong>Aguardando seu gestor</strong>
                <span className="stock-note">Em breve os veículos aparecem aqui</span>
              </div>
            </div>
          )
        ) : (
          <div className="stock-list">
            {list.map(v => (
              <div key={v.id} className="stock-card card">
                <div className="stock-icon"><Car size={18} /></div>
                <div className="stock-info">
                  <strong>{v.model}</strong>
                  {[v.year, v.color, v.price].filter(Boolean).length > 0 && (
                    <span className="stock-meta">{[v.year, v.color, v.price].filter(Boolean).join(' • ')}</span>
                  )}
                  {v.note && <span className="stock-note">{v.note}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
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

      {/* Lembrete pro Marketing: subir a condição do mês (some ao publicar/dispensar) */}
      <ConditionReminder />

      {/* Tarefas do dia — logo após a saudação */}
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

      {/* Metas mensais — logo abaixo das Tarefas. Oculta para marketing puro. */}
      {profile.userAccessType !== 'marketing' && stats && goal > 0 && (
        <div className="day-section">
          <div className="day-section-header">
            <h3 className="section-title">Metas mensais</h3>
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
                placeholder={saleError && !saleForm.model.trim() ? 'Modelo obrigatório!' : 'Modelo vendido'}
                value={saleForm.model}
                onChange={e => { setSaleForm({ ...saleForm, model: e.target.value }); setSaleError(false); }}
                className={`sale-client-input${saleError && !saleForm.model.trim() ? ' input-error' : ''}`}
              />
              <input
                type="text"
                placeholder="Cliente"
                value={saleForm.client}
                onChange={e => setSaleForm({ ...saleForm, client: e.target.value })}
                className="sale-client-input"
              />
              <input
                type="number"
                placeholder="Valor R$ (opcional)"
                value={saleForm.amount}
                onChange={e => setSaleForm({ ...saleForm, amount: e.target.value })}
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
                <span className="goal-value">{stats.monthCount}</span>
                <span className="goal-of">de {stats.goal} {goalUnit}</span>
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
                <span className="goal-stat-label">Faltam</span>
                <span className="goal-stat-value">{stats.remaining}</span>
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

          {/* Metas por modelo — volume por carro */}
          {modelProgress.filter(m => m.target > 0).length > 0 && (
            <div className="model-goals card">
              <span className="model-goals-title">Por modelo</span>
              {modelProgress.filter(m => m.target > 0).map((m, i) => {
                const pct = Math.min(100, Math.round((m.count / m.target) * 100));
                return (
                  <div key={i} className="model-goal-row">
                    <div className="model-goal-head">
                      <span className="model-goal-name">{m.model}</span>
                      <span className="model-goal-count">{m.count}/{m.target}</span>
                    </div>
                    <div className="model-goal-bar"><i style={{ width: `${pct}%` }} className={m.count >= m.target ? 'done' : ''} /></div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Mini-goal chips — metas adicionais de todos os segmentos */}
          {(profile.customGoals || []).some(cg => cg.label && cg.target > 0) && (
            <div className="goal-chips">
              {(profile.customGoals || []).filter(cg => cg.label && cg.target > 0).map((cg, i) => (
                <div key={i} className="goal-chip">
                  <span className="goal-chip-icon">{cg.icon || '🎯'}</span>
                  <span className="goal-chip-label">{cg.label}</span>
                  <span className="goal-chip-value">{cg.unit === 'qtd' ? `${cg.target} un` : formatBRL(cg.target)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Condições comerciais vigentes — 3º item: as suas e as dos concorrentes */}
      <div className="day-section">
        <div className="day-section-header">
          <h3 className="section-title">Condições comerciais vigentes</h3>
        </div>
        <div className="home-dual-grid">
          <button className="home-dual-card home-dual-vendas card" onClick={() => navigate('/condicoes')}>
            <div className="home-dual-icon"><Tag size={18} /></div>
            <strong>As suas</strong>
            <span>Tabelas e campanhas do mês</span>
          </button>
          <button className="home-dual-card home-dual-mkt card" onClick={() => navigate('/concorrencia')}>
            <div className="home-dual-icon"><Swords size={18} /></div>
            <strong>Dos concorrentes</strong>
            <span>O que estão oferecendo agora</span>
          </button>
        </div>
      </div>

      {/* Notícias do setor — 4º item (aba movida pra cá) */}
      <div className="day-section">
        <div className="day-section-header">
          <h3 className="section-title">Notícias do setor</h3>
        </div>
        <button className="home-content-card card" data-tour="news" onClick={() => navigate('/noticias')}>
          <div className="home-content-icon"><Newspaper size={20} /></div>
          <div className="home-content-text">
            <strong>Lançamentos, tendências e ofertas</strong>
            <span>Do seu mercado, atualizado todo dia</span>
          </div>
          <ArrowRight size={16} className="home-train-arrow" />
        </button>
      </div>

      {/* Veículos destacados — gestor cadastra, time prioriza a venda */}
      {renderStockSection('Veículos antigos em estoque', antigos, 'Cadastre os veículos antigos', 'O time vê aqui e prioriza a venda')}
      {renderStockSection('Veículos com premiação', premiados, 'Cadastre os veículos com premiação', 'Bônus extra pra quem vender')}

      {welcomeBack && (
        <div className="welcome-back card" onClick={() => setWelcomeBack(null)}>
          <span>👋 {welcomeBack}</span>
          <X size={14} />
        </div>
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
        <button className="fab-sale" onClick={() => setShowQuickSale(true)} title="Registrar venda" aria-label="Registrar venda">
          <TrendingUp size={22} />
        </button>
      )}

      <QuickSaleSheet open={showQuickSale} onClose={() => setShowQuickSale(false)} onRegistered={() => refreshStats(goal)} />
    </div>
  );
}
