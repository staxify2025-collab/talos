'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

/* ─── SVG Talos Logo (from Stitch) ──────────────────────────── */
function TalosLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 5L20 30V65L50 95L80 65V30L50 5Z" stroke="#0df2f2" strokeWidth="2" />
      <path d="M35 45L50 35L65 45" stroke="#0df2f2" strokeWidth="2" />
      <path d="M50 35V75" stroke="#0df2f2" strokeWidth="2" />
      <path d="M30 60H70" stroke="#0df2f2" strokeWidth="1" opacity="0.5" />
      <circle cx="50" cy="35" r="2" fill="#0df2f2" />
      <circle cx="20" cy="30" r="1.5" fill="#0df2f2" />
      <circle cx="80" cy="30" r="1.5" fill="#0df2f2" />
    </svg>
  );
}

export default function Navbar() {
  const { user, loading, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: '0 32px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: scrolled ? 'rgba(5, 5, 5, 0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border-subtle)' : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <TalosLogo size={28} />
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--brand)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          Talos
        </span>
      </Link>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {loading ? null : user ? (
          <>
            <Link
              href="/dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: '0.04em',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              <LayoutDashboard size={14} />
              Dashboard
            </Link>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                border: '1px solid var(--border-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--brand)',
              }}
            >
              {user.displayName?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <button
              onClick={() => signOut()}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 4,
                transition: 'color 0.2s',
              }}
              title="Sign out"
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <LogOut size={15} />
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              style={{
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: '0.04em',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              Login
            </Link>
            <Link href="/signup" className="btn-primary" style={{ padding: '8px 20px', fontSize: 12 }}>
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
