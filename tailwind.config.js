/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        graphite: '#141518',
        warmWhite: '#F7F6F3',
        neutralGray: '#8A8F98',
        border: '#E4E2DD',
        electricIndigo: '#4F46E5',
      },
      borderRadius: {
        control: '12px',
        sheet: '16px',
        sheetLg: '20px',
      },
    },
  },
  plugins: [],
};
