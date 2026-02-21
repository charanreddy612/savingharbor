/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{astro,html,js,jsx,ts,tsx,mdx}",
    "./components/**/*.{astro,html,js,jsx,ts,tsx,mdx}",
    "./pages/**/*.{astro,html,js,jsx,ts,tsx,mdx}",
    "./layouts/**/*.{astro,html,js,jsx,ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      boxShadow: {
        "store-card": "0 6px 18px rgba(0, 0, 0, 0.06)",
      },
      colors: {
        "verified-badge": {
          gold: "#FFD700",
          silver: "#C0C0C0",
          bronze: "#CD7F32",
        },

        "brand-navybg": "#F6F1EA",
        "brand-dark": "#2E2A27",
        "brand-primary": "#D96C4A",
        "brand-secondary": "#C45534",
        "brand-accent": "#E8DED4",
        "brand-muted": "#8A817C",

        "surface": "#FFFFFF",
        "surface-2": "#FEFBF6",
        "on-surface": "#2E2A27",

        "brand-saving": "#D96C4A",
        "brand-harbor": "#C45534",
        "brand-anchor": "#E8DED4",
        "brand-waves": "#F6F1EA",
        "brand-tagline": "#8A817C",
      },
    },
  },
  plugins: [],
};
