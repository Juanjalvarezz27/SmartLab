import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Minimalista Salud
        "fondo": "#F5F5F7",       // El blanco hueso clásico de Apple
        "superficie": "#FFFFFF",  // Blanco puro para tarjetas y contenedores
        "primario": {
          DEFAULT: "#0071E3",     // Azul clínico (confianza y seriedad)
          light: "#E8F2FF",       // Versión suave para backgrounds de botones
        },
        "acento": {
          DEFAULT: "#F56300",     // Naranja para detalles muy específicos
        },
        "texto": {
          principal: "#1D1D1F",   // Gris casi negro para lectura cómoda
          secundario: "#86868B",  // Gris para etiquetas y datos menos importantes
        },
        "borde": "#D2D2D7",       // Gris muy suave para separadores
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        title: ["var(--font-montserrat)", "sans-serif"],
      },
      // Sombras sutiles estilo Apple
      boxShadow: {
        'apple': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'apple-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
};

export default config;