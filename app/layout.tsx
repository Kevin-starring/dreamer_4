import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' })

export const metadata: Metadata = {
  title: 'Dream Realizer — Turn your dream into action with AI',
  description: 'Type your dream, get an interactive AI roadmap with the exact tools and prompts you need.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.variable} data-theme="light">
      {/* Runs before hydration to prevent flash of wrong theme */}
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `try{var t=localStorage.getItem('theme')||'light';document.documentElement.setAttribute('data-theme',t)}catch(e){}`
        }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
