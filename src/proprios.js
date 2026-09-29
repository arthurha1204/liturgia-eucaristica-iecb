// Reúne os "próprios" do dia: dados da API Estêvão (calendário, celebração, leituras)
// + textos do LOC 1987 (coleta, prefácio, bênção) escolhidos pelas regras do livro.

import { readFileSync } from 'node:fs';
import { analisarData, chaveData, dataPorExtenso, diferencaDias, utc, MESES, somarDias } from './calendario.js';
import * as api from './estevao.js';

const lerJson = (rel) => JSON.parse(readFileSync(new URL(`../data/${rel}`, import.meta.url), 'utf8'));
export const COLETAS = lerJson('loc1987-coletas.json').filter((e) => e.coletas.length || e.mesma_coleta_de);
export const PREFACIOS = lerJson('prefacios.json');
export const BENCAOS = lerJson('bencaos.json');

const normalizar = (s) =>
  String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[ºª°]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

function acharEntrada(titulo, numeroProprio) {
  if (numeroProprio) return COLETAS.find((e) => e.proprio === numeroProprio) || null;
  const alvo = normalizar(titulo);
  return (
    COLETAS.find((e) => normalizar(e.titulo) === alvo) ||
    COLETAS.find((e) => normalizar(e.titulo).startsWith(alvo) || alvo.startsWith(normalizar(e.titulo))) ||
    null
  );
}

/** Resolve "(A mesma coleta da 5ª feira da semana da Páscoa)". */
function resolverEntrada(entrada) {
  if (entrada && !entrada.coletas.length && entrada.mesma_coleta_de) {
    const alvo = acharEntrada(entrada.mesma_coleta_de);
    if (alvo) return { ...alvo, titulo: entrada.titulo, observacao: `Mesma coleta da ${entrada.mesma_coleta_de}` };
  }
  return entrada;
}

// ---------- Dias Santos com data fixa ----------

function dataFixa(entrada, ano) {
  const m = /(\d{1,2}) de (\w+)/.exec(entrada.data_fixa || '');
  if (!m) return null;
  const mes = MESES.indexOf(m[2].toLowerCase());
  return mes < 0 ? null : utc(ano, mes + 1, +m[1]);
}

const DIAS_SANTOS = COLETAS.filter((e) => e.secao === 'Dias Santos' && e.data_fixa);
const PALAVRAS_GENERICAS = new Set(
  'sao santo santa santos apostolo apostolos evangelista dia de da do das dos e a o nosso senhor jesus cristo bem aventurada'.split(' '),
);

function diaSantoNaData(data) {
  return DIAS_SANTOS.find((e) => {
    const d = dataFixa(e, data.getUTCFullYear());
    return d && d.getTime() === data.getTime();
  }) || null;
}

/** Procura, entre os Dias Santos próximos da data, o que corresponde ao nome vindo da API. */
function diaSantoPorNome(nome, data) {
  const tokens = new Set(normalizar(nome).split(' ').filter((t) => t.length > 2 && !PALAVRAS_GENERICAS.has(t)));
  if (!tokens.size) return null;
  let melhor = null;
  for (const e of DIAS_SANTOS) {
    const d = dataFixa(e, data.getUTCFullYear());
    if (!d || Math.abs(diferencaDias(data, d)) > 10) continue;
    const pontos = normalizar(e.titulo).split(' ').filter((t) => tokens.has(t)).length;
    if (pontos > 0 && (!melhor || pontos > melhor.pontos)) melhor = { e, pontos };
  }
  return melhor?.e || null;
}

// Festas que podem ocupar o domingo (fora de Advento, Quaresma e Páscoa)
const PODEM_OCUPAR_DOMINGO = /Apresentação|Transfiguração|Todos os Santos/;

function diaSantoLocal(info) {
  const { data, ehDomingo, sinais, tempo } = info;
  if (sinais.semanaSanta || sinais.oitavaPascoa || sinais.diaCinzas || sinais.diaAscensao ||
      sinais.diaNatal || sinais.diaEpifania || sinais.diaSantoNome) return null;
  const hoje = diaSantoNaData(data);
  const privilegiado = ['advento', 'quaresma', 'semana_santa', 'pascoa'].includes(tempo);
  if (hoje) {
    if (!ehDomingo) return { entrada: hoje, transferida: false };
    if (!privilegiado && PODEM_OCUPAR_DOMINGO.test(hoje.titulo)) return { entrada: hoje, transferida: false };
    return null; // transferido para segunda-feira
  }
  if (data.getUTCDay() === 1) {
    const ontem = diaSantoNaData(somarDias(data, -1));
    if (ontem && !(!privilegiado && PODEM_OCUPAR_DOMINGO.test(ontem.titulo))) return { entrada: ontem, transferida: true };
  }
  return null;
}

