const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument({ margin: 30, size: 'A4' });
doc.pipe(fs.createWriteStream('teste-hits.pdf'));

// Cabeçalho
doc.fontSize(12).font('Helvetica-Bold').text('ENCANTOS DE ITAPERAPUÃ', { align: 'center' });
doc.fontSize(9).font('Helvetica').text('Diário da camareira', { align: 'center' });
doc.text('Filtros: Exibir por: Camareira | Status UH: Vago, Ocupado, Interdição', { align: 'center' });
doc.moveDown();

// Cabeçalho da tabela
const cols = [40, 80, 55, 55, 120, 50, 80, 80, 80, 80];
const headers = ['Apto.','Status','Gov.','Serviço','Serviço detalhe','Ad/Cr','Ck-In','Ck-Out','Chegada Hoje','Check-out hoje'];

doc.fontSize(8).font('Helvetica-Bold');
doc.text('Camareira: BLOCO A TÉRREO', { underline: true });
doc.moveDown(0.3);

// Dados de teste
const quartos = [
  { apto: '01', status: 'Vago',    gov: 'Limpo', servico: 'Sem tarefas de limpeza', checkin: '',            checkout: '',           chegada: '14/04 14:00', saida: '' },
  { apto: '02', status: 'Ocupado', gov: 'Sujo',  servico: 'Arrumação',              checkin: '12/04 14:00', checkout: '17/04 12:00', chegada: '',            saida: '' },
  { apto: '03', status: 'Ocupado', gov: 'Sujo',  servico: 'Troca de enxoval',       checkin: '11/04 14:00', checkout: '17/04 12:00', chegada: '',            saida: '' },
  { apto: '04', status: 'Vago',    gov: 'Limpo', servico: 'Sem tarefas de limpeza', checkin: '',            checkout: '',           chegada: '',            saida: '' },
  { apto: '05', status: 'Ocupado', gov: 'Sujo',  servico: 'Check-out',              checkin: '10/04 14:00', checkout: '14/04 12:00', chegada: '',            saida: '14/04 12:00' },
  { apto: '06', status: 'Vago',    gov: 'Limpo', servico: 'Sem tarefas de limpeza', checkin: '',            checkout: '',           chegada: '14/04 14:00', saida: '' },
  { apto: '07', status: 'Interdição', gov: 'Sujo', servico: 'Check-out',            checkin: '',            checkout: '',           chegada: '',            saida: '' },
  { apto: '08', status: 'Ocupado', gov: 'Sujo',  servico: 'Arrumação',              checkin: '13/04 14:00', checkout: '17/04 12:00', chegada: '',            saida: '' },
  { apto: '09', status: 'Vago',    gov: 'Limpo', servico: 'Sem tarefas de limpeza', checkin: '',            checkout: '',           chegada: '14/04 14:00', saida: '' },
  { apto: '10', status: 'Ocupado', gov: 'Sujo',  servico: 'Troca de enxoval',       checkin: '11/04 14:00', checkout: '16/04 12:00', chegada: '',            saida: '' },
];

doc.font('Helvetica').fontSize(8);
quartos.forEach(q => {
  const y = doc.y;
  doc.text(`${q.apto}  ${q.status}  ${q.gov}  ${q.servico}  ${q.checkin}  ${q.checkout}  ${q.chegada}  ${q.saida}`);
});

doc.moveDown();
doc.font('Helvetica-Bold').text('Totais: Aptos 10 | Check-out 01 | Troca de enxoval 02 | Arrumação 03');

doc.end();
console.log('✅ PDF de teste gerado: teste-hits.pdf');