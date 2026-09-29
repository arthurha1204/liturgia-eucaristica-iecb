// Santa Eucaristia — Rito I (Livro de Oração Comum, IEAB 1987, pp. 53-68),
// montada como uma lista de blocos com os próprios do dia já inseridos.

export const OPCOES_PADRAO = {
  comunidade: '',
  abertura: true,              // "Vinde, celebremos..."
  penitencial: 'inicio',       // inicio | intercessoes | omitir
  lei: 'auto',                 // auto | decalogo | sumario  (auto: Decálogo na Quaresma)
  conviteConfissao: 1,         // 1 | 2
  saudacao: 'espirito',        // espirito | senhor_aqui
  credo: 'auto',               // auto | niceno | apostolico | nenhum
  paz: 'intercessoes',         // intercessoes | fracao
  fracao: 'agnus',             // agnus | humilde | ambos
  posComunhao: 1,              // 1 | 2
  gloria: 'auto',              // auto | sim | nao
  rubricas: 'essenciais',      // essenciais | completas | nenhuma
  textosLeituras: true,
  fonteColeta: 'loc1987',      // loc1987 | api
  indiceColeta: 0,
  prefacio: 'auto',
  prefacioDiaDoSenhor: 2,
  bencao: 'auto',
  proprio: '',
};

const GENERO_EVANGELHO = { Mateus: 'São Mateus', Marcos: 'São Marcos', Lucas: 'São Lucas', João: 'São João' };

