// Rotas do site: páginas públicas, formulários e o painel administrativo (/admin).

import express from 'express';
import multer from 'multer';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { unlink } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as paginas from './paginas.js';
import * as armazem from './armazem.js';
import { ESQUEMAS, limparItem } from './esquemas.js';

const PUBLICO = fileURLToPath(new URL('../../public/', import.meta.url));
const SESSAO_HORAS = 12;
const SEGREDO = randomBytes(32); // sessões valem até o servidor reiniciar

// ------------------------------------------------------------- utilitários

function limitador(max, janelaMs) {
  const contagem = new Map();
  return (req, res, next) => {
    const agora = Date.now();
    const ip = req.ip;
    const reg = contagem.get(ip) || { n: 0, desde: agora };
    if (agora - reg.desde > janelaMs) { reg.n = 0; reg.desde = agora; }
    reg.n++;
    contagem.set(ip, reg);
    if (reg.n > max) return res.status(429).json({ erro: 'Muitas tentativas. Aguarde alguns minutos.' });
    next();
  };
}

const senhaAdmin = () => (process.env.ADMIN_SENHA || '').trim();

function assinar(valor) {
  return createHmac('sha256', SEGREDO).update(valor).digest('hex');
}

function lerCookie(req, nome) {
  const m = new RegExp(`(?:^|;\\s*)${nome}=([^;]+)`).exec(req.headers.cookie || '');
  return m ? decodeURIComponent(m[1]) : null;
}

function logado(req) {
  const token = lerCookie(req, 'iecb_admin');
  if (!token) return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig || Date.now() > Number(exp)) return false;
  const esperado = Buffer.from(assinar(exp));
  const recebido = Buffer.from(sig);
  return esperado.length === recebido.length && timingSafeEqual(esperado, recebido);
}

function exigirLogin(req, res, next) {
  if (!senhaAdmin()) return res.status(503).json({ erro: 'Painel desativado: defina ADMIN_SENHA no arquivo .env.' });
  if (!logado(req)) return res.status(401).json({ erro: 'Faça login novamente.' });
  next();
}

const EXT_IMAGEM = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const EXT_DOC = ['.pdf', '.doc', '.docx', '.odt', '.ppt', '.pptx', '.epub', '.zip', '.xls', '.xlsx'];

function envio(tipo) {
  const imagem = tipo === 'imagem';
  return multer({
    storage: multer.diskStorage({
      destination: join(PUBLICO, 'uploads', imagem ? 'imagens' : 'documentos'),
      filename: (req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        const base = file.originalname.slice(0, -ext.length || undefined)
          .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40).toLowerCase();
        cb(null, `${base || 'arquivo'}-${randomBytes(4).toString('hex')}${ext}`);
      },
    }),
    limits: { fileSize: (imagem ? 15 : 80) * 1024 * 1024, files: imagem ? 60 : 1 },
    fileFilter: (req, file, cb) => {
      const ok = (imagem ? EXT_IMAGEM : [...EXT_DOC, ...EXT_IMAGEM]).includes(extname(file.originalname).toLowerCase());
      cb(ok ? null : new Error(imagem ? 'Envie imagens JPG, PNG, WEBP ou GIF.' : 'Tipo de arquivo não permitido.'), ok);
    },
  });
}

const urlArquivo = (file) => `/uploads/${file.destination.endsWith('imagens') ? 'imagens' : 'documentos'}/${file.filename}`;

/** Apaga do disco os arquivos enviados que o item referencia. */
function apagarArquivos(item) {
  for (const v of Object.values(item || {})) {
    if (typeof v === 'string' && /^\/uploads\/(imagens|documentos)\/[\w.-]+$/.test(v)) {
      unlink(join(PUBLICO, v.slice(1)), () => {});
    }
  }
}

// -------------------------------------------------------------- registro

