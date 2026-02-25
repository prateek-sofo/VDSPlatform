import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
    title: 'VDS — Virtual Data Scientist',
    description: 'Agentic AI data scientist for any business domain.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="dark h-full">
            <body className="bg-background text-foreground antialiased h-full overflow-hidden">{children}</body>
        </html>
    );
}
