import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, TableOfContents, PageBreak, Table, TableRow, TableCell, WidthType, ShadingType, Header, Footer, PageNumber } from 'docx';
import { readFileSync, writeFileSync } from 'fs';

// Read the markdown source
const md = readFileSync(new URL('../Security_CW2_Report.md', import.meta.url), 'utf8');

// Parse markdown into sections
const lines = md.split('\n');
const children = [];
let inCodeBlock = false;
let codeContent = '';
let inTable = false;
let tableRows = [];

for (const line of lines) {
  // Code blocks
  if (line.startsWith('```')) {
    if (inCodeBlock) {
      children.push(new Paragraph({
        spacing: { before: 100, after: 100 },
        shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F5F5F5' },
        children: codeContent.split('\n').map((l, i, arr) =>
          new TextRun({ text: l + (i < arr.length - 1 ? '\n' : ''), font: 'Courier New', size: 18 })
        )
      }));
      codeContent = '';
      inCodeBlock = false;
    } else {
      inCodeBlock = true;
    }
    continue;
  }
  if (inCodeBlock) { codeContent += line + '\n'; continue; }

  // Tables
  if (line.startsWith('|') && line.endsWith('|')) {
    if (line.includes('---')) continue; // separator row
    const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
    tableRows.push(cells);
    inTable = true;
    continue;
  } else if (inTable) {
    // Flush table
    if (tableRows.length > 0) {
      const colCount = tableRows[0].length;
      const colWidth = Math.floor(9000 / colCount);
      children.push(new Table({
        columnWidths: Array(colCount).fill(colWidth),
        rows: tableRows.map((row, ri) => new TableRow({
          children: row.map(cell => new TableCell({
            width: { size: colWidth, type: WidthType.DXA },
            shading: ri === 0 ? { type: ShadingType.CLEAR, color: 'auto', fill: 'D9E2F3' } : undefined,
            children: [new Paragraph({
              spacing: { before: 40, after: 40 },
              children: [new TextRun({ text: cell, size: 20, font: 'Times New Roman', bold: ri === 0 })]
            })]
          }))
        }))
      }));
      children.push(new Paragraph({ spacing: { after: 120 } }));
    }
    tableRows = [];
    inTable = false;
  }

  // Skip empty lines and horizontal rules
  if (line.trim() === '' || line.trim() === '---') continue;

  // Headings
  if (line.startsWith('# ')) {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 360, after: 160 },
      children: [new TextRun({ text: line.replace(/^# /, ''), size: 32, bold: true, font: 'Times New Roman' })]
    }));
  } else if (line.startsWith('## ')) {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 140 },
      children: [new TextRun({ text: line.replace(/^## /, ''), size: 28, bold: true, font: 'Times New Roman' })]
    }));
  } else if (line.startsWith('### ')) {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text: line.replace(/^### /, ''), size: 26, bold: true, font: 'Times New Roman' })]
    }));
  } else if (line.startsWith('#### ')) {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 200, after: 100 },
      children: [new TextRun({ text: line.replace(/^#### /, ''), size: 24, bold: true, font: 'Times New Roman' })]
    }));
  } else if (line.startsWith('**') && line.endsWith('**')) {
    // Bold standalone line (used for metadata)
    children.push(new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: line.replace(/\*\*/g, ''), bold: true, size: 24, font: 'Times New Roman' })]
    }));
  } else if (line.startsWith('- ')) {
    // Bullet point
    children.push(new Paragraph({
      spacing: { after: 60 },
      indent: { left: 720 },
      children: [
        new TextRun({ text: '• ', size: 24, font: 'Times New Roman' }),
        ...parseBoldItalic(line.slice(2))
      ]
    }));
  } else if (/^\d+\.\s/.test(line)) {
    // Numbered list
    const num = line.match(/^(\d+)\.\s/)[1];
    children.push(new Paragraph({
      spacing: { after: 60 },
      indent: { left: 720 },
      children: [
        new TextRun({ text: `${num}. `, size: 24, font: 'Times New Roman' }),
        ...parseBoldItalic(line.replace(/^\d+\.\s/, ''))
      ]
    }));
  } else {
    // Normal paragraph
    children.push(new Paragraph({
      spacing: { after: 120, line: 360 },
      alignment: AlignmentType.JUSTIFIED,
      children: parseBoldItalic(line)
    }));
  }
}

// Flush final table if exists
if (tableRows.length > 0) {
  const colCount = tableRows[0].length;
  const colWidth = Math.floor(9000 / colCount);
  children.push(new Table({
    columnWidths: Array(colCount).fill(colWidth),
    rows: tableRows.map((row, ri) => new TableRow({
      children: row.map(cell => new TableCell({
        width: { size: colWidth, type: WidthType.DXA },
        shading: ri === 0 ? { type: ShadingType.CLEAR, color: 'auto', fill: 'D9E2F3' } : undefined,
        children: [new Paragraph({
          spacing: { before: 40, after: 40 },
          children: [new TextRun({ text: cell, size: 20, font: 'Times New Roman', bold: ri === 0 })]
        })]
      }))
    }))
  }));
}

function parseBoldItalic(text) {
  const runs = [];
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|([^*`]+))/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[2]) runs.push(new TextRun({ text: match[2], bold: true, italics: true, size: 24, font: 'Times New Roman' }));
    else if (match[3]) runs.push(new TextRun({ text: match[3], bold: true, size: 24, font: 'Times New Roman' }));
    else if (match[4]) runs.push(new TextRun({ text: match[4], italics: true, size: 24, font: 'Times New Roman' }));
    else if (match[5]) runs.push(new TextRun({ text: match[5], font: 'Courier New', size: 20 }));
    else if (match[6]) runs.push(new TextRun({ text: match[6], size: 24, font: 'Times New Roman' }));
  }
  return runs.length ? runs : [new TextRun({ text, size: 24, font: 'Times New Roman' })];
}

const doc = new Document({
  sections: [{
    properties: {
      page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: 'ST6005CEM Security — Coursework 2', size: 18, italics: true, font: 'Times New Roman', color: '666666' })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ children: [PageNumber.CURRENT], size: 20, font: 'Times New Roman' })]
        })]
      })
    },
    children
  }]
});

const buffer = await Packer.toBuffer(doc);
writeFileSync(new URL('../Security_CW2_Report.docx', import.meta.url), buffer);
console.log('✓ Report generated: Security_CW2_Report.docx');
