// Armazenamento simples em arquivos JSON (data/site/*.json).
// Cada coleção é uma lista de itens { id, ... }; "info" é um objeto único.

import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEMENTES } from './sementes.js';

const PASTA = fileURLToPath(new URL('../../data/site/', import.meta.url));
mkdirSync(PASTA, { recursive: true });

const caminho = (nome) => join(PASTA, `${nome}.json`);

export function ler(nome) {
  const arq = caminho(nome);
  if (!existsSync(arq)) {
    const semente = SEMENTES[nome] ?? [];
    const inicial = Array.isArray(semente) ? semente.map((i) => ({ id: randomUUID(), ...i })) : semente;
    gravar(nome, inicial);
    return inicial;
  }
  try {
    return JSON.parse(readFileSync(arq, 'utf8'));
  } catch {
    return Array.isArray(SEMENTES[nome]) ? [] : {};
  }
}

export function gravar(nome, dados) {
  const arq = caminho(nome);
  const tmp = `${arq}.tmp`;
  writeFileSync(tmp, JSON.stringify(dados, null, 2), 'utf8');
  renameSync(tmp, arq);
}

export function adicionar(nome, item) {
  const lista = ler(nome);
  const novo = { id: randomUUID(), ...item };
  lista.push(novo);
  gravar(nome, lista);
  return novo;
}

export function atualizar(nome, id, dados) {
  const lista = ler(nome);
  const i = lista.findIndex((x) => x.id === id);
  if (i < 0) return null;
  lista[i] = { ...lista[i], ...dados, id };
  gravar(nome, lista);
  return lista[i];
}

export function remover(nome, id) {
  const lista = ler(nome);
  const item = lista.find((x) => x.id === id);
  gravar(nome, lista.filter((x) => x.id !== id));
  return item || null;
}

export function mover(nome, id, direcao) {
  const lista = ler(nome);
  const i = lista.findIndex((x) => x.id === id);
  const j = i + (direcao === 'cima' ? -1 : 1);
  if (i < 0 || j < 0 || j >= lista.length) return false;
  [lista[i], lista[j]] = [lista[j], lista[i]];
  gravar(nome, lista);
  return true;
}
