import '../styles/globals.css';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
    title: 'FormatNow - Submission Ready Papers',
    description: 'Automatically format your research paper for conferences and journals.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <Navbar />
                <main style={{ paddingTop: '4rem', flex: 1 }}>{children}</main>
                <Footer />
            </body>
        </html>
    );
}
