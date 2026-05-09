import { useState, useEffect } from 'react';
import { Zap, Check, ChevronDown, ChevronUp, Shield, BookOpen, StickyNote } from 'lucide-react';
import { getObjections } from '../services/content';
import { TECHNIQUES } from '../services/content';
import { loadData, KEYS } from '../services/storage';
import type { UserProfile } from '../types';
import type { Objection } from '../services/content';
import './PreMeeting.css';

const PRE_MEETING_CHECKLIST = [
  'Revisei o histórico do cliente',
  'Tenho o objetivo da reunião claro',
  'Preparei perguntas de descoberta',
  'Sei quais objeções esperar',
  'Tenho proposta/material pronto',
  'Confirmei horário e participantes',
];

export default function PreMeeting() {
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [showObjections, setShowObjections] = useState(false);
  const [showTechniques, setShowTechniques] = useState(false);
  const [topObjections, setTopObjections] = useState<Objection[]>([]);
  const [expandedObj, setExpandedObj] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const profile = loadData<UserProfile>(KEYS.PROFILE, { name: '', role: '', company: '', segment: '' });
    const all = getObjections(profile.segment);
    setTopObjections(all.slice(0, 5));
    setNotes(localStorage.getItem('gss_premeeting_notes') || '');
  }, []);

  const toggleCheck = (idx: number) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    localStorage.setItem('gss_premeeting_notes', value);
  };

  const progress = Math.round((checkedItems.size / PRE_MEETING_CHECKLIST.length) * 100);
  const topTechniques = TECHNIQUES.slice(0, 3);

  return (
    <div className="premeeting-page">
      <div className="premeeting-hero card">
        <Zap size={28} />
        <div>
          <h3>Modo Pré-reunião</h3>
          <p>Prepare-se em 2 minutos</p>
        </div>
      </div>

      {/* Checklist */}
      <div className="premeeting-section">
        <h4 className="section-title">Checklist Rápido</h4>
        <div className="premeeting-progress">
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
          <span>{progress}%</span>
        </div>
        <div className="quick-checklist card">
          {PRE_MEETING_CHECKLIST.map((item, i) => (
            <div key={i} className={`quick-check-item ${checkedItems.has(i) ? 'checked' : ''}`} onClick={() => toggleCheck(i)}>
              <div className="quick-check-box">
                {checkedItems.has(i) && <Check size={12} />}
              </div>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notas rápidas */}
      <div className="premeeting-section">
        <h4 className="section-title"><StickyNote size={16} /> Anotações do cliente</h4>
        <textarea
          className="premeeting-notes"
          value={notes}
          onChange={e => handleNotesChange(e.target.value)}
          rows={4}
          placeholder="Nome do cliente, contexto, objetivo da reunião, pontos de atenção..."
        />
      </div>

      {/* Objeções mais comuns */}
      <div className="premeeting-section">
        <div className="section-toggle" onClick={() => setShowObjections(!showObjections)}>
          <h4 className="section-title"><Shield size={16} /> Objeções Frequentes</h4>
          {showObjections ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
        {showObjections && (
          <div className="mini-objections">
            {topObjections.map(obj => (
              <div key={obj.id} className="mini-obj card">
                <div className="mini-obj-header" onClick={() => setExpandedObj(expandedObj === obj.id ? null : obj.id)}>
                  <strong>{obj.objection}</strong>
                  {expandedObj === obj.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
                {expandedObj === obj.id && (
                  <div className="mini-obj-responses">
                    {obj.quickResponses && obj.quickResponses.length > 0 ? (
                      obj.quickResponses.map((r, i) => (
                        <p key={i}><strong>{i + 1}.</strong> {r}</p>
                      ))
                    ) : (
                      obj.responses.map((r, i) => (
                        <p key={i}><strong>{i + 1}.</strong> {r}</p>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Técnicas */}
      <div className="premeeting-section">
        <div className="section-toggle" onClick={() => setShowTechniques(!showTechniques)}>
          <h4 className="section-title"><BookOpen size={16} /> Técnicas Rápidas</h4>
          {showTechniques ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
        {showTechniques && (
          <div className="mini-techniques">
            {topTechniques.map(tech => (
              <div key={tech.id} className="mini-tech card">
                <span className="technique-icon">{tech.icon}</span>
                <div>
                  <strong>{tech.name}</strong>
                  <p>{tech.summary}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
