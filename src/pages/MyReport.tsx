import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, TrendingDown, Crosshair, Lightbulb, RotateCcw } from 'lucide-react';
import { getMyGapReport, hasEnoughDataForMyReport } from '../services/gapReport';
import type { MyReport as Report } from '../services/gapReport';
import RadarChart from '../components/RadarChart';
import OfflineState from '../components/OfflineState';
import { useOnline } from '../hooks/useOnline';
import './MyReport.css';

const GAP_LABELS: Record<string, string> = {
  produto: '📦 Produto — domine melhor o que você vende',
  processo: '⚙️ Processo — simulação, financiamento, burocracia',
  abordagem: '🤝 Abordagem — conexão e defesa de valor',
  'follow-up': '📞 Follow-up — retorno e timing',
};

export default function MyReport() {
  const isOnline = useOnline();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const enough = hasEnoughDataForMyReport();

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      setReport(await getMyGapReport());
    } catch {
      setError('Não consegui gerar agora. Tenta de novo.');
    }
    setLoading(false);
  };

  if (!isOnline) return <OfflineState feature="o Raio-X" />;

  return (
    <div className="myrep-page">
      {!report && !loading && (
        <div className="myrep-hero">
          <div className="myrep-hero-icon"><BarChart3 size={26} /></div>
          <h3>Por que ganho / por que perco</h3>
          <p>A IA cruza suas vendas, perdas e treinos e mostra ONDE está o seu gap — produto, processo, abordagem ou follow-up.</p>
          {enough ? (
            <button className="myrep-fire" onClick={generate}>Gerar meu raio-X</button>
          ) : (
            <div className="myrep-empty card">
              <p>Você precisa de pelo menos <strong>3 registros</strong> (vendas ou perdas) pra análise valer a pena.</p>
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/vendas-perdidas')}>Registrar venda perdida</button>
            </div>
          )}
          {error && <p className="myrep-error">{error}</p>}
        </div>
      )}

      {loading && (
        <div className="myrep-loading">
          <div className="myrep-loading-orb"><BarChart3 size={28} /></div>
          <p>Cruzando suas vendas, perdas e treinos…</p>
        </div>
      )}

      {report && (
        <div className="myrep-result">
          <div className="myrep-block card myrep-resumo">
            <p>{report.resumo}</p>
          </div>

          {/* Radar de competências — fortes e fracos de relance */}
          {report.competencias?.length >= 3 && (
            <div className="myrep-block card">
              <h4><Crosshair size={15} /> Suas competências</h4>
              <RadarChart items={report.competencias.map(c => ({ label: c.nome, value: c.nota }))} benchmark={80} />
              <div className="myrep-radar-legend">
                <span><span className="rl-swatch rl-you" /> Você</span>
                <span><span className="rl-swatch rl-bench" /> Executivo com Maestria</span>
              </div>
              <div className="myrep-bars">
                {[...report.competencias].sort((a, b) => b.nota - a.nota).map((c, i) => (
                  <div key={i} className="myrep-bar-row">
                    <span className="myrep-bar-name">{c.nome}</span>
                    <div className="myrep-bar-track">
                      <div
                        className={`myrep-bar-fill ${c.nota < 50 ? 'low' : c.nota >= 70 ? 'high' : ''}`}
                        style={{ width: `${Math.max(4, Math.min(100, c.nota))}%` }}
                      />
                    </div>
                    <span className="myrep-bar-val">{c.nota}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="myrep-block card">
            <h4 className="myrep-h-win"><TrendingUp size={15} /> Onde você ganha</h4>
            <ul>{report.forte.map((f, i) => <li key={i}>{f}</li>)}</ul>
          </div>

          <div className="myrep-block card">
            <h4 className="myrep-h-lose"><TrendingDown size={15} /> Onde você perde</h4>
            <ul>{report.fraco.map((f, i) => <li key={i}>{f}</li>)}</ul>
          </div>

          <div className="myrep-block card myrep-gap">
            <h4><Crosshair size={15} /> Seu gap principal</h4>
            <p className="myrep-gap-label">{GAP_LABELS[report.gap] || report.gap}</p>
          </div>

          <div className="myrep-block card myrep-action">
            <h4><Lightbulb size={15} /> Pra esta semana</h4>
            <p>{report.recomendacao}</p>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 10 }}
              onClick={() => navigate(report.gap === 'follow-up' ? '/follow-ups' : '/treino-voz')}>
              {report.gap === 'follow-up' ? 'Organizar meus follow-ups' : 'Treinar agora por voz'}
            </button>
          </div>

          <button className="myrep-again" onClick={() => setReport(null)}>
            <RotateCcw size={15} /> Gerar de novo
          </button>
        </div>
      )}
    </div>
  );
}
