import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getBrandGuide } from '../services/brandGuide';
import {
  Send, Upload, FileText, Sparkles, RotateCcw, X,
  AlertCircle, ImagePlus, Download, BookMarked, ChevronDown, ChevronUp, Trash2,
} from 'lucide-react';
import './MarketingChat.css';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GUIDES_KEY = 'gss_brand_guides';

const SYSTEM_PROMPT = `Você é o copiloto de marketing e marca das concessionárias JLR Brasil (Defender, Range Rover, Range Rover Sport). Atende dois públicos:
— Time de Marketing: confere peças, sugere ações, diagnostica mix, traz benchmarks do segmento.
— Time Comercial / Vendedores: confere se apresentações, argumentos, propostas e ativações de showroom estão alinhados com o posicionamento da marca.

Você NÃO é CRM. Não conecta sistemas. Não negocia preços, condições ou financiamento.

CONTEXTO DA MARCA
JLR é portfólio de luxo premium / segmento UHNWI. Comunicação sóbria, elegante, propositiva. Código da marca: ambição, autenticidade, terrain. Sem "liquidação", sem urgência artificial, sem desconto explícito.
Quando um brand guide for carregado (paleta, tipografia, tom de voz, do's & don'ts, regras de logo), ele é a fonte de verdade absoluta — sobreponha-o a qualquer suposição genérica.
Quando uma imagem de ação for enviada (foto de showroom, post, banner, evento, material de vendas), analise visualmente o alinhamento com o guide carregado ou com os princípios conhecidos da marca.

MODOS DE OPERAÇÃO

Modo Conferir (peça ou imagem)
Recebe: texto de legenda, oferta, roteiro, argumento de venda OU imagem de ação (post, banner, foto de evento, material, apresentação).
Devolva:
• Veredito: ✅ dentro da marca / ⚠️ ajustes necessários / ❌ fora do padrão
• Pontos específicos que destoam (cores, tipografia, tom, mensagem, enquadramento visual)
• Versão corrigida ou caminho de correção em linguagem concreta
Nunca aprove automaticamente. Se houver ambiguidade, aponte.

Modo Sugerir
O usuário descreve o momento: sazonalidade, lançamento, estoque parado, evento, baixa de tráfego, campanha nacional chegando, meta do mês.
Devolva repertório priorizado de ações concretas (máx. 5), equilibrando:
— Showroom / experiência física
— Digital (conteúdo, mídia paga, social)
— Relacionamento (base ativa, ex-proprietários, prospects quentes)
— Eventos e ativações locais
— Parcerias lifestyle (aviação executiva, gastronomia, imóveis de alto padrão, náutica)
Cada ação: objetivo + esforço (baixo/médio/alto) + como executar respeitando a marca.

Modo Diagnosticar
O usuário descreve o que vem fazendo (canais, frequência, tipos de ação).
Funcione como espelho honesto:
• O que está desequilibrado no mix
• O que está superinvestido sem resultado proporcional
• O que está sendo ignorado
• 2-3 ajustes de maior impacto imediato
Seja direto. Lacuna identificada é mais útil que elogio.

Modo Benchmark
O usuário quer referências de mercado para calibrar ações.
Devolva dados reais do segmento de luxo automotivo, contextualizados para concessionária local:
• E-mail luxury: abertura 35-45% (vs. 20% mercado geral); 2x/mês segmentado por modelo; assunto personalizado aumenta abertura 25%
• Mídia paga: CTR 1,5-3%; custo por lead qualificado USD 150-400; Meta e Google superam TikTok no UHNWI; vídeo supera estático 2x em awareness
• Test drive: conversão → compra 30-50%; programa ativo dobra volume; experiência de busca e entrega diferencia
• Cadência de relacionamento: contato a cada 45-60 dias, segmentado por modelo/perfil — nunca em massa
• Social: Instagram 3-4 posts/semana qualidade > quantidade; Stories de craft/bastidores têm 2x retenção
• Eventos com curadoria (jantar, arte, lançamento fechado): NPS 40-60pts acima de ações digitais; custo por contato qualificado menor que mídia
• Parcerias lifestyle: 15-25% de leads novos via indicação cruzada com aviação, náutica, fine dining, imóveis
• Retenção: 5-7x mais barato manter cliente que adquirir; ex-proprietário ativo reduz churn 20-30%
• Referral: 40-60% das vendas em luxury vêm de indicação; programa estruturado amplifica sem desconto
• WhatsApp: funciona bem 1:1 com prospects quentes e base ativa — NUNCA broadcast massivo

REGRAS GERAIS
• Identifique o modo pelo contexto; em dúvida, pergunte de forma curta.
• Respostas diretas, priorizadas, acionáveis — sem listas genéricas de 15 itens.
• Nunca rebaixe tom da marca para gerar volume/urgência.
• Desconto/promoção: reenquadre em código de luxo (acesso exclusivo, raridade, experiência — nunca preço).
• Sem brand guide carregado e usuário quer conferir peça: peça o guide antes de opinar.
• Não negocia preços, condições ou financiamento — redirecione para o time comercial.

TOM
Consultor de marca sênior: confiante, conciso, sem jargão vazio. Trata o usuário como capaz — oferece o repertório que ele não tem tempo de construir sozinho.`;

