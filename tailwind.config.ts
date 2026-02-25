import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "bg-app": "#2B2B2B",
        "bg-app-deep": "#1D1D1D",
        "bg-surface": "#3A3A3A",
        "bg-surface-alt": "#404040",
        "bg-sheet": "#2B2B2B",
        "text-primary": "#FFFFFF",
        "text-secondary": "#ADADAD",
        "border-strong": "#000000",
        "accent-teal": "#93C1C1",
        "accent-teal-bright": "#A4D0D0",
        "state-correct": "#B5CE65",
        "state-correct-icon": "#AFD681",
        "state-incorrect": "#E8948A",
        "state-error-icon": "#F39483",
        "state-warning": "#E8B84A",
        "icon-muted": "#FAFAFA"
      },
      fontFamily: {
        display: ["Merriweather", "serif"],
        body: ["Nunito", "sans-serif"]
      },
      borderRadius: {
        card: "24px",
        button: "24px"
      },
      spacing: {
        screenX: "1rem",
        stack: "1rem",
        "option-gap": "0.75rem"
      },
      height: {
        option: "4rem",
        cta: "4rem"
      },
      transitionDuration: {
        fast: "140ms",
        sheet: "220ms"
      },
      boxShadow: {
        insetSoft: "inset 0 1px 0 rgba(255, 255, 255, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;
