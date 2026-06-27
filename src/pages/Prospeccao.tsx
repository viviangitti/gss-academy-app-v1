import { useState } from 'react';
import { MessageCircle, Copy, Check } from 'lucide-react';
import './Prospeccao.css';

interface Modelo { titulo: string; quando: string; msg: string }

const MODELOS: Modelo[] = [
  {
    titulo: 'Primeiro contato',
    quando: 'Lead novo / indicação',
    msg: 'Oi [Nome], tudo bem? Aqui é o [seu nome], da [loja]. Vi que você demonstrou interesse no [modelo]. Posso te mandar as condições desse mês e tirar suas dúvidas por aqui, sem compromisso?',
  },
  {
    titulo: 'Reativar cliente frio',
    quando: 'Sumiu há semanas',
    msg: 'Oi [Nome]! Lembrei de você 😊 Saiu uma condição nova no [modelo] que combina com o que você procurava. Quer que eu te mande os números atualizados?',
  },
  {
    titulo: 'Resgate — não fechou',
    quando: 'Desistiu / achou caro',
    msg: 'Oi [Nome], fiquei pensando no nosso papo. Consegui revisar a proposta e acho que dá pra deixar mais perto do que você precisa. Posso te ligar 5 min hoje pra te mostrar?',
  },
  {
    titulo: 'Follow-up pós test-drive',
    quando: 'Logo após o test-drive',
    msg: 'Oi [Nome]! Que bom ter te recebido hoje 🚗 E aí, o que achou do [modelo]? Qualquer dúvida que ficou, me chama — tô aqui pra te ajudar a decidir com tranquilidade.',
  },
  {
    titulo: 'Pedir indicação',
    quando: 'Logo após fechar a venda',
    msg: 'Que alegria te ver saindo de [modelo] novo! 🎉 Uma ajuda: você conhece 2 ou 3 pessoas que também estão pensando em trocar de carro? Posso cuidar delas com o mesmo carinho que cuidei de você.',
  },
];

export default function Prospeccao() {
  const [copied, setCopied] = useState<number | null>(null);

  const copy = (i: number, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(i);
    setTimeout(() => setCopied(null), 1800);
  };

  const openWhats = (text: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="prosp-page">
      <div className="prosp-hero card">
        <div className="prosp-hero-icon"><MessageCircle size={24} /></div>
        <div>
          <h2>Prospecção por WhatsApp</h2>
          <p>Mensagens prontas pra abordar, reativar e resgatar — é só personalizar</p>
        </div>
      </div>

      {MODELOS.map((m, i) => (
        <div key={i} className="prosp-msg card">
          <div className="prosp-msg-head">
            <div className="prosp-msg-titles">
              <strong>{m.titulo}</strong>
              <span>{m.quando}</span>
            </div>
          </div>
          <div className="prosp-msg-text">{m.msg}</div>
          <div className="prosp-msg-actions">
            <button className="prosp-copy" onClick={() => copy(i, m.msg)}>
              {copied === i ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar</>}
            </button>
            <button className="prosp-wa" onClick={() => openWhats(m.msg)}>
              <MessageCircle size={14} /> Abrir no WhatsApp
            </button>
          </div>
        </div>
      ))}

      <p className="prosp-note">Dica: troque os [colchetes] pelo nome do cliente e do carro antes de enviar.</p>
    </div>
  );
}
