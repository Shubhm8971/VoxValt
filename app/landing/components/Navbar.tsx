// app/landing/components/Navbar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { label: 'How it works', href: '#how-it-works' },
        { label: 'Features', href: '#features' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'FAQ', href: '#faq' },
    ];

    return (
        <>
            <nav
                className={`
          fixed top-0 left-0 right-0 z-50
          transition-all duration-300
          ${scrolled
                        ? 'bg-vox-bg/80 backdrop-blur-xl border-b border-vox-border shadow-lg shadow-black/10'
                        : 'bg-transparent'
                    }
        `}
            >
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/landing" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-shadow duration-300">
                                <span className="text-base">🎙️</span>
                            </div>
                            <span className="text-lg font-bold text-vox-text">
                                Vox<span className="text-brand-500">Valt</span>
                            </span>
                        </Link>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-8">
                            {navLinks.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    className="text-sm text-vox-text-secondary hover:text-vox-text transition-colors duration-200"
                                >
                                    {link.label}
                                </a>
                            ))}
                        </div>

                        {/* CTA Buttons */}
                        <div className="hidden md:flex items-center gap-3">
                            <Link
                                href="/auth"
                                className="text-sm text-vox-text-secondary hover:text-vox-text transition-colors px-4 py-2"
                            >
                                Log in
                            </Link>
                            <Link
                                href="/auth"
                                className="
                  text-sm font-semibold text-white px-5 py-2.5
                  bg-brand-gradient rounded-xl
                  hover:opacity-90 active:scale-95
                  transition-all duration-200
                  shadow-glow-sm hover:shadow-glow
                "
                            >
                                Start Free →
                            </Link>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center hover:bg-vox-surface transition-colors"
                            aria-label="Toggle menu"
                        >
                            <svg className="w-5 h-5 text-vox-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {mobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <div className="fixed top-16 left-0 right-0 z-50 md:hidden bg-vox-bg/95 backdrop-blur-xl border-b border-vox-border animate-slide-down">
                        <div className="px-4 py-4 space-y-1">
                            {navLinks.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-4 py-3 rounded-xl text-sm text-vox-text-secondary hover:text-vox-text hover:bg-vox-surface transition-all"
                                >
                                    {link.label}
                                </a>
                            ))}
                            <div className="pt-3 border-t border-vox-border space-y-2">
                                <Link
                                    href="/auth"
                                    className="block w-full text-center py-3 rounded-xl text-sm font-semibold text-white bg-brand-gradient"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Start Free →
                                </Link>
                                <Link
                                    href="/auth"
                                    className="block w-full text-center py-3 rounded-xl text-sm text-vox-text-secondary hover:text-vox-text"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Log in
                                </Link>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}