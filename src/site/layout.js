// Estrutura comum das páginas: <head>, cabeçalho, rodapé e utilitários de HTML.

import { ler } from './armazem.js';

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Texto simples → parágrafos HTML (linhas em branco separam parágrafos). */
export const paragrafos = (texto) =>
  String(texto ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('');

/** Só aceita links http(s), mailto e caminhos locais. */
export const url = (u) => (/^(https?:\/\/|mailto:|tel:|\/)/i.test(String(u || '').trim()) ? esc(String(u).trim()) : '');

export const dataBR = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  if (!m) return '';
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${+m[3]} ${meses[+m[2] - 1]} ${m[1]}`;
};

const P = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
export const ICONES = {
  pdf: `<svg viewBox="0 0 24 24" ${P}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h1.5a1.5 1.5 0 0 1 0 3H9v-3zm0 3v2M14 13v5M14 13h2M14 15.5h1.5"/></svg>`,
  livro: `<svg viewBox="0 0 24 24" ${P}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M19 19v2H6"/><path d="M11.5 7v6M9 9.5h5"/></svg>`,
  documento: `<svg viewBox="0 0 24 24" ${P}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" ${P}><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>`,
  telefone: `<svg viewBox="0 0 24 24" ${P}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>`,
  email: `<svg viewBox="0 0 24 24" ${P}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>`,
  relogio: `<svg viewBox="0 0 24 24" ${P}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
  calendario: `<svg viewBox="0 0 24 24" ${P}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>`,
  download: `<svg viewBox="0 0 24 24" ${P}><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>`,
  seta: `<svg viewBox="0 0 24 24" ${P}><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" ${P}><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/></svg>`,
  facebook: `<svg viewBox="0 0 24 24" ${P}><path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V10H6.5v3.5H9V21h3.5v-7.5H15l.5-3.5h-3V7a1 1 0 0 1 1-1H15z"/></svg>`,
  youtube: `<svg viewBox="0 0 24 24" ${P}><rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="m10 9 5 3-5 3z" fill="currentColor"/></svg>`,
  cruz: `<svg viewBox="0 0 24 24" ${P}><path d="M12 3v18M6 9h12"/></svg>`,
  pomba: `<svg viewBox="0 0 24 24" ${P}><path d="M3 10c3 0 5-2 6-5 1 3 3 5 3 8 2-2 5-3 9-3-2 3-4 6-8 7l1 3-3-2c-4 0-7-3-8-8z"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" ${P}><path d="M4 7h16M4 12h16M4 17h16"/></svg>`,
  copiar: `<svg viewBox="0 0 24 24" ${P}><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>`,
};

const MENU = [
  { href: '/', rotulo: 'Início' },
  {
    href: '/quem-somos', rotulo: 'Quem Somos',
    sub: [['/quem-somos#historia', 'História'], ['/quem-somos#no-que-cremos', 'No que Cremos'], ['/quem-somos#lideranca', 'Liderança']],
  },
  { href: '/dioceses', rotulo: 'Dioceses & Paróquias' },
  {
    href: '/materiais', rotulo: 'Documentos & Liturgia',
    sub: [['/materiais#documentos', 'Documentos'], ['/materiais/liturgia', 'Gerador de Folheto Litúrgico'], ['/materiais#lecionario', 'Leituras do dia']],
  },
  { href: '/midia', rotulo: 'Mídia & Eventos' },
  { href: '/faq', rotulo: 'FAQ' },
  { href: '/contato', rotulo: 'Contato' },
];

function cabecalho(ativo, info) {
  const itens = MENU.map((m) => {
    const atual = m.href === ativo ? ' aria-current="page"' : '';
    if (!m.sub) return `<li><a href="${m.href}"${atual}>${m.rotulo}</a></li>`;
    return `<li class="tem-sub"><a href="${m.href}"${atual}>${m.rotulo}</a>
      <ul class="submenu">${m.sub.map(([h, r]) => `<li><a href="${h}">${r}</a></li>`).join('')}</ul></li>`;
  }).join('');
  return `
  <a class="pular" href="#conteudo">Pular para o conteúdo</a>
  <header class="cabecalho">
    <div class="cabecalho-interno">
      <a class="marca" href="/" aria-label="${esc(info.nome)} — Início">
        <img src="/brasao.png" alt="" width="44" height="50">
        <span><strong>${esc(info.sigla || 'IECB')}</strong><small>${esc(info.nome)}</small></span>
      </a>
      <button class="botao-menu" aria-expanded="false" aria-controls="menu-principal" aria-label="Abrir menu">${ICONES.menu}</button>
      <nav id="menu-principal" class="menu" aria-label="Principal">
        <ul>${itens}</ul>
        <a class="botao botao-vermelho cta" href="/dioceses">${ICONES.pin} Encontre uma Igreja</a>
      </nav>
    </div>
    <div class="faixa-cores" aria-hidden="true"><span></span><span></span><span></span></div>
  </header>`;
}

