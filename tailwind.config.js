/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./modules/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Portal-specific semantic colors
        "portal-bg": "#f7f5f0",
        "portal-bg2": "#efecea",
        "portal-surface": "#ffffff",
        "portal-border": "#e2ddd8",
        "portal-border2": "#d4cec8",
        "portal-text": "#1a1714",
        "portal-text2": "#4a4540",
        "portal-muted": "#9a9490",
        "portal-accent": "#6B1E3D",
        "portal-accent2": "#8B2850",
        "portal-accent-bg": "#faf0f4",
        "portal-accent-border": "#e8c0cf",
        "portal-gold": "#c9952a",
        "portal-gold-bg": "#fdf8ee",
        "portal-green": "#2a7d4f",
        "portal-green-bg": "#edf7f2",
        "portal-blue": "#2350a0",
        "portal-blue-bg": "#eef2fb",
        "portal-purple": "#6b3fa0",
        "portal-purple-bg": "#f4eefb",
      },
      borderRadius: {
        "2xl": "20px",
        xl: "16px",
        lg: "12px",
        md: "10px",
        sm: "8px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