export function montarRito1(dia, opcoesUsuario = {}) {
  const o = { ...OPCOES_PADRAO, ...opcoesUsuario };
  const B = [];
  const secao = (texto) => B.push({ t: 'secao', texto });
  const titulo = (texto) => B.push({ t: 'titulo', texto });
  const rubrica = (texto, nivel = 1) => {
    if (o.rubricas === 'nenhuma') return;
    if (nivel === 2 && o.rubricas !== 'completas') return;
    B.push({ t: 'rubrica', texto });
  };
  const fala = (quem, texto, povo = false) => B.push({ t: 'fala', quem, texto, povo });
  const texto = (t, extra = {}) => B.push({ t: 'texto', texto: t, ...extra });
  const versos = (linhas, extra = {}) => B.push({ t: 'versos', linhas, ...extra });

  const s = dia.sinais || {};
  const penitencialNoInicio = o.penitencial === 'inicio';
  const lei = o.lei === 'auto' ? (dia.tempo === 'quaresma' ? 'decalogo' : 'sumario') : o.lei;
  const credo = o.credo === 'auto' ? (dia.ehDomingo || dia.festa ? 'niceno' : 'nenhum') : o.credo;
  const gloria = o.gloria === 'auto'
    ? (dia.ehDomingo || dia.festa) && !['advento', 'quaresma', 'semana_santa'].includes(dia.tempo)
    : o.gloria === 'sim';
  const saudacao = (quem) => {
    if (o.saudacao === 'senhor_aqui') {
      fala(quem, 'O Senhor está aqui.');
      fala('Povo', 'O seu Espírito está conosco.', true);
    } else {
      fala(quem, 'O Espírito do Senhor seja convosco.');
      fala('Povo', 'Seja também contigo.', true);
    }
  };

  // ---------------------------------------------------------------- PREPARAÇÃO
  rubrica('Poder-se-á tocar um Prelúdio.', 2);
  secao('Preparação');
  rubrica('Todos de pé.');
  if (o.abertura) {
    texto('Vinde, celebremos, com louvor e ação de graças, o Sacramento da Nova e Eterna Aliança que recorda a última Ceia, anuncia a Morte e a Vitória do Senhor, e a sua presença viva nos santos mistérios do seu Corpo e Sangue, e no meio do seu povo, a quem o mesmo Senhor proclama: Eu sou o pão vivo que desce do céu; se alguém comer deste pão, viverá eternamente.', { quem: 'Oficiante' });
  }
  rubrica('Poder-se-á cantar ou recitar um Salmo ou Hino.', 2);
  fala('Oficiante', 'Bendito seja Deus Pai, Filho e Espírito Santo.');
  fala('Povo', 'Bendito seja o seu Reino, agora e sempre.', true);
  if (s.pascal) {
    fala('Oficiante', 'Aleluia! Cristo ressuscitou.');
    fala('Povo', 'Verdadeiramente o Senhor ressuscitou. Aleluia!', true);
  }
  if (s.penitencial) {
    fala('Oficiante', 'Bendito seja o Senhor que perdoa todos os nossos pecados.');
    fala('Povo', 'Sua misericórdia dura para sempre.', true);
  }

  titulo('Coleta pela Pureza');
  fala('Todos', 'Onipotente Deus, que vês todos os corações, conheces todos os desejos e para quem segredo algum está oculto; purifica nossos corações e pensamentos com a inspiração do teu Espírito Santo, para que te amemos com perfeição e dignamente glorifiquemos o teu Santo Nome; por Jesus Cristo, nosso Senhor. Amém.', true);

  // --------------------------------------------------------- ORDEM PENITENCIAL
  const ordemPenitencial = () => {
    secao('Ordem Penitencial');
    if (lei === 'decalogo') {
      titulo('Decálogo');
      const resp = 'Senhor, tem piedade de nós, e inclina os nossos corações a guardar esta lei.';
      const mandamentos = [
        'Deus falou estas palavras e disse: Eu sou o Senhor teu Deus; não terás outros deuses diante de mim.',
        'Não farás para ti imagem de escultura, nem figura alguma do que há em cima nos céus, nem abaixo na terra, nem nas águas debaixo da terra; não as adorarás nem lhes darás culto.',
        'Não tomarás o Nome do Senhor teu Deus em vão.',
        'Lembra-te de santificar o dia do Descanso.',
        'Honrarás a teu pai e tua mãe.',
        'Não matarás.',
        'Não adulterarás.',
        'Não furtarás.',
        'Não dirás falso testemunho contra o teu próximo.',
      ];
      for (const m of mandamentos) {
        fala('Oficiante', m);
        fala('Povo', resp, true);
      }
      fala('Oficiante', 'Não cobiçarás.');
      fala('Povo', 'Senhor, tem piedade de nós, e grava todos os teus mandamentos em nossos corações, nós te suplicamos.', true);
    } else if (lei === 'sumario') {
      titulo('Sumário da Lei');
      fala('Oficiante', 'Escutai o que diz nosso Senhor Jesus Cristo: Amarás o Senhor teu Deus de todo o teu coração, de toda a tua alma, e de todo o teu entendimento. Este é o primeiro e grande mandamento. E o segundo, semelhante a este, é: Amarás o teu próximo como a ti mesmo. Destes dois mandamentos dependem toda a Lei e os Profetas.');
    }
    titulo('Kyrie');
    fala('Oficiante', 'Senhor, tem piedade de nós.');
    fala('Povo', 'Cristo, tem piedade de nós.', true);
    fala('Oficiante', 'Senhor, tem piedade de nós.');

    titulo('Confissão');
    if (+o.conviteConfissao === 2) {
      fala('Oficiante', 'Vós, que verdadeira e sinceramente vos arrependeis de vossos pecados, estais em caridade com o vosso próximo, e resolvidos a levar vida nova, andando pelos caminhos do Senhor; aproximai-vos com fé, fazei vossa confissão a Deus Todo-poderoso e, confiantes no seu perdão, tomai este Santo Sacramento.');
    } else {
      fala('Oficiante', 'Confessemos humildemente os nossos pecados a Deus Todo-poderoso.');
    }
    rubrica('Todos se ajoelham. Silêncio.');
    fala('Todos', 'Onipotente Deus, nosso Pai, reconhecemos e confessamos nossos muitos pecados, que temos cometido por pensamentos, palavras, obras e omissões, contra Ti, contra nosso próximo e contra nós mesmos. Concede-nos verdadeiro arrependimento, e, por amor de teu Filho, nosso Senhor Jesus Cristo, perdoa-nos todo o passado, e dá-nos a graça de te servir com alegria, para a honra e glória do teu Nome. Amém.', true);
    rubrica('O Presbítero, ou o Bispo quando presente, dirá:');
    fala('Celebrante', 'Deus Onipotente, nosso Pai Celestial, que, por sua grande misericórdia, promete o perdão a todos quantos, com sincero arrependimento e viva fé, a Ele se convertem, vos perdoe e liberte de todos os vossos pecados, vos confirme e fortaleça em todo o bem, e vos preserve no caminho da vida eterna; mediante Jesus Cristo, nosso Senhor.');
    fala('Povo', 'Amém.', true);
  };
  if (penitencialNoInicio) ordemPenitencial();

  // ------------------------------------------------------- LITURGIA DA PALAVRA
  secao('Liturgia da Palavra');
  titulo('Coleta do Dia');
  saudacao('Oficiante');
  if (dia.coleta?.texto) {
    texto(dia.coleta.texto.replace(/\s*Amém\.?$/, ''), { quem: 'Oficiante' });
  } else {
    rubrica('O Oficiante dirá a coleta do Dia e / ou da Quadra.');
  }
  fala('Povo', 'Amém.', true);

  const L = dia.leituras || {};
  const anuncioLeitura = (r) =>
    `A palavra de Deus, escrita no Livro de ${r.livro}, capítulo ${r.capitulo}, começando com o versículo ${r.versiculo}.`;
  const blocoLeitura = (nome, r) => {
    titulo(nome);
    if (!r) {
      rubrica('Leitura própria do dia.');
      texto('A palavra de Deus, escrita no Livro de __________, capítulo ______, começando com o versículo ______.', { quem: 'Leitor' });
    } else {
      B.push({ t: 'referencia', texto: r.referencia, alternativa: r.alternativa, traducao: r.traducao });
      texto(anuncioLeitura(r), { quem: 'Leitor' });
      if (o.textosLeituras && r.texto) texto(r.texto, { leitura: true });
    }
    fala('Leitor', 'Palavra do Senhor.');
    fala('Povo', 'Demos graças a Deus.', true);
  };

  rubrica('Todos sentados.');
  blocoLeitura('Primeira Leitura', L.primeira);
  if (L.salmo) {
    titulo('Salmo');
    B.push({ t: 'referencia', texto: L.salmo.referencia, alternativa: L.salmo.alternativa, traducao: L.salmo.traducao });
    if (o.textosLeituras && L.salmo.versos?.length) {
      rubrica('Dito alternadamente: o leitor e o povo (em negrito).');
      B.push({ t: 'salmo', versos: L.salmo.versos });
      versos([
        'Glória ao Pai e ao Filho, e ao Espírito Santo;',
        'Como era no princípio, é agora e será sempre, por todos os séculos. Amém.',
      ], { quem: 'Todos', povo: true });
    } else {
      rubrica('Salmo dito ou cantado, ao fim do qual se diz o Gloria Patri.', 2);
    }
  }
  if (L.segunda || !L.primeira) blocoLeitura('Epístola', L.segunda);

  titulo('Santo Evangelho');
  rubrica('Todos de pé.');
  const ev = L.evangelho;
  if (ev) {
    B.push({ t: 'referencia', texto: ev.referencia, alternativa: ev.alternativa, traducao: ev.traducao });
    fala('Diácono', `O Santo Evangelho de nosso Senhor Jesus Cristo, conforme ${GENERO_EVANGELHO[ev.livro] || ev.livro}, no capítulo ${ev.capitulo}, começando com o versículo ${ev.versiculo}.`);
  } else {
    fala('Diácono', 'O Santo Evangelho de nosso Senhor Jesus Cristo, conforme __________, no capítulo ______, começando com o versículo ______.');
  }
  fala('Povo', 'Glória Te seja dada, ó Senhor.', true);
  if (ev && o.textosLeituras && ev.texto) texto(ev.texto, { leitura: true });
  fala('Leitor', 'O Evangelho do Senhor.');
  fala('Povo', 'Louvado sejas, ó Cristo.', true);
  rubrica('Poder-se-á cantar um hino.', 2);

  titulo('Sermão');

  if (credo === 'niceno') {
    titulo('Credo Niceno');
    rubrica('Todos de pé.');
    versos([
      'Creio em um só Deus,', 'Pai Onipotente,', 'Criador do céu e da terra,',
      'e de todas as coisas visíveis e invisíveis;',
      'E em um só Senhor Jesus Cristo,', 'Filho Unigênito de Deus;',
      'gerado de seu Pai antes de todos os mundos,', 'Deus de Deus, Luz de Luz,',
      'Verdadeiro Deus, de Verdadeiro Deus;', 'gerado, não feito;', 'consubstancial com o Pai;',
      'por quem todas as coisas foram feitas;',
      'o qual por nós homens e pela nossa salvação desceu do Céu,',
      'e encarnou, por obra do Espírito Santo, da Virgem Maria,', 'e foi feito homem;',
      'foi também crucificado por nós,', 'sob o poder de Pôncio Pilatos;', 'padeceu e foi sepultado:',
      'e ao terceiro dia ressuscitou, segundo as Escrituras:', 'e subiu ao Céu,',
      'e está sentado à direita do Pai:', 'e virá outra vez, com glória, a julgar os vivos e os mortos;',
      'e o seu Reino não terá fim.',
      'E creio no Espírito Santo, Senhor, Doador da Vida,', 'procedente do Pai e do Filho;',
      'o qual com o Pai e o Filho juntamente é adorado e glorificado;', 'o qual falou pelos profetas:',
      'e creio na Igreja Una, Santa, Católica e Apostólica:',
      'reconheço um só Batismo para a remissão de pecados:',
      'e espero a ressurreição dos mortos:', 'e a vida do mundo vindouro. Amém.',
    ], { quem: 'Todos', povo: true });
  } else if (credo === 'apostolico') {
    titulo('Credo Apostólico');
    rubrica('Todos de pé.');
    versos([
      'Creio em Deus Pai Todo-poderoso,', 'Criador do céu e da terra:',
      'E em Jesus Cristo, seu único Filho, nosso Senhor:',
      'o qual foi concebido por obra do Espírito Santo.', 'Nasceu da Virgem Maria:',
      'padeceu sob o poder de Pôncio Pilatos,', 'foi crucificado, morto, e sepultado:',
      'desceu ao Hades;', 'ressuscitou ao terceiro dia: subiu ao Céu,',
      'e está sentado à mão direita de Deus Pai Todo poderoso:',
      'donde há de vir a julgar os vivos e os mortos.',
      'Creio no Espírito Santo:', 'na santa Igreja Católica:', 'na Comunhão dos Santos:',
      'na remissão dos pecados:', 'na ressurreição do corpo:', 'e na Vida eterna. Amém.',
    ], { quem: 'Todos', povo: true });
  }

  titulo('Intercessão (Oração dos Fiéis)');
  rubrica('As orações serão feitas com intercessões:');
  const santo = dia.celebracao?.nome ? ` (com a comemoração de ${dia.celebracao.nome})` : '';
  versos([
    'Pela Igreja Universal, seus membros e sua missão;',
    'Pela Nação e por todos que exercem autoridade;',
    'Pela paz e salvação do mundo;',
    'Pelas preocupações da comunidade local;',
    'Pelos que sofrem e se encontram em dificuldades;',
    `Pelos que partiram${santo}.`,
  ], { marcador: true });
  rubrica('Poder-se-á usar uma das intercessões das páginas 92 ou 95, uma litania autorizada, orações extemporâneas ou silenciosas.', 2);

  if (o.penitencial === 'intercessoes') ordemPenitencial();

  if (o.paz !== 'fracao') {
    titulo('Saudação da Paz');
    fala('Celebrante', 'A paz do Senhor seja sempre convosco.');
    fala('Povo', 'Seja também contigo.', true);
  }

  // ------------------------------------------ CELEBRAÇÃO DA SANTA COMUNHÃO
  secao('Celebração da Santa Comunhão');
  titulo('Ofertório');
  fala('Celebrante', 'Apresentemos ao Senhor a oferta de nossa vida e do nosso trabalho.');
  rubrica('Durante o Ofertório poder-se-á cantar um hino ou salmo. As ofertas de Pão, Vinho, dinheiro e outras são apresentadas e colocadas sobre o Altar.');

  titulo('Grande Oração Eucarística');
  rubrica('Todos de pé.');
  saudacao('Celebrante');
  fala('Celebrante', 'Elevai os corações.');
  fala('Povo', 'Ao Senhor os elevamos.', true);
  fala('Celebrante', 'Demos graças ao Senhor, nosso Deus.');
  fala('Povo', 'Assim fazê-lo é digno e justo.', true);
  fala('Celebrante', 'É verdadeiramente digno, justo, racional e salutar que sempre, e em toda parte, te rendamos graças, ó Pai Onipotente, Criador do céu e da terra.');
  if (dia.prefacio) {
    B.push({ t: 'rotulo', texto: `Prefácio Próprio — ${dia.prefacio.titulo}` });
    texto(dia.prefacio.texto, { quem: 'Celebrante' });
  }
  fala('Celebrante', 'Portanto, com os Anjos e Arcanjos e com toda a multidão celestial, que não cessam de proclamar a tua glória, jubilosos louvamos o teu Nome:');
  versos([
    'Santo, Santo, Santo, Senhor Deus do Universo.',
    'Os céus e a terra estão plenos da tua glória,',
    'Glória te seja dada, ó Senhor Altíssimo,',
    'Hosana nas alturas.',
    'Bendito o que vem em nome do Senhor.',
    'Hosana nas alturas.',
  ], { quem: 'Todos', povo: true });
  rubrica('De pé ou de joelhos.');
  fala('Celebrante', 'Toda a glória e ações de graças te sejam dadas, ó Deus Pai de infinito poder e amor, por toda a criação e por nos teres feito à tua própria imagem; e porque, tendo nós caído em pecado, enviaste misericordioso, em nosso socorro, teu único Filho Jesus Cristo, o qual, para nossa redenção, tomou sobre si a natureza humana e sofreu morte de cruz; e porque Ele, pela oblação única de si mesmo, realizou um sacrifício perfeito, completo e suficiente pelo pecado de todo o mundo.');
  texto('Pois o Senhor Jesus, na noite em que foi traído, tomou o Pão, e, tendo dado graças, o partiu e deu aos seus discípulos, dizendo: Tomai, comei, este é o meu Corpo, que é dado por vós; fazei isto em memória minha.');
  texto('E, depois da ceia, tomou o Cálice, e, tendo dado graças, lho entregou dizendo: Bebei todos deste, porque este é o meu Sangue da Nova Aliança, que é derramado por vós e por muitos, para a remissão dos pecados. Fazei isto, quantas vezes o beberdes, em memória minha.');
  versos([
    'A tua morte, Senhor, nós anunciamos.',
    'A tua ressurreição nós proclamamos.',
    'E a tua vinda nós esperamos.',
    'Vem, Senhor Jesus.',
  ], { quem: 'Todos', povo: true });
  fala('Celebrante', 'Portanto, ó Pai, seguindo o mandamento de teu Filho, comemoramos, até que Ele venha, a sua vida, paixão, morte, ressurreição e ascensão, dando-te graças pelas inumeráveis bênçãos que por Ele recebemos.');
  texto('E aqui te apresentamos, ó Senhor, a oferta de nós mesmos. E humildemente suplicamos que aceites este nosso sacrifício de louvor e ação de graças, e te dignes abençoar e santificar com teu Espírito Santo a este Pão e Vinho, para que nós, revestidos de tua graça e bênção celestial, sejamos unidos, com Cristo em tua Santa Igreja; mediante o mesmo teu Filho, nosso Senhor, por quem e com quem, na unidade do Espírito Santo, seja toda a honra e glória a ti, ó Pai Onipotente, por séculos sem fim.');
  fala('Povo', 'Amém.', true);

  titulo('Oração do Senhor');
  fala('Celebrante', 'Como nos ensinou Cristo, o Salvador, agora nos animamos a dizer:');
  versos([
    'Pai nosso, que estás nos céus,', 'Santificado seja o teu Nome,', 'Venha o teu Reino,',
    'Seja feita a tua vontade, assim na terra como no céu.', 'O pão nosso de cada dia nos dá hoje.',
    'E perdoa-nos as nossas dívidas,', 'Assim como nós também perdoamos aos nossos devedores.',
    'E não nos deixes cair em tentação,', 'Mas livra-nos do mal;',
    'Pois teu é o Reino, e o poder, e a glória para sempre.', 'Amém.',
  ], { quem: 'Todos', povo: true });

  titulo('Partir do Pão');
  rubrica('O Celebrante parte o Pão consagrado. Silêncio.');
  fala('Celebrante', 'O Pão que partimos é a comunhão do Corpo de Cristo, e o Cálice que abençoamos é a comunhão do Sangue de Cristo.');
  fala('Povo', 'Pois nós, embora muitos, somos um só corpo.', true);

  if (o.paz === 'fracao') {
    titulo('Saudação da Paz');
    fala('Celebrante', 'A Paz do Senhor seja sempre convosco.');
    fala('Povo', 'Seja também contigo.', true);
  }

  if (o.fracao === 'agnus' || o.fracao === 'ambos') {
    titulo('Cordeiro de Deus');
    fala('Celebrante', 'Cordeiro de Deus, que tiras os pecados do mundo,');
    fala('Povo', 'Tem misericórdia de nós.', true);
    fala('Celebrante', 'Cordeiro de Deus, que tiras os pecados do mundo,');
    fala('Povo', 'Tem misericórdia de nós.', true);
    fala('Celebrante', 'Cordeiro de Deus, que tiras os pecados do mundo,');
    fala('Povo', 'Dá-nos a tua paz.', true);
  }
  if (o.fracao === 'humilde' || o.fracao === 'ambos') {
    titulo('Oração de Humilde Acesso');
    fala('Todos', 'Não ousamos vir à tua Mesa, ó boníssimo Senhor, confiados em nossa própria retidão, mas em tuas muitas e grandes misericórdias. Nem ao menos somos dignos de apanhar as migalhas que caem de tua Mesa. Tu, porém, és o mesmo Senhor, sempre misericordioso por natureza. Concede-nos, pois, benigno Senhor, que de tal modo comamos a Carne de teu amado Filho Jesus Cristo, e bebamos seu Sangue, que nossos corpos pecadores sejam purificados por seu Corpo, e nossas almas lavadas por seu preciosíssimo Sangue, e que sempre vivamos nele, e ele em nós. Amém.', true);
  }

  titulo('Comunhão');
  rubrica('Ao dar o Pão:');
  fala('Celebrante', 'O Corpo de nosso Senhor Jesus Cristo, que foi dado por amor de ti, preserve o teu corpo e alma na vida eterna. Sê agradecido.');
  fala('Resposta', 'Amém.', true);
  rubrica('Ao dar o Cálice:');
  fala('Celebrante', 'O Sangue de nosso Senhor Jesus Cristo, que foi derramado por amor de ti, preserve o teu corpo e alma na vida eterna. Sê agradecido.');
  fala('Resposta', 'Amém.', true);

  titulo('Pós-Comunhão');
  fala('Celebrante', 'Oremos.');
  if (+o.posComunhao === 2) {
    fala('Todos', 'Ó Deus Todo-poderoso, rendemos-te graças por nos alimentares com o Corpo e Sangue de teu Filho Jesus Cristo, nosso Senhor. E, por meio dele, oferecemos a Ti nossos corpos e almas em sacrifício vivo e santo. Envia-nos no poder do Espírito Santo, para que vivamos e trabalhemos para tua glória e louvor. Amém.', true);
  } else {
    fala('Todos', 'Onipotente e Eterno Deus, de todo o coração te damos graças, porque, nestes santos mistérios, te dignas nutrir-nos com o Corpo e Sangue de teu Filho Jesus Cristo, e preservar-nos no seu Corpo místico, que é a bendita comunidade de todos os fiéis, fazendo-nos participantes do teu eterno Reino. Nós te suplicamos, ó Pai, que, pela tua graça, possamos perseverar em tua Santa Igreja, e fazer todas as boas obras que para nós preparaste; mediante o mesmo Jesus Cristo, nosso Senhor, que vive e reina, na unidade do Espírito Santo, um só Deus, pelos séculos sem fim. Amém.', true);
  }

  if (gloria) {
    titulo('Gloria in Excelsis');
    versos([
      'Glória a Deus nas alturas,', 'E na terra paz, boa vontade entre os homens.',
      'Nós te louvamos, bendizemos, adoramos,', 'Glorificamos e te damos graças por tua grande glória.',
      'Ó Senhor Deus, Rei do Céu, Deus Pai Onipotente.', 'Ó Senhor, Unigênito Filho, Jesus Cristo;',
      'Ó Senhor Deus, Cordeiro de Deus, Filho do Eterno Pai,', 'Que tiras os pecados do mundo,',
      'Tem misericórdia de nós.', 'Tu que tiras os pecados do mundo,', 'Recebe a nossa oração.',
      'Tu que estás à destra de Deus Pai,', 'Tem misericórdia de nós.', 'Porque só tu és Santo;',
      'Só tu és o Senhor;', 'Só tu, ó Cristo, com o Espírito Santo,', 'És altíssimo na glória de Deus Pai. Amém.',
    ], { quem: 'Todos', povo: true });
  }

  titulo('Bênção');
  texto(dia.bencao.texto.replace(/\s*Amém\.?$/, ''), { quem: 'Celebrante' });
  fala('Povo', 'Amém.', true);
  rubrica('Poder-se-á aqui fazer anúncios e cantar um hino ou salmo.', 2);

  titulo('Despedida');
  fala('Diácono', 'Ide na paz de Cristo. Sede corajosos e fortes no testemunho do Evangelho entre os homens. Servi ao Senhor com alegria.');
  fala('Povo', 'No poder do Espírito Santo.', true);
  if (!s.penitencial) fala('Todos', 'Aleluia!', true); // omitido na Quaresma e Semana Santa

  return { blocos: B, opcoes: o, resumo: { lei, credo, gloria } };
}
