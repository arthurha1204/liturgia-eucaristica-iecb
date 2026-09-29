// Páginas públicas do site da IECB (HTML gerado no servidor a partir dos dados do painel).

import { readFileSync } from 'node:fs';
import { ler } from './armazem.js';
import { pagina, topoPagina, esc, paragrafos, url, dataBR, ICONES } from './layout.js';

const hojeISO = () => new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);
const porData = (a, b) => String(b.data || '').localeCompare(String(a.data || ''));
const telLink = (t) => String(t || '').replace(/[^\d+]/g, '');

// ------------------------------------------------------------------ INÍCIO
export function inicio() {
  const info = ler('info');
  const noticias = ler('noticias').slice().sort(porData).slice(0, 3);
  const documentos = ler('documentos').slice(0, 3);
  const eventos = ler('eventos').filter((e) => !e.data || e.data >= hojeISO()).sort((a, b) => String(a.data).localeCompare(String(b.data))).slice(0, 3);
  const fundo = url(info.imagemHero) ? ` style="--foto: url('${url(info.imagemHero)}')"` : '';

  const conteudo = `
  <section class="hero${fundo ? ' com-foto' : ''}"${fundo}>
    <div class="hero-padrao" aria-hidden="true"></div>
    <div class="envolve hero-texto">
      <p class="sobretitulo">${esc(info.nome)}</p>
      <h1>${esc(info.slogan)}</h1>
      <p class="lead">${esc(info.subtituloHero)}</p>
      <div class="acoes">
        <a class="botao botao-ouro" href="/quem-somos#historia">Conheça nossa História ${ICONES.seta}</a>
        <a class="botao botao-contorno-claro" href="/dioceses">Encontre uma Igreja</a>
      </div>
    </div>
  </section>

  <section class="secao">
    <div class="envolve cards-3">
      <article class="card destaque-card">
        <span class="icone-circulo vermelho">${ICONES.pomba}</span>
        <h2>Nossa Visão</h2>
        ${paragrafos(info.visao)}
        <a class="link-seta" href="/quem-somos">Quem somos ${ICONES.seta}</a>
      </article>
      <article class="card destaque-card">
        <span class="icone-circulo azul">${ICONES.livro}</span>
        <h2>Nossos Documentos</h2>
        <ul class="lista-simples">
          ${documentos.map((d) => `<li>${esc(d.titulo)}</li>`).join('') || '<li>Materiais em breve.</li>'}
          <li>Gerador de Folheto Litúrgico</li>
        </ul>
        <a class="link-seta" href="/materiais">Documentos & Liturgia ${ICONES.seta}</a>
      </article>
      <article class="card destaque-card">
        <span class="icone-circulo ouro">${ICONES.calendario}</span>
        <h2>Notícias Recentes</h2>
        ${noticias.length
          ? `<ul class="lista-noticias">${noticias.map((n) => `<li><a href="/noticias/${esc(n.id)}">${esc(n.titulo)}</a><small>${dataBR(n.data)}</small></li>`).join('')}</ul>`
          : '<p class="suave">As notícias da IECB aparecerão aqui.</p>'}
        <a class="link-seta" href="/midia">Mídia & Eventos ${ICONES.seta}</a>
      </article>
    </div>
  </section>

  <section class="secao secao-creme">
    <div class="envolve liturgia-hoje" data-liturgia-hoje>
      <div>
        <p class="sobretitulo">Liturgia de hoje</p>
        <h2 data-hoje-nome>Consultando o calendário…</h2>
        <p class="suave" data-hoje-meta></p>
      </div>
      <ul class="leituras-hoje" data-hoje-leituras></ul>
      <a class="botao botao-azul" href="/materiais/liturgia">${ICONES.download} Baixar o folheto da Eucaristia</a>
    </div>
  </section>

  ${eventos.length ? `
  <section class="secao">
    <div class="envolve">
      <div class="titulo-secao"><p class="sobretitulo">Agenda</p><h2>Próximos eventos</h2></div>
      <div class="lista-eventos">${eventos.map(cartaoEvento).join('')}</div>
    </div>
  </section>` : ''}

  <section class="chamada-mapa">
    <div class="envolve chamada-mapa-interno">
      <span class="pino-grande" aria-hidden="true">${ICONES.pin}</span>
      <div>
        <h2>Há uma comunidade da IECB perto de você</h2>
        <p>Veja no mapa as catedrais, paróquias e missões de todas as dioceses, com endereços e horários.</p>
      </div>
      <a class="botao botao-ouro" href="/dioceses">Abrir o mapa ${ICONES.seta}</a>
    </div>
  </section>`;
  return pagina({ ativo: '/', conteudo });
}

