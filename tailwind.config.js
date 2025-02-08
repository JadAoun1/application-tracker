/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.{html,ejs}",  // All EJS files in the views folder and subfolders
    "./index.ejs",              // The root index.ejs file
    "./src/**/*.{html,js}",      // Any HTML or JS files in the src folder (if applicable)
    // You can add additional paths if Tailwind classes are used elsewhere.
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
