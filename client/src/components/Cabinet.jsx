import React from 'react';
import { U, pitchOf, rowLen, widthOf, facing, FACING, letter, slotKey, shelfId, code, parseKey } from '../../../shared/layout.js';
import { bLabel } from '../wine.js';

// Every bottle looks the same, whatever the wine: one Bordeaux shape, the same glass, the same capsule.
const BDX = 'M12 2h6v32c0 5 9 6 9 12v58a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V46c0-6 9-7 9-12z';
export function Silhouette({ empty }) {
  if (empty)
    return (
      <svg viewBox="0 0 30 110" aria-hidden="true">
        <path d={BDX} fill="none" stroke="var(--slot)" strokeWidth="1.5" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
      </svg>
    );
  return (
    <svg viewBox="0 0 30 110" aria-hidden="true">
      <path d={BDX} style={{ fill: 'var(--glass)' }} />
      <path d={BDX} fill="url(#glass)" stroke="rgba(0,0,0,.4)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <rect x="11.6" y="1.5" width="6.8" height="16" rx="1" style={{ fill: 'var(--cap)' }} />
      <rect x="11.6" y="1.5" width="6.8" height="16" rx="1" fill="url(#glass)" />
      <rect x="5" y="64" width="20" height="26" rx="1" fill="#F2EEE4" opacity=".92" />
      <rect x="8" y="70" width="14" height="2.2" fill="rgba(0,0,0,.55)" />
      <rect x="10" y="75" width="10" height="1.6" fill="rgba(0,0,0,.3)" />
      <rect x="10" y="83" width="10" height="1.6" fill="rgba(0,0,0,.3)" />
      <rect x="5" y="64" width="20" height="26" fill="url(#glass)" opacity=".5" />
    </svg>
  );
}

// slots are centred, so shorter rows sit in the middle and staggered rows form a pyramid
function place(W, n, col, p = U) {
  const span = U + p * (n - 1);
  return { gridRow: 1, gridColumn: `${Math.floor((W * U - span) / 2) + 1 + col * p} / span ${U}` };
}
const cols = (W) => ({ gridTemplateColumns: `repeat(${W * U},minmax(0,1fr))` });

