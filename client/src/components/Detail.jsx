import React, { useEffect, useState } from 'react';
import { COLORS, grapesText, grapeTotal, regionsFor, appsFor, autofill } from '../wine.js';

const Kv = ({ k, v }) => (
  <>
    <dt>{k}</dt>
    <dd>{v == null || v === '' ? '—' : v}</dd>
  </>
);

export function WineDetails({ b }) {
  const w = b.wine, l = b.location;
  return (
    <>
      {b.winePhotoId && <img className="wine-photo" src={'/api/photos/' + b.winePhotoId} alt={`${w.producer || w.name || 'Wine'} bottle`} />}
      <div className="dgroup">
        <p className="eyebrow">Wine</p>
        <dl className="kv">
          <Kv k="Name" v={w.name} />
          <Kv k="Producer" v={w.producer} />
          <Kv k="Vintage" v={w.vintage} />
          <Kv k="Price" v={w.price != null ? '€ ' + w.price : ''} />
          <Kv k="Grapes" v={grapesText(w)} />
          <Kv k="Colour" v={COLORS[w.color]?.label} />
          <Kv k="Drink" v={w.window} />
        </dl>
      </div>
      <div className="dgroup">
        <p className="eyebrow">Location</p>
        <dl className="kv">
          <Kv k="Country" v={l.country} />
          <Kv k="Region" v={l.region} />
          <Kv k="Appellation" v={l.appellation} />
          {l.vineyard && <Kv k="Vineyard" v={l.vineyard} />}
        </dl>
      </div>
    </>
  );
}

export function BottleDetail({ b, where, position, onDrink, onMove, onToCellar, onEdit }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="panel">
      <p className="eyebrow">{where}</p>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span className="bottle mini-bottle" />
        <h3>
          {b.wine.producer}
          <br />
          <span style={{ fontWeight: 500 }}>{[b.wine.name, b.wine.vintage].filter(Boolean).join(' ')}</span>
        </h3>
      </div>
      {position && (
        <dl className="kv">
          <Kv k="Position" v={position} />
        </dl>
      )}
      <WineDetails b={b} />
      <div className="row-btns">
        {confirm ? (
          <>
            <button className="btn primary" onClick={onDrink}>Yes, it's drunk</button>
            <button className="btn ghost" onClick={() => setConfirm(false)}>Not yet</button>
          </>
        ) : (
          <>
            <button className="btn primary" onClick={() => setConfirm(true)}>Drink this bottle</button>
            <button className="btn" onClick={onMove}>{b.slot ? 'Move' : 'Put in closet'}</button>
            {b.slot && <button className="btn" onClick={onToCellar}>To cellar</button>}
            <button className="btn ghost" onClick={onEdit}>Edit</button>
          </>
        )}
      </div>
    </div>
  );
}

