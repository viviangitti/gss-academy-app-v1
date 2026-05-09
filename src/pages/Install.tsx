import { useState, useEffect } from 'react';
import { Smartphone, Download, Share2, Plus, Check } from 'lucide-react';
import './Install.css';

type Platform = 'ios' | 'android' | 'desktop' | 'unknown';

function detectPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/windows|mac|linux/.test(ua)) return 'desktop';
  return 'unknown';
}

export default function Install() {
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  const url = typeof window !== 'undefined' ? window.location.origin : 'https://gss-weld.vercel.app';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <div className="install-page">
      <div className="install-hero card">
        <Smartphone size={32} />
        <h2>Instalar MAESTR.IA</h2>
        <p>Instale no seu celular e use como um app normal. Sem precisar de loja, sem ocupar espaço.</p>
      </div>

      {platform === 'ios' && (
        <div className="install-steps card">
          <h3>Como instalar no iPhone / iPad</h3>
          <div className="step">
            <span className="step-num">1</span>
            <div>
              <strong>Abra no Safari</strong>
              <p>Se estiver em outro navegador, copie o link e abra no Safari.</p>
            </div>
          </div>
          <div className="step">
            <span className="step-num">2</span>
            <div>
              <strong>Toque no botão de compartilhar</strong>
              <p>O ícone <Share2 size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> na barra inferior.</p>
            </div>
          </div>
          <div className="step">
            <span className="step-num">3</span>
            <div>
              <strong>Role e toque em "Adicionar à Tela de Início"</strong>
              <p>O ícone do MAESTR.IA vai aparecer na sua tela inicial.</p>
            </div>
          </div>
          <div className="step">
            <span className="step-num">4</span>
            <div>
              <strong>Pronto!</strong>
              <p>Abra pelo ícone na tela inicial. Vai funcionar como um app normal, sem barra do navegador.</p>
            </div>
          </div>
        </div>
      )}

      {platform === 'android' && (
        <div className="install-steps card">
          <h3>Como instalar no Android</h3>
          <div className="step">
            <span className="step-num">1</span>
            <div>
              <strong>Abra no Chrome</strong>
              <p>Se estiver em outro navegador, copie o link e abra no Chrome.</p>
            </div>
          </div>
          <div className="step">
            <span className="step-num">2</span>
            <div>
              <strong>Toque no menu (3 pontinhos)</strong>
              <p>No canto superior direito.</p>
            </div>
          </div>
          <div className="step">
            <span className="step-num">3</span>
            <div>
              <strong>Toque em "Instalar aplicativo"</strong>
              <p>Ou "Adicionar à tela inicial" em alguns Androids.</p>
            </div>
          </div>
          <div className="step">
            <span className="step-num">4</span>
            <div>
              <strong>Pronto!</strong>
              <p>Abra pelo ícone. Vai funcionar como um app normal, sem a barra do navegador.</p>
            </div>
          </div>
        </div>
      )}

      {platform === 'desktop' && (
        <div className="install-steps card">
          <h3>Como instalar no computador</h3>
          <div className="step">
            <span className="step-num">1</span>
            <div>
              <strong>No Chrome ou Edge</strong>
              <p>Procure o ícone de instalação <Plus size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> na barra de endereço.</p>
            </div>
          </div>
          <div className="step">
            <span className="step-num">2</span>
            <div>
              <strong>Clique em "Instalar MAESTR.IA"</strong>
              <p>O app vira uma janela própria, separada do navegador.</p>
            </div>
          </div>
          <div className="step">
            <span className="step-num">3</span>
            <div>
              <strong>Quer usar no celular também?</strong>
              <p>Copie o link abaixo e abra no seu celular.</p>
            </div>
          </div>
        </div>
      )}

      <div className="install-share card">
        <h3>Compartilhar com alguém</h3>
        <div className="install-url">
          <input type="text" value={url} readOnly />
          <button className={`btn ${copied ? 'btn-copied' : 'btn-primary'} btn-sm`} onClick={handleCopy}>
            {copied ? <><Check size={14} /> Copiado</> : <><Download size={14} /> Copiar</>}
          </button>
        </div>
      </div>

      <div className="install-benefits card">
        <h3>Por que instalar?</h3>
        <ul>
          <li>✅ Ícone no celular, abre como app normal</li>
          <li>✅ Atalhos rápidos (segurar o ícone abre direto na IA, Pesquisa, Reunião)</li>
          <li>✅ Funciona offline para conteúdo já visto</li>
          <li>✅ Sem barra do navegador, tela cheia</li>
          <li>✅ Sem precisar de loja nem ocupar memória</li>
          <li>✅ Atualiza automaticamente</li>
        </ul>
      </div>
    </div>
  );
}
