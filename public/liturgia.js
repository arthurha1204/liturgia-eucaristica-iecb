// Página do folheto: consulta o dia no servidor e baixa o PDF.

const $ = (s) => document.querySelector(s);
const campoData = $('#data');
const campoComunidade = $('#comunidade');

const PREFACIOS = [
  ['nenhum', 'Sem prefácio próprio'], ['dia_do_senhor_1', 'Dia do Senhor — De Deus Pai'],
  ['dia_do_senhor_2', 'Dia do Senhor — De Deus Filho'], ['dia_do_senhor_3', 'Dia do Senhor — De Deus Espírito Santo'],
  ['advento', 'Advento'], ['encarnacao', 'Encarnação'], ['epifania', 'Epifania'], ['quaresma', 'Quaresma'],
  ['semana_santa', 'Semana Santa'], ['ressurreicao', 'Ressurreição'], ['ascensao', 'Ascensão'],
  ['pentecostes', 'Pentecostes'], ['trindade', 'Santíssima Trindade'], ['todos_os_santos', 'Todos os Santos'],
  ['dia_de_um_santo', 'Dia de um Santo'], ['apostolos', 'Apóstolos e Ordenações'], ['dedicacao', 'Dedicação de uma Igreja'],
  ['batismo', 'Batismo'], ['casamento', 'Casamento'], ['memorial', 'Memorial'],
];
const BENCAOS = [
  ['padrao', 'Bênção do Rito I'], ['geral_1', 'Geral — O Senhor vos abençoe'], ['geral_2', 'Geral — O Deus da paz'],
  ['geral_3', 'Geral — E, agora, a Bênção'], ['geral_4', 'Geral — Que o amor de Deus nos una'],
  ['advento', 'Advento'], ['natal', 'Natal'], ['epifania', 'Epifania'], ['quaresma', 'Quaresma'],
  ['semana_santa', 'Semana Santa'], ['pascoa', 'Páscoa'], ['ascensao', 'Ascensão'], ['pentecostes', 'Pentecostes'],
  ['trindade', 'Trindade'], ['dia_de_um_santo', 'Dia de um Santo'], ['unidade', 'Unidade'],
];

const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
const recuperar = (k) => { try { return localStorage.getItem(k); } catch { return null; } };

function preencher(select, itens) {
  for (const [valor, rotulo] of itens) select.append(new Option(rotulo, valor));
}

function hojeBrasil() {
  return new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);
}

function rito() {
  return document.querySelector('input[name="rito"]:checked')?.value || 'I';
}

function aplicarRito() {
  const menor = rito() === 'menor';
  document.body.classList.toggle('rito-menor', menor);
  $('#nome-rito').textContent = menor ? 'Rito Menor' : 'Rito I';
  $('#sel-bencao').options[0].text = menor ? 'Automático (Bênção do Rito)' : 'Automático (da quadra)';
}

