'use client';

import { useState, useRef } from 'react';

interface FileUploaderProps {
    label: string;
    accept?: string;
    onFileSelect: (file: File) => void;
}

export default function FileUploader({ label, accept, onFileSelect }: FileUploaderProps) {
    const [dragActive, setDragActive] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            setFileName(file.name);
            onFileSelect(file);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFileName(file.name);
            onFileSelect(file);
        }
    };

    const onButtonClick = () => {
        inputRef.current?.click();
    };

    return (
        <div
            className={`glass ${dragActive ? 'drag-active' : ''}`}
            style={{
                padding: '2rem',
                borderRadius: 'var(--radius)',
                textAlign: 'center',
                border: dragActive ? '2px dashed var(--primary)' : '1px solid var(--border)',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
        >
            <input
                ref={inputRef}
                type="file"
                style={{ display: 'none' }}
                accept={accept}
                onChange={handleChange}
            />
            <div style={{ marginBottom: '1rem' }}>
                <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
            </div>
            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{label}</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                {fileName ? `Selected: ${fileName}` : 'Drag & drop or click to upload'}
            </p>
        </div >
    );
}
