/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,js}"],
  theme: {
    extend: {
      // Identidad visual de Brilliant Minds Academy (logotipo oficial + paleta corporativa).
      // Uso: bg-bma-azul, text-bma-purpura, border-bma-coral, ring-bma-azul, etc.
      // Cada color expone además `suave` (fondo tenue para estados) y `oscuro` (texto/hover con contraste AA sobre blanco):
      //   · #0073BB (azul) y #8C59A4 (púrpura) admiten texto blanco encima (≥ 4.5:1).
      //   · #4BB387 (verde), #F37365 (coral) y #F9D03D (amarillo) NO alcanzan 4.5:1 con texto blanco: úsalos como
      //     fondo/acento con texto oscuro (`text-bma-*-oscuro` o `text-slate-900`), nunca como fondo de texto blanco.
      colors: {
        // Acento principal: botones, focos y enlaces.
        'bma-azul': { DEFAULT: '#0073BB', suave: '#E6F2FA', oscuro: '#005A92' },
        // Éxito y estados «Activo».
        'bma-verde': { DEFAULT: '#4BB387', suave: '#E8F6F0', oscuro: '#1F6B4B' },
        // Alertas de cobro y estados «Moroso».
        'bma-coral': { DEFAULT: '#F37365', suave: '#FEECEA', oscuro: '#B3362A' },
        // Destellos y avisos de contingencia.
        'bma-amarillo': { DEFAULT: '#F9D03D', suave: '#FEF7DC', oscuro: '#7A5B00' },
        // Módulos premium y cabeceras de tablas.
        'bma-purpura': { DEFAULT: '#8C59A4', suave: '#F3ECF7', oscuro: '#6B3F82' },
      },
    },
  },
  plugins: [],
};
