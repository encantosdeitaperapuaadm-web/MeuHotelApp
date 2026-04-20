const fs = require('fs');
const path = require('path');

function fazerBackup() {
  const origem = path.join(__dirname, 'hotel.db');
  const pasta = path.join(__dirname, 'backups');

  // Cria pasta de backups se não existir
  if (!fs.existsSync(pasta)) {
    fs.mkdirSync(pasta);
  }

  // Nome do arquivo com data e hora
  const agora = new Date();
  const nome = `hotel_${agora.getFullYear()}-${String(agora.getMonth()+1).padStart(2,'0')}-${String(agora.getDate()).padStart(2,'0')}_${String(agora.getHours()).padStart(2,'0')}h${String(agora.getMinutes()).padStart(2,'0')}.db`;

  const destino = path.join(pasta, nome);

  // Copia o banco
  fs.copyFileSync(origem, destino);
  console.log(`✅ Backup feito: ${nome}`);

  // Apaga backups com mais de 7 dias
  const arquivos = fs.readdirSync(pasta);
  const seteDias = 7 * 24 * 60 * 60 * 1000;
  arquivos.forEach(arq => {
    const caminho = path.join(pasta, arq);
    const stats = fs.statSync(caminho);
    if (Date.now() - stats.mtimeMs > seteDias) {
      fs.unlinkSync(caminho);
      console.log(`🗑️ Backup antigo removido: ${arq}`);
    }
  });
}

// Exporta E executa quando chamado direto
module.exports = fazerBackup;

// Executa se rodar direto: node backup.js
if (require.main === module) {
  fazerBackup();
}