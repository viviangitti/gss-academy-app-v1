import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Plus, Check, Trash2, Award, Calendar, BarChart3 } from 'lucide-react';
import { addSale, removeSale, getPeriodStats, getSalesByPeriod, getMonthChartData, getYearChartData, getWeekChartData } from '../services/goal';
import { loadData, KEYS } from '../services/storage';
import type { UserProfile } from '../types';
import type { Sale, Period } from '../services/goal';
import './Sales.css';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'dia', label: 'Hoje' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês' },
  { value: 'ano', label: 'Ano' },
];

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function Sales() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>('mes');
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState({ total: 0, commission: 0, count: 0, average: 0 });
  const [monthlyGoal, setMonthlyGoal] = useState(0);
  const [chartData, setChartData] = useState<{ label: string; value: number }[]>([]);
  const [showAddSale, setShowAddSale] = useState(false);
  const [saleForm, setSaleForm] = useState({ amount: '', commission: '', client: '' });

  const refresh = (p: Period) => {
    setStats(getPeriodStats(p));
    setSales(getSalesByPeriod(p).sort((a, b) => b.date.localeCompare(a.date)));
    if (p === 'semana') setChartData(getWeekChartData());
    else if (p === 'mes') setChartData(getMonthChartData());
    else if (p === 'ano') setChartData(getYearChartData());
    else setChartData([]);
  };

  useEffect(() => {
    refresh(period);
    const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '', monthlyGoal: 0 });
    setMonthlyGoal(profile.monthlyGoal || 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
    refresh(p);
  };

  const handleAddSale = () => {
    const amount = Number(saleForm.amount);
    const commission = Number(saleForm.commission);
    if (!amount || !saleForm.client.trim()) return;
    addSale(amount, commission || 0, saleForm.client);
    setSaleForm({ amount: '', commission: '', client: '' });
    setShowAddSale(false);
    refresh(period);
  };

  const handleRemove = (id: string) => {
    if (confirm('Remover essa venda?')) {
      removeSale(id);
      refresh(period);
    }
  };

  const maxVal = Math.max(...chartData.map(d => d.value), monthlyGoal, 1);
  const goalToShow = period === 'mes' ? monthlyGoal : 0;
  const progress = goalToShow > 0 ? Math.min((stats.commission / goalToShow) * 100, 100) : 0;

  return (
    <div className="sales-page">
      {/* Período selector */}
      <div className="period-tabs">
        {PERIODS.map(p => (
          <button
            key={p.value}
            className={`period-tab ${period === p.value ? 'active' : ''}`}
            onClick={() => handlePeriodChange(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Resumo */}
      <div className="sales-summary card">
        <div className="summary-main">
          <span className="summary-label">Comissão no período</span>
          <span className="summary-value">{formatBRL(stats.commission)}</span>
          <span className="summary-sub">Vendido: {formatBRL(stats.total)}</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-stats">
          <div>
            <span className="stat-label">Vendas</span>
            <span className="stat-value">{stats.count}</span>
          </div>
          <div>
            <span className="stat-label">Ticket médio</span>
            <span className="stat-value">{formatBRL(stats.average)}</span>
          </div>
        </div>

        {period === 'mes' && monthlyGoal > 0 && (
          <>
            <div className="summary-divider" />
            <div className="summary-goal">
              <div className="goal-row">
                <span><Award size={14} /> Meta de comissão</span>
                <span className="goal-val">{formatBRL(monthlyGoal)}</span>
              </div>
              <div className="goal-progress-bar">
                <div className="goal-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="goal-row-small">
                <span>{Math.round(progress)}% concluído</span>
                <span>{formatBRL(Math.max(0, monthlyGoal - stats.commission))} faltando</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Gráfico */}
      {chartData.length > 1 && (
        <div className="sales-chart card">
          <h4><BarChart3 size={14} /> Evolução — {PERIODS.find(p => p.value === period)?.label}</h4>
          <div className="chart-container">
            <svg viewBox={`0 0 ${chartData.length * 40} 100`} preserveAspectRatio="none">
              {/* Linha da meta se for mês */}
              {period === 'mes' && monthlyGoal > 0 && (
                <line
                  x1="0" y1={100 - (monthlyGoal / maxVal) * 90}
                  x2={chartData.length * 40} y2={100 - (monthlyGoal / maxVal) * 90}
                  stroke="var(--text-soft)" strokeWidth="1" strokeDasharray="3 3"
                />
              )}
              {/* Linha das vendas */}
              <polyline
                points={chartData.map((d, i) => `${i * 40 + 20},${100 - (d.value / maxVal) * 90}`).join(' ')}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Pontos */}
              {chartData.map((d, i) => (
                <circle
                  key={i}
                  cx={i * 40 + 20}
                  cy={100 - (d.value / maxVal) * 90}
                  r="3"
                  fill="var(--accent)"
                />
              ))}
            </svg>
          </div>
          <div className="chart-labels">
            {chartData.filter((_, i) => chartData.length <= 10 || i % Math.ceil(chartData.length / 7) === 0).map((d, i) => (
              <span key={i}>{d.label}</span>
            ))}
          </div>
        </div>
      )}

      {/* Extrato */}
      <div className="sales-list-header">
        <h3 className="section-title"><Calendar size={16} /> Extrato de vendas</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddSale(!showAddSale)}>
          <Plus size={12} /> Nova venda
        </button>
      </div>

      {showAddSale && (
        <div className="new-sale-form card">
          <input
            type="text"
            placeholder="Cliente"
            value={saleForm.client}
            onChange={e => setSaleForm({ ...saleForm, client: e.target.value })}
          />
          <div className="sale-amount-row">
            <input
              type="number"
              placeholder="Venda R$"
              value={saleForm.amount}
              onChange={e => setSaleForm({ ...saleForm, amount: e.target.value })}
            />
            <input
              type="number"
              placeholder="Comissão R$"
              value={saleForm.commission}
              onChange={e => setSaleForm({ ...saleForm, commission: e.target.value })}
            />
          </div>
          <button className="btn btn-primary" onClick={handleAddSale}>
            <Check size={14} /> Registrar
          </button>
        </div>
      )}

      {sales.length === 0 ? (
        <div className="sales-empty card">
          <TrendingUp size={32} />
          <p>Nenhuma venda registrada nesse período.</p>
          <button className="btn btn-outline btn-sm" onClick={() => setShowAddSale(true)}>
            <Plus size={12} /> Registrar primeira venda
          </button>
        </div>
      ) : (
        <div className="sales-list">
          {sales.map(sale => (
            <div key={sale.id} className="sale-item card">
              <div className="sale-info">
                <span className="sale-client">{sale.client}</span>
                <span className="sale-date">{formatDate(sale.date)} • {formatTime(sale.date)}</span>
                <span className="sale-value-row">Venda: {formatBRL(sale.amount)}</span>
              </div>
              <div className="sale-commission-box">
                <span className="sale-commission-label">comissão</span>
                <span className="sale-amount">{formatBRL(sale.commission ?? 0)}</span>
              </div>
              <button className="sale-delete" onClick={() => handleRemove(sale.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-outline sales-back" onClick={() => navigate('/')}>
        Voltar ao Meu Dia
      </button>
    </div>
  );
}
