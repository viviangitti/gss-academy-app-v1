// Gráfico radar em SVG puro (sem lib) — competências 0-100.
// Usado no Meu Raio-X pra mostrar pontos fortes/fracos de relance.
import './RadarChart.css';

export interface RadarItem {
  label: string;
  value: number; // 0-100
}

interface Props {
  items: RadarItem[];
  size?: number;
  benchmark?: number; // 0-100 — nível de referência (ex: Executivo com Maestria em Vendas)
}

export default function RadarChart({ items, size = 320, benchmark }: Props) {
  const n = items.length;
  if (n < 3) return null;

  const cx = size / 2;
  const cy = size / 2 + 4;
  const radius = size / 2 - 56; // margem pros rótulos

  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, r: number): [number, number] => [
    cx + Math.cos(angle(i)) * r,
    cy + Math.sin(angle(i)) * r,
  ];
  const poly = (r: number) =>
    Array.from({ length: n }, (_, i) => point(i, r).join(',')).join(' ');

  const dataPoly = items
    .map((it, i) => point(i, (Math.max(0, Math.min(100, it.value)) / 100) * radius).join(','))
    .join(' ');

  return (
    <svg className="radar" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Radar de competências">
      {/* anéis de referência */}
      {[0.25, 0.5, 0.75, 1].map(f => (
        <polygon key={f} points={poly(radius * f)} className="radar-ring" />
      ))}
      {/* eixos */}
      {items.map((_, i) => {
        const [x, y] = point(i, radius);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} className="radar-axis" />;
      })}
      {/* benchmark do expert (Executivo com Maestria) — pontilhado */}
      {typeof benchmark === 'number' && (
        <polygon points={poly((Math.max(0, Math.min(100, benchmark)) / 100) * radius)} className="radar-benchmark" />
      )}
      {/* área do vendedor */}
      <polygon points={dataPoly} className="radar-area" />
      {/* pontos + nota */}
      {items.map((it, i) => {
        const v = Math.max(0, Math.min(100, it.value));
        const [x, y] = point(i, (v / 100) * radius);
        return <circle key={i} cx={x} cy={y} r={3.5} className="radar-dot" />;
      })}
      {/* rótulos */}
      {items.map((it, i) => {
        const [x, y] = point(i, radius + 26);
        const v = Math.max(0, Math.min(100, it.value));
        return (
          <g key={i}>
            <text x={x} y={y - 5} className="radar-label" textAnchor="middle">{it.label}</text>
            <text x={x} y={y + 10} className={`radar-value ${v < 50 ? 'low' : v >= 70 ? 'high' : ''}`} textAnchor="middle">{v}</text>
          </g>
        );
      })}
    </svg>
  );
}
