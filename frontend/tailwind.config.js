/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary:    '#6366f1',
        'primary-dark': '#4f46e5',
        secondary:  '#06b6d4',
        accent:     '#8b5cf6',
        success:    '#10b981',
        danger:     '#ef4444',
        warning:    '#f59e0b',
        background: '#f0f4ff',
        surface:    '#ffffff',
        text:       '#0f172a',
        muted:      '#64748b',
        sidebar:    '#0f172a',
        'sidebar-hover': '#1e293b',
      },
      fontFamily: {
        inter: ['Inter', 'Roboto', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-main':   'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-card':   'linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)',
        'gradient-header': 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
        'gradient-entry':  'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
        'gradient-exit':   'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
      },
      boxShadow: {
        'card':    '0 4px 24px 0 rgba(99,102,241,0.10)',
        'sidebar': '4px 0 24px 0 rgba(15,23,42,0.18)',
        'glow':    '0 0 24px 4px rgba(99,102,241,0.18)',
      },
      animation: {
        'fade-in':     'fadeIn 0.5s ease-out',
        'slide-up':    'slideUp 0.5s cubic-bezier(0.4,0,0.2,1)',
        'slide-right': 'slideRight 0.3s ease-out',
        'pulse-slow':  'pulse 3s infinite',
        'shimmer':     'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { transform: 'translateY(20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        slideRight:{ from: { transform: 'translateX(-20px)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      borderRadius: {
        xl2: '1.25rem',
        xl3: '1.5rem',
      },
    },
  },
  plugins: [],
};
