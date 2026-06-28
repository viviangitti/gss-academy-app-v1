import { useState } from 'react';
import { BarChart3, Upload, Sparkles, TrendingUp, AlertTriangle, ArrowRight, RotateCcw, Wallet } from 'lucide-react';
import { generateText, aiErrorMessage } from '../services/ai';
import OfflineState from '../components/OfflineState';
import { useOnline } from '../hooks/useOnline';
import './MarketingRaioX.css';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const CANAIS = [
  { id: 'midia', label: 'Mídia paga' },
  { id: 'crm', label: 'CRM / E-mail' },
  { id: 'evento', label: 'Evento' },
  { id: 'parceria', label: 'Parceria' },
  { id: 'influenciador', label: 'Influenciador' },
  { id: 'outro', label: 'Outro' },
];

interface Realoc { de: string; para: string; motivo: string }
interface Report {
  canal: string;
  resumo: string;
  metricas: { label: string; valor: string }[];
  insights: string[];
  pontosFortes: string[];
  pontosFracos: string[];
  realocacao: Realoc[];
  proximosPassos: string[];
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function MarketingRaioX() {
  const isOnline = useOnline();
  const [canal, setCanal] = useState('midia');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [fileName, setFileName] = useState('');

  const analyze = async (file: File) => {
    setError(''); setReport(null); setLoading(true); setFileName(file.name);
    try {
      const base64 = await readAsBase64(file);
      const canalLabel = CANAIS.find(c => c.id === canal)?.label || canal;
      const prompt = `Você é um analista de performance de marketing de uma concessionária. Analise este print de resultados de uma ação de ${canalLabel}.
Extraia os números que conseguir ler e gere um diagnóstico prático para o time de marketing, incluindo onde realocar verba.

Responda APENAS um JSON válido (sem markdown), neste formato:
{
 "canal": "${canalLabel}",
 "resumo": "1-2 frases sobre o desempenho geral",
 "metricas": [{"label":"Investimento","valor":"R$ ..."},{"label":"Leads","valor":"..."},{"label":"CPL","valor":"R$ ..."},{"label":"Conversões","valor":"..."}],
 "insights": ["insight acionável 1","insight 2","insight 3"],
 "pontosFortes": ["o que funcionou"],
 "pontosFracos": ["o que não funcionou"],
 "realocacao": [{"de":"canal/ação a reduzir","para":"canal/ação a reforçar","motivo":"por quê"}],
 "proximosPassos": ["ação 1","ação 2"]
}
Use só os dados visíveis no print + boas práticas. Se faltar um número, estime com cuidado ou omita a métrica. Português brasileiro.`;

      const raw = await generateText(API_KEY, [
        { inlineData: { data: base64, mimeType: file.type } },
        { text: prompt },
      ], { models: ['gemini-2.5-flash', 'gemini-2.5-flash-lite'], retries: 2 });
      const match = raw.match(/\{[\s\S]*\}/);
      setReport(JSON.parse(match ? match[0] : raw) as Report);
    } catch (e) {
      setError(aiErrorMessage(e));
    }
    setLoading(false);
  };

  if (!isOnline) return <OfflineState feature="a análise de campanhas" />;
  if (!API_KEY) return <OfflineState feature="a análise de campanhas" subtitle="Serviço indisponível no momento." />;

  return (
    <div className="mrx-page">
      <div className="mrx-intro card">
        <div className="mrx-intro-icon"><BarChart3 size={22} /></div>
        <div>
          <h3>Performance das campanhas</h3>
          <p>Envie o print do resultado (mídia, CRM, evento, parceria, influenciador) — a IA gera o relatório com insights e onde realocar a verba.</p>
        </div>
      </div>

      {!report && !loading && (
        <>
          <span className="mrx-label">Canal da ação</span>
          <div className="mrx-chips">
            {CANAIS.map(c => (
              <button key={c.id} className={`mrx-chip ${canal === c.id ? 'on' : ''}`} onClick={() => setCanal(c.id)}>{c.label}</button>
            ))}
          </div>
          <label className="mrx-upload">
            <Upload size={18} />
            <span>Enviar print do resultado</span>
            <input type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) analyze(f); e.target.value = ''; }} />
          </label>
          {error && <p className="mrx-error">{error}</p>}
        </>
      )}

      {loading && (
        <div className="mrx-loading card"><Sparkles size={22} /><p>Analisando {fileName}…</p></div>
      )}

      {report && (
        <div className="mrx-report">
          <div className="mrx-resumo card">
            <span className="mrx-canal-badge">{report.canal}</span>
            <p>{report.resumo}</p>
          </div>

          {report.metricas?.length > 0 && (
            <div className="mrx-metrics">
              {report.metricas.map((m, i) => (
                <div key={i} className="mrx-metric card">
                  <span className="mrx-metric-val">{m.valor}</span>
                  <span className="mrx-metric-lbl">{m.label}</span>
                </div>
              ))}
            </div>
          )}

          {report.realocacao?.length > 0 && (
            <div className="mrx-realoc card">
              <div className="mrx-sec-head"><Wallet size={15} /> Realocação de verba sugerida</div>
              {report.realocacao.map((r, i) => (
                <div key={i} className="mrx-realoc-row">
                  <div className="mrx-realoc-flow">
                    <span className="mrx-from">{r.de}</span>
                    <ArrowRight size={15} />
                    <span className="mrx-to">{r.para}</span>
                  </div>
                  <span className="mrx-realoc-why">{r.motivo}</span>
                </div>
              ))}
            </div>
          )}

          {report.insights?.length > 0 && (
            <div className="mrx-block card">
              <div className="mrx-sec-head"><Sparkles size={15} /> Insights</div>
              <ul className="mrx-list">{report.insights.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
          )}

          <div className="mrx-sf-grid">
            {report.pontosFortes?.length > 0 && (
              <div className="mrx-block card mrx-strong">
                <div className="mrx-sec-head"><TrendingUp size={14} /> Funcionou</div>
                <ul className="mrx-list">{report.pontosFortes.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </div>
            )}
            {report.pontosFracos?.length > 0 && (
              <div className="mrx-block card mrx-weak">
                <div className="mrx-sec-head"><AlertTriangle size={14} /> Atenção</div>
                <ul className="mrx-list">{report.pontosFracos.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </div>
            )}
          </div>

          {report.proximosPassos?.length > 0 && (
            <div className="mrx-block card">
              <div className="mrx-sec-head"><ArrowRight size={15} /> Próximos passos</div>
              <ul className="mrx-list">{report.proximosPassos.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
          )}

          <button className="mrx-again" onClick={() => setReport(null)}><RotateCcw size={15} /> Analisar outra campanha</button>
        </div>
      )}
    </div>
  );
}
