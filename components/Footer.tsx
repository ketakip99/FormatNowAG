export default function Footer() {
    return (
        <footer style={{
            padding: '4rem 0 2rem',
            textAlign: 'center',
            borderTop: '1px solid var(--border)',
            marginTop: 'auto'
        }}>
            <div className="container">
                <p style={{
                    color: 'var(--muted-foreground)',
                    fontSize: '0.875rem',
                    fontWeight: 500
                }}>
                    ideation and prototype developed by <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Ketaki Paranjape</span>
                </p>
                <p style={{
                    marginTop: '0.5rem',
                    fontSize: '0.75rem',
                    color: 'var(--muted-foreground)',
                    opacity: 0.7
                }}>
                    &copy; {new Date().getFullYear()} FormatNow Platform
                </p>
            </div>
        </footer>
    );
}
