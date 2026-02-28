export default function HeroSection() {
  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 24px 80px',
        overflow: 'hidden',
      }}
    >
      {/* Tech Corner Brackets */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', padding: 32, opacity: 0.2 }}>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: 20, height: 20, borderTop: '2px solid #0df2f2', borderLeft: '2px solid #0df2f2' }} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: 20, height: 20, borderTop: '2px solid #0df2f2', borderRight: '2px solid #0df2f2' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: 20, height: 20, borderBottom: '2px solid #0df2f2', borderLeft: '2px solid #0df2f2' }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderBottom: '2px solid #0df2f2', borderRight: '2px solid #0df2f2' }} />
        </div>
      </div>

      {/* Central Content */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        {/* Brand Mark — SVG with breathe animation */}
        <div className="glow-effect" style={{ marginBottom: 32 }}>
          <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 5L20 30V65L50 95L80 65V30L50 5Z" stroke="#0df2f2" strokeWidth="2" />
            <path d="M35 45L50 35L65 45" stroke="#0df2f2" strokeWidth="2" />
            <path d="M50 35V75" stroke="#0df2f2" strokeWidth="2" />
            <path d="M30 60H70" stroke="#0df2f2" strokeWidth="1" opacity="0.5" />
            <circle cx="50" cy="35" r="2" fill="#0df2f2" />
            <circle cx="20" cy="30" r="1.5" fill="#0df2f2" />
            <circle cx="80" cy="30" r="1.5" fill="#0df2f2" />
          </svg>
        </div>

        {/* TALOS Title */}
        <h1
          className="talos-title"
          style={{
            fontSize: 'clamp(48px, 10vw, 120px)',
            fontWeight: 700,
            lineHeight: 1,
            marginBottom: 12,
          }}
        >
          TALOS
        </h1>

        {/* Tagline */}
        <p
          style={{
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.25em',
            fontSize: 'clamp(11px, 1.5vw, 14px)',
            fontWeight: 300,
            marginBottom: 0,
          }}
        >
          Autonomous Intelligence
        </p>
      </div>
    </section>
  );
}
