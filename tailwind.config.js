/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // C'est cette ligne qui est importante
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}