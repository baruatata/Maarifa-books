import JSZip from "jszip";

const MAX_PREVIEW_BYTES = 35 * 1024 * 1024;

function normalized(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .toUpperCase()
    // PDF extraction may split stylized headings into single-character tokens (e.g. "S U R A").
    .replace(/(?<!\\S)(?:[A-Z0-9]\\s+){1,}[A-Z0-9](?!\\S)/g, (match) => match.replace(/\\s+/g, ""))
    .replace(/\\s+/g, " ");
}

function chapterPattern(number: 1 | 2) {
  // Supports named headings and numbered styles such as "SURA YA 01" / "SURA YA 02".
  const swahili = number === 1 ? "(?:KWANZA|0?\\\\s*1|I)" : "(?:PILI|0?\\\\s*2|II)";
  const english = number === 1 ? "(?:ONE|0?\\\\s*1|I)" : "(?:TWO|0?\\\\s*2|II)";
  return new RegExp(`\\\\bSURA\\\\s+(?:YA\\\\s+)?${swahili}\\\\b|\\\\bCHAPTER\\\\s+${english}\\\\b`, "i");
}

function isContentsPage(value: string) {
  return /\b(YALIYOMO|CONTENTS|TABLE OF CONTENTS)\b/i.test(value);
}

function resolveZipPath(baseFile: string, href: string) {
  const parts = baseFile.split("/").slice(0, -1);
  for (const part of href.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(decodeURIComponent(part.split("#")[0].split("?")[0]));
  }
  return parts.join("/");
}

function requirePreviewSize(blob: Blob) {
  if (blob.size > MAX_PREVIEW_BYTES) {
    throw new Error("Sampuli iliyotengenezwa imezidi MB 35. Punguza ukubwa wa picha ndani ya kitabu au pakia toleo lililobanwa zaidi.");
  }
  if (blob.size === 0) throw new Error("Mfumo haukuweza kutengeneza sampuli ya sura ya kwanza.");
  return blob;
}

export async function createFirstChapterPreview(file: File, format: "pdf" | "epub"): Promise<Blob> {
  if (format === "pdf") return createPdfPreview(file);
  return createEpubPreview(file);
}

async function createPdfPreview(file: File): Promise<Blob> {
  let source: any = null;
  try {
    const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/pdf.worker.min.mjs";
    const loading = pdfjs.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
      isEvalSupported: false,
    });
    source = await loading.promise;

    const pageTexts: string[] = [];
    for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber++) {
      const page = await source.getPage(pageNumber);
      const content = await page.getTextContent();
      pageTexts.push(content.items.map((item: any) => typeof item.str === "string" ? item.str : "").join(" "));
    }

    const firstChapter = chapterPattern(1);
    const secondChapter = chapterPattern(2);
    const startIndex = pageTexts.findIndex((text) =>
      firstChapter.test(normalized(text)) &&
      !isContentsPage(text) &&
      !secondChapter.test(normalized(text))
    );
    if (startIndex < 0) {
      throw new Error("Mfumo haujatambua mwanzo wa Sura ya Kwanza kwenye PDF. Hakikisha kichwa kimeandikwa “SURA YA KWANZA” au “CHAPTER ONE”.");
    }

    let endIndex = -1;
    for (let index = startIndex + 1; index < pageTexts.length; index++) {
      const text = normalized(pageTexts[index]);
      if (secondChapter.test(text) && !isContentsPage(text)) {
        endIndex = index;
        break;
      }
    }
    if (endIndex < 0) {
      throw new Error("Mfumo haujapata mwanzo wa Sura ya Pili. Ili kuzuia kuonyesha kitabu kizima, hakikisha sura zina vichwa vinavyojitambulisha.");
    }
    const { PDFDocument } = await import("pdf-lib");
    const original = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: false });
    const preview = await PDFDocument.create();
    const indices = Array.from({ length: endIndex - startIndex }, (_, index) => startIndex + index);
    const pages = await preview.copyPages(original, indices);
    pages.forEach((page) => preview.addPage(page));
    const bytes = await preview.save();
    return requirePreviewSize(new Blob([bytes as BlobPart], { type: "application/pdf" }));
  } catch (error) {
    if (error instanceof Error && (error.message.startsWith("Mfumo") || error.message.startsWith("Sura") || error.message.startsWith("Sampuli"))) throw error;
    throw new Error("PDF haikuweza kuchambuliwa ili kutoa sura ya kwanza. Hakikisha inafunguka na si PDF iliyofungwa kwa nenosiri.");
  } finally {
    if (source) await source.destroy();
  }
}

