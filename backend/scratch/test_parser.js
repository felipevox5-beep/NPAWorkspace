const fs = require('fs');
const path = require('path');
const { parseBookPdf } = require('../utils/pdfParser');

const test = async () => {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Por favor, informe o caminho do arquivo PDF de teste.');
    console.log('Exemplo: node backend/scratch/test_parser.js "C:\\Users\\FBernardo\\Desktop\\Manual D04.pdf"');
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`Arquivo não encontrado: ${absolutePath}`);
    process.exit(1);
  }

  console.log(`Lendo arquivo: ${absolutePath}`);
  const buffer = fs.readFileSync(absolutePath);
  
  console.log('Iniciando análise do PDF...');
  const result = await parseBookPdf(buffer);
  
  console.log('\n--- RESULTADO DA ANÁLISE ---');
  console.log(`Versão do Documento: ${result.docVersion}`);
  console.log(`Data da Revisão: ${result.docDate}`);
  console.log(`Total de Versões de Terminais Extraídas: ${Object.keys(result.terminalVersions).length}`);
  console.log('Versões extraídas:');
  console.log(JSON.stringify(result.terminalVersions, null, 2));
  console.log(`\nRevisões Históricas Encontradas: ${result.revisions.length}`);
  if (result.revisions.length > 0) {
    console.log('Última revisão do histórico:');
    console.log(JSON.stringify(result.revisions[0], null, 2));
  }
};

test().catch(err => {
  console.error('Erro no teste:', err);
});
