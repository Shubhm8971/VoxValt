// app/landing/page.tsx
import type { Metadata } from 'next';
import LandingPageClient from './LandingPageClient';

export const metadata: Metadata = {
    title: 'VoxValt - Never Forget What You Said You\'d Do',
    description:
        'AI-powered voice memory assistant that extracts tasks, promises, and reminders from your voice notes. Your second brain that actually remembers everything.',
    openGraph: {
        title: 'VoxValt - Never Forget What You Said You\'d Do',
        description:
            'AI-powered voice memory assistant that extracts tasks, promises, and reminders from your voice notes.',
        url: 'https://voxvalt.com',
        images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
};

export default function LandingPage() {
    return <LandingPageClient />;
}