export default function Cabinet(props) {
  const { closet, editing, curShelf, topShelf, onTopView } = props;
  const W = widthOf(closet);
  return (
    <div className={'cabinet' + (editing ? ' editing' : '')} style={{ maxWidth: W * 62 + 64 }}>
      {closet.shelves.map((sh, i) => {
        const sid = shelfId(sh);
        return (
          <div key={sid} className={'shelf' + (editing && curShelf === sid ? ' cur' : '')}>
            <button className="shelf-label" aria-pressed={topShelf === sid} onClick={() => onTopView(sid)} title={`Top view of shelf ${letter(i)}`} aria-label={`Top view of shelf ${letter(i)}`}>
              {letter(i)}
            </button>
            <div className="shelf-body">
              {topShelf === sid ? <TopView {...props} sh={sh} i={i} W={W} /> : sh.type === 'stand' ? <Standing {...props} sh={sh} W={W} /> : <Lying {...props} sh={sh} W={W} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function useSlotBits({ closet, bySlot, selId, filter, moving, onSlot }) {
  const cls = (b, base) => {
    const c = [...base];
    if (b && selId === b._id) c.push('sel');
    if (b && filter && filter !== b.wine.color) c.push('dim');
    return c.join(' ');
  };
  const label = (k, b, extra = '') => code(closet, parseKey(k)) + ', ' + bLabel(b) + extra;
  const click = (k) => (e) => {
    e.stopPropagation();
    onSlot(k, bySlot.get(k) || null);
  };
  return { cls, label, click, moving };
}

function Lying(props) {
  const { sh, W, bySlot, closet, onTopView } = props;
  const { cls, label, click, moving } = useSlotBits(props);
  const sid = shelfId(sh);
  return (
    <div className="rows" onClick={() => onTopView(sid)}>
      {Array.from({ length: sh.rows }, (_, r) => {
        const n = rowLen(sh, r);
        const style = { ...cols(W), ...(sh.type === 'stagger' && r > 0 ? { marginTop: `-${(14 / W).toFixed(2)}%` } : {}) };
        return (
          <div className="row" key={r} style={style}>
            {Array.from({ length: n }, (_, col) => {
              const k = slotKey(sid, 0, r, col);
              const b = bySlot.get(k);
              const kb = sh.depth === 2 ? slotKey(sid, 1, r, col) : null;
              const bb = kb && bySlot.get(kb);
              const neck = facing(sh, r, col) === 'neck';
              const st = place(W, n, col, pitchOf(sh));
              if (!b && bb)
                // a back-row bottle shows through the gap in the front row; dropping here fills the front slot
                return (
                  <button key={col} className={cls(bb, ['slot', 'bottle', 'peek', ...(neck ? ['neck'] : [])])} style={st} data-k={kb} data-drop={k} data-drag={bb._id} onClick={click(kb)} title={label(kb, bb, ' (behind)')} aria-label={label(kb, bb, ', in the back row')} />
                );
              if (b)
                return <button key={col} className={cls(b, ['slot', 'bottle', ...(neck ? ['neck'] : [])])} style={st} data-k={k} data-drag={b._id} onClick={click(k)} title={label(k, b)} aria-label={label(k, b)} />;
              return <button key={col} className={'slot' + (moving ? ' target' : '') + (neck ? ' neck-empty' : '')} style={st} data-k={k} onClick={click(k)} aria-label={'Empty slot ' + code(closet, parseKey(k))} />;
            })}
          </div>
        );
      })}
    </div>
  );
}

function Standing(props) {
  const { sh, W, bySlot, closet, onTopView } = props;
  const { cls, label, click, moving } = useSlotBits(props);
  const sid = shelfId(sh);
  const btn = (k, b, extra, drop) => (
    <button key={k} className={cls(b, ['sb', ...extra])} data-k={k} data-drop={drop} data-drag={b._id} onClick={click(k)} title={label(k, b)} aria-label={label(k, b)}>
      <Silhouette />
    </button>
  );
  return (
    <div className="stand" style={cols(W)} onClick={() => onTopView(sid)}>
      {Array.from({ length: sh.cols }, (_, col) => {
        const kf = slotKey(sid, 0, 0, col);
        const bf = bySlot.get(kf);
        const parts = [];
        // bottles further back peek out above, darker and smaller, like looking into the fridge
        for (let r = Math.min(sh.rows - 1, 2); r >= 1; r--) {
          const k = slotKey(sid, 0, r, col);
          const b = bySlot.get(k);
          if (b) parts.push(btn(k, b, ['back', ...(r === 2 ? ['back2'] : [])], bf ? undefined : kf));
        }
        if (bf) parts.push(btn(kf, bf, ['front']));
        else if (!parts.length)
          parts.push(
            <button key={kf} className={'sb empty' + (moving ? ' target' : '')} data-k={kf} onClick={click(kf)} aria-label={'Empty slot ' + code(closet, parseKey(kf))}>
              <Silhouette empty />
            </button>
          );
        return (
          <div className="scol" key={col} style={place(W, sh.cols, col)}>
            {parts}
          </div>
        );
      })}
    </div>
  );
}

function TopView(props) {
  const { sh, i, W, bySlot, closet, topRow, onTopRow, onTopView } = props;
  const { cls, label, click } = useSlotBits(props);
  const sid = shelfId(sh);
  const tiers = [];
  if (sh.type === 'stand') {
    for (let r = sh.rows - 1; r >= 0; r--) {
      tiers.push(<div key={'l' + r} className="tv-tier-label">{r === 0 ? 'Front row' : 'Row ' + (r + 1)}</div>);
      tiers.push(
        <div key={'t' + r} className="tv-tier row" style={cols(W)}>
          {Array.from({ length: sh.cols }, (_, col) => {
            const k = slotKey(sid, 0, r, col);
            const b = bySlot.get(k);
            const st = place(W, sh.cols, col);
            return b ? (
              <button key={col} className={cls(b, ['slot', 'bottle', 'neck'])} style={st} data-k={k} data-drag={b._id} onClick={click(k)} title={label(k, b)} aria-label={label(k, b)} />
            ) : (
              <button key={col} className="slot" style={st} data-k={k} onClick={click(k)} aria-label={'Empty slot ' + code(closet, parseKey(k))} />
            );
          })}
        </div>
      );
    }
  } else {
    const r = Math.min(topRow, sh.rows - 1);
    const n = rowLen(sh, r);
    for (let d = sh.depth - 1; d >= 0; d--) {
      if (sh.depth > 1) tiers.push(<div key={'l' + d} className="tv-tier-label">{d ? 'Back row' : 'Front row'}</div>);
      tiers.push(
        <div key={'t' + d} className="tv-tier" style={cols(W)}>
          {Array.from({ length: n }, (_, col) => {
            const k = slotKey(sid, d, r, col);
            const b = bySlot.get(k);
            const fac = facing(sh, r, col);
            const st = place(W, n, col, pitchOf(sh));
            return b ? (
              <button key={col} className={cls(b, ['tvl', ...(fac === 'neck' ? ['neckfront'] : [])])} style={st} data-k={k} data-drag={b._id} onClick={click(k)} title={label(k, b)} aria-label={label(k, b, ', ' + FACING[fac].toLowerCase())}>
                <Silhouette />
              </button>
            ) : (
              <button key={col} className={'tvl' + (fac === 'neck' ? ' neckfront' : '')} style={st} data-k={k} onClick={click(k)} aria-label={'Empty slot ' + code(closet, parseKey(k))}>
                <Silhouette empty />
              </button>
            );
          })}
        </div>
      );
    }
  }
  return (
    <div className="tv-inline" role="group" aria-label={`Top view of shelf ${letter(i)}`}>
      <div className="tv-bar">
        <span className="tv-tag">Top view</span>
        {sh.type !== 'stand' && sh.rows > 1 && (
          <span className="tv-rows-pick" role="group" aria-label="Row">
            {Array.from({ length: sh.rows }, (_, r) => (
              <button key={r} className="depth" data-on={topRow === r ? 1 : 0} onClick={() => onTopRow(r)}>
                Row {r + 1}
              </button>
            ))}
          </span>
        )}
        <button className="depth" onClick={() => onTopView(sid)}>Front view</button>
      </div>
      <div className="tv-box">
        <div className="tv-cap wall">Back wall</div>
        <div className="tv-tiers">{tiers}</div>
        <div className="tv-cap door">Door · front</div>
      </div>
    </div>
  );
}