function cartaoEvento(e) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(e.data || '');
  const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  return `
  <article class="evento">
    <div class="evento-data">${m ? `<strong>${+m[3]}</strong><span>${meses[+m[2] - 1]}</span>` : '<span>A definir</span>'}</div>
    <div>
      <h3>${esc(e.titulo)}</h3>
      <p class="suave">${[e.horario, e.local].filter(Boolean).map(esc).join(' · ')}</p>
      ${e.descricao ? paragrafos(e.descricao) : ''}
    </div>
  </article>`;
}

// ------------------------------------------------------------- QUEM SOMOS
export function quemSomos() {
  const historia = ler('historia');
  const crencas = ler('crencas');
  const lideres = ler('lideranca');
  const primaz = lideres.filter((l) => l.grupo === 'Bispo Primaz');
  const outros = lideres.filter((l) => l.grupo !== 'Bispo Primaz');
  const pessoa = (l, grande = false) => `
    <article class="pessoa${grande ? ' pessoa-destaque' : ''}">
      <div class="foto-pessoa">${url(l.foto) ? `<img src="${url(l.foto)}" alt="${esc(l.nome)}" loading="lazy">` : `<span aria-hidden="true">${ICONES.cruz}</span>`}</div>
      <div>
        <h3>${esc(l.nome)}</h3>
        <p class="cargo">${esc(l.cargo)}</p>
        ${l.bio ? paragrafos(l.bio) : ''}
      </div>
    </article>`;

  const conteudo = `
  ${topoPagina('Quem Somos', 'Uma Igreja de três correntes', 'Evangélica, sacramental e carismática: a fé dos Apóstolos, vivida no poder do Espírito Santo.')}
  <nav class="subnav" aria-label="Seções"><div class="envolve">
    <a href="#historia">História</a><a href="#no-que-cremos">No que Cremos</a><a href="#lideranca">Liderança</a>
  </div></nav>

  <section class="secao" id="historia">
    <div class="envolve">
      <div class="titulo-secao"><p class="sobretitulo">Nossa caminhada</p><h2>História da IECB</h2></div>
      <ol class="linha-tempo">
        ${historia.map((h) => `
        <li>
          <div class="marco"><span>${esc(h.ano)}</span></div>
          <div class="card">
            ${url(h.imagem) ? `<img src="${url(h.imagem)}" alt="" loading="lazy">` : ''}
            <h3>${esc(h.titulo)}</h3>
            ${paragrafos(h.texto)}
          </div>
        </li>`).join('')}
      </ol>
    </div>
  </section>

  <section class="secao secao-creme" id="no-que-cremos">
    <div class="envolve estreito">
      <div class="titulo-secao"><p class="sobretitulo">Nossa fé</p><h2>No que Cremos</h2></div>
      <div class="acordeao">
        ${crencas.map((c, i) => `
        <details${i === 0 ? ' open' : ''}>
          <summary><span class="num">${String(i + 1).padStart(2, '0')}</span>${esc(c.titulo)}</summary>
          <div class="acordeao-corpo">${paragrafos(c.texto)}</div>
        </details>`).join('')}
      </div>
    </div>
  </section>

  <section class="secao" id="lideranca">
    <div class="envolve">
      <div class="titulo-secao"><p class="sobretitulo">Clero & Liderança</p><h2>Quem nos pastoreia</h2></div>
      ${primaz.map((l) => pessoa(l, true)).join('')}
      ${outros.length ? `<h3 class="subtitulo-grupo">Conselho de Bispos e Liderança</h3><div class="grade-pessoas">${outros.map((l) => pessoa(l)).join('')}</div>` : ''}
    </div>
  </section>`;
  return pagina({ titulo: 'Quem Somos', ativo: '/quem-somos', conteudo, descricao: 'História, fé e liderança da Igreja Episcopal Carismática do Brasil.' });
}

