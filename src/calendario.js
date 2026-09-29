// Calendário do Ano Cristão calculado localmente (LOC 1987, IEAB).
// Serve para escolher a coleta/prefácio do LOC 1987 e as variações do rito,
// e como reserva quando a API Estêvão não estiver disponível.

const DIA_MS = 86400000;

export const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
export const DIAS_SEMANA = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado',
];

export function utc(ano, mes, dia) {
  return new Date(Date.UTC(ano, mes - 1, dia));
}
export function somarDias(data, n) {
  return new Date(data.getTime() + n * DIA_MS);
}
export function diferencaDias(a, b) {
  return Math.round((a.getTime() - b.getTime()) / DIA_MS);
}
export function chaveData(data) {
  return data.toISOString().slice(0, 10);
}
export function lerData(texto) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto || '');
  if (!m) return null;
  const d = utc(+m[1], +m[2], +m[3]);
  return Number.isNaN(d.getTime()) ? null : d;
}
export function dataPorExtenso(data) {
  return `${DIAS_SEMANA[data.getUTCDay()]}, ${data.getUTCDate()} de ${MESES[data.getUTCMonth()]} de ${data.getUTCFullYear()}`;
}

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher, calendário gregoriano). */
export function pascoa(ano) {
  const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return utc(ano, mes, dia);
}

export function primeiroDomingoAdvento(ano) {
  const natal = utc(ano, 12, 25);
  const dow = natal.getUTCDay();
  const quartoDomingo = somarDias(natal, -(dow === 0 ? 7 : dow));
  return somarDias(quartoDomingo, -21);
}

function proximoDomingoDepois(data) {
  const dow = data.getUTCDay();
  return somarDias(data, dow === 0 ? 7 : 7 - dow);
}

const ORD = (n) => `${n}º`;

/** Número do Próprio (1–29) cujo domingo de referência (11/mai + 7·(n−1)) é o mais próximo. */
function numeroProprio(domingo) {
  const base = utc(domingo.getUTCFullYear(), 5, 11);
  const n = Math.round(diferencaDias(domingo, base) / 7) + 1;
  return Math.min(29, Math.max(1, n));
}

/**
 * Monta, para o ano litúrgico que contém `data`, o mapa data → título do Próprio
 * (títulos no formato do LOC 1987) e os marcos móveis do ano.
 */
function anoLiturgico(data) {
  const ano = data.getUTCFullYear();
  const inicio = data >= primeiroDomingoAdvento(ano) ? primeiroDomingoAdvento(ano) : primeiroDomingoAdvento(ano - 1);
  const anoCivil = inicio.getUTCFullYear() + 1; // ano civil em que cai a Páscoa
  const P = pascoa(anoCivil);
  const m = {
    advento1: inicio,
    natal: utc(anoCivil - 1, 12, 25),
    santoNome: utc(anoCivil, 1, 1),
    epifania: utc(anoCivil, 1, 6),
    cinzas: somarDias(P, -46),
    ramos: somarDias(P, -7),
    pascoa: P,
    ascensao: somarDias(P, 39),
    pentecostes: somarDias(P, 49),
    trindade: somarDias(P, 56),
    proximoAdvento: primeiroDomingoAdvento(anoCivil),
  };

  const ancoras = new Map(); // chaveData → { titulo, proprio? }
  const por = (d, titulo, extra = {}) => ancoras.set(chaveData(d), { titulo, ...extra });

  for (let k = 0; k < 4; k++) por(somarDias(m.advento1, 7 * k), `${ORD(k + 1)} Domingo do Advento`, { domingo: true });
  por(m.natal, 'Natividade de Nosso Senhor');
  for (let s = proximoDomingoDepois(m.natal), k = 1; s < m.epifania; s = somarDias(s, 7), k++) {
    por(s, `${ORD(k)} Domingo depois do Dia de Natal`, { domingo: true });
  }
  por(m.santoNome, 'A Festa do Santo Nome (1º de janeiro)');
  por(m.epifania, 'Epifania');
  const ultimoEpifania = somarDias(m.cinzas, -3);
  for (let s = proximoDomingoDepois(m.epifania), k = 1; s < m.cinzas; s = somarDias(s, 7), k++) {
    let t;
    if (s.getTime() === ultimoEpifania.getTime()) t = 'Último Domingo da Epifania';
    else if (k === 1) t = '1º Domingo depois da Epifania (Festa do Batismo de Nosso Senhor)';
    else t = `${ORD(k)} Domingo depois da Epifania`;
    por(s, t, { domingo: true });
  }
  por(m.cinzas, 'Quarta-feira de Cinzas');
  for (let k = 1; k <= 5; k++) por(somarDias(m.cinzas, 4 + 7 * (k - 1)), `${ORD(k)} Domingo da Quaresma`, { domingo: true });
  por(m.ramos, 'Domingo da Paixão (Domingo de Ramos)', { domingo: true });
  ['2ª feira', '3ª feira', '4ª feira', '5ª feira', '6ª feira'].forEach((d, i) => por(somarDias(m.ramos, i + 1), `${d} da Semana Santa`));
  por(somarDias(m.ramos, 6), 'Sábado Santo');
  por(P, 'Páscoa');
  ['2ª feira', '3ª feira', '4ª feira', '5ª feira', '6ª feira'].forEach((d, i) => por(somarDias(P, i + 1), `${d} da Semana da Páscoa`));
  por(somarDias(P, 6), 'Sábado da Semana da Páscoa');
  for (let k = 2; k <= 7; k++) por(somarDias(P, 7 * (k - 1)), `${ORD(k)} Domingo da Páscoa`, { domingo: true });
  por(m.ascensao, 'Ascensão do Senhor');
  por(m.pentecostes, 'Domingo de Pentecostes', { domingo: true });
  por(somarDias(m.pentecostes, 1), `Próprio ${numeroProprio(m.pentecostes)}`, { proprio: numeroProprio(m.pentecostes) });
  por(m.trindade, '1º Domingo depois de Pentecostes (Domingo da Trindade)', { domingo: true });
  por(somarDias(m.trindade, 1), `Próprio ${numeroProprio(m.trindade)}`, { proprio: numeroProprio(m.trindade) });
  for (let s = somarDias(m.trindade, 7), k = 2; s < m.proximoAdvento; s = somarDias(s, 7), k++) {
    const n = numeroProprio(s);
    por(s, `Próprio ${n}`, { proprio: n, domingo: true, domingoPentecostes: k });
  }
  return { marcos: m, ancoras };
}

