'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FileUploader from '@/components/FileUploader';

export default function UploadPage() {
    const [paper, setPaper] = useState<File | null>(null);
    const [template, setTemplate] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const router = useRouter();

    const handleFormat = async () => {
        if (!paper || !template) return;

        setIsProcessing(true);

        try {
            const formData = new FormData();
            formData.append('paper', paper);
            formData.append('template', template);

            const response = await fetch('/api/format', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                const resultsUrl = result.downloadUrl.replace('/api/download', '/results');
                router.push(resultsUrl);
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            console.error('Formatting error:', error);
            alert('An unexpected error occurred during formatting.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
            <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Finalize Your <span style={{ color: 'var(--primary)' }}>Submission</span>
                </h2>
                <p style={{ color: 'var(--muted-foreground)' }}>
                    Upload your documents below to start the formatting process.
                </p>
            </header>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem',
                marginBottom: '3rem'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 600 }}>Research Paper</label>
                    <FileUploader
                        label="Upload Doc/Markdown"
                        accept=".docx,.md,.txt"
                        onFileSelect={(file) => setPaper(file)}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 600 }}>Conference Template</label>
                    <FileUploader
                        label="Upload .cls / .tex / .dotx"
                        accept=".cls,.tex,.dotx"
                        onFileSelect={(file) => setTemplate(file)}
                    />
                </div>
            </div>

            <div style={{ textAlign: 'center' }}>
                <button
                    className="btn-primary"
                    disabled={!paper || !template || isProcessing}
                    onClick={handleFormat}
                    style={{
                        opacity: (!paper || !template || isProcessing) ? 0.5 : 1,
                        padding: '1rem 3rem',
                        fontSize: '1.125rem',
                        width: '100%',
                        maxWidth: '400px'
                    }}
                >
                    {isProcessing ? 'Processing...' : 'Format Paper'}
                </button>
            </div>
        </div>
    );
}