// ------------------------------------------------------ DIOCESES & PARÓQUIAS
export function dioceses() {
  const info = ler('info');
  const lista = ler('dioceses');
  const paroquias = ler('paroquias');
  const semDiocese = paroquias.filter((p) => !lista.some((d) => d.id === p.diocese));

  const itemParoquia = (p) => `
    <li class="paroquia" data-busca="${esc([p.nome, p.cidade, p.endereco, p.clerigo].join(' ').toLowerCase())}">
      <h4>${esc(p.nome)} ${p.tipo ? `<span class="etiqueta">${esc(p.tipo)}</span>` : ''}</h4>
      ${p.clerigo ? `<p class="suave">${esc(p.clerigo)}</p>` : ''}
      ${p.endereco || p.cidade ? `<p class="com-icone">${ICONES.pin}<span>${esc([p.endereco, p.cidade].filter(Boolean).join(' — ')).replace(/\n/g, '<br>')}</span></p>` : ''}
      ${p.horarios ? `<p class="com-icone">${ICONES.relogio}<span>${esc(p.horarios).replace(/\n/g, '<br>')}</span></p>` : ''}
      <p class="contatos">
        ${p.telefone ? `<a href="tel:${esc(telLink(p.telefone))}">${ICONES.telefone} ${esc(p.telefone)}</a>` : ''}
        ${url(p.instagram) ? `<a href="${url(p.instagram)}" target="_blank" rel="noopener">${ICONES.instagram} Instagram</a>` : ''}
        ${url(p.site) ? `<a href="${url(p.site)}" target="_blank" rel="noopener">${ICONES.seta} Site</a>` : ''}
      </p>
    </li>`;

  const blocoDiocese = (d, ps) => `
    <article class="diocese card" data-diocese>
      <h3>${esc(d.nome)}</h3>
      ${d.regiao ? `<p class="suave">${esc(d.regiao)}</p>` : ''}
      <dl class="dados">
        ${d.bispo ? `<div><dt>Bispo Diocesano</dt><dd>${esc(d.bispo)}</dd></div>` : ''}
        ${d.catedral ? `<div><dt>Catedral</dt><dd>${esc(d.catedral)}${d.catedralEndereco ? `<br><span class="suave">${esc(d.catedralEndereco).replace(/\n/g, '<br>')}</span>` : ''}</dd></div>` : ''}
        ${d.contato ? `<div><dt>Contato</dt><dd>${esc(d.contato)}</dd></div>` : ''}
      </dl>
      <details class="paroquias">
        <summary>Paróquias e Missões <span class="contador">${ps.length}</span></summary>
        ${ps.length ? `<ul>${ps.map(itemParoquia).join('')}</ul>` : '<p class="suave">Nenhuma comunidade cadastrada ainda.</p>'}
      </details>
    </article>`;

  const conteudo = `
  ${topoPagina('Dioceses & Paróquias', 'Encontre uma Igreja', 'Procure no mapa ou na lista a comunidade da IECB mais perto de você.')}
  <section class="secao">
    <div class="envolve mapa-dividido">
      <div class="mapa-caixa">
        ${url(info.mapaWidget)
          ? `<iframe src="${url(info.mapaWidget)}" title="Mapa das igrejas da IECB" width="100%" height="600" style="border:0" allowfullscreen loading="lazy"></iframe>`
          : '<p class="suave">Mapa não configurado.</p>'}
      </div>
      <div class="lista-dioceses">
        <label class="busca">
          <span class="sr">Buscar por cidade ou nome</span>
          <input type="search" placeholder="Buscar por cidade, bairro ou nome…" data-busca-paroquia>
        </label>
        ${lista.map((d) => blocoDiocese(d, paroquias.filter((p) => p.diocese === d.id))).join('')}
        ${semDiocese.length ? blocoDiocese({ nome: 'Outras comunidades' }, semDiocese) : ''}
        <p class="nada-encontrado suave" hidden>Nenhuma comunidade encontrada. Tente outra cidade ou <a href="/contato">fale conosco</a>.</p>
      </div>
    </div>
  </section>`;
  return pagina({ titulo: 'Dioceses & Paróquias', ativo: '/dioceses', conteudo, descricao: 'Mapa e lista de dioceses, catedrais, paróquias e missões da IECB.' });
}

