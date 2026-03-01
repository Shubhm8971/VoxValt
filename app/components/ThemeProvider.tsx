"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children, ...props }: any) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="dark" // Set VoxValt's dark aesthetic as default
            enableSystem
            disableTransitionOnChange
            {...props}
        >
            {children}
        </NextThemesProvider>
    );
}