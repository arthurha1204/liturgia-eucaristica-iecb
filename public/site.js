// Interações do site da IECB.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const hoje = () => new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);

  // Menu móvel
  const botaoMenu = $('.botao-menu');
  const menu = $('#menu-principal');
  botaoMenu?.addEventListener('click', () => {
    const aberto = menu.classList.toggle('aberto');
    botaoMenu.setAttribute('aria-expanded', String(aberto));
  });
  menu?.addEventListener('click', (e) => { if (e.target.closest('a')) menu.classList.remove('aberto'); });

  // Formulários (newsletter e contato)
  $$('form[data-form]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const retorno = $('.retorno', form);
      const botao = $('button[type="submit"]', form);
      botao.disabled = true;
      retorno.className = 'retorno';
      retorno.textContent = 'Enviando…';
      try {
        const resp = await fetch(`/api/${form.dataset.form}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
        });
        const dados = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(dados.erro || 'Não foi possível enviar. Tente novamente.');
        retorno.classList.add('ok');
        retorno.textContent = dados.mensagem || 'Enviado com sucesso!';
        form.reset();
      } catch (err) {
        retorno.classList.add('erro');
        retorno.textContent = err.message;
      } finally {
        botao.disabled = false;
      }
    });
  });

  // Copiar chave PIX
  $$('[data-copiar]').forEach((b) => b.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(b.dataset.copiar);
      const t = b.innerHTML;
      b.textContent = 'Copiado!';
      setTimeout(() => { b.innerHTML = t; }, 1800);
    } catch { /* navegador sem permissão de área de transferência */ }
  }));

  // Galeria: filtros e lightbox
  $$('.filtros button').forEach((b) => b.addEventListener('click', () => {
    $$('.filtros button').forEach((x) => x.classList.toggle('ativo', x === b));
    $$('.galeria figure').forEach((f) => { f.hidden = Boolean(b.dataset.filtro) && f.dataset.categoria !== b.dataset.filtro; });
  }));
  $$('[data-lightbox]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    const caixa = document.createElement('div');
    caixa.className = 'lightbox';
    caixa.setAttribute('role', 'dialog');
    caixa.setAttribute('aria-modal', 'true');
    caixa.innerHTML = `<button aria-label="Fechar">×</button><img src="${esc(a.getAttribute('href'))}" alt=""><p>${esc(a.dataset.legenda || '')}</p>`;
    const fechar = () => { caixa.remove(); document.removeEventListener('keydown', tecla); a.focus(); };
    const tecla = (ev) => { if (ev.key === 'Escape') fechar(); };
    caixa.addEventListener('click', (ev) => { if (ev.target === caixa || ev.target.tagName === 'BUTTON') fechar(); });
    document.addEventListener('keydown', tecla);
    document.body.append(caixa);
    $('button', caixa).focus();
  }));

  // Busca de paróquias
  const busca = $('[data-busca-paroquia]');
  busca?.addEventListener('input', () => {
    const termo = busca.value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    let total = 0;
    $$('[data-diocese]').forEach((d) => {
      let visiveis = 0;
      $$('.paroquia', d).forEach((p) => {
        const alvo = p.dataset.busca.normalize('NFD').replace(/[̀-ͯ]/g, '');
        const ok = !termo || alvo.includes(termo);
        p.hidden = !ok;
        if (ok) visiveis++;
      });
      const nomeDiocese = d.textContent.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      const mostrar = !termo || visiveis > 0 || nomeDiocese.includes(termo);
      d.hidden = !mostrar;
      if (termo && visiveis) $('details', d).open = true;
      if (mostrar) total++;
    });
    const nada = $('.nada-encontrado');
    if (nada) nada.hidden = total > 0;
  });

  // Liturgia do dia (usa o mesmo serviço do gerador de folhetos)
  async function consultarDia(data) {
    const resp = await fetch('/api/dia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, rito: 'I', opcoes: {} }),
    });
    if (!resp.ok) throw new Error('Calendário indisponível no momento.');
    return resp.json();
  }
  const listaLeituras = (d) => {
    const L = d.leituras || {};
    return [['1ª Leitura', L.primeira], ['Salmo', L.salmo], ['Epístola', L.segunda], ['Evangelho', L.evangelho]]
      .filter(([, r]) => r)
      .map(([n, r]) => `<li><span>${n}</span><strong>${esc(r.referencia)}</strong></li>`)
      .join('');
  };

  const hojeBox = $('[data-liturgia-hoje]');
  if (hojeBox) {
    consultarDia(hoje()).then((d) => {
      $('[data-hoje-nome]', hojeBox).textContent = d.nomeDia;
      $('[data-hoje-meta]', hojeBox).textContent = [d.dataExtenso, d.nomeTempo, d.cor && `cor ${d.cor}`].filter(Boolean).join(' · ');
      $('[data-hoje-leituras]', hojeBox).innerHTML = listaLeituras(d) || '<li class="suave">Leituras indisponíveis no momento.</li>';
    }).catch((e) => { $('[data-hoje-nome]', hojeBox).textContent = e.message; });
  }

  const lec = $('[data-lecionario]');
  const lecData = $('[data-lecionario-data]');
  if (lec && lecData) {
    const carregar = async () => {
      lec.style.opacity = '.55';
      try {
        const d = await consultarDia(lecData.value);
        const itens = listaLeituras(d);
        lec.innerHTML = `
          <p class="sobretitulo">${esc(d.nomeTempo)}${d.anoLiturgico ? ` · Ano ${esc(d.anoLiturgico)}` : ''}</p>
          <h3>${esc(d.nomeDia)}</h3>
          <p class="suave">${esc(d.dataExtenso)}${d.subtitulo ? ` · ${esc(d.subtitulo)}` : ''}</p>
          ${itens ? `<ul>${itens}</ul>` : '<p class="suave">Leituras indisponíveis para esta data.</p>'}
          <p style="margin:16px 0 0"><a class="link-seta" href="/materiais/liturgia">Gerar o folheto deste dia →</a></p>`;
      } catch (e) {
        lec.innerHTML = `<p class="suave">${esc(e.message)}</p>`;
      } finally {
        lec.style.opacity = '';
      }
    };
    lecData.value = hoje();
    lecData.addEventListener('change', carregar);
    carregar();
  }
})();