// ------------------------------------------------------ DOCUMENTOS & LITURGIA
export function materiais() {
  const docs = ler('documentos');
  const categorias = [...new Set(docs.map((d) => d.categoria || 'Outros'))];
  const item = (d) => {
    const alvo = url(d.arquivo) || url(d.link);
    return `
    <li class="documento">
      <span class="icone-doc ${esc(d.icone || 'pdf')}">${ICONES[d.icone] || ICONES.pdf}</span>
      <div>
        <h4>${esc(d.titulo)}</h4>
        ${d.descricao ? `<p class="suave">${esc(d.descricao)}</p>` : ''}
      </div>
      ${alvo
        ? `<a class="botao botao-pequeno botao-azul" href="${alvo}" ${url(d.arquivo) ? 'download' : 'target="_blank" rel="noopener"'}>${ICONES.download} ${url(d.arquivo) ? 'Baixar' : 'Abrir'}</a>`
        : '<span class="etiqueta etiqueta-cinza">Em breve</span>'}
    </li>`;
  };

  const conteudo = `
  ${topoPagina('Biblioteca', 'Documentos & Liturgia', 'Livro de Oração Comum, Cânones, materiais de formação e o folheto da Santa Eucaristia pronto para imprimir.')}
  <section class="secao">
    <div class="envolve">
      <a class="card destaque-gerador" href="/materiais/liturgia">
        <span class="icone-circulo vermelho grande">${ICONES.cruz}</span>
        <div>
          <p class="sobretitulo">Ferramenta litúrgica</p>
          <h2>Gerador de Folheto da Santa Eucaristia</h2>
          <p>Escolha a data e baixe o livreto do <strong>Rito I</strong> ou do <strong>Rito Menor</strong> com a coleta, as leituras, o prefácio e a bênção do dia — pronto para imprimir frente e verso e dobrar.</p>
        </div>
        <span class="botao botao-vermelho">Abrir o gerador ${ICONES.seta}</span>
      </a>
    </div>
  </section>

  <section class="secao secao-creme" id="lecionario">
    <div class="envolve lecionario">
      <div>
        <p class="sobretitulo">Lecionário</p>
        <h2>Leituras do dia</h2>
        <p class="suave">Leituras da Santa Eucaristia segundo o calendário litúrgico.</p>
        <label class="campo-data">Data <input type="date" data-lecionario-data></label>
      </div>
      <div class="card lecionario-resultado" data-lecionario>
        <p class="suave">Carregando…</p>
      </div>
    </div>
  </section>

  <section class="secao" id="documentos">
    <div class="envolve">
      <div class="titulo-secao"><p class="sobretitulo">Downloads</p><h2>Documentos</h2></div>
      ${categorias.map((c) => `
        <div class="grupo-docs">
          <h3>${esc(c)}</h3>
          <ul class="lista-docs">${docs.filter((d) => (d.categoria || 'Outros') === c).map(item).join('')}</ul>
        </div>`).join('') || '<p class="suave">Nenhum documento publicado ainda.</p>'}
    </div>
  </section>`;
  return pagina({ titulo: 'Documentos & Liturgia', ativo: '/materiais', conteudo, descricao: 'Livro de Oração Comum, Cânones, materiais de formação, lecionário e folheto litúrgico da IECB.' });
}

const FRAGMENTO_LITURGIA = new URL('./fragmentos/liturgia.html', import.meta.url);
export function liturgia() {
  const conteudo = `
  ${topoPagina('Documentos & Liturgia', 'Folheto da Santa Eucaristia', 'Escolha o rito e a data e baixe o livreto pronto para imprimir.')}
  <section class="secao"><div class="envolve estreito-largo gerador">${readFileSync(FRAGMENTO_LITURGIA, 'utf8')}</div></section>`;
  return pagina({
    titulo: 'Folheto Litúrgico', ativo: '/materiais', conteudo,
    descricao: 'Gere o folheto da Santa Eucaristia (Rito I ou Rito Menor) com os próprios do dia.',
    extrasHead: '<link rel="stylesheet" href="/liturgia.css">',
    scripts: '<script src="/liturgia.js" defer></script>',
  });
}

