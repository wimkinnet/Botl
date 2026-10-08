import React, { useEffect, useMemo, useRef, useState } from 'react';
import { geoCentroid, geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import world from 'world-atlas/countries-110m.json';
import { COLORS, bLabel } from '../wine.js';

const width = 960;
const height = 500;
const clusterDistance = 25;
const tidy = (value = '') => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const wineKey = (bottle) => {
  const identity = [bottle.wine?.producer, bottle.wine?.name, bottle.wine?.vintage, bottle.wine?.color]
    .map((value) => tidy(String(value || ''))).join('|');
  return identity.replaceAll('|', '') ? identity : bottle._id;
};

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
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [openCluster, setOpenCluster] = useState(null);
  const drag = useRef(null);
  const mapRef = useRef(null);
  const countries = useMemo(() => feature(world, world.objects.countries).features, []);
  const projection = useMemo(() => geoNaturalEarth1().fitExtent([[12, 12], [width - 12, height - 12]], { type: 'Sphere' }), []);
  const path = useMemo(() => geoPath(projection), [projection]);
  const countryCentroids = useMemo(() => new Map(countries.map((country) => [canonicalCountry(country.properties.name), geoCentroid(country)])), [countries]);

  const { wines, points, unplaced, countryCounts } = useMemo(() => {
    const countryCounts = new Map();
    const distinctWines = new Map();
    bottles.forEach((bottle) => {
      const key = wineKey(bottle);
      if (distinctWines.has(key)) distinctWines.get(key).bottles.push(bottle);
      else distinctWines.set(key, { key, bottle, bottles: [bottle] });
    });
    const placed = [];
    const unplaced = [];
    distinctWines.forEach((wine) => {
      const bottle = wine.bottle;
      const location = bottle.location || {};
      const country = canonicalCountry(location.country);
      const region = tidy(location.region);
      const appellation = tidy(location.appellation);
      const regionAnchor = regionPoints[`${country}|${region}`] || regionPoints[`${country}|${appellation}`];
      const centroid = countryCentroids.get(country);
      const coordinates = regionAnchor || centroid;
      if (!coordinates) {
        unplaced.push(wine);
        return;
      }
      if (country) countryCounts.set(country, (countryCounts.get(country) || 0) + 1);
      placed.push({ ...wine, coordinates });
    });

    const projected = placed.map((wine) => {
      const [x, y] = projection(wine.coordinates);
      return { ...wine, x, y };
    });
    const clusters = [];
    projected.forEach((wine) => {
      const cluster = clusters.find(({ items }) => {
        const centerX = items.reduce((sum, item) => sum + item.x, 0) / items.length;
        const centerY = items.reduce((sum, item) => sum + item.y, 0) / items.length;
        return Math.hypot((wine.x - centerX) * zoom, (wine.y - centerY) * zoom) <= clusterDistance;
      });
      if (cluster) cluster.items.push(wine);
      else clusters.push({ items: [wine] });
    });
    const points = clusters.map(({ items }) => ({
      wines: items,
      x: items.reduce((sum, item) => sum + item.x, 0) / items.length,
      y: items.reduce((sum, item) => sum + item.y, 0) / items.length
    }));
    return { wines: [...distinctWines.values()], points, unplaced, countryCounts };
  }, [bottles, countryCentroids, projection, zoom]);

  const changeZoom = (factor) => {
    setOpenCluster(null);
    setZoom((value) => Math.max(1, Math.min(8, value * factor)));
  };
  const zoomToPoint = (factor, x, y) => {
    const nextZoom = Math.min(8, zoom * factor);
    setOpenCluster(null);
    setZoom(nextZoom);
    setPan({ x: nextZoom * (width / 2 - x), y: nextZoom * (height / 2 - y) });
  };
  useEffect(() => {
    const map = mapRef.current;
    const handleWheel = (event) => {
      event.preventDefault();
      setOpenCluster(null);
      setZoom((value) => Math.max(1, Math.min(8, value * (event.deltaY < 0 ? 1.2 : 1 / 1.2))));
    };
    map.addEventListener('wheel', handleWheel, { passive: false });
    return () => map.removeEventListener('wheel', handleWheel);
  }, []);
  const onPointerDown = (event) => {
    if (event.target.closest('.wine-map-marker')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, pan };
  };
  const onPointerMove = (event) => {
    if (!drag.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setPan({
      x: drag.current.pan.x + (event.clientX - drag.current.x) * width / bounds.width,
      y: drag.current.pan.y + (event.clientY - drag.current.y) * height / bounds.height
    });
  };
  const onPointerUp = () => { drag.current = null; };
  const openWines = points.find(({ wines: group }) => group.map((wine) => wine.key).join('::') === openCluster)?.wines || [];

  return (
    <div className="wine-map-view">
      <div className="wine-map-heading">
        <div>
          <p className="eyebrow">Wine origins</p>
          <h2>World map</h2>
        </div>
        <span className="wine-map-count">{wines.length} distinct wines · {bottles.length} bottles</span>
      </div>
      <div className="wine-map-stage">
        <svg
          ref={mapRef}
          className="wine-map"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="World map showing the origins of your wines. Scroll to zoom and drag to pan."
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <rect width={width} height={height} className="wine-map-ocean" />
          <g transform={`translate(${width / 2 + pan.x} ${height / 2 + pan.y}) scale(${zoom}) translate(${-width / 2} ${-height / 2})`}>
            {countries.map((country) => {
              const name = canonicalCountry(country.properties.name);
              return <path key={country.properties.name} d={path(country)} className={'wine-map-country' + (countryCounts.has(name) ? ' has-wine' : '')} />;
            })}
          </g>
          {points.map(({ wines: nearbyWines, x, y }) => {
              const markerX = width / 2 + pan.x + zoom * (x - width / 2);
              const markerY = height / 2 + pan.y + zoom * (y - height / 2);
              const dotRadius = Math.min(8, 5.5 + (zoom - 1) * 0.35);
              const clusterRadius = Math.min(11, 8.5 + (zoom - 1) * 0.35);
              const first = nearbyWines[0];
              const labels = nearbyWines.map(({ bottle }) => bLabel(bottle)).filter(Boolean);
              const locations = nearbyWines.map(({ bottle }) => [bottle.location?.appellation, bottle.location?.region, bottle.location?.country].filter(Boolean).join(', '));
              const clustered = nearbyWines.length > 1;
              const title = clustered ? `${nearbyWines.length} wines: ${labels.join('; ')}` : `${labels[0] || 'Unnamed wine'} · ${locations[0]}`;
              const activate = () => {
                if (!clustered) return onSelect(first.bottle);
                if (zoom < 8) return zoomToPoint(1.5, x, y);
                setOpenCluster(nearbyWines.map((wine) => wine.key).join('::'));
              };
              return (
                <g
                  key={nearbyWines.map((wine) => wine.key).join('::')}
                  className={'wine-map-marker' + (clustered ? ' clustered' : '')}
                  role="button"
                  tabIndex="0"
                  aria-label={clustered ? `${nearbyWines.length} nearby wines: ${labels.join(', ')}` : `${labels[0] || 'Unnamed wine'} from ${locations[0]}`}
                  onClick={activate}
                  onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(); } }}
                >
                  <title>{title}</title>
                  <circle cx={markerX} cy={markerY} r={Math.max(10, dotRadius + 4)} className="wine-map-hit" />
                  <circle cx={markerX} cy={markerY} r={clustered ? clusterRadius : dotRadius} fill={COLORS[first.bottle.wine?.color]?.v || 'var(--accent)'} className="wine-map-dot" />
                  {clustered && <text x={markerX} y={markerY} fontSize={8 + (zoom - 1) * 0.2} className="wine-map-cluster-count">{nearbyWines.length}</text>}
                </g>
              );
            })}
        </svg>
        <div className="wine-map-controls" role="group" aria-label="Map zoom controls">
          <button type="button" aria-label="Zoom in" title="Zoom in" onClick={() => changeZoom(1.35)}>+</button>
          <button type="button" aria-label="Zoom out" title="Zoom out" onClick={() => changeZoom(1 / 1.35)}>−</button>
          <button type="button" aria-label="Reset map view" title="Reset map view" onClick={() => { setOpenCluster(null); setZoom(1); setPan({ x: 0, y: 0 }); }}>↺</button>
        </div>
      </div>
      {openCluster && openWines.length > 1 && (
        <div className="wine-map-cluster-list" aria-label="Wines at this map location">
          <p className="eyebrow">Wines at this spot</p>
          {openWines.map(({ bottle, key }) => (
            <button key={key} onClick={() => onSelect(bottle)}>
              <b>{bLabel(bottle) || 'Unnamed wine'}</b>
              <span>{[bottle.location?.appellation, bottle.location?.region, bottle.location?.country].filter(Boolean).join(', ')}</span>
            </button>
          ))}
        </div>
      )}
      <div className="wine-map-legend">
        {Object.entries(COLORS).map(([key, color]) => (
          <span key={key}><i style={{ background: color.v }} />{color.label}</span>
        ))}
      </div>
      {!!unplaced.length && (
        <div className="wine-map-unplaced">
          <p className="eyebrow">Location needed · {unplaced.length}</p>
          {unplaced.map((wine) => (
            <button key={wine.key} onClick={() => onSelect(wine.bottle)}>{bLabel(wine.bottle) || 'Unnamed wine'}{wine.bottles.length > 1 ? ` · ${wine.bottles.length} bottles` : ''}</button>
          ))}
        </div>
      )}
      {!bottles.length && <p className="muted">Add a country or region to a bottle to see it here.</p>}
    </div>
  );
}