import { useEffect, useRef } from 'react';

// Drag and drop for bottles, with pointer events so it works the same with a mouse and a finger.
// A mouse drag starts after a few pixels. On touch the closet needs a short press first, so a swipe still
// scrolls; in a top view and in the Cellar the drag starts as soon as the finger moves.
// Sources carry data-drag (bottle id); targets are slots (data-k, optionally data-drop) and the Cellar (data-loose).
export function useDragDrop(onDrop) {
  const cb = useRef(onDrop);
  cb.current = onDrop;

  useEffect(() => {
    let drag = null;
    let suppressUntil = 0;

    const dropTarget = (x, y) => document.elementFromPoint(x, y)?.closest('[data-k],[data-loose]') || null;
    const scroller = () => document.querySelector('.phone .scroll');

    function start() {
      if (!drag) return;
      drag.active = true;
      const g = document.createElement('div');
      g.className = 'drag-ghost bottle';
      g.style.left = drag.x + 'px';
      g.style.top = drag.y + 'px';
      document.body.appendChild(g);
      drag.g = g;
      drag.src.classList.add('drag-src');
      try { navigator.vibrate?.(10); } catch { /* not supported */ }
      drag.cx = drag.x;
      drag.cy = drag.y;
      drag.iv = setInterval(autoScroll, 30);
    }
    // the closet scrolls when a drag comes near its top or bottom edge
    function autoScroll() {
      if (!drag?.active) return;
      const y = drag.cy, sc = scroller();
      if (sc) {
        const r = sc.getBoundingClientRect();
        if (y < r.top + 48) sc.scrollTop -= 10;
        else if (y > r.bottom - 48 && y < r.bottom + 70) sc.scrollTop += 10;
        else return;
      } else {
        if (y < 56) window.scrollBy(0, -14);
        else if (y > innerHeight - 56) window.scrollBy(0, 14);
        else return;
      }
      hover(drag.cx, drag.cy);
    }
    function hover(x, y) {
      const t = dropTarget(x, y);
      if (t !== drag.over) {
        drag.over?.classList.remove('drop-over');
        drag.over = t && t !== drag.src ? t : null;
        drag.over?.classList.add('drop-over');
      }
    }
    function end() {
      if (!drag) return;
      clearTimeout(drag.timer);
      clearInterval(drag.iv);
      drag.g?.remove();
      drag.over?.classList.remove('drop-over');
      drag.src?.classList.remove('drag-src');
      drag = null;
    }

    const down = (e) => {
      const src = e.target.closest('[data-drag]');
      if (!src || e.button > 0) return;
      drag = { src, id: src.dataset.drag, x: e.clientX, y: e.clientY, type: e.pointerType, active: false };
      drag.quick = !!src.closest('.tv-inline,.loose');
      if (e.pointerType !== 'mouse' && !drag.quick) drag.timer = setTimeout(start, 280);
    };
    const move = (e) => {
      if (!drag) return;
      const dist = Math.hypot(e.clientX - drag.x, e.clientY - drag.y);
      if (!drag.active) {
        if (drag.type === 'mouse' || drag.quick) {
          if (dist > 5) start();
          else return;
        } else {
          if (dist > 8) end();
          return;
        }
      }
      drag.g.style.left = e.clientX + 'px';
      drag.g.style.top = e.clientY + 'px';
      drag.cx = e.clientX;
      drag.cy = e.clientY;
      hover(e.clientX, e.clientY);
    };
    const up = (e) => {
      if (!drag) return;
      if (!drag.active) return end();
      const t = dropTarget(e.clientX, e.clientY), d = drag;
      end();
      suppressUntil = Date.now() + 400; // the click that follows a drop is not a tap
      if (!t || t === d.src && !t.dataset.drop) return;
      if (t.dataset.loose) cb.current(d.id, null);
      else cb.current(d.id, t.dataset.drop || t.dataset.k);
    };
    const click = (e) => {
      if (Date.now() < suppressUntil) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const touchmove = (e) => { if (drag?.active) e.preventDefault(); };
    const ctx = (e) => { if (e.target.closest('[data-drag]')) e.preventDefault(); };

    document.addEventListener('pointerdown', down);
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', end);
    document.addEventListener('click', click, true);
    document.addEventListener('touchmove', touchmove, { passive: false });
    document.addEventListener('contextmenu', ctx);
    return () => {
      end();
      document.removeEventListener('pointerdown', down);
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointercancel', end);
      document.removeEventListener('click', click, true);
      document.removeEventListener('touchmove', touchmove);
      document.removeEventListener('contextmenu', ctx);
    };
  }, []);
}
