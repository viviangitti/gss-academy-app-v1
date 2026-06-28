import { useEffect, useState } from 'react';
import { Radio, CheckCircle2, XCircle, TrendingDown, Sparkles, RefreshCw } from 'lucide-react';
import { loadData, KEYS } from '../services/storage';
import { getTeamLiveStatus } from '../services/firestore/liveStatus';
import { fetchRecentCases } from '../services/firestore/salesCases';
import { generateText, aiErrorMessage } from '../services/ai';
import type { LiveMember } from '../services/firestore/liveStatus';
import type { SalesCase } from '../services/firestore/salesCases';
import type { UserProfile } from '../types';
import './GestorNegociacoes.css';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

function msOf(c: SalesCase): number {
  const ts = c.createdAt as { toMillis?: () => number; seconds?: number } | undefined;
  return ts?.toMillis?.() ?? (ts?.seconds ? ts.seconds * 1000 : 0);
}

function sinceLabel(d?: Date): string {
  if (!d) return '';
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  return `há ${Math.round(min / 60)}h`;
}

export default function GestorNegociacoes() {
  const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
  const [live, setLive] = useState<LiveMember[]>([]);
  const [cases, setCases] = useState<SalesCase[]>([]);
  const [period, setPeriod] = useState<7 | 30>(7);
  const [loadingLive, setLoadingLive] = useState(true);
  const [counter, setCounter] = useState('');
  const [counterLoading, setCounterLoading] = useState(false);

  const loadLive = () => {
    setLoadingLive(true);
    getTeamLiveStatus(profile.company || '').then(setLive).catch(() => {}).finally(() => setLoadingLive(false));
  };

  useEffect(() => {
    loadLive();
    fetchRecentCases(profile.company || '', 200).then(setCases).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cutoff = Date.now() - period * 86400000;
  const periodCases = cases.filter(c => msOf(c) >= cutoff);
  const won = periodCases.filter(c => c.kind === 'won');
  const lost = periodCases.filter(c => c.kind === 'lost');
  const total = won.length + lost.length;
  const taxa = total > 0 ? Math.round((won.length / total) * 100) : 0;

  // Motivos de perda agregados
  const reasonMap = new Map<string, number>();
  lost.forEach(c => { const r = (c.reason || 'Não informado').trim(); reasonMap.set(r, (reasonMap.get(r) || 0) + 1); });
  const reasons = [...reasonMap.entries()].sort((a, b) => b[1] - a[1]);
  const maxReason = Math.max(...reasons.map(r => r[1]), 1);

  const suggestCounter = async () => {
    if (counterLoading || !reasons.length) return;
    setCounterLoading(true); setCounter('');
    try {
      const list = reasons.map(([r, n]) => `- ${r}: ${n} perda(s)`).join('\n');
      const text = await generateText(API_KEY,
        `Você é um consultor de gestão comercial automotiva. O time de uma concessionária perdeu vendas nos últimos ${period} dias pelos motivos abaixo. Proponha, para um GESTOR, contramedidas ASSERTIVAS e práticas (o que treinar, mudar no processo, ou cobrar) — direto ao ponto, em português brasileiro, no máximo 4 itens curtos em bullets, focando nos motivos mais frequentes.\n\nMotivos de perda:\n${list}`,
        { retries: 2 });
      setCounter(text);
    } catch (e) {
      setCounter(aiErrorMessage(e));
    }
    setCounterLoading(false);
  };

  return (
    <div className="gn-page">
      {/* 1. Clientes em atendimento agora */}
      <div className="gn-section">
        <div className="gn-sec-head">
          <h3 className="section-title"><Radio size={15} /> Clientes em atendimento</h3>
          <button className="gn-refresh" onClick={loadLive} aria-label="Atualizar"><RefreshCw size={14} /></button>
        </div>
        <div className="gn-live-count card">
          <span className="gn-live-num">{live.length}</span>
          <span className="gn-live-lbl">{live.length === 1 ? 'cliente sendo atendido agora' : 'clientes sendo atendidos agora'}</span>
        </div>
        {loadingLive ? null : live.length === 0 ? (
          <p className="gn-empty">Ninguém do time marcou atendimento agora.</p>
        ) : (
          <div className="gn-live-list">
            {live.map(m => (
              <div key={m.uid} className="gn-live-item card">
                <div className="gn-live-dot" />
                <div className="gn-live-info">
                  <strong>{m.name}</strong>
                  <span>{m.clientHint ? `Cliente: ${m.clientHint}` : 'Em atendimento'} · {sinceLabel(m.since)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="gn-hint">Veja quem está com cliente agora pra dar suporte na hora certa.</p>
      </div>

      {/* 2. Concluído — vendeu / não vendeu */}
      <div className="gn-section">
        <div className="gn-sec-head">
          <h3 className="section-title"><CheckCircle2 size={15} /> Concluído</h3>
          <div className="gn-period">
            <button className={period === 7 ? 'on' : ''} onClick={() => setPeriod(7)}>7 dias</button>
            <button className={period === 30 ? 'on' : ''} onClick={() => setPeriod(30)}>30 dias</button>
          </div>
        </div>

        <div className="gn-result-grid">
          <div className="gn-result card won">
            <CheckCircle2 size={18} />
            <span className="gn-result-num">{won.length}</span>
            <span className="gn-result-lbl">vendeu</span>
          </div>
          <div className="gn-result card lost">
            <XCircle size={18} />
            <span className="gn-result-num">{lost.length}</span>
            <span className="gn-result-lbl">não vendeu</span>
          </div>
          <div className="gn-result card">
            <span className="gn-result-num">{taxa}%</span>
            <span className="gn-result-lbl">conversão</span>
          </div>
        </div>

        {reasons.length > 0 ? (
          <>
            <div className="gn-sec-head" style={{ marginTop: 4 }}>
              <h4 className="gn-sub"><TrendingDown size={14} /> Motivos das perdas</h4>
            </div>
            <div className="gn-reasons card">
              {reasons.map(([r, n]) => (
                <div key={r} className="gn-reason">
                  <div className="gn-reason-head"><span>{r}</span><strong>{n}</strong></div>
                  <div className="gn-reason-bar"><i style={{ width: `${(n / maxReason) * 100}%` }} /></div>
                </div>
              ))}
            </div>

            {!counter && (
              <button className="gn-counter-btn" onClick={suggestCounter} disabled={counterLoading}>
                <Sparkles size={16} /> {counterLoading ? 'Analisando…' : 'Sugerir contramedidas'}
              </button>
            )}
            {counter && (
              <div className="gn-counter card">
                <div className="gn-counter-head"><Sparkles size={15} /> Contramedidas sugeridas</div>
                <div className="gn-counter-body" dangerouslySetInnerHTML={{ __html: counter.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/^[-•]\s*/gm, '• ').replace(/\n/g, '<br/>') }} />
              </div>
            )}
          </>
        ) : (
          <p className="gn-empty">Nenhuma venda registrada nesse período. Incentive o time a registrar ganhos e perdas pra você agir nos motivos.</p>
        )}
      </div>
    </div>
  );
}
