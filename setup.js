const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('hotel.db');

db.serialize(() => {

  db.run(`DROP TABLE IF EXISTS quartos`);
  db.run(`CREATE TABLE quartos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero INTEGER UNIQUE,
    ala TEXT, categoria TEXT,
    status TEXT DEFAULT 'disponivel'
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS limpezas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ala TEXT, tempo TEXT, tarefas TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS checkin_checkout (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quarto_numero INTEGER, nome_hospede TEXT,
    checkin DATE, checkout DATE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS manutencao (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quarto_numero INTEGER, observacao TEXT,
    status TEXT DEFAULT 'aberto',
    registrado_por TEXT DEFAULT 'camareira',
    registrado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolvido_por TEXT, resolvido_em DATETIME,
    vistoriado_por TEXT, vistoriado_em DATETIME
  )`);

  db.run(`DROP TABLE IF EXISTS enxoval_estoque`);
  db.run(`CREATE TABLE enxoval_estoque (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    peca TEXT UNIQUE,
    quantidade_total INTEGER DEFAULT 0,
    na_rouparia INTEGER DEFAULT 0,
    na_lavanderia INTEGER DEFAULT 0,
    nos_quartos INTEGER DEFAULT 0,
    danificados INTEGER DEFAULT 0,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS enxoval_movimentacao (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quarto_numero INTEGER,
    peca TEXT,
    quantidade_saiu INTEGER DEFAULT 0,
    quantidade_entrou INTEGER DEFAULT 0,
    danificados INTEGER DEFAULT 0,
    registrado_por TEXT,
    perfil TEXT,
    observacao TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  const estoqueInicial = [
    { peca: 'Lençol Casal',    qtd: 115 },
    { peca: 'Lençol Solteiro', qtd: 193 },
    { peca: 'Fronha',          qtd: 258 },
    { peca: 'Travesseiro',     qtd: 157 },
    { peca: 'Cobertor',        qtd: 179 },
    { peca: 'Toalha de Piso',  qtd: 116 },
    { peca: 'Toalha de Rosto', qtd: 121 },
    { peca: 'Toalha de Banho', qtd: 254 },
  ];

  const stmtE = db.prepare(`INSERT OR IGNORE INTO enxoval_estoque (peca, quantidade_total, na_rouparia) VALUES (?, ?, ?)`);
  estoqueInicial.forEach(e => stmtE.run(e.peca, e.qtd, e.qtd));
  stmtE.finalize();

  const quartos = [
    { numero: 1,  ala: 'Bloco A - Térreo',   categoria: 'Luxo' },
    { numero: 2,  ala: 'Bloco A - Térreo',   categoria: 'Master' },
    { numero: 3,  ala: 'Bloco A - Térreo',   categoria: 'Master' },
    { numero: 4,  ala: 'Bloco A - Térreo',   categoria: 'Luxo' },
    { numero: 5,  ala: 'Bloco A - Térreo',   categoria: 'Luxo' },
    { numero: 6,  ala: 'Bloco A - Térreo',   categoria: 'Master' },
    { numero: 7,  ala: 'Bloco A - Térreo',   categoria: 'Master' },
    { numero: 8,  ala: 'Bloco A - Térreo',   categoria: 'Luxo' },
    { numero: 9,  ala: 'Bloco A - Térreo',   categoria: 'Premium-A' },
    { numero: 10, ala: 'Bloco A - Térreo',   categoria: 'Master' },
    { numero: 11, ala: 'Bloco A - Térreo',   categoria: 'Luxo' },
    { numero: 12, ala: 'Bloco A - Térreo',   categoria: 'Luxo' },
    { numero: 13, ala: 'Bloco A - Térreo',   categoria: 'Master' },
    { numero: 14, ala: 'Bloco A - Térreo',   categoria: 'Master' },
    { numero: 15, ala: 'Bloco A - Térreo',   categoria: 'Luxo' },
    { numero: 16, ala: 'Bloco A - Térreo',   categoria: 'Luxo' },
    { numero: 17, ala: 'Bloco A - Térreo',   categoria: 'Master' },
    { numero: 18, ala: 'Bloco B',   categoria: 'Premium-A' },
    { numero: 36, ala: 'Bloco A - Térreo',   categoria: 'Luxo' },
    { numero: 19, ala: 'Bloco A - 1º Andar', categoria: 'Premium-A' },
    { numero: 20, ala: 'Bloco A - 1º Andar', categoria: 'Luxo' },
    { numero: 21, ala: 'Bloco A - 1º Andar', categoria: 'Master' },
    { numero: 22, ala: 'Bloco A - 1º Andar', categoria: 'Master' },
    { numero: 23, ala: 'Bloco A - 1º Andar', categoria: 'Luxo' },
    { numero: 24, ala: 'Bloco A - 1º Andar', categoria: 'Luxo' },
    { numero: 25, ala: 'Bloco A - 1º Andar', categoria: 'Master' },
    { numero: 26, ala: 'Bloco A - 1º Andar', categoria: 'Master' },
    { numero: 27, ala: 'Bloco A - 1º Andar', categoria: 'Luxo' },
    { numero: 28, ala: 'Bloco A - 1º Andar', categoria: 'Premium-A' },
    { numero: 29, ala: 'Bloco A - 1º Andar', categoria: 'Master' },
    { numero: 30, ala: 'Bloco A - 1º Andar', categoria: 'Premium-A' },
    { numero: 31, ala: 'Bloco A - 1º Andar', categoria: 'Luxo' },
    { numero: 32, ala: 'Bloco A - 1º Andar', categoria: 'Master' },
    { numero: 33, ala: 'Bloco A - 1º Andar', categoria: 'Master' },
    { numero: 34, ala: 'Bloco A - 1º Andar', categoria: 'Luxo' },
    { numero: 35, ala: 'Bloco A - 1º Andar', categoria: 'Premium-A' },
    { numero: 37, ala: 'Bloco B',   categoria: 'Premium-B' },
    { numero: 38, ala: 'Bloco B',   categoria: 'Premium-B' },
    { numero: 39, ala: 'Bloco B',   categoria: 'Premium-B' },
    { numero: 40, ala: 'Bloco B',   categoria: 'Premium-B' },
    { numero: 41, ala: 'Bloco B',   categoria: 'Premium-B' },
    { numero: 42, ala: 'Bloco B',   categoria: 'Premium-B' },
    { numero: 43, ala: 'Bloco B', categoria: 'Premium-B' },
    { numero: 44, ala: 'Bloco B', categoria: 'Premium-B' },
    { numero: 45, ala: 'Bloco B', categoria: 'Premium-B' },
    { numero: 46, ala: 'Bloco B', categoria: 'Premium-B' },
    { numero: 47, ala: 'Bloco B', categoria: 'Premium-B' },
    { numero: 48, ala: 'Bloco B', categoria: 'Premium-B' },
  ];

  const stmtQ = db.prepare(`INSERT INTO quartos (numero, ala, categoria, status) VALUES (?, ?, ?, 'disponivel')`);
  quartos.forEach(q => stmtQ.run(q.numero, q.ala, q.categoria));
  stmtQ.finalize();
  db.run(`CREATE TABLE IF NOT EXISTS limpeza_cronometro (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quarto_numero INTEGER,
    ala TEXT,
    categoria TEXT,
    camareira TEXT,
    tipo_servico TEXT,
    inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
    fim DATETIME,
    duracao_minutos INTEGER,
    tempo_pausa_minutos INTEGER DEFAULT 0,
    status TEXT DEFAULT 'em_andamento'
  )`);
db.run(`CREATE TABLE IF NOT EXISTS enxoval_lavanderia (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    peca TEXT,
    quantidade INTEGER,
    status TEXT DEFAULT 'pendente',
    registrado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    enviado_em DATETIME,
    enviado_por TEXT,
    retornado_em DATETIME,
    retornado_por TEXT,
    quantidade_retornada INTEGER DEFAULT 0
  )`);

db.run(`CREATE TABLE IF NOT EXISTS equipe (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT UNIQUE,
    cargo TEXT DEFAULT 'camareira',
    ativo INTEGER DEFAULT 1,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`
  CREATE TABLE IF NOT EXISTS limpezas_quartos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quarto_numero INTEGER,
    camareira_nome TEXT,
    tipo_servico TEXT, -- arrumacao | troca_enxoval | checkout | dispensa
    detalhes_enxoval TEXT, -- ex: 'piso e rosto', 'enxoval completo'
    data TEXT, -- formato: '2026-04-20'
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS limpeza_cronometro (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quarto_numero INTEGER,
    ala TEXT,
    categoria TEXT,
    camareira TEXT,
    tipo_servico TEXT,
    inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
    fim DATETIME,
    duracao_minutos INTEGER,
    tempo_pausa_minutos INTEGER DEFAULT 0,
    segundos_decorridos INTEGER DEFAULT 0,
    status TEXT DEFAULT 'em_andamento'
  )
`);

db.run(`ALTER TABLE limpeza_cronometro ADD COLUMN segundos_decorridos INTEGER DEFAULT 0`, (err) => {
  if (err) console.log('ALTER segundos_decorridos:', err.message);
  else console.log('Coluna segundos_decorridos criada com sucesso.');
});

db.run(`ALTER TABLE limpeza_cronometro ADD COLUMN segundos_decorridos INTEGER DEFAULT 0`, (err) => {
  if (err) {
    console.log('ALTER segundos_decorridos:', err.message);
  } else {
    console.log('Coluna segundos_decorridos criada com sucesso.');
  }
});

db.run(`ALTER TABLE limpeza_cronometro ADD COLUMN inicio_pausa DATETIME`, (err) => {
  if (err) console.log('ALTER inicio_pausa:', err.message);
  else console.log('Coluna inicio_pausa criada com sucesso.');
});

db.run(`ALTER TABLE limpeza_cronometro ADD COLUMN tempo_pausa_segundos INTEGER DEFAULT 0`, (err) => {
  if (err) console.log('ALTER tempo_pausa_segundos:', err.message);
  else console.log('Coluna tempo_pausa_segundos criada com sucesso.');
});

db.run(`ALTER TABLE limpeza_cronometro ADD COLUMN inicio_pausa DATETIME`, (err) => {
  if (err) console.log('ALTER inicio_pausa:', err.message);
  else console.log('Coluna inicio_pausa criada com sucesso.');
});

db.run(`ALTER TABLE limpeza_cronometro ADD COLUMN tempo_pausa_segundos INTEGER DEFAULT 0`, (err) => {
  if (err) console.log('ALTER tempo_pausa_segundos:', err.message);
  else console.log('Coluna tempo_pausa_segundos criada com sucesso.');
});

// Camareiras iniciais
db.run(`INSERT OR IGNORE INTO equipe (nome, cargo) VALUES ('Flávia', 'camareira')`);
db.run(`INSERT OR IGNORE INTO equipe (nome, cargo) VALUES ('Renata', 'camareira')`);

  console.log('✅ Banco atualizado com enxoval e 48 apartamentos!');
});

db.close();