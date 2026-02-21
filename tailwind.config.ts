import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* shadcn/ui color system */
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
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
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },

        /* Press Box design token colors */
        ink: {
          950: "#0d0b08",
          900: "#111009",
          800: "#18150f",
          750: "#1e1a13",
          700: "#252015",
          600: "#30291a",
          500: "#3e3424",
          400: "#554736",
          300: "#6e5f4c",
          200: "#9c8b76",
          150: "#b8a590",
          100: "#d4c4ad",
          50:  "#ede0cc",
        },
        gold: {
          950: "#2a1f00",
          900: "#3d2e00",
          800: "#5e4800",
          700: "#856800",
          600: "#a88500",
          500: "#c9a032",
          450: "#d4a843",
          400: "#ddb85a",
          300: "#e8ca78",
          200: "#f2da9e",
          100: "#faf0cc",
          DEFAULT: "#d4a843",
        },
        ember: {
          700: "#8c4400",
          600: "#b05a0c",
          500: "#d07018",
          400: "#e8851a",
          350: "#ef9a35",
          300: "#f5a84a",
          200: "#f8c07a",
          100: "#fcdcaa",
          DEFAULT: "#e8851a",
        },
      },

      /* Press Box typography */
      fontFamily: {
        display: ["var(--font-oswald)", "Arial Narrow", "Arial", "sans-serif"],
        heading: ["var(--font-oswald)", "Arial Narrow", "Arial", "sans-serif"],
        body:    ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono:    ["var(--font-dm-mono)", "Fira Code", "Consolas", "monospace"],
        serif:   ["var(--font-lora)", "Georgia", "serif"],
      },

      /* Custom spacing */
      spacing: {
        "nav": "60px",
        "sidebar": "280px",
      },

      /* Custom heights */
      height: {
        "nav": "60px",
      },

      /* Custom min-heights */
      minHeight: {
        "nav": "60px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
