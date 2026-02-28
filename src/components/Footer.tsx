export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '32px 0',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 5L20 30V65L50 95L80 65V30L50 5Z" stroke="#0df2f2" strokeWidth="2" />
            <path d="M35 45L50 35L65 45" stroke="#0df2f2" strokeWidth="2" />
            <path d="M50 35V75" stroke="#0df2f2" strokeWidth="2" />
            <circle cx="50" cy="35" r="2" fill="#0df2f2" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Talos
          </span>
        </div>

        {/* Copyright */}
        <p style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: '0.04em' }}>
          © 2026 Staxify, Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
