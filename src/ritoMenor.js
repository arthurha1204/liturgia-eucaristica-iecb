// Santa Eucaristia — Rito Menor (forma simplificada do Rito I do LOC 1987, IEAB),
// na ordem definida pela comunidade, com os próprios do dia (coleta e leituras).

import { OPCOES_PADRAO } from './rito1.js';

const GENERO_EVANGELHO = { Mateus: 'São Mateus', Marcos: 'São Marcos', Lucas: 'São Lucas', João: 'São João' };

export function montarRitoMenor(dia, opcoesUsuario = {}) {
  const o = { ...OPCOES_PADRAO, bencao: 'padrao', ...opcoesUsuario };
  const B = [];
  const secao = (texto) => B.push({ t: 'secao', texto });
  const titulo = (texto) => B.push({ t: 'titulo', texto });
  const rubrica = (texto) => { if (o.rubricas !== 'nenhuma') B.push({ t: 'rubrica', texto }); };
  const fala = (quem, texto, povo = false) => B.push({ t: 'fala', quem, texto, povo });
  const texto = (t, extra = {}) => B.push({ t: 'texto', texto: t, ...extra });
  const versos = (linhas, extra = {}) => B.push({ t: 'versos', linhas, ...extra });
  const s = dia.sinais || {};

  // ------------------------------------------------------------ ABERTURA
  secao('Preparação');
  rubrica('Todos de pé.');
  fala('Oficiante', 'Bendito seja Deus Pai, Filho e Espírito Santo.');
  fala('Povo', 'Bendito seja o seu Reino, agora e sempre.', true);

  titulo('Coleta pela Pureza');
  fala('Todos', 'Onipotente Deus, que vês todos os corações, conheces todos os desejos e para quem segredo algum está oculto; purifica nossos corações e pensamentos com a inspiração do teu Espírito Santo, para que te amemos com perfeição e dignamente glorifiquemos o teu Santo Nome; por Jesus Cristo, nosso Senhor. Amém.', true);

  titulo('Sumário da Lei');
  fala('Oficiante', 'Escutai o que diz nosso Senhor Jesus Cristo: Amarás o Senhor teu Deus de todo o teu coração, de toda a tua alma, e de todo o teu entendimento. Este é o primeiro e grande mandamento. E o segundo, semelhante a este, é: Amarás o teu próximo como a ti mesmo. Destes dois mandamentos dependem toda a Lei e os Profetas.');

  titulo('Kyrie');
  fala('Oficiante', 'Senhor, tem piedade de nós.');
  fala('Povo', 'Cristo, tem piedade de nós.', true);
  fala('Oficiante', 'Senhor, tem piedade de nós.');

  titulo('Confissão');
  rubrica('Todos se ajoelham.');
  fala('Todos', 'Misericordioso Deus, confessamos que temos pecado contra Ti, em pensamentos, palavras e ações. Não te amamos de todo o nosso coração, nem a nosso próximo como a nós mesmos. Imploramos a tua compaixão; esquece o que fomos, emenda o que somos, dirige o que seremos; de modo que nos alegremos em tua vontade e andemos em teus caminhos, por Jesus Cristo nosso Senhor. Amém.', true);

  titulo('Absolvição');
  rubrica('O Presbítero, ou o Bispo quando presente, dirá:');
  fala('Celebrante', 'Deus Onipotente, nosso Pai Celestial, que, por sua grande misericórdia, promete o perdão a todos quantos, com sincero arrependimento e viva fé, a Ele se convertem, vos perdoe e liberte de todos os vossos pecados, vos confirme e fortaleça em todo o bem, e vos preserve no caminho da vida eterna; mediante Jesus Cristo, nosso Senhor.');
  fala('Povo', 'Amém.', true);

  // ---------------------------------------------------- LITURGIA DA PALAVRA
  secao('Liturgia da Palavra');
  if (dia.coleta?.texto) {
    titulo('Coleta do Dia');
    texto(dia.coleta.texto.replace(/\s*Amém\.?$/, ''), { quem: 'Oficiante' });
    fala('Povo', 'Amém.', true);
  }

  const L = dia.leituras || {};
  const ref = (r) => B.push({ t: 'referencia', texto: r.referencia, alternativa: r.alternativa, traducao: r.traducao });
  const leitura = (nome, r) => {
    titulo(nome);
    if (r) {
      ref(r);
      texto(`A palavra de Deus, escrita no Livro de ${r.livro}, capítulo ${r.capitulo}, começando com o versículo ${r.versiculo}.`, { quem: 'Leitor' });
      if (o.textosLeituras && r.texto) texto(r.texto, { leitura: true });
    } else {
      texto('A palavra de Deus, escrita no Livro de __________, capítulo ______, começando com o versículo ______.', { quem: 'Leitor' });
    }
    fala('Leitor', 'Palavra do Senhor.');
    fala('Povo', 'Demos graças a Deus.', true);
  };

  rubrica('Todos sentados.');
  leitura('Primeira Leitura', L.primeira);
  if (L.salmo) {
    titulo('Salmo');
    ref(L.salmo);
    if (o.textosLeituras && L.salmo.versos?.length) {
      B.push({ t: 'salmo', versos: L.salmo.versos });
      versos([
        'Glória ao Pai e ao Filho, e ao Espírito Santo;',
        'Como era no princípio, é agora e será sempre, por todos os séculos. Amém.',
      ], { quem: 'Todos', povo: true });
    }
  }
  if (L.segunda || !L.primeira) leitura('Epístola', L.segunda);

  titulo('Santo Evangelho');
  rubrica('Todos de pé.');
  const ev = L.evangelho;
  if (ev) {
    ref(ev);
    fala('Leitor', `O Santo Evangelho de nosso Senhor Jesus Cristo, conforme ${GENERO_EVANGELHO[ev.livro] || ev.livro}, no capítulo ${ev.capitulo}, começando com o versículo ${ev.versiculo}.`);
  } else {
    fala('Leitor', 'O Santo Evangelho de nosso Senhor Jesus Cristo, conforme __________, no capítulo ______, começando com o versículo ______.');
  }
  fala('Povo', 'Glória Te seja dada, ó Senhor.', true);
  if (ev && o.textosLeituras && ev.texto) texto(ev.texto, { leitura: true });
  fala('Leitor', 'O Evangelho do Senhor.');
  fala('Povo', 'Louvado sejas, ó Cristo.', true);

  titulo('Sermão');

  // ---------------------------------------------------------- OFERTÓRIO
  titulo('Ofertório');
  fala('Todos', 'Tudo vem de ti, Senhor, e do que é teu to damos. Amém.', true);

  // ------------------------------------------ CELEBRAÇÃO DA SANTA COMUNHÃO
  secao('Celebração da Santa Comunhão');
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

  titulo('Saudação da Paz');
  fala('Celebrante', 'A Paz do Senhor seja sempre convosco.');
  fala('Povo', 'Seja também contigo.', true);

  titulo('Comunhão');
  rubrica('O Celebrante recebe a Santa Comunhão e depois a ministra ao povo.');

  titulo('Pós-Comunhão');
  fala('Todos', 'Ó Deus Todo-poderoso, rendemos-te graças por nos alimentares com o Corpo e Sangue de teu Filho Jesus Cristo, nosso Senhor. E, por meio dele, oferecemos a Ti nossos corpos e almas em sacrifício vivo e santo. Envia-nos no poder do Espírito Santo, para que vivamos e trabalhemos para tua glória e louvor. Amém.', true);

  titulo('Bênção');
  texto(dia.bencao.texto.replace(/\s*Amém\.?$/, ''), { quem: 'Celebrante' });
  fala('Povo', 'Amém.', true);

  titulo('Despedida');
  fala('Celebrante', 'Ide na paz de Cristo. Sede corajosos e fortes no testemunho do Evangelho entre os homens. Servi ao Senhor com alegria.');
  fala('Povo', 'No poder do Espírito Santo.', true);
  fala('Todos', s.penitencial ? 'Amém.' : 'Aleluia!', true); // na Quaresma diz-se Amém

  return { blocos: B, opcoes: o, resumo: { lei: 'sumario', credo: 'nenhum', gloria: false } };
}
