// Stub for jspdf's optional peer dependencies (canvg, html2canvas, dompurify).
// jspdf dynamically imports these only when rendering SVG/HTML into a PDF.
// We only emit text PDFs, so they are never actually invoked — but Vite still
// has to resolve the import, and the packages aren't installed. Aliasing them
// here keeps the bundler happy without pulling in ~1MB of unused dependencies.
export default {};
