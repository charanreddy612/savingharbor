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
      // 🔥 Store Page-Specific Extensions (Won't affect homepage)
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },

      // ✅ Updated Shadow (Removed Blue Tone)
      boxShadow: {
        "store-card":
          "0 4px 12px rgba(0, 0, 0, 0.05)",
      },

      colors: {
        // ✅ Verified Badge Colors (Untouched)
        "verified-badge": {
          gold: "#FFD700",
          silver: "#C0C0C0",
          bronze: "#CD7F32",
        },

        // ✅ Existing Brand Colors (Untouched for safety)
        "brand-primary": "#12866f",
        "brand-secondary": "#2076cd",
        "brand-accent": "#1282A2",
        "brand-dark": "#0B1220",
        "brand-muted": "#0C324F",
        "surface": "var(--surface)",
        "surface-2": "var(--surface-2)",
        "on-surface": "var(--on-surface)",
        "brand-saving": "#008660",
        "brand-harbor": "#0077FF",
        "brand-anchor": "#00B4DB",
        "brand-waves": "#0083B0",
        "brand-navybg": "#0B0F1A",
        "brand-tagline": "#E4E4E4",

        // 🔥 NEW PREMIUM WARM UI SYSTEM (Option 1)
        ui: {
          bg: "#F6F1EA",          // Warm Sand (Page Background)
          card: "#FFFFFF",        // Card Background
          border: "#E8DED4",      // Soft Border
          text: "#2E2A27",        // Soft Charcoal Text
          muted: "#8A817C",       // Muted Text
          cta: "#D96C4A",         // Terracotta CTA
          "cta-hover": "#C45534", // CTA Hover
        },
      },
    },
  },
  plugins: [],
};
