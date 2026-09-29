// Gera o PDF do folheto: páginas A5 (pdfkit) e, para impressão, a imposição em
// livreto — folhas A4 paisagem, duas páginas por lado, frente e verso, dobra ao meio.

import PDFDocument from 'pdfkit';
import { PDFDocument as PdfLib } from 'pdf-lib';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const A4 = { w: 841.89, h: 595.28 };
const A5 = { w: A4.w / 2, h: A4.h };
const MARGEM = { top: 44, bottom: 50, left: 40, right: 40 };
const LARGURA = A5.w - MARGEM.left - MARGEM.right;

const COR_TEXTO = '#1b1b1b';
const COR_RUBRICA = '#9b1c1c';
const CORES_LITURGICAS = {
  verde: '#2f6b3b', roxo: '#5b2a6e', violeta: '#5b2a6e', branco: '#c7a33a', dourado: '#c7a33a',
  vermelho: '#a3171c', rosa: '#c46b8b', preto: '#222222', azul: '#2b4c8c',
};

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const BRASAO = join(RAIZ, 'public', 'brasao.png');

// Palatino (Windows) ou fontes colocadas em ./fontes; senão, Times embutida no PDF.
function registrarFontes(doc) {
  const pastas = [process.env.FONTES_DIR, join(RAIZ, 'fontes'), 'C:\\Windows\\Fonts', '/usr/share/fonts/truetype'].filter(Boolean);
  const conjuntos = [
    ['pala.ttf', 'palab.ttf', 'palai.ttf', 'palabi.ttf'],
    ['EBGaramond-Regular.ttf', 'EBGaramond-Bold.ttf', 'EBGaramond-Italic.ttf', 'EBGaramond-BoldItalic.ttf'],
    ['georgia.ttf', 'georgiab.ttf', 'georgiai.ttf', 'georgiaz.ttf'],
  ];
  for (const pasta of pastas) {
    for (const nomes of conjuntos) {
      const caminhos = nomes.map((n) => join(pasta, n));
      if (caminhos.every((c) => existsSync(c))) {
        ['R', 'B', 'I', 'BI'].forEach((k, i) => doc.registerFont(k, caminhos[i]));
        return;
      }
    }
  }
  doc.registerFont('R', 'Times-Roman');
  doc.registerFont('B', 'Times-Bold');
  doc.registerFont('I', 'Times-Italic');
  doc.registerFont('BI', 'Times-BoldItalic');
}

const TAM = { corpo: 10.4, rubrica: 8.6, rotulo: 7.6, titulo: 11, secao: 11.5, leitura: 9.8 };

class Diagramador {
  constructor(doc, opcoes) {
    this.doc = doc;
    this.rubricasVermelhas = opcoes.rubricasVermelhas !== false;
  }
  get limite() { return this.doc.page.height - MARGEM.bottom; }
  get restante() { return this.limite - this.doc.y; }
  get corRubrica() { return this.rubricasVermelhas ? COR_RUBRICA : '#555555'; }

  altura(b) {
    const d = this.doc;
    switch (b.t) {
      case 'secao': return 40;
      case 'titulo': return 22;
      case 'rotulo': return 14;
      case 'referencia': return 15;
      case 'salmo': return 999; // flui entre páginas
      case 'rubrica': d.font('I').fontSize(TAM.rubrica); return d.heightOfString(b.texto, { width: LARGURA }) + 4;
      case 'versos': {
        d.font(b.povo ? 'B' : 'R').fontSize(TAM.corpo);
        const h = b.linhas.reduce((s, l) => s + d.heightOfString(l, { width: LARGURA - 14 }), 0);
        return h + (b.quem ? 12 : 0) + 6;
      }
      default: {
        const rot = b.quem ? `${b.quem.toUpperCase()}   ` : '';
        d.font(b.povo ? 'B' : 'R').fontSize(b.leitura ? TAM.leitura : TAM.corpo);
        return d.heightOfString(rot + b.texto, { width: LARGURA, lineGap: 1.2 }) + 5;
      }
    }
  }

  novaPaginaSeNecessario(h) {
    if (h > this.restante && this.doc.y > MARGEM.top + 1) this.doc.addPage();
  }

  render(blocos) {
    for (let i = 0; i < blocos.length; i++) {
      const b = blocos[i];
      const prox = blocos[i + 1];
      const prox2 = blocos[i + 2];
      let h = this.altura(b);
      if (['secao', 'titulo', 'rotulo', 'referencia'].includes(b.t) && prox) {
        h += Math.min(this.altura(prox), 70);
        if (['titulo', 'referencia', 'rubrica'].includes(prox.t) && prox2) h += Math.min(this.altura(prox2), 50);
      } else if (b.t === 'fala' && !b.povo && prox?.t === 'fala' && prox.povo) {
        h += this.altura(prox); // mantém versículo e resposta juntos
      }
      if (h <= 150) this.novaPaginaSeNecessario(h);
      else if (this.restante < 60) this.doc.addPage();
      this[b.t](b);
    }
  }

