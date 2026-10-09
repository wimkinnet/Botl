import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api.js';
import { slotKey, parseKey, shelfId, code, facing, FACING, capacity, widthOf } from '../../shared/layout.js';
import { COLORS, bLabel, emptyForm, formFrom } from './wine.js';
import { useDragDrop } from './useDragDrop.js';
import Cabinet from './components/Cabinet.jsx';
import Editor from './components/Editor.jsx';
import { BottleDetail, WineForm } from './components/Detail.jsx';
import WineMap from './components/WineMap.jsx';

const keyOf = (slot) => slotKey(String(slot.shelf), slot.d, slot.r, slot.c);
const newId = () => Math.floor(Date.now() / 1000).toString(16).padStart(8, '0') + Array.from({ length: 16 }, () => ((Math.random() * 16) | 0).toString(16)).join('');

function useMedia(q) {
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const f = () => setM(mq.matches);
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, [q]);
  return m;
}

const ICONS = {
  closet: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="5" y="2.5" width="14" height="19" rx="2" /><path d="M5 9h14M5 15h14" /><circle cx="9" cy="12" r="1.3" fill="currentColor" /><circle cx="12.5" cy="12" r="1.3" fill="currentColor" /></svg>,
  bottles: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1.3" fill="currentColor" /><circle cx="4.5" cy="12" r="1.3" fill="currentColor" /><circle cx="4.5" cy="18" r="1.3" fill="currentColor" /></svg>,
  layout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 10h18M10 10v11" /></svg>
};