function rodape(info) {
  const redes = [['instagram', info.instagram], ['facebook', info.facebook], ['youtube', info.youtube]]
    .filter(([, u]) => url(u))
    .map(([n, u]) => `<a href="${url(u)}" target="_blank" rel="noopener" aria-label="${n}">${ICONES[n]}</a>`)
    .join('');
  return `
  <footer class="rodape">
    <div class="faixa-cores" aria-hidden="true"><span></span><span></span><span></span></div>
    <div class="rodape-interno">
      <div class="rodape-marca">
        <img src="/brasao.png" alt="Brasão da ${esc(info.nome)}" width="72" height="82">
        <p><strong>${esc(info.nome)}</strong><br>${esc(info.slogan)}</p>
        ${redes ? `<div class="redes">${redes}</div>` : ''}
      </div>
      <div>
        <h2>Links rápidos</h2>
        <ul class="links">
          <li><a href="/quem-somos">Quem Somos</a></li>
          <li><a href="/dioceses">Encontre uma Igreja</a></li>
          <li><a href="/materiais">Documentos & Liturgia</a></li>
          <li><a href="/materiais/liturgia">Folheto Litúrgico</a></li>
          <li><a href="/midia">Mídia & Eventos</a></li>
          <li><a href="/faq">Perguntas Frequentes</a></li>
          <li><a href="/contato">Contato & Doações</a></li>
        </ul>
      </div>
      <div>
        <h2>${esc(info.sedeNome || 'Sede')}</h2>
        <p class="com-icone">${ICONES.pin}<span>${esc(info.endereco).replace(/\n/g, '<br>')}</span></p>
        ${info.telefone ? `<p class="com-icone">${ICONES.telefone}<span>${esc(info.telefone)}</span></p>` : ''}
        ${info.email ? `<p class="com-icone">${ICONES.email}<span>${esc(info.email)}</span></p>` : ''}
      </div>
      <div>
        <h2>Newsletter</h2>
        <p>Receba notícias, eventos e materiais da IECB.</p>
        <form class="form-newsletter" data-form="newsletter">
          <label class="sr" for="news-email">Seu e-mail</label>
          <input id="news-email" type="email" name="email" placeholder="seu@email.com" required>
          <input type="text" name="site" class="armadilha" tabindex="-1" autocomplete="off" aria-hidden="true">
          <button class="botao botao-ouro" type="submit">Assinar</button>
          <p class="retorno" role="status"></p>
        </form>
      </div>
    </div>
    <p class="creditos">© ${new Date().getFullYear()} ${esc(info.nome)}${info.cnpj ? ` · CNPJ ${esc(info.cnpj)}` : ''}</p>
  </footer>`;
}

export function pagina({ titulo, descricao, ativo, conteudo, extrasHead = '', scripts = '' }) {
  const info = ler('info');
  const tituloCompleto = titulo ? `${titulo} · ${info.sigla || 'IECB'}` : `${info.nome} · ${info.sigla || 'IECB'}`;
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(tituloCompleto)}</title>
  <meta name="description" content="${esc(descricao || info.slogan)}">
  <meta property="og:title" content="${esc(tituloCompleto)}">
  <meta property="og:description" content="${esc(descricao || info.slogan)}">
  <meta name="theme-color" content="#c8321e">
  <link rel="icon" href="/brasao.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/site.css">
  ${extrasHead}
</head>
<body>
  ${cabecalho(ativo, info)}
  <main id="conteudo">
    ${conteudo}
  </main>
  ${rodape(info)}
  <script src="/site.js" defer></script>
  ${scripts}
</body>
</html>`;
}

/** Faixa de título das páginas internas. */
export function topoPagina(sobretitulo, titulo, texto = '') {
  return `
  <section class="topo-pagina">
    <div class="envolve">
      <p class="sobretitulo">${esc(sobretitulo)}</p>
      <h1>${esc(titulo)}</h1>
      ${texto ? `<p class="lead">${esc(texto)}</p>` : ''}
    </div>
  </section>`;
}