  secao(b) {
    const d = this.doc;
    if (d.y > MARGEM.top + 1) d.moveDown(0.9);
    d.font('B').fontSize(TAM.secao).fillColor(this.corRubrica)
      .text(b.texto.toUpperCase(), MARGEM.left, d.y, { width: LARGURA, align: 'center', characterSpacing: 1.6 });
    const y = d.y + 3;
    const cx = A5.w / 2;
    d.save().lineWidth(0.6).strokeColor(this.corRubrica)
      .moveTo(cx - 34, y).lineTo(cx - 6, y).stroke()
      .moveTo(cx + 6, y).lineTo(cx + 34, y).stroke()
      .restore();
    d.save().fillColor(this.corRubrica).rect(cx - 2, y - 2, 4, 4).fill().restore();
    d.y = y + 10;
  }

  titulo(b) {
    const d = this.doc;
    d.moveDown(0.5);
    d.font('B').fontSize(TAM.titulo).fillColor(COR_TEXTO).text(b.texto, MARGEM.left, d.y, { width: LARGURA });
    d.moveDown(0.2);
  }

  rotulo(b) {
    const d = this.doc;
    d.font('I').fontSize(TAM.rotulo + 1).fillColor(this.corRubrica).text(b.texto, MARGEM.left, d.y, { width: LARGURA });
    d.moveDown(0.15);
  }

  referencia(b) {
    const d = this.doc;
    let t = b.alternativa ? `${b.texto}   (ou ${b.alternativa})` : b.texto;
    if (b.traducao) t += `  ·  ${String(b.traducao).toUpperCase()}`;
    d.font('BI').fontSize(9.4).fillColor(this.corRubrica).text(t, MARGEM.left, d.y, { width: LARGURA });
    d.moveDown(0.2);
  }

  rubrica(b) {
    const d = this.doc;
    d.font('I').fontSize(TAM.rubrica).fillColor(this.corRubrica).text(b.texto, MARGEM.left, d.y, { width: LARGURA });
    d.moveDown(0.25);
  }

  fala(b) {
    const d = this.doc;
    const tam = b.leitura ? TAM.leitura : TAM.corpo;
    const opts = { width: LARGURA, align: b.texto.length > 90 ? 'justify' : 'left', lineGap: 1.2 };
    if (b.quem) {
      d.font('I').fontSize(TAM.rotulo).fillColor(this.corRubrica)
        .text(`${b.quem.toUpperCase()}   `, MARGEM.left, d.y, { continued: true, characterSpacing: 0.4 });
      d.font(b.povo ? 'B' : 'R').fontSize(tam).fillColor(COR_TEXTO).text(b.texto, { ...opts, characterSpacing: 0 });
    } else {
      d.font(b.povo ? 'B' : 'R').fontSize(tam).fillColor(COR_TEXTO).text(b.texto, MARGEM.left, d.y, opts);
    }
    d.moveDown(0.35);
  }

  texto(b) { this.fala(b); }

  // Salmo responsorial: versículos alternados, os do povo em negrito.
  salmo(b) {
    const d = this.doc;
    b.versos.forEach((v, i) => {
      const povo = i % 2 === 1;
      d.font(povo ? 'B' : 'R').fontSize(TAM.leitura);
      const h = d.heightOfString(v, { width: LARGURA - 12, lineGap: 0.8 });
      if (h > this.restante) d.addPage();
      d.fillColor(COR_TEXTO).text(v, MARGEM.left + (povo ? 12 : 0), d.y, { width: LARGURA - 12, lineGap: 0.8 });
      d.moveDown(0.25);
    });
    d.x = MARGEM.left;
    d.moveDown(0.2);
  }

  versos(b) {
    const d = this.doc;
    if (b.quem) {
      d.font('I').fontSize(TAM.rotulo).fillColor(this.corRubrica)
        .text(b.quem.toUpperCase(), MARGEM.left, d.y, { width: LARGURA, characterSpacing: 0.4 });
      d.moveDown(0.1);
    }
    for (const linha of b.linhas) {
      d.font(b.povo ? 'B' : 'R').fontSize(TAM.corpo);
      const hl = d.heightOfString(linha, { width: LARGURA - 14 });
      if (hl > this.restante) d.addPage();
      const y = d.y;
      if (b.marcador) d.font('R').fillColor(this.corRubrica).text('•', MARGEM.left + 3, y, { lineBreak: false });
      d.font(b.povo ? 'B' : 'R').fillColor(COR_TEXTO).text(linha, MARGEM.left + 14, y, { width: LARGURA - 14, lineGap: 0.8 });
    }
    d.x = MARGEM.left;
    d.moveDown(0.4);
  }
}