export function WineForm({ title, heading, initial, geo, grapes, showQty, allowPhoto = false, submitLabel, onSubmit, onCancel }) {
  const [f, setF] = useState(initial);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);
  const [ocrStatus, setOcrStatus] = useState('');
  const [labelLines, setLabelLines] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const setWine = (k, v) => setF((s) => ({ ...s, wine: { ...s.wine, [k]: v } }));
  const setLoc = (k, v) => setF((s) => ({ ...s, location: autofill(geo, { ...s.location, [k]: v }, k) }));
  const setGrape = (i, k, v) => setF((s) => ({ ...s, wine: { ...s.wine, grapes: s.wine.grapes.map((g, j) => (j === i ? { ...g, [k]: v } : g)) } }));
  const tot = grapeTotal(f.wine.grapes);
  const uid = React.useId();

  useEffect(() => {
    if (!photo) return undefined;
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const choosePhoto = async (file) => {
    if (!file) { setPhoto(null); setPhotoPreview(''); setLabelLines([]); setOcrStatus(''); return; }
    const jpegName = /\.jpe?g$/i.test(file.name);
    const supportedType = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);
    if (!supportedType && !jpegName) return setErr('Choose a JPEG, PNG, or WebP image.');
    if (file.size > 20 * 1024 * 1024) return setErr('Choose an image smaller than 20 MB.');
    setPhotoBusy(true);
    setErr('');
    setLabelLines([]);
    setOcrStatus('Preparing label reader…');
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const blob = await new Promise((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Could not process this image.')), 'image/webp', 0.82));
      setPhoto(new File([blob], 'wine-photo.webp', { type: 'image/webp' }));
      try {
        setOcrStatus('Preparing label reader…');
        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker('eng', 1, { logger: ({ status, progress }) => {
          setOcrStatus(status === 'recognizing text' ? `Reading label ${Math.round(progress * 100)}%…` : 'Preparing label reader…');
        } });
        let recognizedText;
        try {
          ({ data: { text: recognizedText } } = await worker.recognize(blob));
        } finally {
          await worker.terminate();
        }
        const lines = [...new Set(recognizedText.split(/\r?\n/).map((line) => line.replace(/[^\p{L}\p{N}'’-]+/gu, ' ').trim()).filter((line) => line.length >= 3 && !/^\d+$/.test(line)))];
        setLabelLines(lines.slice(0, 8));
        const vintage = recognizedText.match(/\b(?:19|20)\d{2}\b/)?.[0];
        const normalizedText = ' ' + recognizedText.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
        setF((current) => {
          const next = { ...current, wine: { ...current.wine }, location: { ...current.location } };
          if (vintage && (!next.wine.vintage || next.wine.vintage === 'NV')) next.wine.vintage = vintage;
          for (const [country, regions] of Object.entries(geo)) {
            for (const [region, appellations] of Object.entries(regions)) {
              const match = appellations.find((appellation) => {
                const phrase = ' ' + appellation.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
                return normalizedText.includes(phrase);
              });
              if (match) {
                if (!next.location.country) next.location.country = country;
                if (!next.location.region) next.location.region = region;
                if (!next.location.appellation) next.location.appellation = match;
                return next;
              }
            }
          }
          return next;
        });
        setOcrStatus(lines.length || vintage ? 'Review the label suggestions below.' : 'No clear label text found. You can fill the fields manually.');
      } catch {
        setOcrStatus('Photo added. Label reading is unavailable right now; fill the fields manually.');
      }
    } catch {
      setErr('Could not process this image. Try another photo.');
      setOcrStatus('Could not read the label. You can fill the fields manually.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const applyLabelLine = (field, value) => {
    setWine(field, value);
    setLabelLines((lines) => lines.filter((line) => line !== value));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!f.wine.name.trim() && !f.wine.producer.trim()) return setErr('Give the wine a name or a producer.');
    setBusy(true);
    setErr('');
    try {
      await onSubmit({ ...f, photo });
    } catch (e2) {
      setErr(e2.message);
      setBusy(false);
    }
  };
  const inp = (k, label, ph, extra = {}) => (
    <label className={'field' + (extra.wide ? ' wide' : '')}>
      {label}
      <input value={f.wine[k] ?? ''} placeholder={ph} onChange={(e) => setWine(k, e.target.value)} inputMode={extra.inputMode} />
    </label>
  );
  const loc = (k, label, ph, list) => (
    <label className="field wide">
      {label}
      <input value={f.location[k] ?? ''} placeholder={ph} list={list && uid + list} autoComplete="off" onChange={(e) => setLoc(k, e.target.value)} />
    </label>
  );
  const opts = (arr) => arr.map((v) => <option key={v} value={v} />);

  return (
    <form className="panel" onSubmit={submit}>
      <p className="eyebrow">{title}</p>
      <h3>{heading}</h3>
      <fieldset className="fs">
        <legend>Wine</legend>
        <div className="form-grid">
          {inp('name', 'Name', 'Cuvée, e.g. Reserva', { wide: 1 })}
          {inp('producer', 'Producer', 'e.g. Marqués de Murrieta', { wide: 1 })}
          {inp('vintage', 'Vintage', '2020', { inputMode: 'numeric' })}
          {inp('price', 'Price (€)', '25', { inputMode: 'decimal' })}
          {inp('window', 'Drink', '2026–2034', { wide: 1 })}
          <div className="field wide">
            Colour
            <div className="colorpick">
              {Object.entries(COLORS).map(([k, v]) => (
                <button type="button" key={k} aria-pressed={f.wine.color === k} onClick={() => setWine('color', k)}>
                  <span className="dot" style={{ background: v.v }} />
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="field">
          Grapes
          <div className="grapes">
            {f.wine.grapes.map((g, i) => (
              <div className="grow" key={i}>
                <input list={uid + 'grapes'} value={g.grape} placeholder="Grape" aria-label={`Grape ${i + 1}`} onChange={(e) => setGrape(i, 'grape', e.target.value)} />
                <input type="number" min="0" max="100" value={g.pct} aria-label={`Share of grape ${i + 1} in percent`} onChange={(e) => setGrape(i, 'pct', e.target.value)} />
                <span className="muted">%</span>
                <button type="button" className="icon-btn" aria-label="Remove grape" disabled={f.wine.grapes.length < 2} onClick={() => setF((s) => ({ ...s, wine: { ...s.wine, grapes: s.wine.grapes.filter((_, j) => j !== i) } }))}>
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="row-btns" style={{ alignItems: 'center' }}>
            <button type="button" className="btn sm" onClick={() => setF((s) => ({ ...s, wine: { ...s.wine, grapes: [...s.wine.grapes, { grape: '', pct: '' }] } }))}>
              + Grape
            </button>
            <span className={'muted' + (tot && tot !== 100 ? ' warn' : '')} style={{ fontSize: '.8rem' }}>
              {tot ? `Total ${tot}%` : ''}
            </span>
          </div>
        </div>
      </fieldset>
      {allowPhoto && (
        <div className="wine-photo-picker">
          <label className="field" htmlFor={uid + 'photo'}>Wine photo</label>
          <input id={uid + 'photo'} type="file" accept=".jpg,.jpeg,image/jpeg,image/jpg,image/png,image/webp" onChange={(event) => choosePhoto(event.target.files?.[0])} />
          {photoPreview && <img className="wine-photo-preview" src={photoPreview} alt="Selected wine photo preview" />}
          {ocrStatus && <small className="muted" role="status">{ocrStatus}</small>}
          {!!labelLines.length && (
            <div className="label-suggestions">
              <span className="eyebrow">Recognized label text</span>
              {labelLines.map((line) => (
                <div key={line}>
                  <span>{line}</span>
                  <button type="button" className="btn sm" onClick={() => applyLabelLine('producer', line)}>Producer</button>
                  <button type="button" className="btn sm" onClick={() => applyLabelLine('name', line)}>Wine name</button>
                </div>
              ))}
            </div>
          )}
          <small className="muted">JPEG, PNG, or WebP · up to 20 MB before resizing</small>
        </div>
      )}
      <fieldset className="fs">
        <legend>Location</legend>
        <div className="form-grid">
          {loc('country', 'Country', 'France', 'country')}
          {loc('region', 'Region', 'Bordeaux', 'region')}
          {loc('appellation', 'Appellation', 'Pauillac', 'app')}
          {loc('vineyard', 'Vineyard or cru (optional)', '')}
        </div>
      </fieldset>
      <datalist id={uid + 'grapes'}>{opts(grapes)}</datalist>
      <datalist id={uid + 'country'}>{opts(Object.keys(geo))}</datalist>
      <datalist id={uid + 'region'}>{opts(regionsFor(geo, f.location.country))}</datalist>
      <datalist id={uid + 'app'}>{opts(appsFor(geo, f.location.country, f.location.region))}</datalist>
      {showQty && (
        <div className="field">
          Number of bottles
          <span className="stepper">
            <button type="button" aria-label="Fewer bottles" disabled={f.qty <= 1} onClick={() => setF((s) => ({ ...s, qty: s.qty - 1 }))}>−</button>
            <output>{f.qty}</output>
            <button type="button" aria-label="More bottles" disabled={f.qty >= 48} onClick={() => setF((s) => ({ ...s, qty: s.qty + 1 }))}>+</button>
          </span>
        </div>
      )}
      {err && <p className="err">{err}</p>}
      <div className="row-btns">
        <button className="btn primary" type="submit" disabled={busy || photoBusy}>
          {typeof submitLabel === 'function' ? submitLabel(f) : submitLabel}
        </button>
        <button className="btn ghost" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
