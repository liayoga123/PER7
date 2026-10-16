import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: 16 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '4rem', fontWeight: 700, color: 'var(--teal)', lineHeight: 1 }}>404</div>
      <h2>Page Not Found</h2>
      <p className="text-muted">The archive record you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn-primary">← Return to Archive</Link>
    </div>
  );
}
