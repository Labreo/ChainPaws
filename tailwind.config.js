/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "#080c14",
        card: "rgba(15, 23, 42, 0.75)",
        cardBorder: "rgba(255, 255, 255, 0.08)",
        primary: {
          DEFAULT: "#00F3FF",
          glow: "rgba(0, 243, 255, 0.35)",
          dark: "#00b8c4",
        },
        secondary: {
          DEFAULT: "#8B5CF6",
          glow: "rgba(139, 92, 246, 0.35)",
        },
        accent: {
          green: "#38FE5E",
          amber: "#F59E0B",
          rose: "#FF3366",
        },
        solana: {
          purple: "#9945FF",
          green: "#14F195",
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(0, 243, 255, 0.2)' },
          '100%': { boxShadow: '0 0 30px rgba(0, 243, 255, 0.6)' },
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
};
