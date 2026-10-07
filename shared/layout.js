// Closet geometry shared by the API and the client.
// A slot is never stored on its own: it is derived from the shelf settings, and only bottles store a position.

export const SHELF_TYPES = ['grid', 'stagger', 'stand'];
export const LIMITS = {
  rows: { grid: [1, 8], stagger: [1, 8], stand: [1, 6] },
  cols: [1, 14],
  colsAlt: [1, 19],
  depth: [1, 2],
  width: [0, 14]
};

// grid units per bottle diameter; head-to-tail (alternating) bottles sit closer: one base plus one neck
export const U = 20;
export const pitchOf = (sh) => (sh.alt && sh.type !== 'stand' ? 14 : U);

export const shelfId = (sh) => String(sh._id ?? sh.id);
export const slotKey = (sid, d, r, c) => `${sid}:${d}:${r}:${c}`;
export const parseKey = (k) => {
  const [shelf, d, r, c] = k.split(':');
  return { shelf, d: +d, r: +r, c: +c };
};

// staggered racks are a pyramid: the bottom row is the longest, each row above one bottle shorter
export function rowLen(sh, r) {
  if (sh.type === 'stagger') return Math.max(1, sh.cols - (sh.rows - 1 - r));
  return sh.cols;
}
export const depthOf = (sh) => (sh.type === 'stand' ? 1 : sh.depth || 1);

export function validKeys(sh) {
  const s = new Set();
  const sid = shelfId(sh);
  for (let d = 0; d < depthOf(sh); d++)
    for (let r = 0; r < sh.rows; r++)
      for (let c = 0; c < rowLen(sh, r); c++) s.add(slotKey(sid, d, r, c));
  return s;
}
export const capacity = (sh) => validKeys(sh).size;

// every shelf in a closet is equally wide: the closet width (in bottles) is the widest shelf, or more if set
export const needW = (sh) => Math.ceil((U + pitchOf(sh) * (sh.cols - 1)) / U);
export const widthOf = (c) => Math.max(c.width || 0, 1, ...c.shelves.map(needW));

// which way a bottle faces follows from the shelf, so it is never entered per bottle
export function facing(sh, r, c) {
  if (sh.type === 'stand') return 'up';
  return sh.alt && (r + c) % 2 === 1 ? 'neck' : 'base';
}
export const FACING = { base: 'Base facing you', neck: 'Neck facing you', up: 'Standing upright' };

export const letter = (i) => String.fromCharCode(65 + i);

// Position code: shelf letter, row (only if the shelf has more than one), slot, and "b" for the back row.
export function code(closet, slot) {
  const i = closet.shelves.findIndex((s) => shelfId(s) === String(slot.shelf));
  if (i < 0) return '?';
  const sh = closet.shelves[i];
  return letter(i) + (sh.rows > 1 ? slot.r + 1 : '') + '-' + (slot.c + 1) + (slot.d === 1 ? 'b' : '');
}

const clamp = (v, [lo, hi]) => Math.min(hi, Math.max(lo, Math.round(Number(v) || 0)));

// Normalise a shelf coming from a client so it always respects the limits.
export function cleanShelf(s) {
  const type = SHELF_TYPES.includes(s.type) ? s.type : 'grid';
  const alt = type !== 'stand' && !!s.alt;
  const out = {
    type,
    rows: clamp(s.rows ?? 1, LIMITS.rows[type]),
    cols: clamp(s.cols ?? 6, alt ? LIMITS.colsAlt : LIMITS.cols),
    depth: type === 'stand' ? 1 : clamp(s.depth ?? 1, LIMITS.depth),
    alt
  };
  if (s._id) out._id = s._id;
  return out;
}

export const TEMPLATES = {
  single: {
    name: 'Wine fridge', kind: 'Fridge', desc: '6 shelves × 6 bottles',
    shelves: () => Array.from({ length: 6 }, () => ({ type: 'grid', rows: 1, cols: 6, depth: 1, alt: false }))
  },
  dual: {
    name: 'Large fridge', kind: 'Fridge', desc: 'Upright top shelf, 6 alternating shelves',
    shelves: () => [
      { type: 'stand', rows: 2, cols: 6, depth: 1, alt: false },
      ...Array.from({ length: 6 }, () => ({ type: 'grid', rows: 1, cols: 7, depth: 1, alt: true }))
    ]
  },
  rack: {
    name: 'Wall rack', kind: 'Rack', desc: 'Staggered, 5 rows × 9',
    shelves: () => [{ type: 'stagger', rows: 5, cols: 9, depth: 1, alt: false }]
  },
  blank: {
    name: 'New closet', kind: 'Custom', desc: 'One empty shelf to start',
    shelves: () => [{ type: 'grid', rows: 1, cols: 6, depth: 1, alt: false }]
  }
};