const QUICK_PROMPTS = [
  { label: '🔍 Conferir peça ou imagem', text: 'Quero conferir uma peça ou imagem de ação — vou enviar agora.' },
  { label: '💡 Sugerir ações', text: 'Preciso de ações concretas para este mês. Vou descrever o momento atual da concessionária.' },
  { label: '🪞 Diagnosticar mix', text: 'Quero diagnosticar meu mix de marketing dos últimos 30-60 dias.' },
  { label: '📊 Benchmark', text: 'Quais benchmarks do segmento luxury automotivo devo usar para calibrar nossas ações?' },
  { label: '🌐 Aterrissar campanha', text: 'Temos uma campanha nacional chegando. Como aterrissar localmente sem perder a marca?' },
];

interface Message {
  role: 'user' | 'model';
  text: string;
  imagePreview?: string;
}

interface AttachedImage {
  base64: string;
  mimeType: string;
  preview: string;
  name: string;
}

interface SavedGuide {
  id: string;
  name: string;
  base64: string;
  mimeType: string;
  savedAt: number;
}

interface ActiveGuide {
  base64: string;
  mimeType: string;
  name: string;
}

// ─── localStorage helpers ────────────────────────────────────────
function loadSavedGuides(): SavedGuide[] {
  try { return JSON.parse(localStorage.getItem(GUIDES_KEY) || '[]'); } catch { return []; }
}
function persistGuides(guides: SavedGuide[]) {
  localStorage.setItem(GUIDES_KEY, JSON.stringify(guides));
}

// ─── Text helpers ────────────────────────────────────────────────
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatText(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .split('\n')
    .map(line => {
      if (line.startsWith('• ') || line.startsWith('- ')) return `<li>${line.slice(2)}</li>`;
      return line ? `<p>${line}</p>` : '';
    })
    .join('');
}

