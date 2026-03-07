'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResultsContent() {
    const searchParams = useSearchParams();
    const file = searchParams.get('file');

    if (!file) {
        return (
            <div className="container animate-fade" style={{ textAlign: 'center', paddingTop: '8rem' }}>
                <div className="bg-pattern"></div>
                <h2>No file found</h2>
                <Link href="/upload" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
                    Go back to Upload
                </Link>
            </div>
        );
    }

    const isPdf = file.toLowerCase().endsWith('.pdf');

    return (
        <div className="container animate-fade" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
            <div className="bg-pattern"></div>
            <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem' }}>
                    Your Paper is <span style={{ color: 'var(--primary)' }}>Ready</span>
                </h2>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '1.25rem' }}>
                    We've processed your paper using the provided template. Download your {isPdf ? 'PDF' : 'LaTeX source'} below.
                </p>
            </header>

            <div className="glass animate-slide" style={{
                maxWidth: '600px',
                margin: '0 auto',
                padding: '3rem',
                borderRadius: 'var(--radius)',
                textAlign: 'center',
                border: '1px solid var(--border)'
            }}>
                <div style={{ marginBottom: '2rem' }}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                        {isPdf ? (
                            <path d="M12 18v-6M9 15l3 3 3-3" />
                        ) : (
                            <path d="M12 18v-6M9 15l3 3 3-3" />
                        )}
                    </svg>
                </div>

                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', wordBreak: 'break-all' }}>{file}</h3>
                <p style={{ color: 'var(--muted-foreground)', marginBottom: '2rem' }}>
                    {isPdf ? 'Final Submission PDF' : 'LaTeX Source (Ready for Compilation)'}
                </p>

                <a
                    href={`/api/download?file=${file}`}
                    className="btn-primary"
                    style={{ width: '100%', display: 'block', padding: '1rem' }}
                    download
                >
                    Download Document
                </a>

                <div style={{ marginTop: '1.5rem' }}>
                    <Link href="/upload" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                        Format another paper
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function ResultsPage() {
    return (
        <Suspense fallback={<div className="container" style={{ textAlign: 'center', paddingTop: '8rem' }}>Loading...</div>}>
            <ResultsContent />
        </Suspense>
    );
}
