const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const fazerBackup = require('./backup');

fazerBackup();
setInterval(fazerBackup, 6 * 60 * 60 * 1000);

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.static('public'));
app.use(express.json());

const db = new sqlite3.Database('hotel.db');

db.run(`
  CREATE TABLE IF NOT EXISTS limpezas_quartos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quarto_numero INTEGER NOT NULL,
    camareira_nome TEXT NOT NULL,
    tipo_servico TEXT NOT NULL,
    detalhes_enxoval TEXT DEFAULT '',
    data TEXT NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ==================== QUARTOS ====================
app.get('/quartos', (req, res) => {
    // Suporte a prioridade na ordenação
    db.all('SELECT * FROM quartos ORDER BY numero ASC', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ==================== LIMPEZAS ====================
app.get('/limpezas', (req, res) => {
    db.all('SELECT * FROM limpezas ORDER BY timestamp DESC', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/limpeza-quarto', (req, res) => {
    const { quarto_numero, camareira_nome, tipo_servico, detalhes_enxoval, data } = req.body;
    db.run(
        `INSERT INTO limpezas_quartos (quarto_numero, camareira_nome, tipo_servico, detalhes_enxoval, data) VALUES (?, ?, ?, ?, ?)`,
        [quarto_numero, camareira_nome, tipo_servico, detalhes_enxoval || '', data],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            io.emit('update', 'limpeza_quarto');
            res.json({ id: this.lastID });
        }
    );
});

// ==================== CHECK-IN/OUT ====================
app.post('/checkin', (req, res) => {
    const { quarto_numero, nome_hospede, checkin, checkout, adultos, criancas } = req.body;
    db.run('INSERT INTO checkin_checkout (quarto_numero, nome_hospede, checkin, checkout, adultos, criancas) VALUES (?, ?, ?, ?, ?, ?)',
        [quarto_numero, nome_hospede, checkin, checkout, adultos || 0, criancas || 0],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            db.run('UPDATE quartos SET status = "ocupado" WHERE numero = ?', [quarto_numero]);
            io.emit('update', 'checkin');
            res.json({ id: this.lastID });
        }
    );
});

app.post('/checkout', (req, res) => {
    const { quarto_numero } = req.body;
    db.run('UPDATE quartos SET status = "disponivel" WHERE numero = ?', [quarto_numero], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        io.emit('update', 'checkout');
        res.json({ ok: true });
    });
});

// ==================== NOVOS ENDPOINTS ====================
app.get('/hospedes-total', (req, res) => {
    db.get('SELECT SUM(adultos) as adultos, SUM(criancas) as criancas FROM checkin_checkout WHERE checkout >= date("now")', (err, row) => {
        res.json(row || { adultos: 0, criancas: 0 });
    });
});

app.get('/chegadas-semana', (req, res) => {
    db.all("SELECT * FROM checkin_checkout WHERE checkin >= date('now') AND checkin <= date('now', '+7 days') ORDER BY checkin ASC", (err, rows) => {
        res.json(rows);
    });
});

// ==================== MANUTENÇÃO ====================
app.get('/manutencao', (req, res) => {
    db.all('SELECT * FROM manutencao ORDER BY status ASC, registrado_em DESC', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/manutencao', (req, res) => {
    const { quarto_numero, observacao, registrado_por } = req.body;
    db.run('INSERT INTO manutencao (quarto_numero, observacao, registrado_por) VALUES (?, ?, ?)',
        [quarto_numero, observacao, registrado_por || 'Recepção'],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            io.emit('update', 'manutencao');
            res.json({ id: this.lastID });
        }
    );
});

app.post('/manutencao/resolver', (req, res) => {
    const { id, resolvido_por } = req.body;
    db.run(`UPDATE manutencao SET status='resolvido', resolvido_por=?, resolvido_em=CURRENT_TIMESTAMP WHERE id=?`,
        [resolvido_por, id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            io.emit('update', 'manutencao');
            res.json({ ok: true });
        }
    );
});

// ==================== ENXOVAL ====================
app.post('/enxoval/movimentacao', (req, res) => {
    const { quarto_numero, itens, registrado_por, perfil } = req.body;
    let pendentes = itens.length;
    itens.forEach(item => {
        db.run(`INSERT INTO enxoval_movimentacao (quarto_numero, peca, quantidade_saiu, quantidade_entrou, danificados, registrado_por, perfil) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [quarto_numero, item.peca, item.saiu||0, item.entrou||0, item.danificados||0, registrado_por, perfil],
            function (err) {
                pendentes--;
                if (pendentes === 0) {
                    io.emit('update', 'enxoval');
                    res.json({ ok: true });
                }
            }
        );
    });
});

