import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

// --- NEW: Next.js Metadata & Open Graph Tags ---
export const metadata = {
  title: 'Vouch | The Anti-Resume Network',
  description: 'Showcase your real projects, verify your skills with peer vouches, and connect with top builders.',
  metadataBase: new URL('https://vouch-network.vercel.app'), // Replace with your actual Vercel/Custom Domain later!
  openGraph: {
    title: 'Vouch | The Anti-Resume Network',
    description: 'Showcase your real projects, verify your skills with peer vouches, and connect with top builders.',
    url: 'https://vouch-network.vercel.app', // Replace later
    siteName: 'Vouch',
    images: [
      {
        // For now, this is a beautiful placeholder gradient. 
        // Later, take a screenshot of your app, upload it to your public folder, and link it here!
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop', 
        width: 1200,
        height: 630,
        alt: 'Vouch Network Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vouch | The Anti-Resume Network',
    description: 'Showcase your real projects, verify your skills with peer vouches, and connect with top builders.',
    images: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'], // Same image as above
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}