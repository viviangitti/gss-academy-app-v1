import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  BookOpen, Upload, FileText, X, Sparkles, Send,
  Paperclip, RotateCcw, CheckCircle, AlertCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useOnline } from '../hooks/useOnline';
import OfflineState from '../components/OfflineState';
import './BrandGuide.css';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GUIDE_KEY = 'gss_brand_guide_v1';

const SYSTEM_PROMPT = `Você é o Especialista de Guia de Marca da MAESTR.IA. O usuário carregou o Guia de Marca oficial da empresa. Use-o como referência absoluta em todas as respostas.

SUAS CAPACIDADES:
- CONFERIR ALINHAMENTO: Analise se uma ação, peça ou campanha está dentro dos parâmetros do guide. Diga claramente o que está alinhado e o que não está.
- SUGERIR CAMPANHAS: Crie ideias de campanhas 100% dentro da identidade da marca — tom de voz, cores, valores e direcionamento do guide.
- CRIAR BRIEFINGS: Estruture briefings detalhados alinhados com o guide.
- SUGERIR CONTEÚDO: Proponha posts, textos, roteiros e formatos coerentes com o guide.
- DIAGNOSTICAR: Identifique o que está fora do guide em qualquer material apresentado e sugira correções específicas.

DIRETRIZES:
- Sempre referencie partes do guide ao fazer análises
- Seja objetivo: diga claramente o que está dentro e o que está fora
- Para sugestões, mostre como cada elemento se conecta ao guide
- Fale em português brasileiro, seja prático e direto`;

interface StoredGuide {
  id: string;
  name: string;
  type: 'text' | 'file';
  content: string; // text: o texto; file: base64
  mimeType?: string;
  savedAt: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  imagePreview?: string;
  attachmentName?: string;
}

type ChatInstance = ReturnType<ReturnType<GoogleGenerativeAI['getGenerativeModel']>['startChat']>;

