import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Auth0ProviderWrapper from "@/components/providers/auth0-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import UserSyncProvider from "@/components/providers/user-sync-provider";
import QueryProvider from "@/components/providers/query-provider";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Kanban Board - Collaborative Project Management",
    description: "A real-time collaborative kanban board with Auth0 authentication",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <Auth0ProviderWrapper>
                    <QueryProvider>
                        <ThemeProvider defaultTheme="light" storageKey="kanban-theme">
                            <UserSyncProvider>{children}</UserSyncProvider>
                        </ThemeProvider>
                    </QueryProvider>
                </Auth0ProviderWrapper>
            </body>
        </html>
    );
}
