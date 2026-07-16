// Mock text matching the OCR of the PDF pages
const mockPdfText = `
Título: Book NPA Código: D04
VP/Diretoria: Logística | Qualidade Indoor Versão: 82
Área: Gerência de Terminais Data da Revisão: 17/06/2026
CLASSIFICAÇÃO: EXTERNA 1/117
DOCUMENTO
Histórico de Revisões:
Versão:
80
Data de Revisão:
26/05/2026
Histórico:
• Inclusão da versão CP19N950U40 no terminal N950U, inclusão da nova 
versão CD21NSP9340 do terminal SP930 e exclusão das versões 
CL19BPLL340, CL19BPLLM40, CQ19BPLLM40, CQ19BPLL34 na LIO.
Versão:
81
Data de Revisão:
29/05/2026
Histórico:
• Inclusão da versão CO19IDX8K40 no terminal DX8000, inclusão da nova 
versão CJ19PL40040 do terminal L400 e inclusão das versões CQ19BPLLM40
e CQ19BPLL34 na LIO.
Versão:
82
Data de Revisão: 
17/06/2026
Histórico:
• Inclusão da versão CP19PL30040 no terminal L300.

Modelo
Campo 
Versão Atual
Mat. SAP
SP930 CG19NSP9340 CD21NSP9340 605569 Newland SP930 Combo Sim
ME60 CA19NME6040 605668 Terminal POS ME60 Sim
LIO ON CB20BPLL340 CB20BPLLM40 CQ19BPLLM40 CQ19BPLL34 605340 Smart Terminal LIO 3
Q92X CA19PQ92X40 605838 Terminal Tectoy Q92X Combo
DX8000 CO19IDX8K40 605736 Smart Terminal DX8000
GPOS720 1.1.69.133 1.1.69.135 605849 GPOS720 SMART TEF
L400 CJ19PL40040 CO19PL40040 606049 Smart Terminal L400
L300 CF19PL30040 CO19PL30040 CP19PL30040 606074 Smart Terminal L300
PPC930 2.12 604800 Terminal Eletrônico PIN PAD
S920 TEF Móv. G07.13.05R000 240416 604825 Terminal Eletrônico PAX S920
MP15 CI11SOFMU41 605543 PINPAD BLT GERTEC MP15
N950U CP19N950U40 606194 Cielo Smart Newland N950U
N950K - 606170 Cielo Smart Newland N950K
`;

const normalizeText = (text) => {
  return text.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ');
};

const testParserLogic = () => {
  const normalizedText = normalizeText(mockPdfText);

  // Extract version
  const versionMatch = normalizedText.match(/Versão:\s*(\d+)/i) || normalizedText.match(/Versão\s+(\d+)/i);
  const docVersion = versionMatch ? parseInt(versionMatch[1], 10) : null;

  // Extract revision date
  const dateMatch = normalizedText.match(/Data da Revisão:\s*(\d{2}\/\d{2}\/\d{4})/i) || normalizedText.match(/Data da Revisão\s+(\d{2}\/\d{2}\/\d{4})/i);
  const docDate = dateMatch ? dateMatch[1] : null;

  console.log('--- TESTANDO PARSER DE CABEÇALHO ---');
  console.log(`Versão encontrada: ${docVersion} (Esperado: 82)`);
  console.log(`Data encontrada: ${docDate} (Esperado: 17/06/2026)`);

  // Extract terminal versions
  const terminalMappings = [
    { model: 'SP930', regex: /SP930\s+([A-Z0-9\s/-]+?)\s+605569/i },
    { model: 'ME60', regex: /ME60\s+([A-Z0-9\s/-]+?)\s+605668/i },
    { model: 'LIO ON', regex: /LIO\s+ON\s+([A-Z0-9\s/-]+?)\s+605340/i },
    { model: 'Q92X', regex: /Q92X\s+([A-Z0-9\s/-]+?)\s+605838/i },
    { model: 'DX8000', regex: /DX8000\s+([A-Z0-9\s/-]+?)\s+605736/i },
    { model: 'GPOS720', regex: /GPOS720\s+([0-9.\s/-]+?)\s+605849/i },
    { model: 'L400', regex: /L400\s+([A-Z0-9\s/-]+?)\s+606049/i },
    { model: 'L300', regex: /L300\s+([A-Z0-9\s/-]+?)\s+606074/i },
    { model: 'PPC930', regex: /PPC930\s+([0-9.\s/-]+?)\s+604800/i },
    { model: 'S920', regex: /S920(?:\s+TEF\s+Móv[a-z.]*)?\s+([A-Z0-9.\s/-]+?)\s+604825/i },
    { model: 'MP15', regex: /MP15\s+([A-Z0-9\s/-]+?)\s+605543/i },
    { model: 'N950U', regex: /N950U\s+([A-Z0-9\s/-]+?)\s+606194/i },
    { model: 'N950K', regex: /N950K\s+([A-Z0-9\s-/]+?)\s+606170/i },
  ];

  console.log('\n--- TESTANDO PARSER DE TERMINAIS ---');
  const terminalVersions = {};
  for (const item of terminalMappings) {
    const match = normalizedText.match(item.regex);
    if (match) {
      const versionStr = match[1].trim().replace(/\s+/g, ' / ');
      terminalVersions[item.model] = versionStr;
      console.log(`[OK] ${item.model}: ${versionStr}`);
    } else {
      console.log(`[ERRO] ${item.model} não foi encontrado.`);
    }
  }

  // Extract revision history
  console.log('\n--- TESTANDO PARSER DE HISTÓRICO DE REVISÕES ---');
  const revisions = [];
  const revisionRegex = /Versão:\s*(\d+)\s*Data de Revisão:\s*(\d{2}\/\d{2}\/\d{4})\s*Histórico:\s*(?:•\s*)?([^•]+?)(?=\s*Versão:|\s*Índice:|\s*I\.\s*Objetivo:|\s*Modelo\s+Campo|$)/gi;
  
  let match;
  while ((match = revisionRegex.exec(normalizedText)) !== null) {
    const versionNum = parseInt(match[1], 10);
    const revisionDate = match[2].trim();
    const description = match[3].replace(/\s+/g, ' ').trim();
    
    revisions.push({
      version: versionNum,
      revision_date: revisionDate,
      description: description
    });
  }

  console.log(`Total de revisões extraídas: ${revisions.length} (Esperado: 3)`);
  revisions.forEach(rev => {
    console.log(`- V${rev.version} (${rev.revision_date}): ${rev.description}`);
  });
};

testParserLogic();
