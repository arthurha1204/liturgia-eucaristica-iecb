// Teste rápido sem navegador: gera o folheto de algumas datas na pasta ./saida
// Uso: npm run teste            (datas de exemplo)
//      npm run teste 2026-12-25 (uma data específica)

import { mkdirSync, writeFileSync } from 'node:fs';
import { lerData } from '../src/calendario.js';
import { prepararDia } from '../src/proprios.js';
import { montarRito1 } from '../src/rito1.js';
import { gerarA5, imporLivreto } from '../src/pdf.js';

const datas = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['2026-10-04', '2026-11-29', '2026-12-25', '2027-02-14', '2027-03-28', '2027-03-31', '2027-04-04', '2027-05-16', '2026-11-01', '2026-11-30', '2026-09-29'];

mkdirSync('saida', { recursive: true });
for (const d of datas) {
  const dia = await prepararDia(lerData(d), { comunidade: process.env.COMUNIDADE || '' });
  const { blocos, resumo } = montarRito1(dia);
  const { buffer, paginas } = await gerarA5(dia, blocos, { livreto: true });
  writeFileSync(`saida/${d}-a5.pdf`, buffer);
  writeFileSync(`saida/${d}-livreto.pdf`, await imporLivreto(buffer));
  console.log(`${d} | ${dia.nomeDia} | ${dia.nomeTempo} | ${dia.cor} | coleta: ${dia.coleta.titulo} (${dia.coleta.fonte}) | prefácio: ${dia.prefacio?.titulo || '—'} | bênção: ${dia.bencao.titulo} | ${resumo.credo}/${resumo.lei}/glória:${resumo.gloria} | ${paginas} págs`);
}
