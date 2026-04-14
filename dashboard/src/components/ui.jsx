import React, { useState, useEffect, useCallback } from 'react';

// ─── Toast Hook ───────────────────────────────────────────────────────────────
// Usage: const { showToast, ToastContainer } = useToast();
//        showToast('Message', 'success' | 'error' | 'warning' | 'info')

let _addToast = null;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((msg, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const ToastContainer = () => (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'none' }}>
      {toasts.map(t => <ToastItem key={t.id} toast={t} onDismiss={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />)}
    </div>
  );

  return { showToast: addToast, ToastContainer };
}

const TYPE_CONFIG = {
  success: { bg: 'rgba(47,133,90,0.15)', border: 'rgba(47,133,90,0.4)', color: '#68D391', icon: '✓' },
  error:   { bg: 'rgba(229,62,62,0.15)',  border: 'rgba(229,62,62,0.4)',  color: '#FC8181', icon: '✗' },
  warning: { bg: 'rgba(236,153,75,0.15)', border: 'rgba(236,153,75,0.4)', color: '#F6AD55', icon: '⚠' },
  info:    { bg: 'rgba(0,115,177,0.15)',  border: 'rgba(0,115,177,0.4)',  color: '#63B3ED', icon: 'ℹ' },
};

function ToastItem({ toast, onDismiss }) {
  const cfg = TYPE_CONFIG[toast.type] || TYPE_CONFIG.info;
  return (
    <div style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`, color: '#fff',
      borderRadius: '8px', padding: '12px 16px', fontSize: '13px', fontWeight: 500,
      display: 'flex', alignItems: 'center', gap: '10px', pointerEvents: 'all',
      boxShadow: '0 4px 12px rgba(0,0,0,0.4)', minWidth: '280px', maxWidth: '380px',
      animation: 'fadeIn 200ms ease', fontFamily: 'Inter, sans-serif'
    }}>
      <span style={{ color: cfg.color, fontWeight: 700, fontSize: '15px', flexShrink: 0 }}>{cfg.icon}</span>
      <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.msg}</span>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: '#A1A1A1', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>×</button>
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

export function ConfirmModal({ open, title, message, confirmLabel = 'Delete', confirmDanger = true, onConfirm, onCancel, loading }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '32px', maxWidth: '440px', width: '90%', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>{title}</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '28px' }}>{message}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} disabled={loading}
            style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            style={{ padding: '10px 20px', background: confirmDanger ? 'var(--danger)' : 'var(--accent-primary)', border: 'none', borderRadius: '4px', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600, opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
            {loading && <span className="loader" style={{ width: '14px', height: '14px', border: '2px solid transparent', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

export function Spinner({ size = 24 }) {
  return (
    <span className="loader" style={{ width: `${size}px`, height: `${size}px`, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block', flexShrink: 0 }} />
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

export function EmptyState({ icon = '📋', title, subtitle, actionLabel, onAction }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 32px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>{icon}</div>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>{title}</h3>
      {subtitle && <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: actionLabel ? '24px' : '0' }}>{subtitle}</p>}
      {actionLabel && onAction && (
        <button className="primary-btn" onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const BADGE_STYLES = {
  Active:      { bg: 'rgba(47,133,90,0.15)',  border: 'rgba(47,133,90,0.4)',  color: '#68D391' },
  Closed:      { bg: 'rgba(58,58,58,0.5)',    border: 'var(--border-color)',   color: 'var(--text-muted)' },
  Pending:     { bg: 'rgba(58,58,58,0.5)',    border: 'var(--border-color)',   color: 'var(--text-muted)' },
  Reviewed:    { bg: 'rgba(0,115,177,0.15)',  border: 'rgba(0,115,177,0.4)',  color: '#63B3ED' },
  Shortlisted: { bg: 'rgba(47,133,90,0.15)',  border: 'rgba(47,133,90,0.4)',  color: '#68D391' },
  Rejected:    { bg: 'rgba(229,62,62,0.15)',  border: 'rgba(229,62,62,0.4)',  color: '#FC8181' },
};

export function StatusBadge({ status }) {
  const cfg = BADGE_STYLES[status] || BADGE_STYLES.Pending;
  return (
    <span style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, borderRadius: '4px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {status}
    </span>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export function Pagination({ page, totalPages, total, limit, onPage }) {
  if (totalPages <= 1) return null;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }

  const btnBase = { padding: '7px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', minWidth: '36px', textAlign: 'center' };

  return (
    <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Showing {start}–{end} of {total} results</p>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <button onClick={() => onPage(page - 1)} disabled={page === 1}
          style={{ ...btnBase, background: 'var(--bg-card)', color: page === 1 ? 'var(--border-color)' : 'var(--text-muted)', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>
          ← Prev
        </button>
        {pages.map((p, i) => (
          p === '…' ? <span key={i} style={{ color: 'var(--text-muted)', padding: '0 4px' }}>…</span> :
          <button key={p} onClick={() => onPage(p)}
            style={{ ...btnBase, background: p === page ? 'var(--accent-primary)' : 'var(--bg-card)', color: p === page ? '#fff' : 'var(--text-muted)', borderColor: p === page ? 'var(--accent-primary)' : 'var(--border-color)' }}>
            {p}
          </button>
        ))}
        <button onClick={() => onPage(page + 1)} disabled={page === totalPages}
          style={{ ...btnBase, background: 'var(--bg-card)', color: page === totalPages ? 'var(--border-color)' : 'var(--text-muted)', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>
          Next →
        </button>
      </div>
    </div>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

export function SkeletonCard() {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[80, 60, 40].map((w, i) => (
        <div key={i} style={{ height: i === 0 ? '18px' : '13px', width: `${w}%`, background: 'rgba(255,255,255,0.06)', borderRadius: '4px', animation: 'pulse 1.5s ease-in-out infinite' }} />
      ))}
    </div>
  );
}
