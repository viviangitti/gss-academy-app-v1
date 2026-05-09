import { useState, useEffect } from 'react';
import { Copy, Check, FileText, ChevronDown, ChevronUp, Flame } from 'lucide-react';
import { getScripts, URGENCY_TRIGGERS } from '../services/content';
import { loadData, KEYS } from '../services/storage';
import type { UserProfile } from '../types';
import type { Script } from '../services/content';
import SpeakButton from '../components/SpeakButton';
import FavoriteButton from '../components/FavoriteButton';
import ShareButton from '../components/ShareButton';
import './Scripts.css';

type TabType = 'roteiros' | 'gatilhos';

export default function Scripts() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabType>('roteiros');

  useEffect(() => {
    const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
    setScripts(getScripts(profile.segment));
  }, []);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text.replace(/\\n/g, '\n'));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="scripts-page">
      <div className="scripts-tabs">
        <button className={`scripts-tab ${tab === 'roteiros' ? 'active' : ''}`} onClick={() => setTab('roteiros')}>
          <FileText size={14} /> Roteiros
        </button>
        <button className={`scripts-tab ${tab === 'gatilhos' ? 'active' : ''}`} onClick={() => setTab('gatilhos')}>
          <Flame size={14} /> Gatilhos
        </button>
      </div>

      {tab === 'roteiros' ? (
        <>
          <div className="scripts-intro card">
            <FileText size={20} />
            <p>Roteiros prontos para copiar e adaptar. Personalize com o nome do cliente e dados específicos.</p>
          </div>

          <div className="scripts-list">
            {scripts.map(script => {
              const isExpanded = expandedId === script.id;
              const isSegment = script.segment !== 'geral';
              return (
                <div key={script.id} className={`script-card card ${isSegment ? 'segment-specific' : ''}`}>
                  <div className="script-header" onClick={() => setExpandedId(isExpanded ? null : script.id)}>
                    <div>
                      <h4>{script.title}</h4>
                      <p className="script-context">{script.context}</p>
                    </div>
                    <div className="script-header-actions">
                      {isSegment && <span className="badge badge-reuniao">Seu segmento</span>}
                      <FavoriteButton type="script" itemId={script.id} label={script.title} size={15} />
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="script-content">
                      <pre className="script-text">{script.script}</pre>
                      <div className="script-actions">
                        <button
                          className={`btn btn-sm ${copiedId === script.id ? 'btn-copied' : 'btn-primary'}`}
                          onClick={() => handleCopy(script.script, script.id)}
                        >
                          {copiedId === script.id ? <><Check size={12} /> Copiado!</> : <><Copy size={12} /> Copiar</>}
                        </button>
                        <ShareButton text={`${script.title}\n\n${script.script}`} title={script.title} size={16} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="scripts-intro card">
            <Flame size={20} />
            <p>Frases de urgência legítima e elegante. Use com responsabilidade para acelerar decisões.</p>
          </div>

          <div className="scripts-list">
            {URGENCY_TRIGGERS.map(trigger => (
              <div key={trigger.id} className="urgency-category card">
                <div className="urgency-cat-header">
                  <span className="urgency-icon">{trigger.icon}</span>
                  <h4>{trigger.category}</h4>
                </div>
                <div className="urgency-phrases">
                  {trigger.phrases.map((phrase, i) => (
                    <div key={i} className="urgency-phrase">
                      <p>{phrase}</p>
                      <div className="urgency-actions">
                        <button className="copy-mini" onClick={() => handleCopy(phrase, `${trigger.id}-${i}`)}>
                          {copiedId === `${trigger.id}-${i}` ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                        <SpeakButton text={phrase} size={14} />
                        <ShareButton text={phrase} title={trigger.category} size={14} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
