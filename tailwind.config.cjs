/*
 * EN: Tailwind configuration — the single source of truth for NEOMATTEN brand
 *     design tokens (light theme, red accent #8B1A1A, chrome silver, Montserrat,
 *     brand shadows/gradients/breakpoints). Authored as .cjs so it loads as
 *     CommonJS under the package's "type": "module" setting.
 * RU: Конфигурация Tailwind — единый источник бренд-токенов NEOMATTEN (светлая
 *     тема, красный акцент #8B1A1A, хром-серебро, Montserrat, фирменные тени/
 *     градиенты/брейкпоинты). Файл .cjs, чтобы грузиться как CommonJS при
 *     "type": "module".
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,scss}'],
  theme: {
    fontFamily: {
      // Montserrat is the single project typeface (display + body).
      montserrat: ['Montserrat', 'sans-serif'],
      sans: ['Montserrat', 'sans-serif'],
    },
    extend: {
      screens: {
        xs: '480px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
      },
      maxWidth: {
        container: '1280px',
      },
      zIndex: {
        header: '1000',
        popup: '2000',
        discount: '2100',
        // Toasts sit above every overlay (header/popup/discount dialogs).
        toast: '2200',
      },
      colors: {
        // ===================================================================
        // NEOMATTEN brand palette (light theme + red accent + chrome silver).
        // Source of truth lives as CSS custom properties in src/styles.scss;
        // these named tokens mirror them so Tailwind utilities stay on-brand.
        // ===================================================================

        // Primary red — buttons, borders, icons, links.
        primary: {
          DEFAULT: '#8B1A1A',
          bright: '#C0392B', // hover / lighter accent
          50: '#FBEAEA',
          100: '#F4CACA',
          200: '#E79A9A',
          300: '#D96A6A',
          400: '#C0392B',
          500: '#8B1A1A',
          600: '#7A1717',
          700: '#621212',
          800: '#4A0E0E',
          900: '#330909',
        },

        // Near-black ink — header, footer, dark sections, primary text.
        ink: {
          DEFAULT: '#1A1A1A',
          soft: '#222222',
          900: '#0D0D0D',
        },

        // Chrome / silver — metallic accents.
        chrome: {
          light: '#E8E8E8',
          mid: '#B0B0B0',
          dark: '#707070',
          silver: '#C0C0C0',
        },

        // Light surfaces / backgrounds.
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F5F5F5',
          muted: '#F2F2F2',
          input: '#F5F5F5',
        },

        // Neutral text scale (on light backgrounds).
        content: {
          DEFAULT: '#1A1A1A',
          secondary: '#555555',
          muted: '#888888',
          inverse: '#FFFFFF',
        },

        border: {
          DEFAULT: '#E4E4E4',
          dark: '#2C2C2C',
          accent: '#8B1A1A',
        },

        accent: {
          gold: '#C9A84C',
          silver: '#C0C0C0',
        },

        // Semantic feedback colors.
        success: '#2A9E58',
        warning: '#D97706',
        error: '#DC2626',
        info: '#2563EB',
      },
      boxShadow: {
        card: '0 4px 20px rgba(139, 26, 26, 0.15)',
        soft: '0 6px 24px rgba(0, 0, 0, 0.08)',
        elev: '0 20px 50px rgba(0, 0, 0, 0.18)',
        'glow-red': '0 4px 15px rgba(139, 26, 26, 0.4)',
      },
      borderRadius: {
        sm: '4px',
        md: '10px',
        lg: '16px',
      },
      backgroundImage: {
        'gradient-red': 'linear-gradient(135deg, #8B1A1A 0%, #C0392B 100%)',
        'gradient-hero': 'linear-gradient(135deg, #FFFFFF 0%, #F5F5F5 55%, #ECECEC 100%)',
        'gradient-dark': 'linear-gradient(135deg, #1A1A1A 0%, #0D0D0D 100%)',
        'gradient-chrome':
          'linear-gradient(135deg, #EDEDED 0%, #BFBFBF 45%, #E0E0E0 60%, #9C9C9C 100%)',
      },
      transitionTimingFunction: {
        'ease-out-brand': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
