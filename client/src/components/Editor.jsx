import React, { useState, useEffect } from 'react';
import { letter, needW, widthOf, shelfId, LIMITS } from '../../../shared/layout.js';

const TYPE_LABEL = { grid: 'Grid', stagger: 'Staggered', stand: 'Standing' };

function Stepper({ label, value, min, max, onChange }) {
  return (
    <div>
      {label}
      <span className="stepper">
        <button type="button" aria-label={`Fewer ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)}>−</button>
        <output>{value}</output>
        <button type="button" aria-label={`More ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
      </span>
    </div>
  );
}

// Changes apply live: every tap saves the layout, and the closet preview updates with it.
export default function Editor({ closet, templates, bottleCount, curShelf, setCurShelf, onChange, onCreate, onDeleteCloset }) {
  const [presetOpen, setPresetOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [name, setName] = useState(closet.name);
  const [kind, setKind] = useState(closet.kind);
  useEffect(() => { setName(closet.name); setKind(closet.kind); setConfirmDel(null); }, [closet._id, closet.name, closet.kind]);

  const shelves = closet.shelves;
  const setShelves = (next) => onChange({ shelves: next });
  const edit = (i, patch) => {
    setCurShelf(shelfId(shelves[i]));
    setShelves(shelves.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  };
  const W = widthOf(closet), minW = Math.max(1, ...shelves.map(needW));
  const used = (sh) => bottleCount(shelfId(sh));

  return (
    <div className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div>
          <p className="eyebrow">Layout · {closet.kind}</p>
          <h3>{closet.name}</h3>
        </div>
        <button className="btn sm" onClick={() => setPresetOpen((v) => !v)}>New closet</button>
      </div>
      {presetOpen && (
        <div>
          <p className="eyebrow" style={{ marginBottom: 6 }}>Start from a template</p>
          <div className="presets">
            {Object.entries(templates).map(([k, t]) => (
              <button key={k} className="preset" onClick={() => { setPresetOpen(false); onCreate(k); }}>
                <b>{t.name}</b>
                <span>{t.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="ed-card">
        <div className="closet-meta">
          <label className="field">
            Name
            <input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} onBlur={() => name.trim() && name !== closet.name && onChange({ name })} />
          </label>
          <label className="field">
            Kind
            <input value={kind} maxLength={40} list="closet-kinds" onChange={(e) => setKind(e.target.value)} onBlur={() => kind !== closet.kind && onChange({ kind })} />
            <datalist id="closet-kinds"><option value="Fridge" /><option value="Rack" /><option value="Cellar" /><option value="Custom" /></datalist>
          </label>
        </div>
        <div className="ed-row">
          <Stepper label="Closet width (bottles)" value={W} min={minW} max={LIMITS.width[1]} onChange={(v) => onChange({ width: v <= minW ? 0 : v })} />
        </div>
      </div>
      <div className="ed-list">
        {shelves.map((sh, i) => {
          const sid = shelfId(sh);
          const lim = sh.type === 'stand' ? LIMITS.rows.stand : LIMITS.rows.grid;
          const colLim = sh.alt && sh.type !== 'stand' ? LIMITS.colsAlt : LIMITS.cols;
          return (
            <div key={sid} className={'ed-card' + (curShelf === sid ? ' cur' : '')} onClick={() => setCurShelf(sid)}>
              <div className="ed-head">
                <span className="lab">{letter(i)}</span>
                <b style={{ flex: 1 }}>Shelf {letter(i)}</b>
                <span className="icons">
                  <button className="icon-btn" aria-label="Move up" disabled={i === 0} onClick={() => { const n = [...shelves]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; setShelves(n); }}>↑</button>
                  <button className="icon-btn" aria-label="Move down" disabled={i === shelves.length - 1} onClick={() => { const n = [...shelves]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; setShelves(n); }}>↓</button>
                  <button className="icon-btn" aria-label="Delete shelf" disabled={shelves.length < 2} onClick={() => setConfirmDel(sid)}>✕</button>
                </span>
              </div>
              {confirmDel === sid && (
                <div className="row-btns" style={{ alignItems: 'center' }}>
                  <span className="muted" style={{ fontSize: '.85rem' }}>
                    Delete shelf {letter(i)}?{used(sh) ? ` Its ${used(sh)} bottle${used(sh) === 1 ? '' : 's'} go to the cellar.` : ''}
                  </span>
                  <button className="btn sm danger" onClick={() => { setConfirmDel(null); setShelves(shelves.filter((s) => shelfId(s) !== sid)); }}>Delete shelf</button>
                  <button className="btn sm ghost" onClick={() => setConfirmDel(null)}>Keep</button>
                </div>
              )}
              <div className="ed-row">
                <div>
                  Type
                  <span className="typeseg">
                    {['grid', 'stagger', 'stand'].map((t) => (
                      <button type="button" key={t} aria-pressed={sh.type === t} onClick={() => edit(i, { type: t, ...(t === 'stand' ? { depth: 1, alt: false, rows: Math.min(sh.rows, 6) } : {}) })}>
                        {TYPE_LABEL[t]}
                      </button>
                    ))}
                  </span>
                </div>
                {sh.type !== 'stand' && (
                  <div>
                    Bottles lie
                    <span className="typeseg">
                      <button type="button" aria-pressed={!sh.alt} onClick={() => edit(i, { alt: false, cols: Math.min(sh.cols, LIMITS.cols[1]) })}>Same way</button>
                      <button type="button" aria-pressed={!!sh.alt} onClick={() => edit(i, { alt: true })}>Alternating</button>
                    </span>
                  </div>
                )}
              </div>
              <div className="ed-row">
                <Stepper label={sh.type === 'stand' ? 'Rows deep' : 'Rows'} value={sh.rows} min={lim[0]} max={lim[1]} onChange={(v) => edit(i, { rows: v })} />
                <Stepper label="Per row" value={sh.cols} min={colLim[0]} max={colLim[1]} onChange={(v) => edit(i, { cols: v })} />
                {sh.type !== 'stand' && <Stepper label="Deep" value={sh.depth} min={1} max={2} onChange={(v) => edit(i, { depth: v })} />}
              </div>
            </div>
          );
        })}
      </div>
      <div className="add-shelf">
        <span className="muted" style={{ fontSize: '.85rem' }}>Add shelf</span>
        {['grid', 'stagger', 'stand'].map((t) => (
          <button key={t} className="btn sm" onClick={() => setShelves([...shelves, { type: t, rows: t === 'grid' ? 1 : 2, cols: shelves.at(-1)?.cols || 6, depth: 1, alt: false }])}>
            {TYPE_LABEL[t]}
          </button>
        ))}
      </div>
      <div className="row-btns">
        {confirmDel === 'closet' ? (
          <>
            <span className="muted" style={{ fontSize: '.85rem', alignSelf: 'center' }}>Delete {closet.name}? Its bottles go to the cellar.</span>
            <button className="btn sm danger" onClick={onDeleteCloset}>Delete closet</button>
            <button className="btn sm ghost" onClick={() => setConfirmDel(null)}>Keep</button>
          </>
        ) : (
          <button className="btn sm ghost danger" onClick={() => setConfirmDel('closet')}>Delete this closet</button>
        )}
      </div>
    </div>
  );
}
