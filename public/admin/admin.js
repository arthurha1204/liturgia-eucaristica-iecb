// Painel administrativo da IECB: edita as coleções descritas em src/site/esquemas.js.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const GRUPOS = [
    ['Site', ['info', 'noticias', 'eventos', 'galeria', 'documentos']],
    ['Igrejas', ['dioceses', 'paroquias']],
    ['Quem Somos', ['historia', 'crencas', 'lideranca', 'faq']],
    ['Recebidos', ['mensagens', 'newsletter']],
  ];

  let esquemas = {};
  let atual = 'info';
  let editando = null; // { colecao, id|null }

  async function api(caminho, opcoes = {}) {
    const resp = await fetch(`/api/admin${caminho}`, {
      ...opcoes,
      headers: opcoes.body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    });
    const dados = await resp.json().catch(() => ({}));
    if (resp.status === 401) { mostrarLogin(); throw new Error(dados.erro || 'Sessão expirada.'); }
    if (!resp.ok) throw new Error(dados.erro || `Erro ${resp.status}`);
    return dados;
  }

  function avisar(texto, falha = false) {
    const a = $('#aviso');
    a.textContent = texto;
    a.className = `aviso${falha ? ' falha' : ''}`;
    a.hidden = false;
    clearTimeout(avisar.t);
    avisar.t = setTimeout(() => { a.hidden = true; }, 4000);
  }

  // ------------------------------------------------------------ sessão
  function mostrarLogin() {
    $('#tela-painel').hidden = true;
    $('#tela-login').hidden = false;
    $('#senha').focus();
  }

  async function iniciar() {
    const sessao = await fetch('/api/admin/sessao').then((r) => r.json());
    if (!sessao.configurado) {
      mostrarLogin();
      $('#erro-login').textContent = 'Painel desativado: defina ADMIN_SENHA no arquivo .env e reinicie o servidor.';
      return;
    }
    if (!sessao.logado) return mostrarLogin();
    await abrirPainel();
  }

  $('#form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('#erro-login').textContent = '';
    try {
      const resp = await fetch('/api/admin/entrar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: $('#senha').value }),
      });
      const d = await resp.json();
      if (!resp.ok) throw new Error(d.erro);
      $('#senha').value = '';
      await abrirPainel();
    } catch (err) {
      $('#erro-login').textContent = err.message;
    }
  });

  $('#sair').addEventListener('click', async () => {
    await fetch('/api/admin/sair', { method: 'POST' });
    mostrarLogin();
  });

  async function abrirPainel() {
    esquemas = await api('/esquemas');
    $('#tela-login').hidden = true;
    $('#tela-painel').hidden = false;
    montarNav();
    await abrirColecao(location.hash.slice(1) in esquemas ? location.hash.slice(1) : 'info');
  }

  function montarNav() {
    $('#nav-colecoes').innerHTML = GRUPOS.map(([g, cols]) => `
      <h3>${g}</h3>
      ${cols.filter((c) => esquemas[c]).map((c) => `<button data-colecao="${c}">${esc(esquemas[c].titulo)}<span class="num" data-num="${c}"></span></button>`).join('')}
    `).join('');
    $('#nav-colecoes').addEventListener('click', (e) => {
      const b = e.target.closest('[data-colecao]');
      if (b) abrirColecao(b.dataset.colecao);
    });
  }

  // ------------------------------------------------------------ coleções
  async function abrirColecao(nome) {
    atual = nome;
    location.hash = nome;
    document.querySelectorAll('#nav-colecoes button').forEach((b) => b.classList.toggle('ativo', b.dataset.colecao === nome));
    const esq = esquemas[nome];
    $('#titulo-colecao').textContent = esq.titulo;
    $('#ajuda-colecao').textContent = esq.ajuda || '';
    $('#acoes-topo').innerHTML = esq.unico || esq.somenteLeitura ? '' : '<button class="bt bt-vermelho" id="novo">+ Adicionar</button>';
    $('#novo')?.addEventListener('click', () => abrirDialogo(nome, null, {}));
    const dados = await api(`/dados/${nome}`);
    if (esq.unico) return desenharFormUnico(nome, dados);
    const num = $(`[data-num="${nome}"]`);
    if (num) num.textContent = dados.length || '';
    if (esq.somenteLeitura) return desenharLeitura(nome, dados);
    if (nome === 'galeria') return desenharGaleria(dados);
    desenharLista(nome, dados);
  }

  const rotulo = (nome, item) => item[esquemas[nome].rotuloItem] || item.titulo || item.nome || '(sem título)';
  const imagemDe = (item) => item.imagem || item.foto || '';

  function desenharLista(nome, dados) {
    const c = $('#conteudo-painel');
    if (!dados.length) { c.innerHTML = '<div class="vazio">Nada cadastrado ainda. Clique em “+ Adicionar”.</div>'; return; }
    c.innerHTML = `<div class="lista">${dados.map((item, i) => `
      <div class="linha">
        ${imagemDe(item) ? `<img class="miniatura" src="${esc(imagemDe(item))}" alt="">` : ''}
        <div class="texto"><strong>${esc(rotulo(nome, item))}</strong><small>${esc(resumo(nome, item))}</small></div>
        <div class="botoes">
          <button class="bt bt-pequeno" data-acao="cima" data-id="${item.id}" ${i === 0 ? 'disabled' : ''} aria-label="Mover para cima">↑</button>
          <button class="bt bt-pequeno" data-acao="baixo" data-id="${item.id}" ${i === dados.length - 1 ? 'disabled' : ''} aria-label="Mover para baixo">↓</button>
          <button class="bt bt-pequeno" data-acao="editar" data-id="${item.id}">Editar</button>
          <button class="bt bt-pequeno bt-perigo" data-acao="excluir" data-id="${item.id}">Excluir</button>
        </div>
      </div>`).join('')}</div>`;
    c.onclick = (e) => acaoItem(e, nome, dados);
  }

  function resumo(nome, item) {
    const campos = esquemas[nome].campos.filter((f) => ['texto', 'data', 'select'].includes(f.tipo) && f.nome !== esquemas[nome].rotuloItem);
    return campos.map((f) => item[f.nome]).filter(Boolean).slice(0, 3).join(' · ');
  }

  async function acaoItem(e, nome, dados) {
    const b = e.target.closest('[data-acao]');
    if (!b) return;
    const item = dados.find((x) => x.id === b.dataset.id);
    try {
      if (b.dataset.acao === 'editar') return abrirDialogo(nome, item.id, item);
      if (b.dataset.acao === 'excluir') {
        if (!confirm(`Excluir “${rotulo(nome, item)}”? Isso não pode ser desfeito.`)) return;
        await api(`/dados/${nome}/${item.id}`, { method: 'DELETE' });
        avisar('Excluído.');
      } else {
        await api(`/dados/${nome}/${item.id}/mover`, { method: 'POST', body: JSON.stringify({ direcao: b.dataset.acao }) });
      }
      await abrirColecao(nome);
    } catch (err) { avisar(err.message, true); }
  }

  function desenharGaleria(dados) {
    const c = $('#conteudo-painel');
    const opcoes = esquemas.galeria.campos.find((f) => f.nome === 'categoria').opcoes;
    c.innerHTML = `
      <form class="lote" id="form-lote">
        <strong>Enviar várias fotos de um evento</strong>
        <div class="linha-campos">
          <label class="campo"><span>Evento</span><input type="text" name="evento" placeholder="Ex.: Sínodo 2026"></label>
          <label class="campo"><span>Categoria</span><select name="categoria">${opcoes.map((o) => `<option>${esc(o)}</option>`).join('')}</select></label>
          <label class="campo"><span>Data</span><input type="date" name="data"></label>
        </div>
        <label class="campo"><span>Fotos (pode selecionar várias de uma vez — até 60, 15 MB cada)</span><input type="file" name="fotos" accept="image/*" multiple required></label>
        <div><button class="bt bt-azul" type="submit">Enviar fotos</button> <span id="estado-lote" class="ajuda"></span></div>
      </form>
      ${dados.length ? `<div class="grade-fotos">${dados.slice().reverse().map((f) => `
        <div class="foto">
          <img src="${esc(f.imagem)}" alt="" loading="lazy">
          <div><strong>${esc(f.legenda || f.evento || '—')}</strong><br><small>${esc([f.categoria, f.data].filter(Boolean).join(' · '))}</small>
            <div class="botoes">
              <button class="bt bt-pequeno" data-acao="editar" data-id="${f.id}">Editar</button>
              <button class="bt bt-pequeno bt-perigo" data-acao="excluir" data-id="${f.id}">Excluir</button>
            </div>
          </div>
        </div>`).join('')}</div>` : '<div class="vazio">Nenhuma foto ainda.</div>'}`;
    c.onclick = (e) => acaoItem(e, 'galeria', dados);
    $('#form-lote').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const estado = $('#estado-lote');
      estado.textContent = 'Enviando… (pode levar alguns instantes)';
      form.querySelector('button').disabled = true;
      try {
        const r = await api('/galeria/lote', { method: 'POST', body: new FormData(form) });
        avisar(`${r.total} foto(s) enviada(s).`);
        await abrirColecao('galeria');
      } catch (err) {
        estado.textContent = '';
        avisar(err.message, true);
        form.querySelector('button').disabled = false;
      }
    });
  }

  function desenharLeitura(nome, dados) {
    const c = $('#conteudo-painel');
    const esq = esquemas[nome];
    if (!dados.length) { c.innerHTML = '<div class="vazio">Nada recebido ainda.</div>'; return; }
    const extra = nome === 'newsletter'
      ? `<p><button class="bt" id="copiar-emails">Copiar todos os e-mails</button></p>` : '';
    c.innerHTML = `${extra}<div class="lista">${dados.slice().reverse().map((item) => `
      <div class="somente-leitura">
        <dl>${esq.campos.map((f) => item[f.nome] ? `<dt>${esc(f.rotulo)}</dt><dd>${esc(item[f.nome])}</dd>` : '').join('')}</dl>
        <p style="margin:10px 0 0"><button class="bt bt-pequeno bt-perigo" data-acao="excluir" data-id="${item.id}">Excluir</button></p>
      </div>`).join('')}</div>`;
    c.onclick = (e) => acaoItem(e, nome, dados);
    $('#copiar-emails')?.addEventListener('click', async () => {
      await navigator.clipboard.writeText(dados.map((d) => d.email).join(', '));
      avisar('E-mails copiados.');
    });
  }

  // ------------------------------------------------------------ formulários
  async function htmlCampos(nome, item) {
    const partes = [];
    for (const f of esquemas[nome].campos) {
      const v = item[f.nome] ?? '';
      const obrig = f.obrigatorio ? ' required' : '';
      const id = `campo-${f.nome}`;
      let controle;
      if (f.tipo === 'area') controle = `<textarea id="${id}" name="${f.nome}" class="${f.grande ? 'grande' : ''}"${obrig}>${esc(v)}</textarea>`;
      else if (f.tipo === 'select') controle = `<select id="${id}" name="${f.nome}"><option value=""></option>${f.opcoes.map((o) => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
      else if (f.tipo === 'ref') {
        const lista = await api(`/dados/${f.colecao}`);
        controle = `<select id="${id}" name="${f.nome}"><option value="">— nenhuma —</option>${lista.map((o) => `<option value="${esc(o.id)}" ${o.id === v ? 'selected' : ''}>${esc(o[f.campoRotulo])}</option>`).join('')}</select>`;
      } else if (f.tipo === 'imagem' || f.tipo === 'arquivo') {
        const img = f.tipo === 'imagem';
        controle = `
          <div class="arquivo" data-arquivo="${f.nome}" data-tipo="${img ? 'imagem' : 'arquivo'}">
            <input type="hidden" name="${f.nome}" value="${esc(v)}"${obrig}>
            <span class="previa">${v ? (img ? `<img src="${esc(v)}" alt="">` : `<a href="${esc(v)}" target="_blank" rel="noopener">${esc(v.split('/').pop())}</a>`) : '<span class="estado">Nenhum arquivo</span>'}</span>
            <input type="file" id="${id}" ${img ? 'accept="image/*"' : ''}>
            ${v ? '<button type="button" class="bt bt-pequeno bt-perigo" data-limpar>Remover</button>' : ''}
            <span class="estado" data-estado></span>
          </div>`;
      } else {
        const tipo = { data: 'date', url: 'url', email: 'email', tel: 'tel' }[f.tipo] || 'text';
        controle = `<input id="${id}" type="${tipo}" name="${f.nome}" value="${esc(v)}"${obrig}>`;
      }
      partes.push(`<label class="campo" for="${id}"><span>${esc(f.rotulo)}${f.obrigatorio ? ' *' : ''}</span>${controle}</label>`);
    }
    return partes.join('');
  }

  function ligarArquivos(raiz) {
    raiz.querySelectorAll('[data-arquivo]').forEach((caixa) => {
      const oculto = caixa.querySelector('input[type="hidden"]');
      const estado = caixa.querySelector('[data-estado]');
      caixa.querySelector('input[type="file"]').addEventListener('change', async (e) => {
        const arq = e.target.files[0];
        if (!arq) return;
        estado.textContent = 'Enviando…';
        const fd = new FormData();
        fd.append('arquivo', arq);
        try {
          const r = await api(`/upload?tipo=${caixa.dataset.tipo}`, { method: 'POST', body: fd });
          oculto.value = r.url;
          caixa.querySelector('.previa').innerHTML = caixa.dataset.tipo === 'imagem'
            ? `<img src="${esc(r.url)}" alt="">` : `<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(arq.name)}</a>`;
          estado.textContent = 'Enviado ✓ (lembre de salvar)';
        } catch (err) {
          estado.textContent = err.message;
          e.target.value = '';
        }
      });
      caixa.querySelector('[data-limpar]')?.addEventListener('click', () => {
        oculto.value = '';
        caixa.querySelector('.previa').innerHTML = '<span class="estado">Nenhum arquivo (salve para confirmar)</span>';
      });
    });
  }

  function lerFormulario(form) {
    return Object.fromEntries([...new FormData(form)].filter(([, v]) => typeof v === 'string'));
  }

  async function desenharFormUnico(nome, dados) {
    const c = $('#conteudo-painel');
    c.innerHTML = `<form class="form-unico" id="form-unico"><div class="campos">${await htmlCampos(nome, dados)}</div>
      <p style="margin:18px 0 0"><button class="bt bt-vermelho" type="submit">Salvar alterações</button></p></form>`;
    c.onclick = null;
    ligarArquivos(c);
    $('#form-unico').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api(`/dados/${nome}`, { method: 'PUT', body: JSON.stringify(lerFormulario(e.currentTarget)) });
        avisar('Informações salvas.');
      } catch (err) { avisar(err.message, true); }
    });
  }

  const dialogo = $('#dialogo');
  dialogo.querySelectorAll('[data-fechar]').forEach((b) => b.addEventListener('click', () => dialogo.close()));

  async function abrirDialogo(nome, id, item) {
    editando = { colecao: nome, id };
    $('#titulo-dialogo').textContent = id ? `Editar — ${esquemas[nome].titulo}` : `Adicionar — ${esquemas[nome].titulo}`;
    $('#campos').innerHTML = await htmlCampos(nome, item);
    ligarArquivos($('#campos'));
    dialogo.showModal();
  }

  $('#form-item').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const faltando = [...form.querySelectorAll('input[type="hidden"][required]')].find((i) => !i.value);
    if (faltando) return avisar('Envie o arquivo obrigatório antes de salvar.', true);
    const dados = lerFormulario(form);
    const { colecao, id } = editando;
    try {
      if (id) await api(`/dados/${colecao}/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
      else await api(`/dados/${colecao}`, { method: 'POST', body: JSON.stringify(dados) });
      dialogo.close();
      avisar('Salvo.');
      await abrirColecao(colecao);
    } catch (err) { avisar(err.message, true); }
  });

  iniciar();
})();