function downloadText(text: string, filename = 'analise-marketing.txt') {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── Component ───────────────────────────────────────────────────
export default function MarketingChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Guide state
  const [activeGuide, setActiveGuide] = useState<ActiveGuide | null>(null);
  const [savedGuides, setSavedGuides] = useState<SavedGuide[]>(loadSavedGuides);
  const [showGuidePanel, setShowGuidePanel] = useState(false);
  const [uploadingGuide, setUploadingGuide] = useState(false);
  const [guideError, setGuideError] = useState('');

  // Image attachment
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const guideInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<ReturnType<ReturnType<GoogleGenerativeAI['getGenerativeModel']>['startChat']> | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Guia de Marca do /guia-marca é a fonte única: se houver um arquivo cadastrado lá,
  // ele já entra como guia ativo do Copiloto (sem precisar subir de novo aqui).
  useEffect(() => {
    if (activeGuide) return;
    const g = getBrandGuide();
    if (g && g.type === 'file' && g.mimeType) {
      setActiveGuide({ base64: g.content, mimeType: g.mimeType, name: g.name || 'Guia de Marca' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Chat init ─────────────────────────────────────────────────
  const initChat = (guide: ActiveGuide | null) => {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: SYSTEM_PROMPT });
    const history = guide ? [
      {
        role: 'user' as const,
        parts: [
          { text: 'Brand guide carregado. Use-o como fonte de verdade para todas as consultas desta sessão.' },
          { inlineData: { data: guide.base64, mimeType: guide.mimeType } },
        ],
      },
      {
        role: 'model' as const,
        parts: [{ text: `Brand guide "${guide.name}" registrado. Vou usá-lo como referência primária. Como posso ajudar?` }],
      },
    ] : [];
    chatRef.current = model.startChat({ history });
  };

  // ─── Guide upload ──────────────────────────────────────────────
  const handleGuideUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const valid = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!valid.includes(file.type)) { setGuideError('Use JPG, PNG ou PDF.'); return; }
    if (file.size > 20 * 1024 * 1024) { setGuideError('Máximo 20 MB.'); return; }

    setUploadingGuide(true);
    setGuideError('');
    try {
      const base64 = await readFileAsBase64(file);
      const guide: ActiveGuide = { base64, mimeType: file.type, name: file.name };
      setActiveGuide(guide);
      chatRef.current = null;
      setMessages([]);

      // Save to library
      const newSaved: SavedGuide = { id: Date.now().toString(), name: file.name, base64, mimeType: file.type, savedAt: Date.now() };
      setSavedGuides(prev => {
        const updated = [newSaved, ...prev.filter(g => g.name !== file.name)].slice(0, 10);
        persistGuides(updated);
        return updated;
      });
    } catch { setGuideError('Erro ao processar o arquivo.'); }
    setUploadingGuide(false);
  };

  const loadSavedGuide = (saved: SavedGuide) => {
    const guide: ActiveGuide = { base64: saved.base64, mimeType: saved.mimeType, name: saved.name };
    setActiveGuide(guide);
    chatRef.current = null;
    setMessages([]);
    setShowGuidePanel(false);
  };

  const deleteSavedGuide = (id: string) => {
    setSavedGuides(prev => {
      const updated = prev.filter(g => g.id !== id);
      persistGuides(updated);
      return updated;
    });
  };

  const clearGuide = () => {
    setActiveGuide(null);
    chatRef.current = null;
    setMessages([]);
  };

  // ─── Image attachment ──────────────────────────────────────────
  const handleImageAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const valid = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!valid.includes(file.type)) { setError('Imagem: use JPG, PNG ou WebP.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('Imagem muito grande. Máximo 10 MB.'); return; }

    setUploadingImage(true);
    try {
      const [base64, preview] = await Promise.all([readFileAsBase64(file), readFileAsDataURL(file)]);
      setAttachedImage({ base64, mimeType: file.type, preview, name: file.name });
    } catch { setError('Erro ao carregar imagem.'); }
    setUploadingImage(false);
  };

  // ─── Send message ──────────────────────────────────────────────
  const sendMessage = async (text: string, img?: AttachedImage) => {
    if ((!text.trim() && !img) || loading) return;
    setError('');

    const userMsg: Message = { role: 'user', text, imagePreview: img?.preview };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachedImage(null);
    setLoading(true);

    try {
      if (!chatRef.current) initChat(activeGuide);

      type Part = { text: string } | { inlineData: { data: string; mimeType: string } };
      const parts: Part[] = [];

      if (img) parts.push({ inlineData: { data: img.base64, mimeType: img.mimeType } });
      if (text.trim()) parts.push({ text });
      if (!text.trim() && img) parts.push({ text: 'Analise esta imagem e confira se está alinhada com o guide e os padrões da marca JLR.' });

      const result = await chatRef.current!.sendMessage(parts as never);
      const reply = result.response.text();
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch {
      setError('Erro ao conectar com a IA. Verifique sua conexão.');
      setMessages(prev => prev.slice(0, -1));
    }

    setLoading(false);
  };

  const handleReset = () => { chatRef.current = null; setMessages([]); setError(''); setAttachedImage(null); };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input, attachedImage || undefined); }
  };

  const handleSend = () => sendMessage(input, attachedImage || undefined);

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="mc-page">

      {/* ── Guide bar ── */}
      <div className="mc-guide-bar card">
        <div className="mc-guide-row">
          {activeGuide ? (
            <div className="mc-guide-active">
              <FileText size={15} className="mc-guide-icon-active" />
              <span className="mc-guide-name">{activeGuide.name}</span>
              <span className="mc-guide-pill">Guide ativo</span>
              <button className="mc-guide-clear" onClick={clearGuide}><X size={14} /></button>
            </div>
          ) : (
            <button className="mc-guide-upload" onClick={() => guideInputRef.current?.click()} disabled={uploadingGuide}>
              {uploadingGuide
                ? <><Sparkles size={14} className="mc-spinning" /> Processando...</>
                : <><Upload size={14} /> Subir Brand Guide (PDF ou imagem)</>}
            </button>
          )}

          {/* Saved guides toggle */}
          <button
            className="mc-guide-library-btn"
            onClick={() => setShowGuidePanel(v => !v)}
            title="Guides salvos"
          >
            <BookMarked size={15} />
            {savedGuides.length > 0 && <span className="mc-guide-badge">{savedGuides.length}</span>}
            {showGuidePanel ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* Saved guides panel */}
        {showGuidePanel && (
          <div className="mc-guide-panel">
            {savedGuides.length === 0 ? (
              <p className="mc-guide-panel-empty">Nenhum guide salvo ainda.</p>
            ) : (
              savedGuides.map(g => (
                <div key={g.id} className="mc-guide-panel-item">
                  <FileText size={13} />
                  <span className="mc-guide-panel-name">{g.name}</span>
                  <button className="mc-guide-panel-load btn btn-outline btn-sm" onClick={() => loadSavedGuide(g)}>
                    Carregar
                  </button>
                  <button className="mc-guide-panel-del" onClick={() => deleteSavedGuide(g.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {guideError && <div className="mc-guide-error"><AlertCircle size={13} /> {guideError}</div>}
      </div>

      <input ref={guideInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
        style={{ display: 'none' }} onChange={handleGuideUpload} />
      <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }} onChange={handleImageAttach} />

      {/* ── Messages ── */}
      <div className="mc-messages">
        {messages.length === 0 && (
          <div className="mc-empty">
            <Sparkles size={28} className="mc-empty-icon" />
            <h3>Copiloto de Marketing & Marca</h3>
            <p>Confira peças e imagens, sugira ações, diagnostique o mix ou busque benchmarks.</p>
            <div className="mc-quick-prompts">
              {QUICK_PROMPTS.map(q => (
                <button key={q.label} className="mc-quick" onClick={() => sendMessage(q.text)}>{q.label}</button>
              ))}
            </div>
            {!activeGuide && (
              <p className="mc-guide-hint">
                Para <strong>conferir peças e imagens</strong>, suba o Brand Guide acima primeiro.<br />
                Para os outros modos, pode usar sem o guide.
              </p>
            )}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`mc-msg mc-msg-${m.role}`}>
            {m.role === 'model' && <div className="mc-msg-avatar"><Sparkles size={13} /></div>}
            <div className="mc-msg-content">
              {m.imagePreview && (
                <img src={m.imagePreview} alt="imagem enviada" className="mc-msg-img-preview" />
              )}
              <div className="mc-msg-bubble" dangerouslySetInnerHTML={{ __html: formatText(m.text) }} />
              {m.role === 'model' && m.text && (
                <button
                  className="mc-download-btn"
                  onClick={() => downloadText(m.text, `analise-${i}.txt`)}
                  title="Baixar análise"
                >
                  <Download size={13} /> Baixar análise
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="mc-msg mc-msg-model">
            <div className="mc-msg-avatar"><Sparkles size={13} /></div>
            <div className="mc-msg-bubble mc-typing"><span /><span /><span /></div>
          </div>
        )}

        {error && <div className="mc-error"><AlertCircle size={14} /> {error}</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input bar ── */}
      <div className="mc-input-bar">
        {messages.length > 0 && (
          <button className="mc-reset" onClick={handleReset} title="Nova conversa"><RotateCcw size={16} /></button>
        )}
        <div className="mc-input-wrap">
          {/* Image attachment preview */}
          {attachedImage && (
            <div className="mc-attach-preview">
              <img src={attachedImage.preview} alt="anexo" className="mc-attach-thumb" />
              <span className="mc-attach-name">{attachedImage.name}</span>
              <button className="mc-attach-remove" onClick={() => setAttachedImage(null)}><X size={12} /></button>
            </div>
          )}
          <div className="mc-input-row">
            <button
              className="mc-image-btn"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploadingImage}
              title="Anexar imagem de ação"
            >
              {uploadingImage ? <Sparkles size={16} className="mc-spinning" /> : <ImagePlus size={16} />}
            </button>
            <textarea
              className="mc-input"
              placeholder={attachedImage ? 'Descreva o que quer conferir (ou envie só a imagem)…' : 'Cole uma peça, descreva o momento ou anexe uma imagem…'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button className="mc-send" onClick={handleSend} disabled={(!input.trim() && !attachedImage) || loading}>
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
