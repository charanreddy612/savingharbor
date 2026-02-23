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
          "0 4px 6px -1px rgba(17,20,24,0.08), 0 2px 4px -1px rgba(17,20,24,0.05)",
        "card-hover": "0 8px 24px rgba(255,90,31,0.10)",
      },
      colors: {
        // ── Verified Badge Colors (unchanged) ──
        "verified-badge": {
          gold: "#FFD700",
          silver: "#C0C0C0",
          bronze: "#CD7F32",
        },

        // ── Solar Carbon Brand Colors ──
        "brand-primary": "#FF5A1F", // Burnt Tangerine (CTA)
        "brand-secondary": "#E14A15", // Deep Ember (hover)
        "brand-pressed": "#B93C10", // Dark Rust (pressed)
        "brand-dark": "#111418", // Carbon Black
        "brand-muted": "#4B5563", // Graphite

        // ── Accent ──
        "brand-accent": "#B8F200", // Electric Lime
        "brand-accent-soft": "#ECFAD0", // Pale Lime Tint
        "brand-accent-text": "#2A3300", // Deep Olive

        // ── Deal Tag Colors ──
        "tag-verified": "#0F766E", // Deep Teal
        "tag-expiring": "#F59E0B", // Amber Gold
        "tag-exclusive": "#2D2F4A", // Indigo Charcoal

        // ── Typography ──
        "text-primary": "#111418", // Carbon Black
        "text-secondary": "#4B5563", // Graphite
        "text-muted": "#6B7280", // Cool Grey
        link: "#1E3A8A", // Deep Blue Slate
        "link-hover": "#1D4ED8", // Royal Blue

        // ── Backgrounds ──
        "bg-default": "#F8F7F4", // Soft Bone
        "bg-surface": "#FFFFFF", // Pure White
        "bg-subtle": "#EEF1F4", // Mist Grey
        "border-default": "#D9DEE5", // Soft Slate

        // ── Legacy named tokens (remapped) ──
        "brand-navybg": "#111418",
        "brand-saving": "#FF5A1F",
        "brand-harbor": "#E14A15",
        "brand-anchor": "#FF5A1F",
        "brand-waves": "#111418",
        "brand-tagline": "#6B7280",

        // ── Surface tokens (CSS-var backed) ──
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "on-surface": "var(--on-surface)",
      },
    },
  },
  plugins: [],
};
