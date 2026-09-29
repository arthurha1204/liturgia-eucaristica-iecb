// Cliente da API Estêvão (https://api.caminhoanglicano.com.br/api/v1).
// A chave fica SOMENTE no servidor (arquivo .env) e nunca é enviada ao navegador.

const BASE = process.env.ESTEVAO_API_URL || 'https://api.caminhoanglicano.com.br';
const CACHE_MS = 6 * 60 * 60 * 1000;
const cache = new Map();

export function apiConfigurada() {
  return Boolean(process.env.ESTEVAO_API_KEY && process.env.ESTEVAO_API_KEY.trim());
}

export function preferencias() {
  return {
    prayer_book_code: process.env.ESTEVAO_PRAYER_BOOK || 'loc_2015',
    bible_version: process.env.ESTEVAO_BIBLE_VERSION || undefined,
  };
}

export class ErroApi extends Error {
  constructor(mensagem, status) {
    super(mensagem);
    this.status = status;
  }
}

async function get(caminho, params = {}) {
  if (!apiConfigurada()) throw new ErroApi('Chave da API Estêvão não configurada (.env → ESTEVAO_API_KEY).', 0);
  const url = new URL(caminho, BASE);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  const chave = url.toString();
  const emCache = cache.get(chave);
  if (emCache && Date.now() - emCache.em < CACHE_MS) return emCache.dados;

  let resp;
  try {
    resp = await fetch(url, {
      headers: { 'X-API-Key': process.env.ESTEVAO_API_KEY.trim(), Accept: 'application/json' },
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new ErroApi('Não foi possível conectar à API Estêvão agora (sem internet ou serviço fora do ar). Tente de novo em instantes.', 0);
  }
  const texto = await resp.text();
  let dados;
  try { dados = JSON.parse(texto); } catch { dados = { bruto: texto }; }
  if (!resp.ok) {
    const msg = dados?.message || dados?.error || `HTTP ${resp.status}`;
    throw new ErroApi(`API Estêvão: ${msg}`, resp.status);
  }
  cache.set(chave, { em: Date.now(), dados });
  return dados;
}

function paramsPreferencias(extra = {}) {
  const p = { ...preferencias(), ...extra };
  const params = {};
  for (const [k, v] of Object.entries(p)) if (v) params[`preferences[${k}]`] = v;
  return params;
}

const partes = (data) => [data.getUTCFullYear(), data.getUTCMonth() + 1, data.getUTCDate()];

export function diaLiturgico(data) {
  const [a, m, d] = partes(data);
  return get(`/api/v1/calendar/${a}/${m}/${d}`, paramsPreferencias());
}

export function lecionario(data) {
  const [a, m, d] = partes(data);
  return get(`/api/v1/lectionary/${a}/${m}/${d}`, paramsPreferencias());
}

export function explicacao(data) {
  const [a, m, d] = partes(data);
  return get(`/api/v1/liturgical_explanation/${a}/${m}/${d}`, {
    ...paramsPreferencias(),
    service_type: 'eucharist',
    locale: 'pt-BR',
  });
}

export function livrosDeOracao() {
  return get('/api/v1/prayer_books');
}

export function versoesBiblia() {
  return get('/api/v1/bible_versions');
}