export default function App() {
  const [data, setData] = useState(null);
  const [ref, setRef] = useState({ geo: {}, grapes: [], templates: {} });
  const [loadErr, setLoadErr] = useState('');
  const [activeId, setActiveId] = useState(() => { try { return localStorage.getItem('botl-closet'); } catch { return null; } });
  const [tab, setTab] = useState('closet'); // phone: closet | bottles | layout
  const [webView, setWebView] = useState('closet'); // web: closet | bottles | cellar | map
  const [webEdit, setWebEdit] = useState(false);
  const [cabinetScale, setCabinetScale] = useState(100);
  const cabinetFrameRef = useRef(null);
  const [sel, setSel] = useState(null); // {kind:'bottle',id} | {kind:'add',key} | {kind:'edit',id}
  const [moving, setMoving] = useState(null); // bottle id for tap-to-move
  const [filter, setFilter] = useState(null);
  const [topShelf, setTopShelf] = useState(null);
  const [topRow, setTopRow] = useState(0);
  const [curShelf, setCurShelf] = useState(null);
  const [toast, setToast] = useState('');
  const toastT = useRef();
  const phone = useMedia('(max-width: 760px)');

  const flash = useCallback((t) => {
    setToast(t);
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(''), 2400);
  }, []);

  const load = useCallback(async () => {
    try {
      setData(await api.state());
      setLoadErr('');
    } catch (e) {
      setLoadErr(e.message);
    }
  }, []);
  useEffect(() => {
    load();
    api.reference().then(setRef).catch(() => {});
  }, [load]);

  const closets = data?.closets || [];
  const bottles = data?.bottles || [];
  const closet = closets.find((c) => c._id === activeId) || closets[0] || null;
  useEffect(() => {
    if (closet && closet._id !== activeId) setActiveId(closet._id);
    if (closet) try { localStorage.setItem('botl-closet', closet._id); } catch { /* private mode */ }
  }, [closet, activeId]);

  const bySlot = useMemo(() => {
    const m = new Map();
    if (closet) bottles.forEach((b) => b.slot && String(b.slot.closet) === closet._id && m.set(keyOf(b.slot), b));
    return m;
  }, [bottles, closet]);
  const cellar = useMemo(() => bottles.filter((b) => !b.slot), [bottles]);
  const closetById = useMemo(() => Object.fromEntries(closets.map((c) => [c._id, c])), [closets]);
  const selectedBottle = sel?.kind === 'bottle' ? bottles.find((b) => b._id === sel.id) : null;
  const sameWineIds = useMemo(() => {
    if (!selectedBottle) return new Set();
    const sameWine = (bottle) => selectedBottle.wineGroupId && bottle.wineGroupId
      ? String(bottle.wineGroupId) === String(selectedBottle.wineGroupId)
      : ['producer', 'name', 'vintage', 'color'].every((key) => String(bottle.wine?.[key] || '') === String(selectedBottle.wine?.[key] || ''))
        && ['country', 'region', 'appellation', 'vineyard'].every((key) => String(bottle.location?.[key] || '') === String(selectedBottle.location?.[key] || ''));
    return new Set(bottles.filter(sameWine).map((b) => b._id));
  }, [bottles, selectedBottle]);

  const replaceBottles = (list) => setData((d) => ({ ...d, bottles: d.bottles.map((b) => list.find((x) => x._id === b._id) || b) }));
  const fail = (e) => { flash(e.message); load(); };

  /* moving bottles */
  const move = useCallback(async (id, key) => {
    const a = bottles.find((b) => b._id === id);
    if (!a || !closet && key) return;
    if (key && a.slot && String(a.slot.closet) === closet._id && keyOf(a.slot) === key) return;
    if (!key && !a.slot) return;
    const slot = key ? { closet: closet._id, ...parseKey(key) } : null;
    const other = key ? bySlot.get(key) : null;
    // show it straight away, then take what the server says
    setData((d) => ({ ...d, bottles: d.bottles.map((b) => (b._id === a._id ? { ...b, slot } : other && b._id === other._id ? { ...b, slot: a.slot } : b)) }));
    setSel(null);
    setMoving(null);
    try {
      const r = await api.moveBottle(id, slot);
      replaceBottles(r.bottles);
      if (!key) flash('Moved to the cellar');
      else if (r.swapped) flash(`Swapped ${code(closet, slot)} and ${a.slot ? code(closetById[a.slot.closet] || closet, a.slot) : 'the cellar'}`);
      else flash('Moved to ' + code(closet, slot));
    } catch (e) { fail(e); }
  }, [bottles, closet, bySlot, closetById]);
  useDragDrop(move);

  /* closet layout: optimistic, saved in order */
  const queue = useRef(Promise.resolve());
  const pending = useRef(0);
  const patchCloset = (patch) => {
    const id = closet._id;
    if (patch.shelves) patch = { ...patch, shelves: patch.shelves.map((s) => (s._id ? s : { ...s, _id: newId() })) };
    setData((d) => ({ ...d, closets: d.closets.map((c) => (c._id === id ? { ...c, ...patch } : c)) }));
    pending.current++;
    queue.current = queue.current.then(async () => {
      try {
        const r = await api.updateCloset(id, patch);
        pending.current--;
        if (r.moved) {
          flash(r.moved + (r.moved === 1 ? ' bottle' : ' bottles') + ' moved to the cellar');
          if (!pending.current) await load();
        } else if (!pending.current) setData((d) => ({ ...d, closets: d.closets.map((c) => (c._id === id ? r.closet : c)) }));
      } catch (e) {
        pending.current--;
        fail(e);
      }
    });
  };
  const createCloset = async (template) => {
    try {
      const r = await api.createCloset({ template });
      setData((d) => ({ ...d, closets: [...d.closets, r.closet] }));
      setActiveId(r.closet._id);
      setSel(null);
      setTopShelf(null);
      flash('Created ' + r.closet.name);
    } catch (e) { fail(e); }
  };
  const deleteCloset = async () => {
    try {
      const r = await api.deleteCloset(closet._id);
      flash(r.moved ? `Closet deleted, ${r.moved} bottle${r.moved === 1 ? '' : 's'} moved to the cellar` : 'Closet deleted');
      setActiveId(null);
      setWebEdit(false);
      setTab('closet');
      await load();
    } catch (e) { fail(e); }
  };

  /* taps */
  const editingLayout = phone ? tab === 'layout' : webEdit;
  const onSlot = (key, b) => {
    if (moving) {
      if (b && b._id === moving) return setMoving(null);
      if (b) return flash('That slot is taken');
      return move(moving, key);
    }
    if (editingLayout) return setCurShelf(parseKey(key).shelf);
    setSel(b ? { kind: 'bottle', id: b._id } : { kind: 'add', key });
  };
  const onTopView = (sid) => {
    setTopShelf((t) => (t === sid ? null : sid));
    setTopRow(0);
    if (editingLayout) setCurShelf(sid);
  };
  const pickBottle = (b) => {
    if (b.slot && closetById[b.slot.closet]) setActiveId(String(b.slot.closet));
    setTab('closet');
    setWebView('closet');
    setSel({ kind: 'bottle', id: b._id });
  };

  /* detail panel */
  function renderDetail() {
    if (moving) {
      const b = bottles.find((x) => x._id === moving);
      return (
        <div className="panel">
          <p className="eyebrow">Moving</p>
          <h3>{b && bLabel(b)}</h3>
          <div className="row-btns"><button className="btn" onClick={() => setMoving(null)}>Cancel</button></div>
        </div>
      );
    }
    if (!sel) return <div className="panel"><p className="eyebrow">Nothing selected</p><h3>Tap a bottle or an empty slot</h3></div>;
    const close = () => setSel(null);
    if (sel.kind === 'add') {
      const inCellar = !sel.key;
      return (
        <WineForm
          key={'add' + sel.key}
          title={inCellar ? 'Cellar' : 'Empty slot ' + code(closet, parseKey(sel.key))}
          heading={inCellar ? 'Add bottles' : 'Add a bottle'}
          initial={emptyForm()}
          geo={ref.geo}
          grapes={ref.grapes}
          showQty={inCellar}
          allowPhoto
          submitLabel={(f) => (inCellar ? `Add ${f.qty} to cellar` : 'Put in slot')}
          onCancel={close}
          onSubmit={async (f) => {
            const slot = inCellar ? null : { closet: closet._id, ...parseKey(sel.key) };
            const r = await api.addBottles({ wine: f.wine, location: f.location, qty: f.qty, slot, photo: f.photo });
            setData((d) => ({ ...d, bottles: [...d.bottles, ...r.bottles] }));
            flash(inCellar ? `Added ${r.bottles.length} ${r.bottles.length === 1 ? 'bottle' : 'bottles'} to the cellar` : 'Placed in ' + code(closet, slot));
            setSel(inCellar ? null : { kind: 'bottle', id: r.bottles[0]._id });
          }}
        />
      );
    }
    const b = bottles.find((x) => x._id === sel.id);
    if (!b) return null;
    if (sel.kind === 'edit')
      return (
        <WineForm
          key={'edit' + b._id}
          title="Edit"
          heading={bLabel(b)}
          initial={formFrom(b)}
          geo={ref.geo}
          grapes={ref.grapes}
          submitLabel="Save"
          allowPhoto
          existingPhotoId={b.winePhotoId}
          onCancel={() => setSel({ kind: 'bottle', id: b._id })}
          onSubmit={async (f) => {
            const r = await api.updateBottle(b._id, { wine: f.wine, location: f.location, photo: f.photo, removePhoto: f.removePhoto });
            replaceBottles(r.bottles || [r.bottle]);
            setSel({ kind: 'bottle', id: b._id });
            flash('Saved');
          }}
        />
      );
    const bc = b.slot && closetById[b.slot.closet];
    let position = null;
    if (bc) {
      const sh = bc.shelves.find((s) => shelfId(s) === String(b.slot.shelf));
      position = code(bc, b.slot) + ' · ' + FACING[facing(sh, b.slot.r, b.slot.c)] + (sh.type === 'stand' && sh.rows > 1 ? `, row ${b.slot.r + 1} from the front` : '');
    }
    return (
      <BottleDetail
        key={b._id}
        b={b}
        where={bc ? bc.name : 'Cellar'}
        position={position}
        quantity={sameWineIds.size}
        cellarQuantity={cellar.filter((item) => sameWineIds.has(item._id)).length}
        onSetQuantity={async (quantity, confirmClosetRemoval) => {
          const result = await api.setWineQuantity(b._id, quantity, confirmClosetRemoval);
          if (result.confirmationRequired) return result;
          setData((current) => ({ ...current, bottles: [...current.bottles.filter((item) => !sameWineIds.has(item._id)), ...result.bottles] }));
          if (!result.bottles.some((item) => item._id === b._id)) setSel(result.bottles.length ? { kind: 'bottle', id: result.bottles[0]._id } : null);
          if (result.added) flash(`Added ${result.added} bottle${result.added === 1 ? '' : 's'} to the global cellar`);
          else if (result.removed) flash(`Removed ${result.removed} bottle${result.removed === 1 ? '' : 's'}${result.closetRemoved ? `, including ${result.closetRemoved} from closets` : ''}`);
          return result;
        }}
        onEdit={() => setSel({ kind: 'edit', id: b._id })}
        onMove={() => { setMoving(b._id); setSel(null); if (phone) setTab('closet'); }}
        onToCellar={() => move(b._id, null)}
      />
    );
  }

  /* pieces */
  const chips = (
    <div className="chips" role="group" aria-label="Highlight colour">
      <button className="chip" aria-pressed={!filter} onClick={() => setFilter(null)}>All</button>
      {Object.entries(COLORS).map(([k, v]) => (
        <button key={k} className="chip" aria-pressed={filter === k} onClick={() => setFilter(filter === k ? null : k)}>
          <span className="dot" style={{ background: v.v }} />
          {v.label}
        </button>
      ))}
    </div>
  );
  const cellarStrip = (
    <div className="loose" data-loose="1" role="group" aria-label="Cellar">
      <div className="loose-head">
        <span>Global cellar</span>
        <span className="mono">{cellar.length}</span>
        <button className="btn sm" aria-label="Add bottles to the cellar" onClick={() => { setMoving(null); setSel({ kind: 'add', key: null }); }}>+</button>
      </div>
      <div className="loose-items">
        {cellar.map((b) => (
          <button
            key={b._id}
            className={'lb bottle' + (sel?.id === b._id ? ' sel' : sameWineIds.has(b._id) ? ' same-wine' : '') + (filter && filter !== b.wine.color ? ' dim' : '')}
            data-drag={b._id}
            title={sameWineIds.has(b._id) && sel?.id !== b._id ? bLabel(b) + ' · same wine as selected bottle' : bLabel(b)}
            aria-label={bLabel(b) + ', in the cellar'}
            onClick={() => (moving ? setMoving(null) : setSel({ kind: 'bottle', id: b._id }))}
          />
        ))}
        {!cellar.length && <span className="loose-empty">Drop bottles here</span>}
      </div>
    </div>
  );
  const list = (source = bottles) => {
    const items = source
      .filter((b) => !filter || b.wine.color === filter)
      .map((b) => {
        const bc = b.slot && closetById[b.slot.closet];
        return { b, pos: bc ? (closets.length > 1 ? bc.name + ' ' : '') + code(bc, b.slot) : 'Cellar' };
      })
      .sort((x, y) => (x.b.wine.producer + x.b.wine.vintage).localeCompare(y.b.wine.producer + y.b.wine.vintage));
    if (!items.length) return <p className="muted">No bottles yet.</p>;
    return (
      <div className="blist">
        {items.map(({ b, pos }) => (
          <button key={b._id} className="bitem" onClick={() => pickBottle(b)}>
            <span className="dot" style={{ width: 16, height: 16, background: COLORS[b.wine.color]?.v }} />
            <span className="t">
              <b>{[b.wine.producer, b.wine.name].filter(Boolean).join(' ')}</b>
              <small>{[b.wine.vintage, b.location.appellation || b.location.region, b.wine.window && 'drink ' + b.wine.window].filter(Boolean).join(' · ')}</small>
            </span>
            <span className="pos">{pos}</span>
          </button>
        ))}
      </div>
    );
  };
  const cabinet = closet && (
    <div ref={cabinetFrameRef} className="cabinet-frame" style={{ '--cabinet-scale': `${cabinetScale}%` }}>
      <Cabinet
        closet={closet}
        bySlot={bySlot}
        selId={sel?.id}
        sameWineIds={sameWineIds}
        filter={filter}
        moving={moving}
        editing={editingLayout}
        curShelf={curShelf}
        topShelf={topShelf}
        topRow={topRow}
        onTopRow={setTopRow}
        onTopView={onTopView}
        onSlot={onSlot}
      />
    </div>
  );
  const editor = closet && (
    <Editor
      closet={closet}
      templates={ref.templates}
      bottleCount={(sid) => [...bySlot.values()].filter((b) => String(b.slot.shelf) === sid).length}
      curShelf={curShelf}
      setCurShelf={setCurShelf}
      onChange={patchCloset}
      onCreate={createCloset}
      onDeleteCloset={deleteCloset}
    />
  );
  const toastEl = toast && <div className="toast" role="status">{toast}</div>;
  const movingBanner = moving && (
    <div className="banner" style={phone ? undefined : { margin: 0 }}>
      <span>{phone ? 'Tap' : 'Click'} a free slot{(() => { const b = bottles.find((x) => x._id === moving); return b ? ' for ' + (b.wine.producer || b.wine.name) : ''; })()}</span>
      <button className="btn sm" onClick={() => setMoving(null)}>Cancel</button>
    </div>
  );
  const fitCabinet = useCallback(() => {
    const frame = cabinetFrameRef.current;
    const cabinetElement = frame?.querySelector('.cabinet');
    if (!frame || !cabinetElement) return;
    const frameRect = frame.getBoundingClientRect();
    const cabinetRect = cabinetElement.getBoundingClientRect();
    const scroll = frame.closest('.scroll');
    const availableHeight = (scroll ? scroll.getBoundingClientRect().bottom : window.innerHeight) - frameRect.top - 16;
    const availableWidth = frameRect.width - 16;
    const fitRatio = Math.min(availableWidth / cabinetRect.width, availableHeight / cabinetRect.height);
    setCabinetScale((scale) => Math.max(10, Math.min(300, Math.floor(scale * fitRatio))));
  }, []);
  useEffect(() => {
    if (!closet) return undefined;
    let resizeFrame;
    const fit = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(fitCabinet);
    };
    fit();
    window.addEventListener('resize', fit);
    return () => {
      cancelAnimationFrame(resizeFrame);
      window.removeEventListener('resize', fit);
    };
  }, [closet?._id, fitCabinet, phone, tab, webView]);
  const cabinetSizeControl = (
    <div className="cabinet-size-control">
      <label htmlFor="cabinet-size">Closet size</label>
      <input id="cabinet-size" type="range" min="10" max="300" step="2" value={cabinetScale} onChange={(event) => setCabinetScale(Number(event.target.value))} />
      <output>{cabinetScale}%</output>
      <button className="btn sm" type="button" onClick={fitCabinet}>Fit screen</button>
    </div>
  );

  if (loadErr && !data) return <div className="loading"><div className="panel" style={{ textAlign: 'center' }}><h3>Botl could not load</h3><p className="err">{loadErr}</p><button className="btn" onClick={load}>Try again</button></div></div>;
  if (!data) return <div className="loading">Loading…</div>;

  if (!closet && !phone && (webView === 'map' || webView === 'cellar'))
    return (
      <div className="web">
        <div className="web-body" style={{ gridTemplateColumns: 'minmax(0,1fr) 340px' }}>
          <section className="web-main web-relative">
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setWebView('closet')}>Set up a closet</button>
            {webView === 'map' ? <WineMap bottles={bottles} onSelect={(bottle) => setSel({ kind: 'bottle', id: bottle._id })} /> : (
              <>
                <h2 style={{ fontSize: '1.4rem' }}>Global cellar · {cellar.length} bottles</h2>
                <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setSel({ kind: 'add', key: null })}>+ Add to cellar</button>
                {list(cellar)}
              </>
            )}
          </section>
          <aside className="web-panel">{renderDetail()}</aside>
        </div>
        {toastEl}
      </div>
    );

  if (!closet)
    return (
      <div className="empty-state">
        <h1>Botl</h1>
        <p>Describe your first closet. Pick the template closest to it; you can change every shelf afterwards.</p>
        <div className="presets">
          {Object.entries(ref.templates).map(([k, t]) => (
            <button key={k} className="preset" onClick={() => createCloset(k)}>
              <b>{t.name}</b>
              <span>{t.desc}</span>
            </button>
          ))}
        </div>
        {!phone && <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setWebView('map')}>View wine map</button>}
        {cellar.length > 0 && (
          <section className="empty-cellar">
            <p className="eyebrow">Global cellar · {cellar.length} bottles</p>
            <button className="btn" onClick={() => setSel({ kind: 'add', key: null })}>+ Add to cellar</button>
            <div className="blist">
              {cellar.map((bottle) => (
                <button key={bottle._id} className="bitem" onClick={() => setSel({ kind: 'bottle', id: bottle._id })}>
                  <span className="dot" style={{ width: 16, height: 16, background: COLORS[bottle.wine.color]?.v }} />
                  <span className="t"><b>{[bottle.wine.producer, bottle.wine.name].filter(Boolean).join(' ')}</b><small>{bottle.wine.vintage} · {bottle.location.appellation || bottle.location.region}</small></span>
                </button>
              ))}
            </div>
            {sel && <div className="empty-detail">{renderDetail()}</div>}
          </section>
        )}
        {toastEl}
      </div>
    );

  const usedHere = bySlot.size;
  const capHere = closet.shelves.reduce((t, sh) => t + capacity(sh), 0);

  if (phone)
    return (
      <div className="phone">
        <div className="app-top">
          <div className="closet-pick">
            <select aria-label="Closet" value={closet._id} onChange={(e) => { setActiveId(e.target.value); setSel(null); setMoving(null); setTopShelf(null); }}>
              {closets.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <small>{usedHere} bottles · {capHere - usedHere} free slots</small>
          </div>
          <span className="brand">Botl</span>
        </div>
        {movingBanner}
        {tab === 'closet' && cabinetSizeControl}
        {tab !== 'layout' && chips}
        <div className="scroll">
          {tab === 'closet' && cabinet}
          {tab === 'bottles' && list()}
          {tab === 'layout' && <>{cabinet}<div style={{ height: 14 }} />{editor}</>}
        </div>
        {tab !== 'bottles' && cellarStrip}
        <nav className="tabbar">
          {[['closet', 'Closet'], ['bottles', 'Bottles'], ['layout', 'Layout']].map(([k, l]) => (
            <button key={k} aria-pressed={tab === k} onClick={() => { setTab(k); setSel(null); }}>
              {ICONS[k]}
              {l}
            </button>
          ))}
        </nav>
        {sel && !moving && tab !== 'layout' && (
          <div className="sheet-wrap" onClick={(e) => e.target === e.currentTarget && setSel(null)}>
            <div className="sheet"><div className="grab" />{renderDetail()}</div>
          </div>
        )}
        {toastEl}
      </div>
    );

  return (
    <div className="web">
      <div className="web-body">
        <aside className="web-side">
          <span className="brand" style={{ fontSize: '1.4rem' }}>Botl</span>
          <div>
            <p className="eyebrow" style={{ marginBottom: 6 }}>Closets</p>
            <div className="closet-list">
              {closets.map((c) => {
                const n = bottles.filter((b) => b.slot && String(b.slot.closet) === c._id).length;
                const t = c.shelves.reduce((s, sh) => s + capacity(sh), 0);
                return (
                  <button key={c._id} aria-pressed={webView === 'closet' && c._id === closet._id} onClick={() => { setActiveId(c._id); setWebView('closet'); setSel(null); setMoving(null); setTopShelf(null); }}>
                    <b>{c.name}</b>
                    <small>{n} of {t} · {c.kind}</small>
                  </button>
                );
              })}
              <button style={{ color: 'var(--accent)' }} onClick={() => { setWebView('closet'); setWebEdit(true); setSel(null); }}><b>+ New closet</b></button>
            </div>
          </div>
          <div>
            <button className="list-link" aria-pressed={webView === 'bottles'} onClick={() => setWebView('bottles')}><b>All bottles</b> <span className="muted">{bottles.length}</span></button>
            <button className="list-link" aria-pressed={webView === 'cellar'} onClick={() => { setWebView('cellar'); setSel(null); }}><b>Global cellar</b> <span className="muted">{cellar.length}</span></button>
            <button className="list-link" aria-pressed={webView === 'map'} onClick={() => { setWebView('map'); setSel(null); }}><b>Wine map</b></button>
          </div>
          {webView !== 'map' && <div>
            <p className="eyebrow">In this closet</p>
            <div className="stat">{usedHere}<span className="muted" style={{ fontSize: '1rem', fontWeight: 500 }}> / {capHere}</span></div>
          </div>}
          {webView !== 'map' && <div>
            <p className="eyebrow" style={{ marginBottom: 6 }}>Legend</p>
            <div className="legend">
              <div><span className="bottle" style={{ width: 16, height: 16, borderRadius: '50%', display: 'inline-block' }} />Base facing you</div>
              <div><span className="bottle neck" style={{ width: 16, height: 16, borderRadius: '50%', display: 'inline-block' }} />Neck facing you</div>
              <div><span className="dot" style={{ border: '1.5px dashed var(--muted)', background: 'transparent' }} />Free slot</div>
            </div>
          </div>}
        </aside>
        <section className="web-main web-relative">
          {webView === 'map' ? (
            <WineMap bottles={bottles} onSelect={(bottle) => setSel({ kind: 'bottle', id: bottle._id })} />
          ) : webView === 'cellar' ? (
            <>
              <h2 style={{ fontSize: '1.4rem' }}>Global cellar · {cellar.length} bottles</h2>
              <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => { setSel({ kind: 'add', key: null }); }}>+ Add to cellar</button>
              {list(cellar)}
            </>
          ) : webView === 'bottles' ? (
            <>
              <h2 style={{ fontSize: '1.4rem' }}>All bottles</h2>
              {chips}
              {list()}
            </>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem' }}>{closet.name}</h2>
                  <span className="muted" style={{ fontSize: '.85rem' }}>{closet.kind} · {closet.shelves.length} shelves · {widthOf(closet)} bottles wide</span>
                </div>
                <div className="row-btns">
                  <button className={'btn' + (webEdit ? ' primary' : '')} onClick={() => { setWebEdit((v) => !v); setSel(null); }}>{webEdit ? 'Done editing' : 'Edit layout'}</button>
                </div>
              </div>
              {chips}
              {movingBanner}
              {cabinetSizeControl}
              <div className="closet-area">{cabinet}{cellarStrip}</div>
            </>
          )}
          {toastEl}
        </section>
        <aside className="web-panel">{webEdit && webView === 'closet' ? editor : renderDetail()}</aside>
      </div>
    </div>
  );
}
