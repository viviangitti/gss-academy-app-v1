import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { isFavorite, toggleFavorite } from '../services/favorites';
import type { FavoriteType } from '../services/favorites';
import './FavoriteButton.css';

interface Props {
  type: FavoriteType;
  itemId: string;
  label: string;
  size?: number;
}

export default function FavoriteButton({ type, itemId, label, size = 16 }: Props) {
  const [fav, setFav] = useState(false);

  useEffect(() => {
    setFav(isFavorite(type, itemId));
  }, [type, itemId]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = toggleFavorite(type, itemId, label);
    setFav(newState);
  };

  return (
    <button
      className={`fav-btn ${fav ? 'active' : ''}`}
      onClick={handleClick}
      title={fav ? 'Remover dos favoritos' : 'Favoritar'}
    >
      <Star size={size} fill={fav ? 'currentColor' : 'none'} strokeWidth={fav ? 2 : 1.8} />
    </button>
  );
}
