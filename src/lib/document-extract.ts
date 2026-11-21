import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

const textExtensions = new Set(["txt", "md", "csv", "json", "log"]);

export async function extractSourceText(file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (textExtensions.has(extension)) {
    return file.text();
  }

  if (extension === "docx") {
    const mammoth = await import("mammoth/mammoth.browser.js");
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value;
  }

  if (extension === "pdf") {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    const document = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(
        content.items
          .map((item) => ("str" in item ? item.str : ""))
          .filter(Boolean)
          .join(" "),
      );
    }

    return pages.join("\n\n");
  }

  throw new Error("Use a PDF, DOCX, TXT, Markdown, CSV, JSON, or LOG file.");
}