function opcoes() {
  const o = { comunidade: campoComunidade.value.trim() };
  document.querySelectorAll('[data-op]').forEach((el) => {
    o[el.dataset.op] = el.type === 'checkbox' ? el.checked : el.value;
  });
  return o;
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function mostrarDia(d) {
  const L = d.leituras || {};
  const leitura = (nome, r) => r
    ? `<li><span>${nome}</span> ${esc(r.referencia)}${r.alternativa ? ` <em>ou ${esc(r.alternativa)}</em>` : ''}</li>`
    : '';
  const lista = leitura('1ª Leitura', L.primeira) + leitura('Salmo', L.salmo) + leitura('Epístola', L.segunda) + leitura('Evangelho', L.evangelho);
  $('#dia').className = 'dia';
  $('#dia').innerHTML = `
    <div class="cabecalho-dia">
      <span class="cor cor-${esc(d.cor)}" title="Cor litúrgica: ${esc(d.cor)}"></span>
      <div>
        <h2>${esc(d.nomeDia)}</h2>
        ${d.subtitulo ? `<p class="subtitulo">${esc(d.subtitulo)}</p>` : ''}
        <p class="meta">${esc(d.dataExtenso)} · ${esc(d.nomeTempo)} · cor ${esc(d.cor)}${d.anoLiturgico ? ` · Ano ${esc(d.anoLiturgico)}` : ''}</p>
      </div>
    </div>
    <div class="colunas">
      <div>
        <h3>Leituras</h3>
        ${lista ? `<ul class="leituras">${lista}</ul>` : '<p class="vazio">Sem leituras da API para esta data.</p>'}
        ${d.rito === 'menor' ? '' : `<h3>Prefácio</h3>
        <p>${d.prefacio ? esc(d.prefacio.titulo) : '<span class="vazio">Sem prefácio próprio</span>'}</p>`}
        <h3>Bênção</h3>
        <p>${esc(d.bencao?.titulo)}</p>
      </div>
      <div>
        <h3>Coleta do Dia <small>${esc(d.coleta?.fonte)}${d.coleta?.titulo ? ` — ${esc(d.coleta.titulo)}` : ''}</small></h3>
        <p class="coleta">${esc(d.coleta?.texto) || '<span class="vazio">Nenhuma coleta encontrada.</span>'}</p>
        ${d.coleta?.textos?.length > 1 ? `<label class="alt">Coleta alternativa
          <select id="indice-coleta">${d.coleta.textos.map((t, i) => `<option value="${i}" ${i === d.coleta.indice ? 'selected' : ''}>Opção ${i + 1}: ${esc(t.slice(0, 60))}…</option>`).join('')}</select></label>` : ''}
      </div>
    </div>
    ${d.avisos?.length ? `<ul class="avisos-dia">${d.avisos.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}`;
  const alt = $('#indice-coleta');
  if (alt) alt.addEventListener('change', () => { indiceColeta = +alt.value; atualizar(); });
}

let indiceColeta = 0;
let pedido = 0;

async function atualizar() {
  const meu = ++pedido;
  $('#dia').classList.add('carregando');
  try {
    const resp = await fetch('/api/dia', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: campoData.value, rito: rito(), opcoes: { ...opcoes(), indiceColeta } }),
    });
    const d = await resp.json();
    if (meu !== pedido) return;
    if (!resp.ok) throw new Error(d.erro || 'Erro ao consultar o dia.');
    mostrarDia(d);
  } catch (e) {
    $('#dia').className = 'dia erro';
    $('#dia').textContent = e.message;
  }
}

async function baixar(formato, botao) {
  const texto = botao.textContent;
  botao.disabled = true;
  botao.textContent = 'Gerando PDF…';
  try {
    const resp = await fetch('/api/folheto', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: campoData.value, rito: rito(), formato, opcoes: { ...opcoes(), indiceColeta } }),
    });
    if (!resp.ok) throw new Error((await resp.json().catch(() => ({}))).erro || 'Falha ao gerar o PDF.');
    const blob = await resp.blob();
    const nome = /filename="([^"]+)"/.exec(resp.headers.get('Content-Disposition') || '')?.[1] || 'eucaristia.pdf';
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: nome });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  } catch (e) {
    alert(e.message);
  } finally {
    botao.disabled = false;
    botao.textContent = texto;
  }
}

async function iniciar() {
  preencher($('#sel-prefacio'), PREFACIOS);
  preencher($('#sel-bencao'), BENCAOS);
  const proprios = await fetch('/api/proprios').then((r) => r.json()).catch(() => []);
  let grupo = null;
  for (const p of proprios) {
    if (!grupo || grupo.dataset.secao !== p.secao) {
      grupo = document.createElement('optgroup');
      grupo.label = p.secao === 'Tempo' ? 'Ano Cristão' : p.secao;
      grupo.dataset.secao = p.secao;
      $('#sel-proprio').append(grupo);
    }
    grupo.append(new Option(p.titulo, p.titulo));
  }

  const status = await fetch('/api/status').then((r) => r.json()).catch(() => null);
  if (status && !status.apiConfigurada) {
    const aviso = $('#aviso-api');
    aviso.hidden = false;
    aviso.innerHTML = '<strong>Chave da API Estêvão não configurada.</strong> O folheto sai com coleta, prefácio e bênção do LOC 1987, mas sem as leituras. Coloque sua chave no arquivo <code>.env</code> e reinicie o servidor.';
  }

  const ritoSalvo = recuperar('rito');
  if (ritoSalvo) document.querySelectorAll('input[name="rito"]').forEach((r) => { r.checked = r.value === ritoSalvo; });
  aplicarRito();
  document.querySelectorAll('input[name="rito"]').forEach((r) => r.addEventListener('change', () => {
    guardar('rito', rito());
    aplicarRito();
    atualizar();
  }));

  campoData.value = hojeBrasil();
  campoComunidade.value = recuperar('comunidade') || '';
  campoData.addEventListener('change', () => { indiceColeta = 0; atualizar(); });
  campoComunidade.addEventListener('change', () => guardar('comunidade', campoComunidade.value));
  document.querySelectorAll('[data-op]').forEach((el) => el.addEventListener('change', () => {
    if (el.dataset.op === 'proprio' || el.dataset.op === 'fonteColeta') indiceColeta = 0;
    atualizar();
  }));
  $('#baixar-livreto').addEventListener('click', (e) => baixar('livreto', e.currentTarget));
  $('#baixar-a5').addEventListener('click', (e) => baixar('a5', e.currentTarget));
  atualizar();
}

iniciar();
