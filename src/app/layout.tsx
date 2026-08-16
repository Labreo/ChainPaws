import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import './globals.css';
import { WalletContextProvider } from '@/components/providers/WalletContextProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat', weight: ['400', '500', '600', '700', '800', '900'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://chain-paws.vercel.app'),
  title: 'ChainPaws | Decentralized Pet Registry & Escrow Recovery Network on Solana',
  description:
    'Stop lost pet scams with trustless Solana escrow bounties and immutable Program Derived Account (PDA) microchip registries. Built for the DEV Dog Days Challenge.',
  keywords: [
    'Solana',
    'Lost Pet',
    'Escrow',
    'Anchor',
    'Pet Registry',
    'Smart Contracts',
    'Web3',
    'ChainPaws',
    'Microchip',
  ],
  authors: [{ name: 'ChainPaws Team' }],
  openGraph: {
    title: 'ChainPaws — Stopping Lost Pet Scams with Solana Escrow',
    description:
      'Tamper-proof pet microchip identity registry & trustless escrow bounty network on Solana Devnet.',
    url: 'https://chain-paws.vercel.app',
    siteName: 'ChainPaws',
    images: [
      {
        url: 'https://raw.githubusercontent.com/Labreo/ChainPaws/main/images/Live%20OpenStreetMap_Missing_Pet_Radar.png',
        width: 1200,
        height: 630,
        alt: 'ChainPaws Live Missing Pet Discovery Radar on Solana',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ChainPaws — Stopping Lost Pet Scams with Solana Escrow',
    description: 'Decentralized pet identification & trustless recovery escrows on Solana Devnet with Google AI.',
    images: ['https://raw.githubusercontent.com/Labreo/ChainPaws/main/images/Live%20OpenStreetMap_Missing_Pet_Radar.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${montserrat.variable} font-sans bg-[#080c14] text-slate-100 min-h-screen flex flex-col`}>
        <WalletContextProvider>{children}</WalletContextProvider>
      </body>
    </html>
  );
}