function faixaCor(doc, cor) {
  const c = CORES_LITURGICAS[cor] || '#7a1e1e';
  doc.save().rect(0, 0, A5.w, 7).fill(c).rect(0, A5.h - 7, A5.w, 7).fill(c).restore();
}

function capa(doc, dia, opcoes) {
  const cx = MARGEM.left;
  faixaCor(doc, dia.cor);
  let y = 58;
  if (existsSync(BRASAO)) {
    doc.image(BRASAO, (A5.w - 118) / 2, y, { fit: [118, 128], align: 'center' });
    y += 138;
  }
  doc.font('R').fontSize(7.8).fillColor('#444').text('IGREJA EPISCOPAL CARISMÁTICA DO BRASIL', cx, y, { width: LARGURA, align: 'center', characterSpacing: 1.8 });
  if (opcoes.comunidade) {
    doc.moveDown(0.35);
    doc.font('I').fontSize(11).fillColor(COR_TEXTO).text(opcoes.comunidade, cx, doc.y, { width: LARGURA, align: 'center' });
  }
  doc.moveDown(1.6);
  doc.font('B').fontSize(25).fillColor(COR_TEXTO).text('Santa Eucaristia', cx, doc.y, { width: LARGURA, align: 'center' });
  doc.font('I').fontSize(13).fillColor(COR_RUBRICA).text(opcoes.nomeRito || 'Rito I', cx, doc.y, { width: LARGURA, align: 'center' });
  const ly = doc.y + 10;
  doc.save().lineWidth(0.6).strokeColor(COR_RUBRICA).moveTo(A5.w / 2 - 50, ly).lineTo(A5.w / 2 + 50, ly).stroke().restore();
  doc.y = ly + 16;
  doc.font('B').fontSize(14).fillColor(COR_TEXTO).text(dia.nomeDia, cx, doc.y, { width: LARGURA, align: 'center' });
  if (dia.subtitulo) doc.font('I').fontSize(10.5).fillColor('#333').text(dia.subtitulo, cx, doc.y, { width: LARGURA, align: 'center' });
  doc.moveDown(0.6);
  doc.font('R').fontSize(11).fillColor(COR_TEXTO).text(dia.dataExtenso, cx, doc.y, { width: LARGURA, align: 'center' });
  doc.moveDown(0.4);
  const detalhes = [dia.nomeTempo, dia.cor ? `cor ${dia.cor}` : null, dia.anoLiturgico ? `Ano ${dia.anoLiturgico}` : null].filter(Boolean).join('  ·  ');
  doc.font('I').fontSize(9.5).fillColor('#444').text(detalhes, cx, doc.y, { width: LARGURA, align: 'center' });

  doc.font('R').fontSize(8).fillColor('#666')
    .text('Livro de Oração Comum · IEAB · 1987', cx, A5.h - 64, { width: LARGURA, align: 'center', lineBreak: false });
}

function contracapa(doc, dia) {
  const cx = MARGEM.left;
  faixaCor(doc, dia.cor);
  doc.y = 56;
  doc.font('B').fontSize(11).fillColor(COR_RUBRICA).text('LEITURAS DO DIA', cx, doc.y, { width: LARGURA, align: 'center', characterSpacing: 1.4 });
  doc.moveDown(0.8);
  const L = dia.leituras || {};
  const itens = [
    ['Primeira Leitura', L.primeira], ['Salmo', L.salmo], ['Epístola', L.segunda], ['Evangelho', L.evangelho],
  ].filter(([, r]) => r);
  if (!itens.length) {
    doc.font('I').fontSize(10).fillColor('#555').text('Leituras próprias do dia.', cx, doc.y, { width: LARGURA, align: 'center' });
  }
  for (const [nome, r] of itens) {
    doc.font('I').fontSize(9).fillColor('#555').text(nome, cx, doc.y, { width: LARGURA, align: 'center' });
    doc.font('B').fontSize(11).fillColor(COR_TEXTO).text(r.alternativa ? `${r.referencia}  ou  ${r.alternativa}` : r.referencia, cx, doc.y, { width: LARGURA, align: 'center' });
    doc.moveDown(0.5);
  }
  if (dia.coleta?.titulo) {
    doc.moveDown(0.4);
    doc.font('I').fontSize(8.8).fillColor('#555').text(`Próprio: ${dia.coleta.titulo}`, cx, doc.y, { width: LARGURA, align: 'center' });
  }
  if (dia.prefacio) doc.font('I').fontSize(8.8).fillColor('#555').text(`Prefácio: ${dia.prefacio.titulo}`, cx, doc.y, { width: LARGURA, align: 'center' });

  doc.moveDown(1.6);
  doc.font('B').fontSize(11).fillColor(COR_RUBRICA).text('AVISOS E INTENÇÕES', cx, doc.y, { width: LARGURA, align: 'center', characterSpacing: 1.4 });
  let y = doc.y + 14;
  doc.save().lineWidth(0.4).strokeColor('#bbbbbb');
  while (y < A5.h - 96) { doc.moveTo(cx, y).lineTo(A5.w - MARGEM.right, y).stroke(); y += 20; }
  doc.restore();
  const baixo = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;
  doc.font('R').fontSize(7).fillColor('#777').text(
    'Texto litúrgico: Livro de Oração Comum da Igreja Episcopal Anglicana do Brasil (1987). Calendário e lecionário: API Estêvão — caminhoanglicano.com.br.',
    cx, A5.h - 74, { width: LARGURA, align: 'center' },
  );
  doc.page.margins.bottom = baixo;
}

