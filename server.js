// Servidor do site da IECB: páginas, painel administrativo, consulta à API Estêvão
// (a chave fica aqui, no servidor) e geração do folheto da Santa Eucaristia (Rito I ou Rito Menor).

import express from 'express';
import { fileURLToPath } from 'node:url';
import { registrarSite, paginaNaoEncontrada } from './src/site/rotas.js';
import { lerData, chaveData } from './src/calendario.js';
import { prepararDia, listaProprios } from './src/proprios.js';
import { montarRito1, OPCOES_PADRAO } from './src/rito1.js';
import { montarRitoMenor } from './src/ritoMenor.js';
import { gerarA5, imporLivreto } from './src/pdf.js';
import * as api from './src/estevao.js';

const app = express();
app.disable('x-powered-by');
if (process.env.ATRAS_DE_PROXY) app.set('trust proxy', 1);
app.use(express.json({ limit: '200kb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
registrarSite(app);
app.use(express.static(fileURLToPath(new URL('./public', import.meta.url)), { maxAge: '1h' }));

const RITOS = {
  I: { nome: 'Rito I', arquivo: 'rito-I', montar: montarRito1 },
  menor: { nome: 'Rito Menor', arquivo: 'rito-menor', montar: montarRitoMenor },
};

// No Rito Menor a bênção automática é a do próprio rito, e não há prefácio.
function prepararOpcoes(body) {
  const rito = RITOS[body?.rito] ? body.rito : 'I';
  const opcoes = { ...(body?.opcoes || {}) };
  if (rito === 'menor' && (!opcoes.bencao || opcoes.bencao === 'auto')) opcoes.bencao = 'padrao';
  return { rito, R: RITOS[rito], opcoes };
}

async function prepararDiaDoRito(data, rito, opcoes) {
  const dia = await prepararDia(data, opcoes);
  if (rito === 'menor') dia.prefacio = null;
  return dia;
}

function dataDaRequisicao(valor) {
  if (!valor) {
    const agora = new Date(Date.now() - 3 * 3600 * 1000); // horário de Brasília
    return lerData(agora.toISOString().slice(0, 10));
  }
  return lerData(valor);
}

app.get('/api/status', (req, res) => {
  res.json({ apiConfigurada: api.apiConfigurada(), livro: api.preferencias().prayer_book_code, opcoesPadrao: OPCOES_PADRAO });
});

app.get('/api/proprios', (req, res) => res.json(listaProprios()));

app.post('/api/dia', async (req, res) => {
  const data = dataDaRequisicao(req.body?.data);
  if (!data) return res.status(400).json({ erro: 'Data inválida (use AAAA-MM-DD).' });
  try {
    const { rito, R, opcoes } = prepararOpcoes(req.body);
    const dia = await prepararDiaDoRito(data, rito, opcoes);
    const { resumo } = R.montar(dia, opcoes);
    res.json({ ...dia, rito, nomeRito: R.nome, resumo });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: e.message });
  }
});

app.post('/api/folheto', async (req, res) => {
  const data = dataDaRequisicao(req.body?.data);
  if (!data) return res.status(400).json({ erro: 'Data inválida (use AAAA-MM-DD).' });
  const { rito, R, opcoes } = prepararOpcoes(req.body);
  const formato = req.body?.formato === 'a5' ? 'a5' : 'livreto';
  try {
    const dia = await prepararDiaDoRito(data, rito, opcoes);
    const { blocos, opcoes: o } = R.montar(dia, opcoes);
    const { buffer } = await gerarA5(dia, blocos, { ...o, nomeRito: R.nome, livreto: formato === 'livreto' });
    const pdf = formato === 'livreto' ? await imporLivreto(buffer) : buffer;
    const nome = `eucaristia-${R.arquivo}-${chaveData(data)}${formato === 'livreto' ? '-livreto' : ''}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);
    res.send(pdf);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: e.message });
  }
});

// Mostra o JSON bruto da API para conferência (útil ao configurar a chave).
app.get('/api/diagnostico', async (req, res) => {
  const data = dataDaRequisicao(req.query.data);
  const resultado = { data: chaveData(data), apiConfigurada: api.apiConfigurada(), preferencias: api.preferencias() };
  for (const [nome, fn] of [['calendario', () => api.diaLiturgico(data)], ['lecionario', () => api.lecionario(data)], ['livros', () => api.livrosDeOracao()]]) {
    try { resultado[nome] = await fn(); } catch (e) { resultado[nome] = { erro: e.message, status: e.status }; }
  }
  res.json(resultado);
});

app.use(paginaNaoEncontrada);

const PORTA = Number(process.env.PORT) || 3000;
app.listen(PORTA, () => {
  console.log(`\n  Site da IECB`);
  console.log(`  Abra no navegador: http://localhost:${PORTA}`);
  console.log(`  Painel administrativo: http://localhost:${PORTA}/admin${process.env.ADMIN_SENHA ? '' : '  (defina ADMIN_SENHA no .env)'}`);
  console.log(api.apiConfigurada()
    ? `  API Estêvão: chave configurada (livro ${api.preferencias().prayer_book_code})\n`
    : '  ATENÇÃO: chave da API Estêvão não configurada — edite o arquivo .env\n');
});
