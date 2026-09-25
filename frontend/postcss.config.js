/* ==========================================================================
   GENESIS — POSTCSS
   Sem este ficheiro o Vite nunca invocava o Tailwind: as diretivas
   @tailwind base/components/utilities em src/index.css eram ignoradas e
   todo o layout escrito com utilities nao produzia CSS (bug raiz do aspeto
   "inacabado"). Com postcss + tailwind + autoprefixer as utilities passam a
   ser geradas e prefixadas para Safari/iOS.
   ========================================================================== */
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
