/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/renderer/**/*.{js,ts,jsx,tsx,html}'
  ],
  theme: {
    extend: {
      colors: {
        notion: {
          bg: '#ffffff',
          sidebar: '#f7f6f3',
          hover: '#ebebea',
          text: '#37352f',
          muted: '#9b9a97',
          border: '#e9e9e7',
          tag: {
            ag: '#ff7369',
            pro: '#4da1ff',
            br: '#9d7bea',
            in: '#4daa57'
          }
        }
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif']
      },
      keyframes: {
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        }
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.3s ease-out'
      }
    }
  },
  plugins: []
}