// ==================== IMPORTAR CSV HITS ====================
app.post('/importar-csv', upload.single('csv'), (req, res) => {
    try {
        const conteudo = req.file.buffer.toString('utf-8');
        const registros = parse(conteudo, { columns: true, skip_empty_lines: true, trim: true });
        res.json({ ok: true, resultado: registros });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/importar-confirmar', (req, res) => {
    const { quartos } = req.body;
    let pendentes = quartos.length;
    quartos.forEach(q => {
        db.run('UPDATE quartos SET status=? WHERE numero=?', [q.status, q.apto], () => {
            if (q.servico === 'Chegada hoje' || q.checkin) {
                db.run(`INSERT INTO checkin_checkout (quarto_numero, nome_hospede, checkin, checkout, adultos, criancas) VALUES (?, ?, ?, ?, ?, ?)`,
                    [q.apto, 'Importado HITS', q.checkin, q.checkout, q.adultos||0, q.criancas||0]);
            }
            pendentes--;
            if (pendentes === 0) {
                io.emit('update', 'importacao');
                res.json({ ok: true });
            }
        });
    });
});

// ==================== CRONÔMETRO ====================
app.post('/cronometro/iniciar', (req, res) => {
    const { quarto_numero, camareira, tipo_servico } = req.body;
    db.run(`INSERT INTO limpeza_cronometro (quarto_numero, camareira, tipo_servico) VALUES (?, ?, ?)`,
        [quarto_numero, camareira, tipo_servico],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            db.run('UPDATE quartos SET status="em_limpeza" WHERE numero=?', [quarto_numero]);
            io.emit('update', 'cronometro');
            res.json({ id: this.lastID });
        }
    );
});

app.post('/cronometro/finalizar', (req, res) => {
    const { id, quarto_numero } = req.body;
    db.run(`UPDATE limpeza_cronometro SET fim=CURRENT_TIMESTAMP, status='concluido' WHERE id=?`, [id], function(err) {
        db.run('UPDATE quartos SET status="disponivel" WHERE numero=?', [quarto_numero]);
        io.emit('update', 'cronometro');
        res.json({ ok: true });
    });
});

app.get('/equipe', (req, res) => {
    db.all(`SELECT * FROM equipe WHERE ativo=1 ORDER BY nome`, (err, rows) => {
        res.json(rows);
    });
});

app.post('/reset-governanca', (req, res) => {
  db.serialize(() => {
    db.run(`UPDATE quartos SET status='disponivel' WHERE status='em_limpeza'`);
    db.run(`
      UPDATE limpeza_cronometro
      SET fim = CURRENT_TIMESTAMP,
          status = 'concluido'
      WHERE fim IS NULL
    `, function(err) {
      if (err) {
        console.error('Erro ao resetar governança:', err.message);
        return res.status(500).json({ error: err.message });
      }

      io.emit('update', 'reset-governanca');
      res.json({ ok: true, message: 'Governança resetada com sucesso.' });
    });
  });
});

app.get('/cronometro/andamento', (req, res) => {
  db.all(`
    SELECT
      id,
      quarto_numero,
      camareira,
      tipo_servico,
      inicio,
      inicio_pausa,
      COALESCE(tempo_pausa_segundos, 0) AS tempo_pausa_segundos,
      COALESCE(status, 'em_andamento') AS status,
      CASE
        WHEN COALESCE(status, 'em_andamento') = 'pausado' THEN COALESCE(segundos_decorridos, 0)
        ELSE CAST(
          (strftime('%s','now') - strftime('%s', inicio)) - COALESCE(tempo_pausa_segundos, 0)
          AS INTEGER
        )
      END AS segundos_decorridos
    FROM limpeza_cronometro
    WHERE fim IS NULL
    ORDER BY id DESC
  `, [], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar cronômetros em andamento:', err.message);
      return res.status(500).json({ error: err.message });
    }

    res.json(rows || []);
  });
});

app.post('/cronometro/pausar/:id', (req, res) => {
  const { id } = req.params;

  db.run(`
    UPDATE limpeza_cronometro
    SET
      status = 'pausado',
      inicio_pausa = CURRENT_TIMESTAMP,
      segundos_decorridos = CAST(
        (strftime('%s','now') - strftime('%s', inicio)) - COALESCE(tempo_pausa_segundos, 0)
        AS INTEGER
      )
    WHERE id = ? AND fim IS NULL
  `, [id], function(err) {
    if (err) {
      console.error('Erro ao pausar cronômetro:', err.message);
      return res.status(500).json({ error: err.message });
    }

    io.emit('update', 'cronometro-pausado');
    res.json({ ok: true, message: 'Cronômetro pausado com sucesso.' });
  });
});

app.post('/cronometro/retomar/:id', (req, res) => {
  const { id } = req.params;

  db.run(`
    UPDATE limpeza_cronometro
    SET
      tempo_pausa_segundos = COALESCE(tempo_pausa_segundos, 0) +
        CAST((strftime('%s','now') - strftime('%s', inicio_pausa)) AS INTEGER),
      inicio_pausa = NULL,
      status = 'em_andamento'
    WHERE id = ? AND fim IS NULL
  `, [id], function(err) {
    if (err) {
      console.error('Erro ao retomar cronômetro:', err.message);
      return res.status(500).json({ error: err.message });
    }

    io.emit('update', 'cronometro-retomado');
    res.json({ ok: true, message: 'Cronômetro retomado com sucesso.' });
  });
});

// ==================== ATIVIDADES DO DIA ====================
app.get('/atividades-hoje', (req, res) => {
  const hoje = new Date().toISOString().slice(0, 10);
  db.all(
    `SELECT quarto_numero, camareira_nome, tipo_servico, data
     FROM limpezas_quartos
     WHERE data = ?
     ORDER BY rowid ASC`,
    [hoje],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

io.on('connection', (socket) => { console.log('Cliente conectado'); });
server.listen(3000, () => { console.log('Servidor rodando em http://localhost:3000'); });