// frontend/tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}", 
    "./src/**/*.{js,ts,jsx,tsx,mdx}",        
  ],
  theme: {
    extend: {
      colors: {
        // カスタムカラーもここで定義しておくと安全
        terminal: {
          bg: "#050505",
          text: "#00ff41",
        }
      }
    },
  },
  plugins: [],
};
export default config;