import './globals.css';

export const metadata = {
  title: 'BABEH DIGITAL STORE - Jual Produk Digital',
  description: 'Toko digital terpercaya. Jual panel, script, dan VPS dengan pengiriman otomatis.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <div className="bg-glow-1" />
        <div className="bg-glow-2" />
        {children}
      </body>
    </html>
  );
}
