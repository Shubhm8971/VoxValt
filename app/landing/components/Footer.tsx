// app/landing/components/Footer.tsx
'use client';

import Link from 'next/link';

const FOOTER_LINKS = {
    Product: [
        { label: 'Features', href: '#features' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'FAQ', href: '#faq' },
        { label: 'Changelog', href: '#' },
    ],
    Company: [
        { label: 'About', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Contact', href: 'mailto:voxvalt@gmail.com' },
    ],
    Legal: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Cookie Policy', href: '#' },
    ],
    Connect: [
        { label: 'Twitter / X', href: 'https://twitter.com/voxvalt' },
        { label: 'LinkedIn', href: '#' },
        { label: 'GitHub', href: '#' },
        { label: 'Discord', href: '#' },
    ],
};

export default function Footer() {
    return (
        <footer className="border-t border-vox-border bg-vox-bg-secondary">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
                {/* Top section */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/landing" className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center">
                                <span className="text-base">🎙️</span>
                            </div>
                            <span className="text-lg font-bold text-vox-text">
                                Vox<span className="text-brand-500">Valt</span>
                            </span>
                        </Link>
                        <p className="text-sm text-vox-text-muted leading-relaxed">
                            Your conversational memory assistant. Never forget what you said you'd do.
                        </p>
                    </div>

                    {/* Links */}
                    {Object.entries(FOOTER_LINKS).map(([title, links]) => (
                        <div key={title}>
                            <h4 className="text-xs font-semibold text-vox-text-secondary uppercase tracking-wider mb-4">
                                {title}
                            </h4>
                            <ul className="space-y-2.5">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        <a
                                            href={link.href}
                                            className="text-sm text-vox-text-muted hover:text-vox-text transition-colors"
                                            target={link.href.startsWith('http') ? '_blank' : undefined}
                                            rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom */}
                <div className="pt-8 border-t border-vox-border flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-vox-text-muted">
                        © {new Date().getFullYear()} VoxValt. All rights reserved.
                    </p>
                    <p className="text-xs text-vox-text-muted">
                        Made with 🎙️ in India
                    </p>
                </div>
            </div>
        </footer>
    );
}