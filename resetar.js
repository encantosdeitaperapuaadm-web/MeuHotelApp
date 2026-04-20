const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('hotel.db');

db.serialize(() => {
  // Limpa limpezas
  db.run(`DELETE FROM limpezas`);
  db.run(`DELETE FROM sqlite_sequence WHERE name='limpezas'`);

  // Limpa cronômetro
  db.run(`DELETE FROM limpeza_cronometro`);
  db.run(`DELETE FROM sqlite_sequence WHERE name='limpeza_cronometro'`);

  // Limpa manutenções
  db.run(`DELETE FROM manutencao`);
  db.run(`DELETE FROM sqlite_sequence WHERE name='manutencao'`);

  // Limpa movimentações de enxoval
  db.run(`DELETE FROM enxoval_movimentacao`);
  db.run(`DELETE FROM sqlite_sequence WHERE name='enxoval_movimentacao'`);

  // Limpa lavanderia
  db.run(`DELETE FROM enxoval_lavanderia`);
  db.run(`DELETE FROM sqlite_sequence WHERE name='enxoval_lavanderia'`);

  // Limpa check-ins
  db.run(`DELETE FROM checkin_checkout`);
  db.run(`DELETE FROM sqlite_sequence WHERE name='checkin_checkout'`);

  // Reseta status dos quartos para disponivel
  db.run(`UPDATE quartos SET status='disponivel'`);

  // Reseta estoque de enxoval (zera lavanderia e nos quartos)
  db.run(`UPDATE enxoval_estoque SET na_lavanderia=0`);

  console.log('✅ Sistema resetado com sucesso!');
  console.log('✅ Apartamentos e estoque mantidos!');
  console.log('✅ Limpezas, manutenções e check-ins zerados!');
});

db.close();