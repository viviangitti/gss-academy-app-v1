import { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { TECHNIQUES } from '../services/content';
import FavoriteButton from '../components/FavoriteButton';
import ShareButton from '../components/ShareButton';
import './Techniques.css';

export default function Techniques() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="techniques-page">
      <div className="techniques-intro card">
        <BookOpen size={20} />
        <p>Resumo das principais técnicas de vendas. Consulte antes de reuniões para escolher a abordagem certa.</p>
      </div>

      <div className="techniques-list">
        {TECHNIQUES.map(tech => {
          const isExpanded = expandedId === tech.id;
          return (
            <div key={tech.id} className="technique-card card">
              <div className="technique-header" onClick={() => setExpandedId(isExpanded ? null : tech.id)}>
                <span className="technique-icon">{tech.icon}</span>
                <div className="technique-info">
                  <h4>{tech.name}</h4>
                  <p>{tech.summary}</p>
                </div>
                <div className="technique-header-actions">
                  <FavoriteButton type="technique" itemId={tech.id} label={tech.name} size={15} />
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {isExpanded && (
                <div className="technique-details">
                  <div className="technique-steps">
                    <h5>Como aplicar:</h5>
                    {tech.steps.map((step, i) => (
                      <div key={i} className="step-item">
                        <span className="step-number">{i + 1}</span>
                        <p>{step}</p>
                      </div>
                    ))}
                  </div>
                  <div className="technique-when">
                    <h5>Quando usar:</h5>
                    <p>{tech.whenToUse}</p>
                  </div>
                  <ShareButton text={`${tech.name}\n\n${tech.summary}\n\nComo aplicar:\n${tech.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`} title={tech.name} size={16} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
