import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // jspdf's optional SVG/HTML renderers — see src/lib/empty-module.ts
      canvg: path.resolve(__dirname, "./src/lib/empty-module.ts"),
      html2canvas: path.resolve(__dirname, "./src/lib/empty-module.ts"),
      dompurify: path.resolve(__dirname, "./src/lib/empty-module.ts"),
    },
  },
}));