// ---------- Prefácio ----------

function escolherPrefacio(indicacao, ctx, opcoes) {
  const domSenhor = `dia_do_senhor_${[1, 2, 3].includes(+opcoes.prefacioDiaDoSenhor) ? +opcoes.prefacioDiaDoSenhor : 2}`;
  const daQuadra = () => {
    const s = ctx.sinais;
    if (s.ascensaoAtePentecostes) return 'ascensao';
    if (s.diaPentecostes) return 'pentecostes';
    if (s.domingoTrindade) return 'trindade';
    return {
      advento: 'advento', natal: 'encarnacao', epifania: 'epifania', quaresma: 'quaresma',
      semana_santa: 'semana_santa', pascoa: 'ressurreicao', pentecostes: ctx.ehDomingo ? domSenhor : null,
    }[ctx.tempo];
  };
  if (!indicacao) return daQuadra();
  const t = normalizar(indicacao);
  if (t.includes('nao ha prefacio')) return null;
  const primeira = t.split(' ou ')[0];
  const mapa = [
    ['epifania ou do dia do senhor', ctx.ehDomingo ? domSenhor : 'epifania'],
    ['dia do senhor', ctx.ehDomingo ? domSenhor : null],
    ['advento', 'advento'], ['encarnacao', 'encarnacao'], ['epifania', 'epifania'],
    ['quaresma', 'quaresma'], ['semana santa', 'semana_santa'], ['pascoa', 'ressurreicao'],
    ['ascensao', 'ascensao'], ['pentecostes', 'pentecostes'], ['trindade', 'trindade'],
    ['apostolos', 'apostolos'], ['todos os santos', 'todos_os_santos'], ['santo', 'dia_de_um_santo'],
    ['santos', 'dia_de_um_santo'], ['memorial', 'memorial'], ['batismo', 'batismo'],
    ['casamento', 'casamento'], ['dedicacao', 'dedicacao'], ['quadra', null],
  ];
  if (t.startsWith('prefacio da epifania ou do dia do senhor')) return ctx.ehDomingo ? domSenhor : 'epifania';
  for (const [chave, valor] of mapa) {
    if (primeira.includes(chave)) return chave === 'quadra' ? daQuadra() : valor;
  }
  return daQuadra();
}

// ---------- Bênção ----------

function bencaoDaQuadra(ctx) {
  const s = ctx.sinais;
  if (ctx.diaSanto) return 'dia_de_um_santo';
  if (s.domingoTrindade) return 'trindade';
  if (s.diaPentecostes) return 'pentecostes';
  if (s.ascensaoAtePentecostes) return 'ascensao';
  return {
    advento: 'advento', natal: 'natal', epifania: 'epifania', quaresma: 'quaresma',
    semana_santa: 'semana_santa', pascoa: 'pascoa', pentecostes: 'padrao',
  }[ctx.tempo] || 'padrao';
}

// ---------- Leituras ----------

const CHAVES_LEITURA = {
  primeira: ['first_reading', 'primeira_leitura', 'old_testament'],
  salmo: ['psalm', 'salmo'],
  segunda: ['second_reading', 'segunda_leitura', 'epistle', 'epistola'],
  evangelho: ['gospel', 'evangelho'],
};

/** Versículos da leitura. A API manda em `content.verses: [{ number, text }]`. */
function versosDaLeitura(r) {
  if (!r) return null;
  for (const k of ['text', 'texto', 'content', 'conteudo', 'passage']) {
    if (typeof r[k] === 'string' && r[k].trim()) return [r[k].trim()];
  }
  const fonte = r.content && typeof r.content === 'object' ? r.content : r;
  const versos = fonte.verses || fonte.versiculos || fonte.lines;
  if (!Array.isArray(versos) || !versos.length) return null;
  return versos
    .map((v) => (typeof v === 'string' ? v : v.text ?? v.texto ?? v.content ?? ''))
    .map((t) => String(t).trim())
    .filter(Boolean);
}