// ------------------------------------------------------------ MÍDIA & EVENTOS
export function midia() {
  const fotos = ler('galeria');
  const noticias = ler('noticias').slice().sort(porData);
  const eventos = ler('eventos').filter((e) => !e.data || e.data >= hojeISO()).sort((a, b) => String(a.data).localeCompare(String(b.data)));
  const categorias = [...new Set(fotos.map((f) => f.categoria).filter(Boolean))];

  const conteudo = `
  ${topoPagina('Mídia & Eventos', 'A vida da Igreja', 'Agenda, notícias e fotos de Sínodos, Ordenações, Retiros e Celebrações.')}
  <section class="secao">
    <div class="envolve duas-colunas">
      <div>
        <div class="titulo-secao"><p class="sobretitulo">Agenda</p><h2>Próximos eventos</h2></div>
        ${eventos.length ? `<div class="lista-eventos">${eventos.map(cartaoEvento).join('')}</div>` : '<p class="suave">Nenhum evento agendado no momento.</p>'}
      </div>
      <div id="noticias">
        <div class="titulo-secao"><p class="sobretitulo">Notícias</p><h2>Últimas notícias</h2></div>
        ${noticias.length ? `<ul class="lista-noticias grande">${noticias.slice(0, 8).map((n) => `
          <li><a href="/noticias/${esc(n.id)}">${url(n.imagem) ? `<img src="${url(n.imagem)}" alt="" loading="lazy">` : ''}<span><strong>${esc(n.titulo)}</strong><small>${dataBR(n.data)}</small>${n.resumo ? `<em>${esc(n.resumo)}</em>` : ''}</span></a></li>`).join('')}</ul>`
          : '<p class="suave">Nenhuma notícia publicada ainda.</p>'}
      </div>
    </div>
  </section>

  <section class="secao secao-creme" id="galeria">
    <div class="envolve">
      <div class="titulo-secao"><p class="sobretitulo">Galeria</p><h2>Fotos</h2></div>
      ${categorias.length > 1 ? `<div class="filtros" role="group" aria-label="Filtrar fotos">
        <button class="ativo" data-filtro="">Todas</button>${categorias.map((c) => `<button data-filtro="${esc(c)}">${esc(c)}</button>`).join('')}
      </div>` : ''}
      ${fotos.length ? `<div class="galeria">${fotos.slice().sort(porData).map((f) => `
        <figure data-categoria="${esc(f.categoria || '')}">
          <a href="${url(f.imagem)}" data-lightbox data-legenda="${esc([f.legenda, f.evento].filter(Boolean).join(' — '))}">
            <img src="${url(f.imagem)}" alt="${esc(f.legenda || f.evento || 'Foto')}" loading="lazy">
          </a>
          ${f.legenda || f.evento ? `<figcaption>${esc(f.legenda || f.evento)}</figcaption>` : ''}
        </figure>`).join('')}</div>`
        : '<p class="suave">As fotos dos eventos aparecerão aqui.</p>'}
    </div>
  </section>`;
  return pagina({ titulo: 'Mídia & Eventos', ativo: '/midia', conteudo, descricao: 'Agenda, notícias e galeria de fotos da IECB.' });
}

export function noticia(id) {
  const n = ler('noticias').find((x) => x.id === id);
  if (!n) return null;
  const conteudo = `
  ${topoPagina(dataBR(n.data) || 'Notícia', n.titulo)}
  <section class="secao"><article class="envolve estreito texto-longo">
    ${url(n.imagem) ? `<img class="imagem-noticia" src="${url(n.imagem)}" alt="">` : ''}
    ${n.resumo ? `<p class="lead">${esc(n.resumo)}</p>` : ''}
    ${paragrafos(n.texto)}
    <p><a class="link-seta" href="/midia#noticias">Todas as notícias ${ICONES.seta}</a></p>
  </article></section>`;
  return pagina({ titulo: n.titulo, ativo: '/midia', conteudo, descricao: n.resumo });
}

