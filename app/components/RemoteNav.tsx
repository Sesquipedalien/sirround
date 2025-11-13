"use client";

import { useEffect } from "react";

function getFocusable(): HTMLElement[] {
  // Include explicit focusables + semantic controls
  const nodes = document.querySelectorAll<HTMLElement>([
    '[data-focusable="true"]',
    'a[href]',
    'button',
    '[tabindex]:not([tabindex="-1"])',
  ].join(','));
  return Array.from(nodes).filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
}

function rect(el: Element) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
}

type Dir = "left" | "right" | "up" | "down";

function nextByDirection(current: HTMLElement | null, dir: Dir): HTMLElement | null {
  const items = getFocusable();
  if (!items.length) return null;
  if (!current) return items[0] || null;
  const c = rect(current);
  const candidates = items.filter(el => el !== current && el.offsetParent !== null);
  const axis = dir === "left" || dir === "right" ? "x" : "y";
  const sign = dir === "left" || dir === "up" ? -1 : 1;

  // Filter to those in the intended hemisphere
  const filtered = candidates.filter(el => {
    const r = rect(el);
    if (axis === "x") return Math.sign(r.x - c.x) === sign || Math.sign(r.x - c.x) === 0;
    return Math.sign(r.y - c.y) === sign || Math.sign(r.y - c.y) === 0;
  });

  // Score by primary axis distance, then secondary axis
  const scored = filtered.map(el => {
    const r = rect(el);
    const dx = r.x - c.x;
    const dy = r.y - c.y;
    const primary = axis === "x" ? Math.abs(dx) : Math.abs(dy);
    const secondary = axis === "x" ? Math.abs(dy) : Math.abs(dx);
    const bias = axis === "x" ? (sign * dx < 0 ? Infinity : 0) : (sign * dy < 0 ? Infinity : 0);
    return { el, score: primary * 1000 + secondary + bias };
  }).sort((a, b) => a.score - b.score);

  return scored.length ? scored[0].el : null;
}

function focusEl(el: HTMLElement | null) {
  if (!el) return;
  // Remove previous
  document.querySelectorAll('.tv-focused').forEach(x => x.classList.remove('tv-focused'));
  el.classList.add('tv-focused');
  el.focus({ preventScroll: true });
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
}

export default function RemoteNav() {
  useEffect(() => {
    // Ensure an initial focus
    const first = getFocusable()[0];
    if (first && !document.querySelector('.tv-focused')) focusEl(first);

    const onKey = (e: KeyboardEvent) => {
      // Normalize key across TVs
      const code = (e as any).keyCode || 0;
      const key = e.key || (
        code === 37 ? 'ArrowLeft' :
        code === 39 ? 'ArrowRight' :
        code === 38 ? 'ArrowUp' :
        code === 40 ? 'ArrowDown' :
        code === 13 ? 'Enter' :
        code === 8 ? 'Backspace' :
        code === 10009 ? 'Backspace' : // Tizen back
        ''
      );
      const current = (document.querySelector('.tv-focused') as HTMLElement) || (document.activeElement as HTMLElement | null);
      if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown') {
        e.preventDefault();
        const dir: Dir = key === 'ArrowLeft' ? 'left' : key === 'ArrowRight' ? 'right' : key === 'ArrowUp' ? 'up' : 'down';
        const next = nextByDirection(current, dir);
        if (next) focusEl(next);
        return;
      }
      if (key === 'Enter') {
        e.preventDefault();
        if (current) {
          current.click();
        }
        return;
      }
      if (key === 'Backspace' || key === 'Escape') {
        // Navigate back
        if (document.referrer) history.back();
      }
    };
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, []);

  // No UI, only listeners
  return null;
}