export function analisarReferencia(ref) {
  const m = /^\s*(.+?)\s+(\d+)(?:\s*[.:,]\s*(\d+))?/.exec(ref || '');
  if (!m) return { livro: ref || '', capitulo: '', versiculo: '' };
  return { livro: m[1].trim(), capitulo: m[2], versiculo: m[3] || '1' };
}

/** Junta as fontes: a primeira com referência define a leitura; as demais completam texto e alternativa. */
function montarLeituras(...fontes) {
  const out = {};
  for (const [slot, chaves] of Object.entries(CHAVES_LEITURA)) {
    const achadas = fontes
      .filter(Boolean)
      .map((f) => chaves.map((k) => f[k]).find((x) => x && (x.reference || x.referencia)))
      .filter(Boolean);
    if (!achadas.length) continue;
    const r = achadas[0];
    const referencia = r.reference || r.referencia;
    const mesma = achadas.filter((x) => (x.reference || x.referencia) === referencia);
    const versos = mesma.map(versosDaLeitura).find(Boolean) || null;
    const ref = analisarReferencia(referencia);
    out[slot] = {
      referencia,
      alternativa: achadas.map((x) => x.alternative_reference || x.referencia_alternativa).find(Boolean) || null,
      ...ref,
      capitulo: String(mesma.map((x) => x.chapter).find(Boolean) || ref.capitulo),
      versiculo: ref.versiculo,
      versos,
      texto: versos ? versos.join(' ') : null,
      traducao: mesma.map((x) => x.translation || x.content?.translation).find(Boolean) || null,
    };
  }
  return out;
}

function textosColetaApi(coleta) {
  const lista = Array.isArray(coleta) ? coleta : coleta ? [coleta] : [];
  return lista
    .map((c) => (typeof c === 'string' ? c : c?.texto || c?.text || c?.content || ''))
    .map((s) => s.trim())
    .filter(Boolean);
}

// ---------- Montagem do dia ----------

