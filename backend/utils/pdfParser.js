const pdfParse = require('pdf-parse');

const parseBookPdf = async (fileBuffer) => {
  try {
    const data = await pdfParse(fileBuffer);
    const text = data.text;
    
    // Normalize text (replace all newlines/tabs with simple spaces)
    const normalizedText = text.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ');

    // Extract document version (e.g., "Versão: 82")
    // Match "Versão: [number]" or "Versão [number]"
    const versionMatch = normalizedText.match(/Versão:\s*(\d+)/i) || normalizedText.match(/Versão\s+(\d+)/i);
    const docVersion = versionMatch ? parseInt(versionMatch[1], 10) : null;

    // Extract revision date (e.g., "Data da Revisão: 17/06/2026")
    const dateMatch = normalizedText.match(/Data da Revisão:\s*(\d{2}\/\d{2}\/\d{4})/i) || normalizedText.match(/Data da Revisão\s+(\d{2}\/\d{2}\/\d{4})/i);
    const docDate = dateMatch ? dateMatch[1] : new Date().toLocaleDateString('pt-BR');

    // Extract terminal software versions from the summary table
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

    const terminalVersions = {};
    for (const item of terminalMappings) {
      const match = normalizedText.match(item.regex);
      if (match) {
        // Clean version string (remove excessive spacing)
        const versionStr = match[1].trim().replace(/\s+/g, ' / ');
        terminalVersions[item.model] = versionStr;
      }
    }

    // Extract revision history items
    // Format in PDF is:
    // Versão: [version] Data de Revisão: [date] Histórico: • [description]
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

    return {
      docVersion,
      docDate,
      terminalVersions,
      revisions
    };
  } catch (error) {
    console.error('[PDF_PARSER_ERROR]', error);
    throw error;
  }
};

module.exports = { parseBookPdf };
