import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { guideSections } from "../guide-content";

function ascii(value: string) {
  return value
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/→/g, "->")
    .replace(/↓/g, "v")
    .replace(/•/g, "-");
}

export async function GET() {
  const pdf = await PDFDocument.create();
  pdf.setTitle("MaarifaBooks - Mwongozo wa Matumizi");
  pdf.setAuthor("MaarifaBooks");
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 52;
  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - 62;

  const addPage = () => {
    page = pdf.addPage([pageWidth, pageHeight]);
    y = pageHeight - 58;
  };
  const drawText = (text: string, size = 10, isBold = false, color = rgb(0.12, 0.16, 0.23)) => {
    page.drawText(ascii(text), { x: margin, y, size, font: isBold ? bold : regular, color });
    y -= size + 7;
  };
  const wrap = (text: string, size: number, font: typeof regular, maxWidth: number) => {
    const words = ascii(text).split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const next = line ? line + " " + word : word;
      if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
    return lines;
  };
  const paragraph = (text: string, size = 9.5, isBold = false, indent = 0) => {
    const font = isBold ? bold : regular;
    const lines = wrap(text, size, font, pageWidth - margin * 2 - indent);
    for (const line of lines) {
      if (y < 58) addPage();
      page.drawText(line, { x: margin + indent, y, size, font, color: rgb(0.16, 0.19, 0.25) });
      y -= size + 5;
    }
    y -= 3;
  };
  const heading = (text: string) => {
    if (y < 95) addPage();
    y -= 8;
    drawText(text, 14, true, rgb(0.08, 0.22, 0.35));
    y -= 2;
  };

  page.drawText("MAARIFABOOKS", { x: margin, y: y - 35, size: 26, font: bold, color: rgb(0.08, 0.18, 0.31) });
  y -= 72;
  drawText("MWONGOZO WA MATUMIZI YA MFUMO", 16, true, rgb(0.08, 0.22, 0.35));
  drawText("Mafunzo kwa Wanunuzi na Wauzaji", 11, false, rgb(0.35, 0.4, 0.47));
  y -= 12;
  paragraph("Soma. Jifunze. Endelea. | Tovuti: https://maarifabooks.vercel.app", 10, true);
  y -= 18;

  for (const section of guideSections) {
    if (y < 100) addPage();
    heading(section.title);
    if (section.intro) paragraph(section.intro);
    if (section.steps) {
      section.steps.forEach((step, index) => paragraph((index + 1) + ". " + step, 9.3, false, 8));
    }
    if (section.note) {
      paragraph("Kumbuka: " + section.note, 9, true, 8);
    }
  }

  const pages = pdf.getPages();
  pages.forEach((p, index) => {
    p.drawLine({ start: { x: margin, y: 35 }, end: { x: pageWidth - margin, y: 35 }, thickness: 0.5, color: rgb(0.82, 0.85, 0.89) });
    p.drawText("MaarifaBooks | Mwongozo wa Matumizi", { x: margin, y: 21, size: 8, font: regular, color: rgb(0.4, 0.44, 0.5) });
    p.drawText("Ukurasa " + (index + 1), { x: pageWidth - margin - 55, y: 21, size: 8, font: regular, color: rgb(0.4, 0.44, 0.5) });
  });

  const bytes = await pdf.save();
  return new Response(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="MaarifaBooks-Mwongozo-wa-Matumizi.pdf"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}