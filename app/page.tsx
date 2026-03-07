import Link from 'next/link';

export default function Home() {
    return (
        <div className="hero animate-fade">
            <div className="bg-pattern"></div>
            <div className="container animate-slide">
                <h1>Format Your Paper <span style={{ color: 'var(--primary)' }}>Instantly</span></h1>
                <p>
                    Upload your research and a conference template. We handle the formatting,
                    you focus on the science. Submission-ready copies in seconds.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <Link href="/upload" className="btn-primary">
                        Get Started
                    </Link>
                    <button className="glass" style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius)', fontWeight: 600 }}>
                        How it works
                    </button>
                </div>
            </div>
        </div>
    );
}
