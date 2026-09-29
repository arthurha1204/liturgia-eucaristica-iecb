// Descrição das coleções editáveis no painel (/admin).
// O painel monta os formulários automaticamente a partir destes campos.

export const ESQUEMAS = {
  info: {
    titulo: 'Informações gerais',
    unico: true,
    ajuda: 'Dados que aparecem no cabeçalho, rodapé, página inicial e contato.',
    campos: [
      { nome: 'nome', rotulo: 'Nome da igreja', tipo: 'texto' },
      { nome: 'sigla', rotulo: 'Sigla', tipo: 'texto' },
      { nome: 'slogan', rotulo: 'Frase de boas-vindas (Início)', tipo: 'texto' },
      { nome: 'subtituloHero', rotulo: 'Texto abaixo da frase (Início)', tipo: 'area' },
      { nome: 'imagemHero', rotulo: 'Foto de destaque do Início (larga, alta qualidade)', tipo: 'imagem' },
      { nome: 'visao', rotulo: 'Nossa Visão (texto curto)', tipo: 'area' },
      { nome: 'sedeNome', rotulo: 'Nome da sede (Catedral Primacial / sede administrativa)', tipo: 'texto' },
      { nome: 'endereco', rotulo: 'Endereço', tipo: 'area' },
      { nome: 'telefone', rotulo: 'Telefone / WhatsApp', tipo: 'tel' },
      { nome: 'email', rotulo: 'E-mail', tipo: 'email' },
      { nome: 'instagram', rotulo: 'Instagram (link)', tipo: 'url' },
      { nome: 'facebook', rotulo: 'Facebook (link)', tipo: 'url' },
      { nome: 'youtube', rotulo: 'YouTube (link)', tipo: 'url' },
      { nome: 'cnpj', rotulo: 'CNPJ', tipo: 'texto' },
      { nome: 'razaoSocial', rotulo: 'Razão social', tipo: 'texto' },
      { nome: 'pix', rotulo: 'Chave PIX', tipo: 'texto' },
      { nome: 'banco', rotulo: 'Dados bancários (banco, agência, conta)', tipo: 'area' },
      { nome: 'mapaWidget', rotulo: 'Endereço do mapa (widget)', tipo: 'url' },
    ],
  },
  noticias: {
    titulo: 'Notícias',
    rotuloItem: 'titulo',
    campos: [
      { nome: 'titulo', rotulo: 'Título', tipo: 'texto', obrigatorio: true },
      { nome: 'data', rotulo: 'Data', tipo: 'data' },
      { nome: 'imagem', rotulo: 'Imagem', tipo: 'imagem' },
      { nome: 'resumo', rotulo: 'Resumo', tipo: 'area' },
      { nome: 'texto', rotulo: 'Texto completo', tipo: 'area', grande: true },
    ],
  },
  eventos: {
    titulo: 'Eventos (agenda)',
    rotuloItem: 'titulo',
    campos: [
      { nome: 'titulo', rotulo: 'Evento', tipo: 'texto', obrigatorio: true },
      { nome: 'data', rotulo: 'Data', tipo: 'data' },
      { nome: 'horario', rotulo: 'Horário', tipo: 'texto' },
      { nome: 'local', rotulo: 'Local', tipo: 'texto' },
      { nome: 'descricao', rotulo: 'Descrição', tipo: 'area' },
    ],
  },
  galeria: {
    titulo: 'Galeria de fotos',
    rotuloItem: 'legenda',
    lote: true,
    ajuda: 'Use "Enviar várias fotos" para subir as fotos de um evento de uma só vez.',
    campos: [
      { nome: 'imagem', rotulo: 'Foto', tipo: 'imagem', obrigatorio: true },
      { nome: 'evento', rotulo: 'Evento', tipo: 'texto' },
      { nome: 'categoria', rotulo: 'Categoria', tipo: 'select', opcoes: ['Celebrações', 'Sínodos', 'Ordenações', 'Retiros', 'Comunidade'] },
      { nome: 'data', rotulo: 'Data', tipo: 'data' },
      { nome: 'legenda', rotulo: 'Legenda', tipo: 'texto' },
    ],
  },
  documentos: {
    titulo: 'Documentos & Materiais',
    rotuloItem: 'titulo',
    campos: [
      { nome: 'titulo', rotulo: 'Título', tipo: 'texto', obrigatorio: true },
      { nome: 'categoria', rotulo: 'Categoria', tipo: 'select', opcoes: ['Liturgia', 'Cânones', 'Formação', 'Lecionário', 'Outros'] },
      { nome: 'descricao', rotulo: 'Descrição', tipo: 'area' },
      { nome: 'arquivo', rotulo: 'Arquivo (PDF, DOCX…)', tipo: 'arquivo' },
      { nome: 'link', rotulo: 'Ou link externo', tipo: 'url' },
      { nome: 'icone', rotulo: 'Ícone', tipo: 'select', opcoes: ['pdf', 'livro', 'documento'] },
    ],
  },
  dioceses: {
    titulo: 'Dioceses',
    rotuloItem: 'nome',
    campos: [
      { nome: 'nome', rotulo: 'Nome da diocese', tipo: 'texto', obrigatorio: true },
      { nome: 'regiao', rotulo: 'Região / Estados', tipo: 'texto' },
      { nome: 'bispo', rotulo: 'Bispo Diocesano', tipo: 'texto' },
      { nome: 'catedral', rotulo: 'Catedral', tipo: 'texto' },
      { nome: 'catedralEndereco', rotulo: 'Endereço da Catedral', tipo: 'area' },
      { nome: 'contato', rotulo: 'Contato da diocese', tipo: 'texto' },
    ],
  },
  paroquias: {
    titulo: 'Paróquias e Missões',
    rotuloItem: 'nome',
    campos: [
      { nome: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true },
      { nome: 'tipo', rotulo: 'Tipo', tipo: 'select', opcoes: ['Paróquia', 'Missão', 'Catedral', 'Capela'] },
      { nome: 'diocese', rotulo: 'Diocese', tipo: 'ref', colecao: 'dioceses', campoRotulo: 'nome' },
      { nome: 'clerigo', rotulo: 'Clérigo responsável', tipo: 'texto' },
      { nome: 'endereco', rotulo: 'Endereço', tipo: 'area' },
      { nome: 'cidade', rotulo: 'Cidade / UF', tipo: 'texto' },
      { nome: 'horarios', rotulo: 'Horários das celebrações', tipo: 'area' },
      { nome: 'telefone', rotulo: 'Telefone / WhatsApp', tipo: 'tel' },
      { nome: 'instagram', rotulo: 'Instagram (link)', tipo: 'url' },
      { nome: 'site', rotulo: 'Site ou outra rede (link)', tipo: 'url' },
    ],
  },
  historia: {
    titulo: 'Linha do tempo (História)',
    rotuloItem: 'titulo',
    campos: [
      { nome: 'ano', rotulo: 'Ano', tipo: 'texto', obrigatorio: true },
      { nome: 'titulo', rotulo: 'Título', tipo: 'texto', obrigatorio: true },
      { nome: 'texto', rotulo: 'Texto', tipo: 'area' },
      { nome: 'imagem', rotulo: 'Imagem (opcional)', tipo: 'imagem' },
    ],
  },
  crencas: {
    titulo: 'No que Cremos',
    rotuloItem: 'titulo',
    campos: [
      { nome: 'titulo', rotulo: 'Título', tipo: 'texto', obrigatorio: true },
      { nome: 'texto', rotulo: 'Texto', tipo: 'area', grande: true },
    ],
  },
  lideranca: {
    titulo: 'Clero & Liderança',
    rotuloItem: 'nome',
    campos: [
      { nome: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true },
      { nome: 'cargo', rotulo: 'Cargo', tipo: 'texto' },
      { nome: 'grupo', rotulo: 'Grupo', tipo: 'select', opcoes: ['Bispo Primaz', 'Conselho de Bispos', 'Clero', 'Administração'] },
      { nome: 'foto', rotulo: 'Foto', tipo: 'imagem' },
      { nome: 'bio', rotulo: 'Apresentação', tipo: 'area' },
    ],
  },
  faq: {
    titulo: 'Perguntas Frequentes',
    rotuloItem: 'pergunta',
    campos: [
      { nome: 'pergunta', rotulo: 'Pergunta', tipo: 'texto', obrigatorio: true },
      { nome: 'resposta', rotulo: 'Resposta', tipo: 'area', grande: true },
    ],
  },
  mensagens: {
    titulo: 'Mensagens recebidas',
    rotuloItem: 'assunto',
    somenteLeitura: true,
    campos: [
      { nome: 'recebidaEm', rotulo: 'Recebida em', tipo: 'texto' },
      { nome: 'nome', rotulo: 'Nome', tipo: 'texto' },
      { nome: 'email', rotulo: 'E-mail', tipo: 'email' },
      { nome: 'telefone', rotulo: 'Telefone', tipo: 'tel' },
      { nome: 'assunto', rotulo: 'Assunto', tipo: 'texto' },
      { nome: 'mensagem', rotulo: 'Mensagem', tipo: 'area' },
    ],
  },
  newsletter: {
    titulo: 'Inscritos na Newsletter',
    rotuloItem: 'email',
    somenteLeitura: true,
    campos: [
      { nome: 'email', rotulo: 'E-mail', tipo: 'email' },
      { nome: 'inscritoEm', rotulo: 'Inscrito em', tipo: 'texto' },
    ],
  },
};

/** Mantém só os campos conhecidos do esquema, como texto. */
export function limparItem(nome, dados) {
  const esquema = ESQUEMAS[nome];
  const out = {};
  for (const c of esquema.campos) {
    const v = dados?.[c.nome];
    if (v === undefined || v === null) continue;
    out[c.nome] = String(v).slice(0, c.tipo === 'area' ? 20000 : 1000).trim();
  }
  return out;
}
