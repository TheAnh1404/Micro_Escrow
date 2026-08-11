import type { Metadata } from 'next';
import './globals.css';
import { WalletProvider } from '../context/WalletContext';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'StellarPact | Micro-Escrow Protocol on Soroban (Stellar Network)',
  description:
    'Fast, low-cost non-custodial micro-escrow smart contracts for global freelancers and clients on Stellar Mainnet.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 antialiased selection:bg-primary/20 selection:text-primary">
        <WalletProvider>
          {children}
          <Toaster position="top-right" theme="dark" richColors closeButton />
        </WalletProvider>
      </body>
    </html>
  );
}
