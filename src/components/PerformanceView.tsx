import { getSales } from '../services/goal';
import { getLostSales, REASON_LABELS, STAGE_LABELS } from '../services/lostSales';
import type { LostReason, LostStage } from '../services/lostSales';
import './PerformanceView.css';

/** Extrai o fator determinante salvo na venda ("Determinante pra venda: X"). */
function parseDeterminant(notes?: string): string {
  if (!notes) return 'Não informado';
  const m = notes.match(/Determinante pra venda:\s*(.+)/i);
  return m ? m[1].trim() : 'Não informado';
}

function Bar({ label, value, max, tone }: { label: string; value: number; max: number; tone: 'win' | 'lose' }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="pv-row">
      <span className="pv-row-label">{label}</span>
      <div className="pv-track">
        <div className={`pv-fill pv-${tone}`} style={{ width: `${Math.max(6, pct)}%` }} />
      </div>
      <span className="pv-row-val">{value}</span>
    </div>
  );
}

export default function PerformanceView() {
  const sales = getSales();
  const lost = getLostSales();
  const totalWon = sales.length;
  const totalLost = lost.length;
  const total = totalWon + totalLost;
  const taxa = total ? Math.round((totalWon / total) * 100) : 0;

  // Motivos de venda (o que foi determinante)
  const winBy: Record<string, number> = {};
  sales.forEach(s => { const d = parseDeterminant(s.notes); winBy[d] = (winBy[d] || 0) + 1; });
  const winRows = Object.entries(winBy).sort((a, b) => b[1] - a[1]);

  // Motivos de perda
  const lossBy: Record<string, number> = {};
  const stageBy: Record<string, number> = {};
  lost.forEach(s => {
    lossBy[s.reason] = (lossBy[s.reason] || 0) + 1;
    stageBy[s.stage] = (stageBy[s.stage] || 0) + 1;
  });
  const lossRows = Object.entries(lossBy).sort((a, b) => b[1] - a[1]);
  const stageRows = Object.entries(stageBy).sort((a, b) => b[1] - a[1]);

  if (total === 0) {
    return (
      <div className="pv-empty card">
        Registre suas vendas e perdas que sua performance aparece aqui — taxa de sucesso e os motivos de cada lado.
      </div>
    );
  }

  return (
    <>
      <div className="pv-metrics">
        <div className="pv-metric">
          <span className="pv-val pv-green">{taxa}%</span>
          <span className="pv-lbl">taxa de sucesso</span>
        </div>
        <div className="pv-metric">
          <span className="pv-val">{totalWon}</span>
          <span className="pv-lbl">vendas</span>
        </div>
        <div className="pv-metric">
          <span className="pv-val pv-redval">{totalLost}</span>
          <span className="pv-lbl">perdas</span>
        </div>
      </div>

      {winRows.length > 0 && (
        <div className="pv-block card">
          <h4 className="pv-h pv-h-win">Por que você vendeu</h4>
          {winRows.map(([k, v]) => <Bar key={k} label={k} value={v} max={totalWon} tone="win" />)}
        </div>
      )}

      {lossRows.length > 0 && (
        <div className="pv-block card">
          <h4 className="pv-h pv-h-lose">Por que você perdeu</h4>
          {lossRows.map(([k, v]) => (
            <Bar key={k} label={REASON_LABELS[k as LostReason] || k} value={v} max={totalLost} tone="lose" />
          ))}
        </div>
      )}

      {stageRows.length > 0 && (
        <div className="pv-block card">
          <h4 className="pv-h pv-h-lose">Onde você perde (etapa)</h4>
          {stageRows.map(([k, v]) => (
            <Bar key={k} label={STAGE_LABELS[k as LostStage] || k} value={v} max={totalLost} tone="lose" />
          ))}
        </div>
      )}
    </>
  );
}
