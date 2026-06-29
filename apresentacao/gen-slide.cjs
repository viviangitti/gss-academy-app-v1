const pptxgen = require('pptxgenjs');
const path = require('path');

const GOLD = 'C9A84C';
const BG = '101218';
const CARD = '1B1E27';
const WHITE = 'FFFFFF';
const MUTED = 'A6A6B2';
const NUMTXT = '2A2206';

const p = new pptxgen();
p.defineLayout({ name: 'W', width: 13.333, height: 7.5 });
p.layout = 'W';
const FONT = 'Helvetica Neue';

const s = p.addSlide();
s.background = { color: BG };

// ── Header ──
s.addText('GSS', {
  x: 0.6, y: 0.5, w: 1.0, h: 0.55, align: 'center', valign: 'middle',
  fill: { color: GOLD }, color: NUMTXT, bold: true, fontSize: 20, fontFace: FONT,
  rectRadius: 0.08, shape: p.ShapeType.roundRect,
});
s.addText('MAESTR.IA', {
  x: 1.75, y: 0.5, w: 5, h: 0.55, valign: 'middle',
  color: WHITE, bold: true, fontSize: 20, charSpacing: 2, fontFace: FONT,
});

s.addText('Instale na tela do seu celular', {
  x: 0.6, y: 1.35, w: 12.1, h: 0.7, color: WHITE, bold: true, fontSize: 34, fontFace: FONT,
});
s.addText([
  { text: 'Abra  ', options: { color: MUTED } },
  { text: 'gss-weld.vercel.app', options: { color: GOLD, bold: true } },
  { text: '  no navegador do celular', options: { color: MUTED } },
], { x: 0.6, y: 2.05, w: 12.1, h: 0.5, fontSize: 17, fontFace: FONT });

// ── Step card helper ──
function card(x, title, steps) {
  const w = 3.85, y = 2.85, h = 3.95;
  s.addShape(p.ShapeType.roundRect, { x, y, w, h, fill: { color: CARD }, line: { type: 'none' }, rectRadius: 0.12 });
  s.addText(title, { x: x + 0.3, y: y + 0.22, w: w - 0.6, h: 0.45, color: WHITE, bold: true, fontSize: 17, fontFace: FONT });
  const sy = y + 0.95, gap = 0.98;
  steps.forEach((t, i) => {
    const cy = sy + i * gap;
    s.addText(String(i + 1), {
      x: x + 0.3, y: cy, w: 0.42, h: 0.42, align: 'center', valign: 'middle',
      shape: p.ShapeType.ellipse, fill: { color: GOLD }, color: NUMTXT, bold: true, fontSize: 15, fontFace: FONT,
    });
    s.addText(t, { x: x + 0.85, y: cy - 0.12, w: w - 1.15, h: 0.7, color: WHITE, fontSize: 14.5, valign: 'middle', fontFace: FONT });
  });
}

card(0.6, 'iPhone · Safari', [
  'Abra o site no Safari',
  [{ text: 'Toque em ', options: {} }, { text: 'Compartilhar', options: { bold: true } }, { text: ' (quadrado com seta ↑)', options: { color: MUTED } }],
  [{ text: 'Toque em ', options: {} }, { text: '“Adicionar à Tela de Início”', options: { bold: true } }],
]);

card(4.74, 'Android · Chrome', [
  'Abra o site no Chrome',
  [{ text: 'Toque no menu ', options: {} }, { text: '⋮', options: { bold: true } }, { text: ' (3 pontinhos)', options: { color: MUTED } }],
  [{ text: 'Toque em ', options: {} }, { text: '“Instalar aplicativo”', options: { bold: true } }],
]);

// ── QR card ──
const qx = 8.88, qy = 2.85, qw = 3.85, qh = 3.95;
s.addShape(p.ShapeType.roundRect, { x: qx, y: qy, w: qw, h: qh, fill: { color: CARD }, line: { type: 'none' }, rectRadius: 0.12 });
s.addText('Ou aponte a câmera', { x: qx + 0.3, y: qy + 0.22, w: qw - 0.6, h: 0.45, color: WHITE, bold: true, fontSize: 17, fontFace: FONT });
s.addImage({ path: path.join(__dirname, 'qrcode-app.png'), x: qx + 1.07, y: qy + 0.95, w: 1.7, h: 1.7 });
s.addText('Escaneie e abra o app direto no seu celular', {
  x: qx + 0.3, y: qy + 2.85, w: qw - 0.6, h: 0.8, align: 'center', color: MUTED, fontSize: 13.5, fontFace: FONT,
});

// ── Footer ──
s.addText([
  { text: 'iPhone: ', options: { color: GOLD, bold: true } },
  { text: 'instalar é o que liga os avisos.   ', options: { color: MUTED } },
  { text: 'Android: ', options: { color: GOLD, bold: true } },
  { text: 'os avisos já funcionam — instalar deixa com cara de app.', options: { color: MUTED } },
], { x: 0.6, y: 6.95, w: 12.1, h: 0.4, fontSize: 13, align: 'center', fontFace: FONT });

p.writeFile({ fileName: path.join(__dirname, 'MAESTRIA-instalar.pptx') }).then(f => console.log('OK ->', f));