/** Tempo (quadra) litúrgico local. */
function tempoDe(data, m) {
  if (data >= m.advento1 && data < m.natal) return 'advento';
  if (data >= m.natal && data < m.epifania) return 'natal';
  if (data >= m.epifania && data < m.cinzas) return 'epifania';
  if (data >= m.cinzas && data < m.ramos) return 'quaresma';
  if (data >= m.ramos && data < m.pascoa) return 'semana_santa';
  if (data >= m.pascoa && data <= m.pentecostes) return 'pascoa';
  return 'pentecostes'; // Estação depois de Pentecostes (Tempo Comum)
}

export const NOME_TEMPO = {
  advento: 'Advento',
  natal: 'Natal',
  epifania: 'Epifania',
  quaresma: 'Quaresma',
  semana_santa: 'Semana Santa',
  pascoa: 'Páscoa',
  pentecostes: 'Tempo Comum (depois de Pentecostes)',
};

const COR_TEMPO = {
  advento: 'roxo', natal: 'branco', epifania: 'verde', quaresma: 'roxo',
  semana_santa: 'vermelho', pascoa: 'branco', pentecostes: 'verde',
};

/**
 * Analisa uma data: tempo, marcos, título do Próprio do LOC 1987 que governa o dia
 * (o Próprio do domingo vale para a semana seguinte) e sinalizadores do rito.
 */
export function analisarData(data) {
  const { marcos: m, ancoras } = anoLiturgico(data);
  let ancora = null;
  let dataAncora = null;
  for (let d = data, i = 0; i < 8; i++, d = somarDias(d, -1)) {
    const a = ancoras.get(chaveData(d));
    if (a) { ancora = a; dataAncora = d; break; }
  }
  const tempo = tempoDe(data, m);
  const ehDomingo = data.getUTCDay() === 0;
  const igual = (a, b) => a.getTime() === b.getTime();

  let cor = COR_TEMPO[tempo];
  if (igual(data, m.epifania) || (ancora && /Batismo|Último Domingo da Epifania/.test(ancora.titulo) && ehDomingo)) cor = 'branco';
  if (igual(data, m.pentecostes)) cor = 'vermelho';
  if (igual(data, m.trindade)) cor = 'branco';

  let nomeDia = ancora?.titulo || NOME_TEMPO[tempo];
  if (ancora?.proprio && ehDomingo && ancora.domingoPentecostes) {
    nomeDia = `${ORD(ancora.domingoPentecostes)} Domingo depois de Pentecostes`;
  } else if (!ehDomingo && dataAncora && !igual(dataAncora, data)) {
    nomeDia = `${DIAS_SEMANA[data.getUTCDay()]} — semana de: ${ancora.titulo}`;
    if (ancora.proprio) nomeDia = `${DIAS_SEMANA[data.getUTCDay()]} — Tempo Comum`;
  }

  return {
    data,
    ehDomingo,
    tempo,
    nomeTempo: NOME_TEMPO[tempo],
    cor,
    marcos: m,
    proprio: ancora ? { titulo: ancora.titulo, numero: ancora.proprio || null, desde: chaveData(dataAncora) } : null,
    nomeDia,
    sinais: {
      pascal: data >= m.pascoa && data <= m.pentecostes,
      penitencial: data >= m.cinzas && data < m.pascoa,
      semanaSanta: data >= m.ramos && data < m.pascoa,
      oitavaPascoa: data >= m.pascoa && data < somarDias(m.pascoa, 7),
      ascensaoAtePentecostes: data >= m.ascensao && data < m.pentecostes,
      diaPentecostes: igual(data, m.pentecostes),
      domingoTrindade: igual(data, m.trindade),
      diaNatal: igual(data, m.natal),
      diaEpifania: igual(data, m.epifania),
      diaPascoa: igual(data, m.pascoa),
      diaAscensao: igual(data, m.ascensao),
      diaCinzas: igual(data, m.cinzas),
      diaSantoNome: igual(data, m.santoNome),
    },
  };
}
