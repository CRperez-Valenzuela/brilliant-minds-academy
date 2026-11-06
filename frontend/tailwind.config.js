/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,js}"],
  theme: {
    extend: {
      // Tipografía: Inter (texto) y Outfit (títulos, etiquetas del login y firma). Se cargan desde Google Fonts en admin/index.html;
      // si no llegan, caen a la pila del sistema sin romper el diseño.
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      // Identidad visual de Brilliant Minds Academy (logotipo oficial + paleta corporativa).
      // Uso: bg-bma-azul, text-bma-purpura, border-bma-coral, ring-bma-azul, etc.
      // Cada color expone además `suave` (fondo tenue para estados) y `oscuro` (texto/hover con contraste AA sobre su fondo suave):
      //   · #0073BB (azul) y #8C59A4 (púrpura) admiten texto blanco encima (5.04:1 y 5.15:1).
      //   · #4BB387 (verde), #F37365 (coral) y #F9D03D (amarillo) NO alcanzan 4.5:1 con texto blanco (2.59 · 2.82 · 1.49):
      //     úsalos solo como fondo/acento/borde con texto oscuro (`text-bma-*-oscuro`), nunca como fondo de texto blanco.
      //   · Pares auditados (WCAG 2.1 AA, ≥ 4.5:1): verde-oscuro/verde-suave 5.20 · coral-oscuro/coral-suave 6.01 ·
      //     amarillo-oscuro/amarillo-suave 5.12 · blanco/coral-oscuro 6.86 · blanco/verde-oscuro 5.78.
      colors: {
        // Acento principal: botones, focos de inputs y enlaces (también botones de WhatsApp).
        'bma-azul': { DEFAULT: '#0073BB', suave: '#E6F2FA', oscuro: '#005A92' },
        // Éxito y badges «Activo».
        'bma-verde': { DEFAULT: '#4BB387', suave: '#E8F6F0', oscuro: '#2A7253' },
        // Alertas de cobro, badges «Moroso» y botón «Retirar».
        'bma-coral': { DEFAULT: '#F37365', suave: '#FEECEA', oscuro: '#A23429' },
        // Avisos de contingencia y advertencias.
        'bma-amarillo': { DEFAULT: '#F9D03D', suave: '#FEF7DC', oscuro: '#82650C' },
        // Cabeceras de tablas, candados premium y títulos secundarios.
        'bma-purpura': { DEFAULT: '#8C59A4', suave: '#F3ECF7', oscuro: '#6B3F82' },
      },
    },
  },
  plugins: [],
};