export async function prepararDia(data, opcoes = {}) {
  const info = analisarData(data);
  const avisos = [];
  let apiDia = null;
  let apiLec = null;
  let apiErro = null;

  if (api.apiConfigurada()) {
    const [r1, r2] = await Promise.allSettled([api.diaLiturgico(data), api.lecionario(data)]);
    if (r1.status === 'fulfilled') apiDia = r1.value?.data && !r1.value.date ? r1.value.data : r1.value;
    else apiErro = r1.reason?.message;
    if (r2.status === 'fulfilled') apiLec = r2.value?.data && !r2.value.leituras ? r2.value.data : r2.value;
    if (apiErro) avisos.push(apiErro);
  } else {
    apiErro = 'Chave da API Estêvão não configurada — leituras e calendário da API indisponíveis.';
    avisos.push(apiErro);
  }

  const celebracaoApi = apiDia?.celebration && Object.keys(apiDia.celebration).length ? apiDia.celebration : null;
  const tiposMaiores = ['principal_feast', 'major_holy_day', 'festival'];

  // 1) Qual Próprio do LOC 1987 governa o dia?
  let entrada = null;
  let origemProprio = 'calendário do LOC 1987';
  let diaSanto = null;
  if (opcoes.proprio) {
    entrada = acharEntrada(opcoes.proprio);
    origemProprio = 'escolhido manualmente';
  }
  if (!entrada && celebracaoApi?.name && (tiposMaiores.includes(celebracaoApi.type) || apiDia?.is_holy_day)) {
    const e = diaSantoPorNome(celebracaoApi.name, data);
    if (e) { entrada = e; diaSanto = { entrada: e, transferida: !!celebracaoApi.transferred }; origemProprio = 'celebração indicada pela API'; }
  }
  if (!entrada && !celebracaoApi) {
    diaSanto = diaSantoLocal(info);
    if (diaSanto) entrada = diaSanto.entrada;
  }
  if (!entrada && info.proprio) entrada = acharEntrada(info.proprio.titulo, info.proprio.numero);
  entrada = resolverEntrada(entrada);
  if (entrada?.secao === 'Dias Santos') diaSanto = diaSanto || { entrada, transferida: false };

  const ctx = { ...info, diaSanto: Boolean(diaSanto) };

  // 2) Coleta
  const coletasApi = textosColetaApi(apiDia?.collect);
  const coletasLoc = entrada?.coletas?.map((c) => c.texto) || [];
  const usarApi = opcoes.fonteColeta === 'api' ? coletasApi.length > 0 : coletasLoc.length === 0 && coletasApi.length > 0;
  const lista = usarApi ? coletasApi : coletasLoc;
  const indice = Math.min(Math.max(0, +opcoes.indiceColeta || 0), Math.max(0, lista.length - 1));
  const coleta = {
    titulo: entrada?.titulo || null,
    fonte: usarApi ? `API Estêvão (${api.preferencias().prayer_book_code})` : 'LOC 1987',
    textos: lista,
    texto: lista[indice] || null,
    indice,
    observacao: entrada?.observacao || null,
  };
  if (!coleta.texto) avisos.push('Nenhuma coleta encontrada para este dia.');

  // 3) Prefácio
  const indicacao = entrada?.coletas?.[indice]?.prefacio || entrada?.prefacio || (entrada?.rubricas || []).find((r) => /prefácio/i.test(r)) || null;
  const chavePrefacio = opcoes.prefacio && opcoes.prefacio !== 'auto'
    ? (opcoes.prefacio === 'nenhum' ? null : opcoes.prefacio)
    : escolherPrefacio(indicacao, ctx, opcoes);
  const prefacio = chavePrefacio && PREFACIOS[chavePrefacio] ? { chave: chavePrefacio, ...PREFACIOS[chavePrefacio] } : null;

  // 4) Bênção
  const chaveBencao = opcoes.bencao && opcoes.bencao !== 'auto' ? opcoes.bencao : bencaoDaQuadra(ctx);
  const bencao = { chave: chaveBencao, ...(BENCAOS[chaveBencao] || BENCAOS.padrao) };

  // 5) Leituras (lecionário da API; o dia do calendário como reserva)
  const leituras = montarLeituras(apiDia?.readings, apiLec?.leituras, apiLec?.readings);
  if (api.apiConfigurada() && !Object.keys(leituras).length) avisos.push('A API não retornou leituras para esta data.');

  // 6) Nomes e cor
  // Celebração maior dá nome ao dia; comemoração menor (ex.: Francisco de Assis) vira subtítulo.
  const celebracaoMaior = celebracaoApi && (tiposMaiores.includes(celebracaoApi.type) || diaSanto) ? celebracaoApi.name : null;
  const nomeCelebracao = celebracaoMaior || (diaSanto ? diaSanto.entrada.titulo.replace(/,\s*\d{1,2}º? de \w+$/, '') : null);
  const nomeDia = nomeCelebracao || info.nomeDia;
  const partesSub = [];
  if (info.proprio?.numero && !nomeCelebracao) partesSub.push(`Próprio ${info.proprio.numero}`);
  if (celebracaoApi && !celebracaoMaior) partesSub.push(`Comemoração: ${celebracaoApi.name}`);
  if (nomeCelebracao && info.ehDomingo && info.nomeDia !== nomeCelebracao) partesSub.push(info.nomeDia);
  const festa = Boolean(nomeCelebracao) ||
    ['diaNatal', 'diaEpifania', 'diaPascoa', 'diaAscensao', 'diaPentecostes', 'domingoTrindade', 'diaSantoNome'].some((k) => info.sinais[k]);

  return {
    data: chaveData(data),
    dataExtenso: dataPorExtenso(data),
    nomeDia,
    subtitulo: partesSub.join(' · ') || null,
    tempo: info.tempo,
    nomeTempo: apiDia?.liturgical_season || info.nomeTempo,
    cor: (apiDia?.liturgical_color ||
      (diaSanto ? (/apóstolo|mártir|Inocentes|Santa Cruz/i.test(diaSanto.entrada.titulo) ? 'vermelho' : 'branco') : info.cor) || '').toLowerCase(),
    anoLiturgico: apiDia?.liturgical_year || apiLec?.ciclo || null,
    ehDomingo: info.ehDomingo,
    festa,
    celebracao: celebracaoApi ? { nome: celebracaoApi.name, tipo: celebracaoApi.type, transferida: !!celebracaoApi.transferred } : (diaSanto ? { nome: nomeCelebracao, tipo: 'dia_santo', transferida: diaSanto.transferida } : null),
    proprio: { titulo: entrada?.titulo || null, origem: origemProprio },
    coleta,
    coletasApi,
    prefacio,
    prefacioIndicacao: indicacao,
    bencao,
    leituras,
    sinais: info.sinais,
    api: { configurada: api.apiConfigurada(), ok: Boolean(apiDia), erro: apiErro, livro: api.preferencias().prayer_book_code },
    avisos,
  };
}

export function listaProprios() {
  return COLETAS.map((e) => ({ titulo: e.titulo, secao: e.secao }));
}
