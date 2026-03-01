// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react'; // Added for the Briefing banner
import ServiceWorkerInitializer from './components/ServiceWorkerInitializer';
import OfflineIndicator from './components/OfflineIndicator';
import MorningBriefing from './components/MorningBriefing'; // Your new component
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from './components/ThemeProvider';
import './globals.css';

// ============================================
// Font Configuration
// ============================================
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  fallback: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ],
});

// ============================================
// Viewport Configuration
// ============================================
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#667eea' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a1a' },
  ],
};

// ============================================
// Metadata Configuration
// ============================================
export const metadata: Metadata = {
  title: {
    default: 'VoxValt - Memory Assistant',
    template: '%s | VoxValt',
  },
  description:
    'Your conversational memory assistant. Record voice notes, extract tasks & promises, and never forget what you said you\'d do.',
  manifest: '/manifest.json',
  applicationName: 'VoxValt',
  generator: 'Next.js',
  category: 'productivity',
  creator: 'VoxValt',
  publisher: 'VoxValt',
  keywords: [
    'voice notes', 'memory assistant', 'task manager', 'AI assistant',
    'voice recorder', 'second brain', 'productivity', 'reminders',
    'promises tracker', 'voice to text', 'smart notes',
  ],
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/icons/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'VoxValt',
    startupImage: [
      {
        url: '/splash/apple-splash-1290x2796.png',
        media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/splash/apple-splash-1179x2556.png',
        media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)',
      },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://voxvalt.com',
    siteName: 'VoxValt',
    title: 'VoxValt - Never Forget What You Said You\'d Do',
    description: 'AI-powered voice memory assistant that extracts tasks, promises, and reminders from your voice notes.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'VoxValt' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VoxValt - Voice Memory Assistant',
    description: 'Never forget what you said you\'d do.',
    images: ['/og-image.png'],
    creator: '@voxvalt',
  },
  robots: {
    index: true,
    follow: true,
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#667eea',
    'msapplication-tap-highlight': 'no',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Client-side guard for environment variables
  if (typeof window !== 'undefined' && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    console.error('VoxValt: Missing Supabase Environment Variables!');
  }

  return (
    <html
      lang="en"
      className={`${inter.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="anonymous" />
        )}
        <link rel="dns-prefetch" href="https://generativelanguage.googleapis.com" />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('voxvalt-theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>

      <body
        className={`
          ${inter.className}
          bg-vox-bg text-vox-text
          min-h-screen min-h-[100dvh]
          overflow-x-hidden
          selection:bg-brand-500/30 selection:text-brand-200
          antialiased
        `}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-brand-500 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-500"
        >
          Skip to main content
        </a>

        <ThemeProvider>
          <AuthProvider>
            {/* Service Worker: PWA, notifications, offline, caching */}
            {/* <ServiceWorkerInitializer /> */}

            {/* Offline status banner */}
            <OfflineIndicator />

            {/* AI Morning Briefing Banner 
            Suspense is REQUIRED here because MorningBriefing uses useSearchParams()
          */}
            {/* <Suspense fallback={null}>
              <MorningBriefing />
            </Suspense> */}

            <div
              id="main-content"
              role="main"
              className="relative min-h-screen min-h-[100dvh] flex flex-col"
            >
              {children}
            </div>

            <div id="toast-container" role="status" aria-live="polite" className="fixed bottom-6 left-4 right-4 z-toast flex flex-col items-center gap-2 pointer-events-none sm:bottom-8 sm:left-auto sm:right-8 sm:items-end" />
            <div id="modal-root" />
          </AuthProvider>
        </ThemeProvider>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true || document.referrer.includes('android-app://');
                  if (isStandalone) {
                    document.documentElement.classList.add('pwa-standalone');
                    document.body.classList.add('pwa-mode');
                    document.body.style.paddingTop = 'env(safe-area-inset-top)';
                    document.body.style.paddingBottom = 'env(safe-area-inset-bottom)';
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}