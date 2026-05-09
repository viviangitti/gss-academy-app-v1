import { Share2 } from 'lucide-react';
import './ShareButton.css';

interface Props {
  text: string;
  title?: string;
  size?: number;
}

export default function ShareButton({ text, title, size = 16 }: Props) {
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Try native share API first
    if (navigator.share) {
      try {
        await navigator.share({ text, title });
        return;
      } catch {
        // User cancelled or error — fallback below
      }
    }

    // Fallback: open WhatsApp
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <button className="share-btn" onClick={handleShare} title="Compartilhar">
      <Share2 size={size} />
    </button>
  );
}
