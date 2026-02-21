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
        "store-card":
          "0 4px 6px -1px rgba(46,42,39,0.10), 0 2px 4px -1px rgba(46,42,39,0.06)",
      },
      colors: {
        // ✅ Verified Badge Colors (unchanged)
        "verified-badge": {
          gold: "#FFD700",
          silver: "#C0C0C0",
          bronze: "#CD7F32",
        },

        // ✅ Brand Colors — Warm Terracotta palette
        "brand-primary": "#D96C4A", // Terracotta (CTA)
        "brand-secondary": "#C45534", // Deep Clay (CTA hover)
        "brand-accent": "#D96C4A", // same as primary
        "brand-dark": "#2E2A27", // Soft Charcoal (text / dark bg)
        "brand-muted": "#3D3532", // slightly lighter charcoal (muted backgrounds)

        // legacy named tokens — remapped
        "brand-saving": "#D96C4A",
        "brand-harbor": "#C45534",
        "brand-anchor": "#D96C4A",
        "brand-waves": "#2E2A27",
        "brand-navybg": "#2E2A27",
        "brand-tagline": "#E8DED4", // Warm Gray

        // surface tokens (CSS-var backed — keep as-is)
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "on-surface": "var(--on-surface)",

        // page background convenience token
        canvas: "#F6F1EA", // Warm Sand
        "border-warm": "#E8DED4", // Subtle border
      },
    },
  },
  plugins: [],
};
