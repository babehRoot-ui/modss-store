/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        dark: { 50:'#f7f7f8',100:'#ececf1',200:'#d9d9e3',300:'#c5c5d2',400:'#acacbe',500:'#8e8ea0',600:'#565869',700:'#40414f',800:'#2d2d3a',900:'#1a1a2e',950:'#0a0a0f' },
        accent: { DEFAULT:'#06d6a0', light:'#34ebc0', dark:'#04a67d' },
        cyan: { 400:'#22d3ee', 500:'#06b6d4', 600:'#0891b2' }
      },
      fontFamily: { sans:['Inter','system-ui','sans-serif'], mono:['JetBrains Mono','monospace'] },
      animation: {
        'marquee':'marquee 30s linear infinite',
        'glow-pulse':'glowPulse 2s ease-in-out infinite alternate',
        'fade-in':'fadeIn 0.3s ease-out',
        'slide-up':'slideUp 0.4s ease-out',
        'slide-down':'slideDown 0.3s ease-out'
      },
      keyframes: {
        marquee:{ '0%':{transform:'translateX(0%)'},'100%':{transform:'translateX(-50%)'} },
        glowPulse:{ '0%':{boxShadow:'0 0 5px rgba(6,214,160,0.2)'},'100%':{boxShadow:'0 0 20px rgba(6,214,160,0.4), 0 0 40px rgba(6,214,160,0.1)'} },
        fadeIn:{ '0%':{opacity:'0'},'100%':{opacity:'1'} },
        slideUp:{ '0%':{opacity:'0',transform:'translateY(20px)'},'100%':{opacity:'1',transform:'translateY(0)'} },
        slideDown:{ '0%':{opacity:'0',transform:'translateY(-10px)'},'100%':{opacity:'1',transform:'translateY(0)'} }
      }
    }
  },
  plugins: []
};
