import { useState, useEffect } from 'react';
import { Star, Shield, FileText, BookOpen, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getFavorites } from '../services/favorites';
import type { Favorite, FavoriteType } from '../services/favorites';
import './Favorites.css';

const TYPE_CONFIG: Record<FavoriteType, { label: string; icon: React.ComponentType<{ size?: number }>; color: string; route: string }> = {
  objection: { label: 'Objeção', icon: Shield, color: '#ef4444', route: '/objecoes' },
  script: { label: 'Roteiro', icon: FileText, color: '#3b82f6', route: '/scripts' },
  technique: { label: 'Técnica', icon: BookOpen, color: '#8b5cf6', route: '/tecnicas' },
  urgency: { label: 'Gatilho', icon: Flame, color: '#f59e0b', route: '/scripts' },
};

export default function Favorites() {
  const navigate = useNavigate();
  const [favs, setFavs] = useState<Favorite[]>([]);

  useEffect(() => {
    setFavs(getFavorites().sort((a, b) => b.addedAt - a.addedAt));
  }, []);

  if (favs.length === 0) {
    return (
      <div className="favorites-page">
        <div className="favorites-empty card">
          <Star size={36} />
          <h3>Sem favoritos ainda</h3>
          <p>Toque na estrela ao lado de objeções, roteiros ou técnicas para guardar aqui e acessar rápido.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <div className="favorites-list">
        {favs.map(f => {
          const cfg = TYPE_CONFIG[f.type];
          const Icon = cfg.icon;
          return (
            <button key={`${f.type}-${f.id}`} className="favorite-card card" onClick={() => navigate(cfg.route)}>
              <div className="favorite-icon" style={{ background: `${cfg.color}15`, color: cfg.color }}>
                <Icon size={18} />
              </div>
              <div className="favorite-info">
                <span className="favorite-type">{cfg.label}</span>
                <span className="favorite-label">{f.label}</span>
              </div>
              <Star size={16} fill="currentColor" className="favorite-star" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
