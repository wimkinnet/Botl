export const COLORS = {
  red: { label: 'Red', v: 'var(--w-red)' },
  white: { label: 'White', v: 'var(--w-white)' },
  rose: { label: 'Rosé', v: 'var(--w-rose)' },
  spark: { label: 'Sparkling', v: 'var(--w-spark)' },
  sweet: { label: 'Sweet & fortified', v: 'var(--w-sweet)' }
};

export const bLabel = (b) => [b.wine.producer, b.wine.name, b.wine.vintage].filter(Boolean).join(' ');
export const grapesText = (w) => (w.grapes || []).filter((g) => g.grape).map((g) => g.grape + (g.pct != null && g.pct !== '' ? ' ' + g.pct + '%' : '')).join(', ');
export const grapeTotal = (grapes) => (grapes || []).reduce((t, g) => t + (+g.pct || 0), 0);

export function emptyForm() {
  return {
    wine: { name: '', producer: '', vintage: '', price: '', window: '', color: 'red', grapes: [{ grape: '', pct: '' }] },
    location: { country: '', region: '', appellation: '', vineyard: '' },
    qty: 1
  };
}
export function formFrom(b) {
  const w = b.wine;
  return {
    wine: { ...w, price: w.price ?? '', grapes: w.grapes?.length ? w.grapes.map((g) => ({ grape: g.grape, pct: g.pct ?? '' })) : [{ grape: '', pct: '' }] },
    location: { ...b.location },
    qty: 1
  };
}

// Location suggestions narrow each other: a country limits the regions, a region limits the appellations.
export function regionsFor(geo, country) {
  const countryKey = Object.keys(geo).find((key) => key.trim().toLowerCase() === country?.trim().toLowerCase());
  if (countryKey) return Object.keys(geo[countryKey]);
  return country?.trim() ? [] : [...new Set(Object.values(geo).flatMap(Object.keys))];
}
export function appsFor(geo, country, region) {
  const countryKey = Object.keys(geo).find((key) => key.trim().toLowerCase() === country?.trim().toLowerCase());
  if (country?.trim() && !countryKey) return [];
  const countries = countryKey ? [[countryKey, geo[countryKey]]] : Object.entries(geo);
  if (region?.trim()) return countries.flatMap(([, regions]) => regions[region] || []);
  return countries.flatMap(([, regions]) => Object.values(regions).flat());
}
// Picking an appellation fills in region and country when they are empty, a region fills in its country.
export function autofill(geo, loc, field) {
  const out = { ...loc };
  if (field === 'appellation' && loc.appellation) {
    for (const [cn, rs] of Object.entries(geo))
      for (const [rn, as] of Object.entries(rs))
        if (as.includes(loc.appellation)) {
          if (!out.region) out.region = rn;
          if (!out.country) out.country = cn;
        }
  }
  if (field === 'region' && loc.region && !out.country) {
    for (const [cn, rs] of Object.entries(geo)) if (rs[loc.region]) out.country = cn;
  }
  return out;
}
