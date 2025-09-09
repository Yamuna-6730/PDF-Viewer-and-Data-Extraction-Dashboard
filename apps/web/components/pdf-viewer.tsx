"use client";

import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";
import { Button } from "@/components/ui/button";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;

export default function PdfViewer({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageNum, setPageNum] = useState(1);

  useEffect(() => {
    const loadPdf = async () => {
      const pdfDoc = await pdfjsLib.getDocument(url).promise;
      setPdf(pdfDoc);
      setPageNum(1);
    };
    if (url) loadPdf();
  }, [url]);

  useEffect(() => {
    const renderPage = async () => {
      if (!pdf || !containerRef.current) return;
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport }).promise;

      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(canvas);
    };
    renderPage();
  }, [pdf, pageNum]);

  return (
    <div className="flex flex-col items-center gap-2 bg-gray-900 p-2 rounded">
      <div ref={containerRef} className="w-full h-[600px] overflow-auto border border-yellow-400 rounded" />
      <div className="flex gap-2">
        <Button onClick={() => setPageNum((p) => Math.max(1, p - 1))}>Prev</Button>
        <span className="text-yellow-400">{pageNum}</span>
        <Button onClick={() => setPageNum((p) => Math.min(pdf?.numPages || 1, p + 1))}>Next</Button>
      </div>
    </div>
  );
}
