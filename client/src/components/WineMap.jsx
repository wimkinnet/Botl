import React, { useMemo } from 'react';
import { geoCentroid, geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import world from 'world-atlas/countries-110m.json';
import { COLORS, bLabel } from '../wine.js';

const width = 960;
const height = 500;
const tidy = (value = '') => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const countryAliases = {
  usa: 'united states', 'united states of america': 'united states', us: 'united states',
  uk: 'united kingdom', britain: 'united kingdom', england: 'united kingdom',
  holland: 'netherlands', 'the netherlands': 'netherlands'
};
const canonicalCountry = (value) => {
  const name = tidy(value);
  return countryAliases[name] || name;
};

const regionPoints = {
  'france|bordeaux': [-0.58, 44.84], 'france|burgundy': [4.84, 47.05], 'france|champagne': [4.1, 49.1],
  'france|loire': [0.8, 47.4], 'france|rhone': [4.9, 44.3], 'france|provence': [6.1, 43.5], 'france|alsace': [7.4, 48.3],
  'italy|piedmont': [7.95, 44.7], 'italy|tuscany': [11.3, 43.2], 'italy|veneto': [11.8, 45.5],
  'spain|rioja': [-2.5, 42.4], 'spain|castilla y leon': [-4.5, 41.6], 'spain|catalonia': [1.5, 41.3],
  'germany|mosel': [6.9, 49.9], 'germany|rheingau': [8.0, 50.0], 'germany|pfalz': [8.1, 49.3],
  'portugal|douro': [-7.5, 41.2], 'portugal|minho': [-8.4, 41.8],
  'belgium|flanders': [4.8, 51.0], 'belgium|wallonia': [5.3, 50.3],
  'lebanon|bekaa valley': [36.0, 33.9], 'new zealand|marlborough': [173.8, -41.5],
  'new zealand|central otago': [169.2, -45.1], 'new zealand|hawkes bay': [176.8, -39.6],
  'united states|california': [-120.2, 38.0], 'united states|oregon': [-123.0, 44.0],
  'australia|south australia': [139.0, -34.0], 'argentina|mendoza': [-69.2, -33.0],
  'south africa|western cape': [19.0, -33.5]
};

export default function WineMap({ bottles, onSelect }) {
  const countries = useMemo(() => feature(world, world.objects.countries).features, []);
  const projection = useMemo(() => geoNaturalEarth1().fitExtent([[12, 12], [width - 12, height - 12]], { type: 'Sphere' }), []);
  const path = useMemo(() => geoPath(projection), [projection]);
  const countryCentroids = useMemo(() => new Map(countries.map((country) => [canonicalCountry(country.properties.name), geoCentroid(country)])), [countries]);

  const { points, unplaced, countryCounts } = useMemo(() => {
    const countryCounts = new Map();
    const placed = [];
    const unplaced = [];
    bottles.forEach((bottle) => {
      const location = bottle.location || {};
      const country = canonicalCountry(location.country);
      const region = tidy(location.region);
      const appellation = tidy(location.appellation);
      const regionAnchor = regionPoints[`${country}|${region}`] || regionPoints[`${country}|${appellation}`];
      const centroid = countryCentroids.get(country);
      const coordinates = regionAnchor || centroid;
      if (!coordinates) {
        unplaced.push(bottle);
        return;
      }
      if (country) countryCounts.set(country, (countryCounts.get(country) || 0) + 1);
      placed.push({ bottle, coordinates, group: regionAnchor ? `${country}|${region || appellation}` : `country|${country}` });
    });

    const groups = new Map();
    placed.forEach((point) => groups.set(point.group, [...(groups.get(point.group) || []), point]));
    const points = [...groups.values()].flatMap((group) => group.map((point, index) => {
      const [x, y] = projection(point.coordinates);
      const angle = (index / Math.max(group.length, 1)) * Math.PI * 2 - Math.PI / 2;
      const radius = group.length > 1 ? Math.min(19, 7 + group.length * 1.25) : 0;
      return { ...point, x: x + Math.cos(angle) * radius, y: y + Math.sin(angle) * radius };
    }));
    return { points, unplaced, countryCounts };
  }, [bottles, countryCentroids, projection]);

  return (
    <div className="wine-map-view">
      <div className="wine-map-heading">
        <div>
          <p className="eyebrow">Wine origins</p>
          <h2>World map</h2>
        </div>
        <span className="wine-map-count">{points.length} of {bottles.length} bottles plotted</span>
      </div>
      <svg className="wine-map" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="World map showing the origins of your wines">
        <rect width={width} height={height} className="wine-map-ocean" />
        {countries.map((country) => {
          const name = tidy(country.properties.name);
          return <path key={country.properties.name} d={path(country)} className={'wine-map-country' + (countryCounts.has(name) ? ' has-wine' : '')} />;
        })}
        {points.map(({ bottle, x, y }) => (
          <g
            key={bottle._id}
            className="wine-map-marker"
            role="button"
            tabIndex="0"
            aria-label={`${bLabel(bottle)} from ${[bottle.location?.appellation, bottle.location?.region, bottle.location?.country].filter(Boolean).join(', ')}`}
            onClick={() => onSelect(bottle)}
            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(bottle); } }}
          >
            <title>{`${bLabel(bottle)} · ${[bottle.location?.appellation, bottle.location?.region, bottle.location?.country].filter(Boolean).join(', ')}`}</title>
            <circle cx={x} cy={y} r="10" className="wine-map-hit" />
            <circle cx={x} cy={y} r="5.5" fill={COLORS[bottle.wine?.color]?.v || 'var(--accent)'} className="wine-map-dot" />
          </g>
        ))}
      </svg>
      <div className="wine-map-legend">
        {Object.entries(COLORS).map(([key, color]) => (
          <span key={key}><i style={{ background: color.v }} />{color.label}</span>
        ))}
      </div>
      {!!unplaced.length && (
        <div className="wine-map-unplaced">
          <p className="eyebrow">Location needed · {unplaced.length}</p>
          {unplaced.map((bottle) => (
            <button key={bottle._id} onClick={() => onSelect(bottle)}>{bLabel(bottle) || 'Unnamed wine'}</button>
          ))}
        </div>
      )}
      {!bottles.length && <p className="muted">Add a country or region to a bottle to see it here.</p>}
    </div>
  );
}