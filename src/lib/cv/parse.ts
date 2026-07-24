export interface ParsedCv {
  text: string;
  fileName: string;
  mimeType: string;
  parsed: boolean;
  parser: 'pdf-parse' | 'mammoth' | 'plain-text' | 'unsupported' | 'error';
  sections: string[];
  warnings: string[];
}

const MAX_CV_CHARS = 30000;

function detectSections(text: string) {
  const sectionNames = [
    'summary',
    'experience',
    'work experience',
    'employment',
    'projects',
    'skills',
    'education',
    'certifications',
    'publications',
    'achievements',
  ];
  const lower = text.toLowerCase();
  return sectionNames.filter((section) => lower.includes(section));
}

function trimText(text: string) {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return normalized.length > MAX_CV_CHARS ? normalized.slice(0, MAX_CV_CHARS) : normalized;
}

export async function parseCvFile(file: File | null): Promise<ParsedCv | null> {
  if (!file || file.size === 0) return null;

  const fileName = file.name || 'uploaded-cv';
  const mimeType = file.type || 'application/octet-stream';
  const lowerName = fileName.toLowerCase();
  const warnings: string[] = [];

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    let text = '';
    let parser: ParsedCv['parser'] = 'unsupported';

    if (mimeType === 'application/pdf' || lowerName.endsWith('.pdf')) {
      const { PDFParse } = await import('pdf-parse');
      const pdfParser = new PDFParse({ data: buffer });
      try {
        const result = await pdfParser.getText();
        text = result.text || '';
        parser = 'pdf-parse';
      } finally {
        await pdfParser.destroy();
      }
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      lowerName.endsWith('.docx')
    ) {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      text = result.value || '';
      parser = 'mammoth';
      if (result.messages?.length) {
        warnings.push(...result.messages.map((message) => message.message));
      }
    } else if (mimeType.startsWith('text/') || lowerName.endsWith('.txt')) {
      text = buffer.toString('utf8');
      parser = 'plain-text';
    } else if (lowerName.endsWith('.doc')) {
      warnings.push('Legacy .doc files are not supported by mammoth. Please upload .docx for best results.');
    } else {
      warnings.push(`Unsupported CV file type: ${mimeType || fileName}`);
    }

    const parsedText = trimText(text);
    if (!parsedText && parser !== 'unsupported') {
      warnings.push('The CV parser did not find readable text in this file.');
    }

    return {
      text: parsedText,
      fileName,
      mimeType,
      parsed: Boolean(parsedText),
      parser,
      sections: detectSections(parsedText),
      warnings,
    };
  } catch (error) {
    return {
      text: '',
      fileName,
      mimeType,
      parsed: false,
      parser: 'error',
      sections: [],
      warnings: [error instanceof Error ? error.message : 'Failed to parse CV file.'],
    };
  }
}
