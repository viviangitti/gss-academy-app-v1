import { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, Shield, AlertTriangle, Copy, Check } from 'lucide-react';
import { getObjections, STAGES } from '../services/content';
import { loadData, KEYS } from '../services/storage';
import { SEGMENTS } from '../types';
import type { UserProfile } from '../types';
import type { Objection, Stage } from '../services/content';
import SpeakButton from '../components/SpeakButton';
import FavoriteButton from '../components/FavoriteButton';
import ShareButton from '../components/ShareButton';
import './Objections.css';

export default function Objections() {
  const [allObjections, setAllObjections] = useState<Objection[]>([]);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [segmentLabel, setSegmentLabel] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<Stage | ''>('');

  useEffect(() => {
    const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
    setAllObjections(getObjections(profile.segment));
    setSegmentLabel(SEGMENTS.find(s => s.value === profile.segment)?.label || '');
  }, []);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* fallback */ }
  };

  // Stage filter: when a stage is selected, show stage variants first, then general
  const stageFiltered: Objection[] = selectedStage
    ? [
        ...allObjections.filter(o => o.stage === selectedStage),
        ...allObjections.filter(o => !o.stage),
      ]
    : allObjections.filter(o => !o.stage);

  const filtered = stageFiltered.filter(o => {
    if (!search) return true;
    return o.objection.toLowerCase().includes(search.toLowerCase()) ||
      o.responses.some(r => r.toLowerCase().includes(search.toLowerCase()));
  });

  return (
    <div className="objections-page">
      <div className="objections-intro card">
        <Shield size={20} />
        <p>Respostas prontas para as objeções mais comuns. Consulte antes de reuniões e negociações.</p>
      </div>

      {segmentLabel && (
        <span className="objections-segment">Personalizado para: {segmentLabel}</span>
      )}

      {/* Filtro por estágio do funil */}
      <div className="stage-chips">
        {STAGES.map(s => (
          <button
            key={s.value}
            className={`stage-chip ${selectedStage === s.value ? 'active' : ''}`}
            onClick={() => { setSelectedStage(s.value as Stage | ''); setExpandedId(null); }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {selectedStage && (
        <div className="stage-hint">
          <AlertTriangle size={12} />
          Variantes específicas de <strong>{STAGES.find(s => s.value === selectedStage)?.label}</strong> aparecem primeiro
        </div>
      )}

      <div className="search-bar">
        <Search size={16} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar objeção..."
        />
      </div>

      <div className="objections-list">
        {filtered.map(obj => {
          const isExpanded = expandedId === obj.id;
          const isSegment = obj.segment !== 'geral';
          const isStageVariant = !!obj.stage;

          return (
            <div key={obj.id} className={`objection-card card ${isSegment ? 'segment-specific' : ''} ${isStageVariant ? 'stage-variant' : ''}`}>
              <div className="objection-header" onClick={() => setExpandedId(isExpanded ? null : obj.id)}>
                <h4>{obj.objection}</h4>
                <div className="objection-meta">
                  {isStageVariant && <span className="badge badge-stage">{STAGES.find(s => s.value === obj.stage)?.label}</span>}
                  {isSegment && <span className="badge badge-reuniao">Seu segmento</span>}
                  <FavoriteButton type="objection" itemId={obj.id} label={obj.objection} size={15} />
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {isExpanded && (
                <div className="objection-body">
                  {obj.quickResponses && obj.quickResponses.length > 0 && (
                    <div className="quick-cards-section">
                      <span className="quick-cards-label">Respostas rápidas</span>
                      <div className="quick-cards-scroll">
                        {obj.quickResponses.map((qr, i) => (
                          <div key={i} className="quick-card">
                            <p>{qr}</p>
                            <div className="quick-card-actions">
                              <button
                                className="copy-mini"
                                onClick={(e) => { e.stopPropagation(); handleCopy(qr, `${obj.id}-q${i}`); }}
                              >
                                {copiedId === `${obj.id}-q${i}` ? <Check size={12} /> : <Copy size={12} />}
                              </button>
                              <SpeakButton text={qr} size={14} />
                              <ShareButton text={`Objeção: ${obj.objection}\n\n${qr}`} title="Resposta rápida" size={14} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {obj.commonMistake && (
                    <div className="common-mistake">
                      <AlertTriangle size={14} />
                      <div>
                        <strong>O que NÃO fazer:</strong>
                        <p>{obj.commonMistake}</p>
                      </div>
                    </div>
                  )}

                  <div className="objection-responses">
                    <span className="responses-label">Respostas completas</span>
                    {obj.responses.map((response, i) => (
                      <div key={i} className="response-item">
                        <span className="response-number">{i + 1}</span>
                        <p>{response}</p>
                        <div className="response-actions">
                          <SpeakButton text={response} size={14} />
                          <ShareButton text={`Objeção: ${obj.objection}\n\n${response}`} title="Resposta" size={14} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
