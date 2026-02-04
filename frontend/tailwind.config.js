/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // AURIXON Brand Colors
        'midnight-navy': '#102035',      // Primary text/headings, nav, footer
        'growth-green': '#41B549',       // Primary CTA buttons, success states
        'compliance-blue': '#85C6EA',    // Secondary accent, links, taglines
        'forest-shade': '#1E6B38',       // Button hover states, gradients
        'cyan-mist': '#BCE6F7',          // Borders, highlights, rings
        
        // Semantic color mappings
        primary: {
          DEFAULT: '#102035',            // Deep Midnight Navy
          light: '#1a3552',
          dark: '#0a1420',
        },
        secondary: {
          DEFAULT: '#85C6EA',            // Compliance Blue
          light: '#a8d9f3',
          dark: '#5ba8d4',
        },
        success: {
          DEFAULT: '#41B549',            // Vivid Growth Green
          light: '#5bc963',
          dark: '#2e8035',
          hover: '#1E6B38',              // Forest Shade for hover
        },
        accent: {
          DEFAULT: '#BCE6F7',            // Cyan Mist
          light: '#d4f1fc',
          dark: '#8fcfe8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Poppins', 'Inter', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(16, 32, 53, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(16, 32, 53, 0.1), 0 1px 2px 0 rgba(16, 32, 53, 0.06)',
        'md': '0 4px 6px -1px rgba(16, 32, 53, 0.1), 0 2px 4px -1px rgba(16, 32, 53, 0.06)',
        'lg': '0 10px 15px -3px rgba(16, 32, 53, 0.1), 0 4px 6px -2px rgba(16, 32, 53, 0.05)',
        'xl': '0 20px 25px -5px rgba(16, 32, 53, 0.1), 0 10px 10px -5px rgba(16, 32, 53, 0.04)',
        '2xl': '0 25px 50px -12px rgba(16, 32, 53, 0.25)',
        'inner': 'inset 0 2px 4px 0 rgba(16, 32, 53, 0.06)',
      },
      borderRadius: {
        'sm': '0.25rem',
        'DEFAULT': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-slow': 'bounce 3s infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.6s ease-out forwards',
        'fade-in-left': 'fadeInLeft 0.6s ease-out forwards',
        'fade-in-right': 'fadeInRight 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.5s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(65, 181, 73, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(65, 181, 73, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