async function createEpubPreview(file: File): Promise<Blob> {
  try {
    const zip = await JSZip.loadAsync(file);
    const containerFile = zip.file("META-INF/container.xml");
    if (!containerFile) throw new Error("EPUB haijakamilika: container.xml haipo.");
    const containerXml = await containerFile.async("text");
    const containerDoc = new DOMParser().parseFromString(containerXml, "application/xml");
    const rootfile = containerDoc.getElementsByTagName("rootfile")[0];
    const opfPath = rootfile?.getAttribute("full-path");
    if (!opfPath) throw new Error("EPUB haijaonyesha mahali pa kitabu chake.");
    const opfFile = zip.file(opfPath);
    if (!opfFile) throw new Error("Faili la maelezo ya EPUB halijapatikana.");

    const opfXml = await opfFile.async("text");
    const opfDoc = new DOMParser().parseFromString(opfXml, "application/xml");
    const manifestItems = Array.from(opfDoc.getElementsByTagName("item"));
    const itemById = new Map(manifestItems.map((item) => [item.getAttribute("id") || "", item]));
    const spine = opfDoc.getElementsByTagName("spine")[0];
    if (!spine) throw new Error("EPUB haina mpangilio wa sura (spine).");

    const spineRefs = Array.from(spine.getElementsByTagName("itemref"));
    const chapters: { id: string; path: string; text: string }[] = [];
    for (const ref of spineRefs) {
      const id = ref.getAttribute("idref") || "";
      const item = itemById.get(id);
      const href = item?.getAttribute("href");
      if (!item || !href || item.getAttribute("media-type") !== "application/xhtml+xml") continue;
      const path = resolveZipPath(opfPath, href);
      const chapterFile = zip.file(path);
      if (!chapterFile) continue;
      const html = await chapterFile.async("text");
      const doc = new DOMParser().parseFromString(html, "text/html");
      chapters.push({ id, path, text: doc.body?.textContent || doc.documentElement.textContent || "" });
    }

    const firstChapter = chapterPattern(1);
    const secondChapter = chapterPattern(2);
    const startIndex = chapters.findIndex((chapter) =>
      firstChapter.test(normalized(chapter.text)) &&
      !isContentsPage(chapter.text) &&
      !secondChapter.test(normalized(chapter.text))
    );
    if (startIndex < 0) {
      throw new Error("Mfumo haujatambua Sura ya Kwanza ndani ya EPUB. Hakikisha kichwa kimeandikwa “SURA YA KWANZA” au “CHAPTER ONE”.");
    }
    const endIndex = chapters.findIndex((chapter, index) =>
      index > startIndex && secondChapter.test(normalized(chapter.text)) && !isContentsPage(chapter.text)
    );
    if (endIndex < 0) {
      throw new Error("Mfumo haujapata Sura ya Pili ndani ya EPUB. Hakikisha kila sura imewekwa kama sehemu yake kwenye EPUB.");
    }

    const selected = chapters[startIndex];
    const selectedItem = itemById.get(selected.id);
    if (!selectedItem) throw new Error("Sura ya kwanza haikuweza kutambuliwa.");
    const navItems = manifestItems.filter((item) => (item.getAttribute("properties") || "").split(/\s+/).includes("nav"));
    const navPaths = new Set(navItems.map((item) => resolveZipPath(opfPath, item.getAttribute("href") || "")));

    for (const ref of spineRefs) {
      if (ref.getAttribute("idref") !== selected.id) ref.parentNode?.removeChild(ref);
    }

    for (const item of manifestItems) {
      if (item.getAttribute("media-type") !== "application/xhtml+xml") continue;
      const id = item.getAttribute("id") || "";
      const href = item.getAttribute("href") || "";
      const path = resolveZipPath(opfPath, href);
      if (id !== selected.id && !navPaths.has(path)) {
        zip.remove(path);
        item.parentNode?.removeChild(item);
      }
    }

    for (const path of Object.keys(zip.files)) {
      if (/\.(?:xhtml|html)$/i.test(path) && path !== selected.path && !navPaths.has(path)) zip.remove(path);
    }

    zip.file(opfPath, new XMLSerializer().serializeToString(opfDoc));
    const mimeFile = zip.file("mimetype");
    if (mimeFile) {
      const mimeText = await mimeFile.async("text");
      zip.file("mimetype", mimeText, { compression: "STORE" });
    }
    const preview = await zip.generateAsync({
      type: "blob",
      mimeType: "application/epub+zip",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });
    return requirePreviewSize(preview);
  } catch (error) {
    if (error instanceof Error && (error.message.startsWith("Mfumo") || error.message.startsWith("EPUB") || error.message.startsWith("Sampuli") || error.message.startsWith("Sura"))) throw error;
    throw new Error("EPUB haikuweza kuchambuliwa ili kutoa sura ya kwanza. Hakikisha ni EPUB halali yenye mpangilio wa sura.");
  }
}
