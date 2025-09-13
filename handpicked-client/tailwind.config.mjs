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
      boxShadow: {
        "store-card":
          "0 4px 6px -1px rgba(0, 0, 255, 0.1), 0 2px 4px -1px rgba(0, 0, 255, 0.06)",
      },
      colors: {
        // ✅ Verified Badge Colors
        "verified-badge": {
          gold: "#FFD700",
          silver: "#C0C0C0",
          bronze: "#CD7F32",
        },
        // ✅ Brand Colors (from logo)
        "brand-primary": "#1ABC9C", // Teal
        "brand-secondary": "#2E86DE", // Blue
        "brand-accent": "#1282A2", // Gradient midpoint
        "brand-dark": "#0B1220", // Navy background
      },
    },
  },
  plugins: [],
};
