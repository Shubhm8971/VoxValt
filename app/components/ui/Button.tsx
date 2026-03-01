import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper to merge tailwind classes safely
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    withGlow?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, withGlow = false, children, ...props }, ref) => {

        // Base styles: Focus rings, transitions, and centering
        const baseStyles = "inline-flex items-center justify-center rounded-2xl font-medium transition-all duration-fast active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 focus:ring-offset-vox-bg";

        // Variant styles referencing your custom config
        const variants = {
            primary: cn(
                "bg-brand-gradient text-white border-none",
                withGlow && "shadow-glow hover:shadow-glow-lg"
            ),
            secondary: "bg-vox-surface text-vox-text hover:bg-vox-surface-hover border border-vox-border",
            ghost: "bg-transparent text-vox-text-secondary hover:text-vox-text hover:bg-vox-surface",
            outline: "bg-transparent border border-brand-500/50 text-brand-400 hover:bg-brand-500/10",
            danger: "bg-status-error text-white hover:bg-status-error/90 shadow-error/20 shadow-lg",
        };

        // Size styles using your custom spacing
        const sizes = {
            sm: "px-3 py-1.5 text-xs",
            md: "px-4.5 py-2.5 text-sm", // Using your 4.5 spacing (18px)
            lg: "px-6 py-3 text-base",
            icon: "h-10 w-10",
        };

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                ) : null}
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";