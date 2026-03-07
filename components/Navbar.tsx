import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="glass" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            padding: '1rem 0',
            borderBottom: '1px solid var(--glass-border)'
        }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)' }}>
                    Format<span style={{ color: 'var(--primary)' }}>Now</span>
                </Link>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <Link href="/upload" style={{ fontWeight: 500 }}>Upload</Link>
                    <button className="btn-primary" style={{ padding: '0.5rem 1rem' }}>Login</button>
                </div>
            </div>
        </nav>
    );
}
