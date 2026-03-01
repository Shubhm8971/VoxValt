// app/landing/LandingPageClient.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import DemoSection from './components/DemoSection';
import HowItWorks from './components/HowItWorks';
import UseCases from './components/UseCases';
import Features from './components/Features';
import Pricing from './components/Pricing';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import CTA from './components/CTA';
import Footer from './components/Footer';

export default function LandingPageClient() {
    return (
        <div className="min-h-screen bg-vox-bg overflow-x-hidden">
            <Navbar />
            <HeroSection />
            <DemoSection />
            <HowItWorks />
            <UseCases />
            <Features />
            <Pricing />
            <Testimonials />
            <FAQ />
            <CTA />
            <Footer />
        </div>
    );
}