function rodapes(doc, semNumero, nomeRito = 'Rito I') {
  const { start, count } = doc.bufferedPageRange();
  for (let i = start; i < start + count; i++) {
    if (semNumero.has(i)) continue;
    doc.switchToPage(i);
    const baixo = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc.font('R').fontSize(8).fillColor('#777')
      .text(String(i + 1), MARGEM.left, A5.h - 32, { width: LARGURA, align: 'center', lineBreak: false });
    doc.font('I').fontSize(6.8).fillColor('#999')
      .text(`Santa Eucaristia · ${nomeRito}`, MARGEM.left, A5.h - 32, { width: LARGURA, align: i % 2 ? 'left' : 'right', lineBreak: false });
    doc.page.margins.bottom = baixo;
  }
}

/** Gera o PDF sequencial em A5 (já com o número de páginas múltiplo de 4 se livreto). */
export function gerarA5(dia, blocos, opcoes = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [A5.w, A5.h], margins: MARGEM, bufferPages: true, autoFirstPage: false,
      info: { Title: `Santa Eucaristia — ${opcoes.nomeRito || 'Rito I'} — ${dia.dataExtenso}`, Author: opcoes.comunidade || 'Igreja Episcopal Carismática do Brasil', Subject: dia.nomeDia },
    });
    const partes = [];
    let total = 0;
    doc.on('data', (c) => partes.push(c));
    doc.on('error', reject);
    doc.on('end', () => resolve({ buffer: Buffer.concat(partes), paginas: total }));
    registrarFontes(doc);

    doc.addPage();
    capa(doc, dia, opcoes);
    doc.addPage();
    new Diagramador(doc, opcoes).render(blocos);

    const semNumero = new Set([0]);
    const comContracapa = doc.bufferedPageRange().count + 1;
    if (opcoes.livreto !== false) {
      const faltam = (4 - (comContracapa % 4)) % 4;
      for (let k = 0; k < faltam; k++) { doc.addPage(); semNumero.add(doc.bufferedPageRange().count - 1); }
    }
    doc.addPage();
    contracapa(doc, dia);
    semNumero.add(doc.bufferedPageRange().count - 1);
    total = doc.bufferedPageRange().count;
    rodapes(doc, semNumero, opcoes.nomeRito);
    doc.end();
  });
}

/**
 * Imposição em livreto: para N páginas (múltiplo de 4), a folha s tem
 * frente = [N−1−2s | 2s] e verso = [2s+1 | N−2−2s].
 * Imprimir em A4, frente e verso, virando pela BORDA CURTA, e dobrar ao meio.
 */
export async function imporLivreto(bufferA5) {
  const origem = await PdfLib.load(bufferA5);
  const n = origem.getPageCount();
  const saida = await PdfLib.create();
  saida.setTitle(origem.getTitle() || 'Santa Eucaristia — Rito I');
  const paginas = await saida.embedPages(origem.getPages());
  const colocar = (folha, idx, x) => {
    if (idx < 0 || idx >= n) return;
    folha.drawPage(paginas[idx], { x, y: 0, width: A5.w, height: A5.h });
  };
  for (let s = 0; s < n / 4; s++) {
    const frente = saida.addPage([A4.w, A4.h]);
    colocar(frente, n - 1 - 2 * s, 0);
    colocar(frente, 2 * s, A5.w);
    const verso = saida.addPage([A4.w, A4.h]);
    colocar(verso, 2 * s + 1, 0);
    colocar(verso, n - 2 - 2 * s, A5.w);
  }
  return Buffer.from(await saida.save());
}
