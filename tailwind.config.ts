import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* --- shadcn-compatible CSS var tokens --- */
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        /* --- LifeQuest semantic tokens --- */
        lq: {
          bg: "hsl(var(--background))",
          surface1: "hsl(var(--surface-1))",
          surface2: "hsl(var(--surface-2))",
          surface3: "hsl(var(--surface-3))",
          border: "hsl(var(--border))",
          "border-strong": "hsl(var(--border-strong))",
        },

        /* XP / Progression */
        xp: {
          DEFAULT: "hsl(var(--xp))",
          muted: "hsl(var(--xp-muted))",
          foreground: "hsl(var(--xp-foreground))",
        },

        /* Gold / Currency */
        gold: {
          DEFAULT: "hsl(var(--gold))",
          muted: "hsl(var(--gold-muted))",
          foreground: "hsl(var(--gold-foreground))",
        },

        /* Rank / Status */
        rank: {
          DEFAULT: "hsl(var(--rank))",
          muted: "hsl(var(--rank-muted))",
          foreground: "hsl(var(--rank-foreground))",
        },

        /* Attributes */
        attr: {
          intellect: "hsl(var(--attr-intellect))",
          "intellect-muted": "hsl(var(--attr-intellect-muted))",
          strength: "hsl(var(--attr-strength))",
          "strength-muted": "hsl(var(--attr-strength-muted))",
          wellness: "hsl(var(--attr-wellness))",
          "wellness-muted": "hsl(var(--attr-wellness-muted))",
          creativity: "hsl(var(--attr-creativity))",
          "creativity-muted": "hsl(var(--attr-creativity-muted))",
          discipline: "hsl(var(--attr-discipline))",
          "discipline-muted": "hsl(var(--attr-discipline-muted))",
        },

        /* Difficulty */
        diff: {
          easy: "hsl(var(--diff-easy))",
          medium: "hsl(var(--diff-medium))",
          hard: "hsl(var(--diff-hard))",
          epic: "hsl(var(--diff-epic))",
        },

        /* States */
        success: {
          DEFAULT: "hsl(var(--success))",
          muted: "hsl(var(--success-muted))",
          foreground: "hsl(var(--success-foreground))",
        },
      },

      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },

      fontFamily: {
        display: ["var(--font-barlow)", "system-ui", "sans-serif"],
        body: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },

      /* Sidebar width token */
      width: {
        sidebar: "220px",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