// -------------------------------------------------------------------- FAQ
export function faq() {
  const itens = ler('faq');
  const conteudo = `
  ${topoPagina('FAQ', 'Perguntas Frequentes', 'Não encontrou sua resposta? Fale conosco.')}
  <section class="secao">
    <div class="envolve estreito acordeao">
      ${itens.map((f) => `
      <details>
        <summary>${esc(f.pergunta)}</summary>
        <div class="acordeao-corpo">${paragrafos(f.resposta)}</div>
      </details>`).join('')}
      <p class="centro"><a class="botao botao-vermelho" href="/contato">Enviar uma pergunta</a></p>
    </div>
  </section>`;
  return pagina({ titulo: 'Perguntas Frequentes', ativo: '/faq', conteudo });
}

// ---------------------------------------------------------------- CONTATO
export function contato() {
  const info = ler('info');
  const conteudo = `
  ${topoPagina('Contato & Doações', 'Fale conosco', 'Envie sua mensagem, pedido de oração ou dúvida. Responderemos em breve.')}
  <section class="secao">
    <div class="envolve duas-colunas contato">
      <form class="card form-contato" data-form="contato">
        <h2>Envie uma mensagem</h2>
        <div class="linha-campos">
          <label>Nome <input name="nome" required maxlength="120" autocomplete="name"></label>
          <label>E-mail <input name="email" type="email" required maxlength="160" autocomplete="email"></label>
        </div>
        <div class="linha-campos">
          <label>Telefone (opcional) <input name="telefone" type="tel" maxlength="40" autocomplete="tel"></label>
          <label>Assunto
            <select name="assunto">
              <option>Informações</option><option>Batismo</option><option>Casamento</option>
              <option>Pedido de oração</option><option>Vocação / Clero</option><option>Outro</option>
            </select>
          </label>
        </div>
        <label>Mensagem <textarea name="mensagem" rows="6" required maxlength="5000"></textarea></label>
        <input type="text" name="site" class="armadilha" tabindex="-1" autocomplete="off" aria-hidden="true">
        <button class="botao botao-vermelho" type="submit">Enviar mensagem</button>
        <p class="retorno" role="status"></p>
      </form>

      <div class="coluna-info">
        <div class="card">
          <h2>${esc(info.sedeNome || 'Sede')}</h2>
          <p class="com-icone">${ICONES.pin}<span>${esc(info.endereco).replace(/\n/g, '<br>')}</span></p>
          ${info.telefone ? `<p class="com-icone">${ICONES.telefone}<span>${esc(info.telefone)}</span></p>` : ''}
          ${info.email ? `<p class="com-icone">${ICONES.email}<span>${esc(info.email)}</span></p>` : ''}
        </div>
        <div class="card doacoes">
          <p class="sobretitulo">Dízimos & Doações</p>
          <h2>Contribua com a missão</h2>
          <p class="suave">Dízimos interdiocesanos e ofertas institucionais.</p>
          <dl class="dados">
            ${info.razaoSocial ? `<div><dt>Favorecido</dt><dd>${esc(info.razaoSocial)}</dd></div>` : ''}
            ${info.cnpj ? `<div><dt>CNPJ</dt><dd>${esc(info.cnpj)}</dd></div>` : ''}
            ${info.pix ? `<div><dt>Chave PIX</dt><dd class="pix"><code>${esc(info.pix)}</code><button type="button" class="botao-copiar" data-copiar="${esc(info.pix)}">${ICONES.copiar} Copiar</button></dd></div>` : ''}
            ${info.banco ? `<div><dt>Transferência</dt><dd>${esc(info.banco).replace(/\n/g, '<br>')}</dd></div>` : ''}
          </dl>
        </div>
      </div>
    </div>
  </section>`;
  return pagina({ titulo: 'Contato & Doações', ativo: '/contato', conteudo });
}

export function naoEncontrada() {
  return pagina({
    titulo: 'Página não encontrada',
    conteudo: `${topoPagina('Erro 404', 'Página não encontrada')}<section class="secao"><div class="envolve centro"><a class="botao botao-vermelho" href="/">Voltar ao início</a></div></section>`,
  });
}
