// Conteúdo inicial do site. Tudo pode ser editado no painel (/admin).
// Trechos entre [colchetes] são dados da igreja que precisam ser preenchidos.

export const SEMENTES = {
  info: {
    nome: 'Igreja Episcopal Carismática do Brasil',
    sigla: 'IECB',
    slogan: 'Uma Igreja Histórica, Sacramental e Carismática',
    subtituloHero: 'Enraizada na fé dos Apóstolos, alimentada pelos Sacramentos e renovada pelo Espírito Santo.',
    imagemHero: '',
    visao: 'Ser uma Igreja que une as três correntes da fé cristã — a Palavra, os Sacramentos e o poder do Espírito Santo — para formar discípulos, servir ao próximo e anunciar o Evangelho em todo o Brasil.',
    sedeNome: 'Catedral da Reconciliação',
    endereco: '[Rua, número — Bairro]\n[Cidade / UF — CEP]',
    telefone: '[(00) 00000-0000]',
    email: '[contato@iecb.org.br]',
    instagram: '',
    facebook: '',
    youtube: '',
    cnpj: '[00.000.000/0000-00]',
    razaoSocial: 'Igreja Episcopal Carismática do Brasil',
    pix: '[chave PIX]',
    banco: '[Banco — Agência 0000 — Conta 00000-0]',
    mapaWidget: 'https://caminhoanglicano.com.br/widget/IECB',
  },

  historia: [
    { ano: '1977', titulo: 'O Chamado de Chicago', texto: 'Líderes evangélicos norte-americanos publicam o "Chicago Call", convocando as igrejas a redescobrirem a fé histórica, a liturgia e os sacramentos da Igreja antiga.' },
    { ano: 'Década de 1980', titulo: 'Nasce o Movimento de Convergência', texto: 'Cristãos evangélicos, carismáticos e litúrgicos passam a buscar a unidade das três grandes correntes da fé: a Escritura, os Sacramentos e a vida no Espírito Santo.' },
    { ano: '[Ano]', titulo: '[Fundação da IECB no Brasil]', texto: '[Conte aqui como a IECB começou no Brasil — edite no painel.]' },
    { ano: '[Ano]', titulo: '[Os primeiros bispos]', texto: '[Sagração dos primeiros bispos brasileiros e estabelecimento da sucessão apostólica.]' },
    { ano: '[Ano]', titulo: '[Expansão]', texto: '[Criação das dioceses, novas paróquias e missões pelo país.]' },
  ],

  crencas: [
    {
      titulo: 'O Credo Niceno',
      texto: 'Professamos a fé da Igreja indivisa, resumida no Credo Niceno:\n\nCreio em um só Deus, Pai Onipotente, Criador do céu e da terra, e de todas as coisas visíveis e invisíveis; e em um só Senhor Jesus Cristo, Filho Unigênito de Deus; gerado de seu Pai antes de todos os mundos, Deus de Deus, Luz de Luz, Verdadeiro Deus, de Verdadeiro Deus; gerado, não feito; consubstancial com o Pai; por quem todas as coisas foram feitas; o qual por nós homens e pela nossa salvação desceu do Céu, e encarnou, por obra do Espírito Santo, da Virgem Maria, e foi feito homem; foi também crucificado por nós, sob o poder de Pôncio Pilatos; padeceu e foi sepultado: e ao terceiro dia ressuscitou, segundo as Escrituras: e subiu ao Céu, e está sentado à direita do Pai: e virá outra vez, com glória, a julgar os vivos e os mortos; e o seu Reino não terá fim. E creio no Espírito Santo, Senhor, Doador da Vida, procedente do Pai e do Filho; o qual com o Pai e o Filho juntamente é adorado e glorificado; o qual falou pelos profetas: e creio na Igreja Una, Santa, Católica e Apostólica: reconheço um só Batismo para a remissão de pecados: e espero a ressurreição dos mortos: e a vida do mundo vindouro. Amém.',
    },
    {
      titulo: 'As Sagradas Escrituras',
      texto: 'Cremos que as Escrituras do Antigo e do Novo Testamento são a Palavra de Deus e contêm tudo o que é necessário para a salvação. Elas são lidas em cada celebração e ocupam o centro da pregação e da vida da Igreja.',
    },
    {
      titulo: 'Os Sacramentos',
      texto: 'Cremos que os Sacramentos são sinais visíveis de uma graça interior e espiritual. O Batismo e a Santa Eucaristia, instituídos por Cristo, estão no coração da vida cristã; celebramos também a Confirmação, a Reconciliação, o Matrimônio, as Ordens Sagradas e a Unção dos Enfermos.',
    },
    {
      titulo: 'A Sucessão Apostólica',
      texto: 'Mantemos o ministério histórico de bispos, presbíteros e diáconos, transmitido desde os Apóstolos pela imposição de mãos. Os bispos guardam a fé, a unidade e a ordem da Igreja.',
    },
    {
      titulo: 'A Ênfase Carismática e Evangélica',
      texto: 'Cremos que o Espírito Santo continua a distribuir seus dons à Igreja. Buscamos uma fé viva e pessoal em Jesus Cristo, o anúncio do Evangelho a todos e uma adoração cheia do Espírito, unida à liturgia histórica.',
    },
  ],

  lideranca: [
    { nome: 'Dom [Nome do Bispo Primaz]', cargo: 'Bispo Primaz', grupo: 'Bispo Primaz', bio: '[Breve apresentação do Bispo Primaz.]' },
    { nome: 'Dom [Nome]', cargo: 'Bispo Diocesano de [Diocese]', grupo: 'Conselho de Bispos', bio: '' },
    { nome: 'Dom [Nome]', cargo: 'Bispo Diocesano de [Diocese]', grupo: 'Conselho de Bispos', bio: '' },
  ],

  dioceses: [
    { nome: 'Diocese Primacial', regiao: '[Região / Estado]', bispo: 'Dom [Nome do Bispo]', catedral: 'Catedral da Reconciliação', catedralEndereco: '[Endereço da Catedral]', contato: '' },
  ],

  paroquias: [],

  documentos: [
    { titulo: 'Livro de Oração Comum (LOC)', categoria: 'Liturgia', descricao: 'Ofícios Diários, Santa Eucaristia, Coletas do Ano Cristão e Saltério.', icone: 'livro' },
    { titulo: 'Cânones da IECB', categoria: 'Cânones', descricao: 'Constituição e Cânones que regem a vida da Igreja.', icone: 'pdf' },
    { titulo: 'Apostila sobre a IECB', categoria: 'Formação', descricao: 'Material do curso de Confirmação e integração de novos membros.', icone: 'pdf' },
  ],

  galeria: [],
  noticias: [],
  eventos: [],

  faq: [
    {
      pergunta: 'O que é a convergência?',
      resposta: 'O Movimento de Convergência reúne três correntes que, ao longo da história, muitas vezes se separaram: a evangélica (a centralidade das Escrituras e da conversão pessoal a Cristo), a sacramental e litúrgica (a fé histórica, os Sacramentos e a sucessão apostólica) e a carismática (a vida e os dons do Espírito Santo). Na IECB, essas três correntes fluem juntas em uma só Igreja.',
    },
    {
      pergunta: 'Qual a diferença entre a IECB e outras igrejas episcopais?',
      resposta: 'Compartilhamos com as igrejas episcopais a liturgia histórica, o Livro de Oração Comum e o ministério de bispos, presbíteros e diáconos. O que marca a IECB é a união dessa herança com uma espiritualidade carismática e evangélica: abertura aos dons do Espírito Santo e ênfase no anúncio do Evangelho. [Complete com a posição oficial da IECB.]',
    },
    {
      pergunta: 'Como me tornar um clérigo na IECB?',
      resposta: 'O caminho começa com uma conversa com o clérigo da sua paróquia. Em seguida, há um período de discernimento vocacional acompanhado pelo bispo diocesano, formação teológica e pastoral e, por fim, a ordenação. [Descreva aqui as etapas e requisitos definidos pelos Cânones.]',
    },
    {
      pergunta: 'Como posso agendar um batismo?',
      resposta: 'Procure a paróquia mais próxima pela página Dioceses & Paróquias ou fale conosco pelo formulário de contato. O clérigo responsável vai orientar a preparação batismal para você ou para sua família.',
    },
    {
      pergunta: 'Posso participar das celebrações sem ser membro?',
      resposta: 'Sim! Todos são bem-vindos em nossas celebrações. Encontre a comunidade mais próxima e venha nos visitar.',
    },
  ],

  mensagens: [],
  newsletter: [],
};
