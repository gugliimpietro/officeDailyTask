/** @type {import('tailwindcss').Config} */
module.exports = {
  // This line tells Tailwind: "Look inside these files for your classes"
  // If you don't add this, Tailwind won't work because it won't see your code!
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}