export function registrarSite(app) {
  const html = (fn) => (req, res) => {
    const saida = fn(req);
    if (!saida) return res.status(404).type('html').send(paginas.naoEncontrada());
    res.type('html').send(saida);
  };

  app.get('/', html(paginas.inicio));
  app.get('/quem-somos', html(paginas.quemSomos));
  app.get('/dioceses', html(paginas.dioceses));
  app.get('/materiais', html(paginas.materiais));
  app.get('/materiais/liturgia', html(paginas.liturgia));
  app.get('/liturgia', (req, res) => res.redirect(301, '/materiais/liturgia'));
  app.get('/midia', html(paginas.midia));
  app.get('/noticias/:id', html((req) => paginas.noticia(req.params.id)));
  app.get('/faq', html(paginas.faq));
  app.get('/contato', html(paginas.contato));

  // ---- formulários públicos
  const limiteForm = limitador(8, 10 * 60 * 1000);
  const emailValido = (e) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(String(e || '').trim());

  app.post('/api/contato', limiteForm, (req, res) => {
    const b = req.body || {};
    if (b.site) return res.json({ mensagem: 'Mensagem enviada. Obrigado!' }); // robô
    if (!String(b.nome || '').trim() || !emailValido(b.email) || !String(b.mensagem || '').trim()) {
      return res.status(400).json({ erro: 'Preencha nome, e-mail válido e mensagem.' });
    }
    armazem.adicionar('mensagens', { ...limparItem('mensagens', b), recebidaEm: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) });
    res.json({ mensagem: 'Mensagem enviada. Obrigado! Responderemos em breve.' });
  });

  app.post('/api/newsletter', limiteForm, (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (req.body?.site) return res.json({ mensagem: 'Inscrição confirmada!' });
    if (!emailValido(email)) return res.status(400).json({ erro: 'Informe um e-mail válido.' });
    if (!armazem.ler('newsletter').some((n) => n.email === email)) {
      armazem.adicionar('newsletter', { email, inscritoEm: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) });
    }
    res.json({ mensagem: 'Inscrição confirmada! Obrigado.' });
  });

  // ---- painel administrativo
  app.get('/admin', (req, res) => res.sendFile(join(PUBLICO, 'admin', 'index.html')));

  app.get('/api/admin/sessao', (req, res) => res.json({ configurado: Boolean(senhaAdmin()), logado: Boolean(senhaAdmin()) && logado(req) }));

  app.post('/api/admin/entrar', limitador(10, 15 * 60 * 1000), (req, res) => {
    const senha = senhaAdmin();
    if (!senha) return res.status(503).json({ erro: 'Defina ADMIN_SENHA no arquivo .env e reinicie o servidor.' });
    const a = Buffer.from(assinar(String(req.body?.senha || '')));
    const b = Buffer.from(assinar(senha));
    if (!timingSafeEqual(a, b)) return res.status(401).json({ erro: 'Senha incorreta.' });
    const exp = String(Date.now() + SESSAO_HORAS * 3600 * 1000);
    const seguro = req.secure ? '; Secure' : '';
    res.setHeader('Set-Cookie', `iecb_admin=${exp}.${assinar(exp)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSAO_HORAS * 3600}${seguro}`);
    res.json({ ok: true });
  });

  app.post('/api/admin/sair', (req, res) => {
    res.setHeader('Set-Cookie', 'iecb_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
    res.json({ ok: true });
  });

  const admin = express.Router();
  admin.use(exigirLogin);

  admin.get('/esquemas', (req, res) => res.json(ESQUEMAS));

  admin.post('/upload', (req, res) => {
    const tipo = req.query.tipo === 'imagem' ? 'imagem' : 'arquivo';
    envio(tipo).single('arquivo')(req, res, (err) => {
      if (err) return res.status(400).json({ erro: err.code === 'LIMIT_FILE_SIZE' ? 'Arquivo grande demais.' : err.message });
      if (!req.file) return res.status(400).json({ erro: 'Nenhum arquivo enviado.' });
      res.json({ url: urlArquivo(req.file) });
    });
  });

  admin.post('/galeria/lote', (req, res) => {
    envio('imagem').array('fotos', 60)(req, res, (err) => {
      if (err) return res.status(400).json({ erro: err.code === 'LIMIT_FILE_SIZE' ? 'Alguma foto passou de 15 MB.' : err.message });
      const extra = limparItem('galeria', req.body);
      const novos = (req.files || []).map((f) => armazem.adicionar('galeria', { ...extra, imagem: urlArquivo(f) }));
      res.json({ total: novos.length });
    });
  });

  const colecaoValida = (req, res, next) => {
    const esquema = ESQUEMAS[req.params.colecao];
    if (!esquema) return res.status(404).json({ erro: 'Coleção desconhecida.' });
    req.esquema = esquema;
    next();
  };
  const editavel = (req, res, next) => (req.esquema.somenteLeitura ? res.status(403).json({ erro: 'Somente leitura.' }) : next());

  admin.get('/dados/:colecao', colecaoValida, (req, res) => res.json(armazem.ler(req.params.colecao)));

  admin.put('/dados/info', (req, res) => {
    const atual = armazem.ler('info');
    const novo = { ...atual, ...limparItem('info', req.body) };
    armazem.gravar('info', novo);
    res.json(novo);
  });

  admin.post('/dados/:colecao', colecaoValida, editavel, (req, res) => {
    if (req.esquema.unico) return res.status(400).json({ erro: 'Use PUT.' });
    res.json(armazem.adicionar(req.params.colecao, limparItem(req.params.colecao, req.body)));
  });

  admin.put('/dados/:colecao/:id', colecaoValida, editavel, (req, res) => {
    const antes = armazem.ler(req.params.colecao).find((x) => x.id === req.params.id);
    const item = armazem.atualizar(req.params.colecao, req.params.id, limparItem(req.params.colecao, req.body));
    if (!item) return res.status(404).json({ erro: 'Item não encontrado.' });
    // apaga arquivos substituídos
    if (antes) apagarArquivos(Object.fromEntries(Object.entries(antes).filter(([k, v]) => item[k] !== v)));
    res.json(item);
  });

  admin.delete('/dados/:colecao/:id', colecaoValida, (req, res) => {
    const item = armazem.remover(req.params.colecao, req.params.id);
    if (!item) return res.status(404).json({ erro: 'Item não encontrado.' });
    apagarArquivos(item);
    res.json({ ok: true });
  });

  admin.post('/dados/:colecao/:id/mover', colecaoValida, editavel, (req, res) => {
    armazem.mover(req.params.colecao, req.params.id, req.body?.direcao === 'cima' ? 'cima' : 'baixo');
    res.json({ ok: true });
  });

  app.use('/api/admin', admin);
}

export function paginaNaoEncontrada(req, res) {
  if (req.path.startsWith('/api/')) return res.status(404).json({ erro: 'Rota não encontrada.' });
  res.status(404).type('html').send(paginas.naoEncontrada());
}