const QUICK_PROMPTS = [
  { emoji: '📋', label: 'Conferir ação', text: 'Vou descrever uma ação de marketing. Confira se está alinhada com o guia de marca:\n\n' },
  { emoji: '💡', label: 'Sugerir campanhas', text: 'Com base no guia de marca, sugira 3 ideias de campanhas criativas para o próximo mês.' },
  { emoji: '📝', label: 'Criar briefing', text: 'Crie um briefing de campanha totalmente dentro do guia de marca para o tema:\n\n' },
  { emoji: '📱', label: 'Sugerir post', text: 'Sugira um post para redes sociais alinhado com o guia de marca sobre:\n\n' },
  { emoji: '🔍', label: 'O que está fora?', text: 'Vou compartilhar uma peça ou ação. Identifique o que está fora do guia de marca e como corrigir:\n\n' },
];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function loadGuide(): StoredGuide | null {
  try {
    const raw = localStorage.getItem(GUIDE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveGuide(guide: StoredGuide | null) {
  if (guide) localStorage.setItem(GUIDE_KEY, JSON.stringify(guide));
  else localStorage.removeItem(GUIDE_KEY);
}

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

export default function BrandGuide() {
  const isOnline = useOnline();

  // Guide management
  const [savedGuide, setSavedGuide] = useState<StoredGuide | null>(loadGuide);
  const [inputMode, setInputMode] = useState<'none' | 'text' | 'file'>('none');
  const [pastedText, setPastedText] = useState('');
  const [pendingFile, setPendingFile] = useState<{
    base64: string; mimeType: string; preview: string | null; name: string;
  } | null>(null);
  const [guideOpen, setGuideOpen] = useState(!loadGuide()); // expanded when no guide

  // Chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatReady, setChatReady] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [initError, setInitError] = useState('');
  const [attachedFile, setAttachedFile] = useState<{
    base64: string; mimeType: string; preview: string | null; name: string;
  } | null>(null);

  const chatRef = useRef<ChatInstance | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const guideFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Re-init chat when guide changes
  useEffect(() => {
    if (savedGuide && API_KEY && isOnline) {
      initChat(savedGuide);
    } else {
      chatRef.current = null;
      setChatReady(false);
    }
  }, [savedGuide?.id, isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  const initChat = async (guide: StoredGuide) => {
    setInitLoading(true);
    setInitError('');
    setChatReady(false);
    setMessages([]);
    chatRef.current = null;

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      // Use flash (not lite) para melhor compreensão de documentos
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      if (guide.type === 'text') {
        chatRef.current = model.startChat({
          history: [
            { role: 'user', parts: [{ text: `SISTEMA: ${SYSTEM_PROMPT}` }] },
            { role: 'model', parts: [{ text: 'Entendido. Sou o Especialista de Guia de Marca da MAESTR.IA, pronto para analisar ações, sugerir campanhas e conferir alinhamento.' }] },
            { role: 'user', parts: [{ text: `Aqui está o Guia de Marca da empresa:\n\n${guide.content}` }] },
            { role: 'model', parts: [{ text: 'Guia de Marca carregado e analisado. Tenho pleno conhecimento da identidade, valores, tom de voz e diretrizes da marca. Pode me perguntar qualquer coisa — desde conferir alinhamento de uma ação até sugerir campanhas dentro do guide. Como posso ajudar?' }] },
          ],
        });
        setChatReady(true);
      } else {
        // PDF ou imagem: enviar como primeira mensagem real
        chatRef.current = model.startChat({
          history: [
            { role: 'user', parts: [{ text: `SISTEMA: ${SYSTEM_PROMPT}` }] },
            { role: 'model', parts: [{ text: 'Entendido. Sou o Especialista de Guia de Marca. Aguardando o guia.' }] },
          ],
        });

        const parts: ({ text: string } | { inlineData: { data: string; mimeType: string } })[] = [
          { inlineData: { data: guide.content, mimeType: guide.mimeType! } },
          { text: 'Este é o Guia de Marca oficial da empresa. Analise-o completamente — identidade, valores, tom de voz, diretrizes visuais, paleta de cores, tipografia e qualquer outra diretriz presente. Confirme o que aprendeu sobre a marca.' },
        ];

        const result = await chatRef.current.sendMessage(parts);
        const ack = result.response.text();
        setMessages([{ id: generateId(), role: 'assistant', text: ack }]);
        setChatReady(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setInitError(msg);
    } finally {
      setInitLoading(false);
    }
  };

  // ── Guide management handlers ────────────────────────────────────────────

  const handleSaveTextGuide = () => {
    if (!pastedText.trim()) return;
    const guide: StoredGuide = {
      id: generateId(),
      name: 'Guia de Marca (texto)',
      type: 'text',
      content: pastedText.trim(),
      savedAt: Date.now(),
    };
    saveGuide(guide);
    setSavedGuide(guide);
    setInputMode('none');
    setPastedText('');
    setGuideOpen(false);
  };

  const handleGuideFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert('Arquivo muito grande. O limite é 15 MB.');
      e.target.value = '';
      return;
    }
    const base64 = await readFileAsBase64(file);
    const preview = file.type.startsWith('image/') ? await readFileAsDataURL(file) : null;
    setPendingFile({ base64, mimeType: file.type, preview, name: file.name });
    e.target.value = '';
  };

  const handleSaveFileGuide = () => {
    if (!pendingFile) return;
    const guide: StoredGuide = {
      id: generateId(),
      name: pendingFile.name,
      type: 'file',
      content: pendingFile.base64,
      mimeType: pendingFile.mimeType,
      savedAt: Date.now(),
    };
    saveGuide(guide);
    setSavedGuide(guide);
    setInputMode('none');
    setPendingFile(null);
    setGuideOpen(false);
  };

  const handleRemoveGuide = () => {
    saveGuide(null);
    setSavedGuide(null);
    setMessages([]);
    setChatReady(false);
    chatRef.current = null;
    setGuideOpen(true);
  };

  // ── Chat attachment ───────────────────────────────────────────────────────

  const handleAttachFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { alert('Arquivo muito grande. Limite: 15 MB.'); e.target.value = ''; return; }
    const base64 = await readFileAsBase64(file);
    const preview = file.type.startsWith('image/') ? await readFileAsDataURL(file) : null;
    setAttachedFile({ base64, mimeType: file.type, preview, name: file.name });
    e.target.value = '';
  };

  // ── Send ─────────────────────────────────────────────────────────────────

  const handleSend = async (text?: string) => {
    if (!chatRef.current || !chatReady) return;
    const msg = text || input.trim();
    const file = text ? null : attachedFile;
    if ((!msg && !file) || loading) return;

    if (!text) setAttachedFile(null);
    setInput('');
    setLoading(true);

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      text: msg || `📎 ${file?.name}`,
      imagePreview: file?.preview ?? undefined,
      attachmentName: !file?.preview && file ? file.name : undefined,
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const parts: ({ text: string } | { inlineData: { data: string; mimeType: string } })[] = [];
      if (file) parts.push({ inlineData: { data: file.base64, mimeType: file.mimeType } });
      parts.push({ text: msg || 'Analise esse arquivo com base no guia de marca.' });

      const result = await chatRef.current.sendMessage(parts);
      const response = result.response.text();
      setMessages(prev => [...prev, { id: generateId(), role: 'assistant', text: response }]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Erro';
      setMessages(prev => [...prev, { id: generateId(), role: 'assistant', text: `Erro: ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    if (savedGuide) initChat(savedGuide);
  };

  const formatMessage = (text: string) =>
    text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');

  if (!isOnline) return <OfflineState feature="o Guia de Marca" />;
  if (!API_KEY) return <OfflineState feature="o Guia de Marca" subtitle="Serviço indisponível. Fale com o suporte." />;

  const isPdf = savedGuide?.mimeType === 'application/pdf';
  const isImage = savedGuide?.type === 'file' && savedGuide.mimeType?.startsWith('image/');

  return (
    <div className="bg-page">

      {/* ── Guide section ───────────────────────────────────────── */}
      <div className={`bg-guide-card card ${savedGuide ? 'bg-guide-card--active' : ''}`}>
        <div className="bg-guide-header" onClick={() => setGuideOpen(v => !v)}>
          <div className="bg-guide-header-left">
            <div className={`bg-guide-icon ${savedGuide ? 'bg-guide-icon--active' : ''}`}>
              <BookOpen size={18} />
            </div>
            <div>
              <span className="bg-guide-label">Guia de Marca</span>
              {savedGuide ? (
                <span className="bg-guide-status bg-guide-status--ok">
                  <CheckCircle size={11} /> Ativo
                </span>
              ) : (
                <span className="bg-guide-status bg-guide-status--empty">
                  Nenhum guide carregado
                </span>
              )}
            </div>
          </div>
          {savedGuide
            ? guideOpen ? <ChevronUp size={18} className="bg-chevron" /> : <ChevronDown size={18} className="bg-chevron" />
            : null
          }
        </div>

        {/* Active guide info */}
        {savedGuide && guideOpen && (
          <div className="bg-guide-info">
            <div className="bg-guide-file-row">
              {isImage
                ? <img src={`data:${savedGuide.mimeType};base64,${savedGuide.content}`} className="bg-guide-thumb" alt="guide" />
                : <div className="bg-guide-file-icon"><FileText size={20} /></div>
              }
              <div className="bg-guide-file-meta">
                <span className="bg-guide-file-name">{savedGuide.name}</span>
                <span className="bg-guide-file-type">
                  {isPdf ? 'PDF' : isImage ? 'Imagem' : 'Texto colado'}
                </span>
              </div>
              <button className="bg-guide-remove" onClick={handleRemoveGuide} title="Remover guide">
                <X size={16} />
              </button>
            </div>
            <button className="bg-guide-replace-btn" onClick={() => { setInputMode('none'); setGuideOpen(true); setSavedGuide(null); saveGuide(null); }}>
              Substituir guide
            </button>
          </div>
        )}

        {/* No guide — input options */}
        {!savedGuide && (
          <div className="bg-upload-area">
            {inputMode === 'none' && (
              <div className="bg-upload-choices">
                <button className="bg-upload-btn" onClick={() => { setInputMode('file'); guideFileInputRef.current?.click(); }}>
                  <Upload size={18} />
                  <span>Enviar PDF ou imagem</span>
                </button>
                <button className="bg-upload-btn bg-upload-btn--text" onClick={() => setInputMode('text')}>
                  <FileText size={18} />
                  <span>Colar texto do guide</span>
                </button>
                <input
                  ref={guideFileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  style={{ display: 'none' }}
                  onChange={handleGuideFileSelect}
                />
              </div>
            )}

            {/* Pending file preview */}
            {inputMode === 'file' && pendingFile && (
              <div className="bg-pending-file">
                {pendingFile.preview
                  ? <img src={pendingFile.preview} className="bg-pending-thumb" alt="preview" />
                  : <div className="bg-pending-pdf"><FileText size={24} /></div>
                }
                <span className="bg-pending-name">{pendingFile.name}</span>
                <div className="bg-pending-actions">
                  <button className="bg-save-btn" onClick={handleSaveFileGuide}>Usar como guide</button>
                  <button className="bg-cancel-btn" onClick={() => { setPendingFile(null); setInputMode('none'); }}>Cancelar</button>
                </div>
              </div>
            )}

            {/* Text paste */}
            {inputMode === 'text' && (
              <div className="bg-text-input">
                <textarea
                  className="bg-textarea"
                  placeholder="Cole aqui o conteúdo do guia de marca: valores, tom de voz, paleta, tipografia, diretrizes..."
                  value={pastedText}
                  onChange={e => setPastedText(e.target.value)}
                  rows={6}
                />
                <div className="bg-text-actions">
                  <button className="bg-save-btn" onClick={handleSaveTextGuide} disabled={!pastedText.trim()}>
                    Salvar guide
                  </button>
                  <button className="bg-cancel-btn" onClick={() => { setInputMode('none'); setPastedText(''); }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Chat section ─────────────────────────────────────────── */}
      {savedGuide && (
        <div className="bg-chat">

          {/* Init loading */}
          {initLoading && (
            <div className="bg-init-loading">
              <Sparkles size={16} className="bg-init-spin" />
              <span>Carregando guia de marca na IA...</span>
            </div>
          )}

          {/* Init error */}
          {initError && !initLoading && (
            <div className="bg-init-error">
              <AlertCircle size={16} />
              <span>Erro ao carregar guide: {initError}</span>
              <button onClick={() => initChat(savedGuide)}><RotateCcw size={14} /> Tentar novamente</button>
            </div>
          )}

          {/* Welcome / quick prompts */}
          {chatReady && messages.length === 0 && (
            <div className="bg-welcome">
              <div className="bg-welcome-icon"><Sparkles size={28} /></div>
              <p className="bg-welcome-text">Guia carregado. O que você quer fazer?</p>
              <div className="bg-quick-grid">
                {QUICK_PROMPTS.map(q => (
                  <button key={q.label} className="bg-quick-btn" onClick={() => setInput(q.text)}>
                    <span className="bg-quick-emoji">{q.emoji}</span>
                    <span>{q.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.length > 0 && (
            <div className="bg-messages">
              <button className="bg-clear-btn" onClick={handleClear}>
                <RotateCcw size={12} /> Nova conversa
              </button>
              {messages.map(msg => (
                <div key={msg.id} className={`bg-msg bg-msg--${msg.role}`}>
                  {msg.role === 'assistant' && (
                    <div className="bg-msg-avatar"><Sparkles size={13} /></div>
                  )}
                  <div className="bg-msg-bubble">
                    {msg.imagePreview && (
                      <img src={msg.imagePreview} className="bg-msg-img" alt="anexo" />
                    )}
                    {msg.attachmentName && (
                      <div className="bg-msg-pdf"><FileText size={13} /><span>{msg.attachmentName}</span></div>
                    )}
                    <div
                      className="bg-msg-text"
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }}
                    />
                  </div>
                </div>
              ))}
              {loading && (
                <div className="bg-msg bg-msg--assistant">
                  <div className="bg-msg-avatar"><Sparkles size={13} /></div>
                  <div className="bg-msg-bubble bg-typing">
                    <span className="dot" /><span className="dot" /><span className="dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      )}

      {/* ── Input bar (fixed) ────────────────────────────────────── */}
      {savedGuide && chatReady && (
        <div className="bg-input-area">
          {attachedFile && (
            <div className="bg-attach-preview">
              {attachedFile.preview
                ? <img src={attachedFile.preview} className="bg-attach-thumb" alt="anexo" />
                : <div className="bg-attach-pdf-icon"><FileText size={16} /></div>
              }
              <span className="bg-attach-name">{attachedFile.name}</span>
              <button className="bg-attach-remove" onClick={() => setAttachedFile(null)}><X size={13} /></button>
            </div>
          )}
          <div className="bg-input-row">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              style={{ display: 'none' }}
              onChange={handleAttachFile}
            />
            <button className="bg-attach-btn" onClick={() => fileInputRef.current?.click()} disabled={loading} aria-label="Anexar">
              <Paperclip size={18} />
            </button>
            <input
              className="bg-text-field"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Pergunte sobre o guia de marca..."
              disabled={loading}
            />
            <button
              className="bg-send-btn"
              onClick={() => handleSend()}
              disabled={(!input.trim() && !attachedFile) || loading}
              aria-label="Enviar"
            >
              <Send size={17} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
