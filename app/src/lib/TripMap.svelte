<script>
  import { onMount, onDestroy } from 'svelte';
  import L from 'leaflet';
  import 'leaflet/dist/leaflet.css';
  import { app, days } from './state.svelte.js';
  import { publicUrl } from './storage.js';
  import { t } from './i18n.svelte.js';

  let el = $state(null);
  let map = null;
  let layer = null;
  let status = $state('');

  let located = $derived(days().filter(d => d.lat != null && d.lon != null));
  let gpxFiles = $derived((app.bundle?.files ?? []).filter(f => f.kind === 'gpx'));

  const PHASE_COLOUR = {
    cyprus: '#5B7C99', cortina: '#2F5D50', huts: '#C94F6D',
    gardena: '#2F5D50', garda: '#B98A2E', venice: '#5B7C99'
  };

  function dot(colour) {
    return L.divIcon({
      className: 'day-pin',
      html: `<span style="background:${colour}"></span>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
  }

  onMount(() => {
    map = L.map(el, { scrollWheelZoom: false }).setView([46.5, 12.1], 6);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 17,
      // OSM's tile policy requires attribution. It is also just correct.
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    layer = L.layerGroup().addTo(map);
    draw();
  });

  onDestroy(() => { map?.remove(); map = null; });

  // Redraw whenever the located days change.
  $effect(() => {
    located; gpxFiles;
    if (map) draw();
  });

  async function draw() {
    if (!layer) return;
    layer.clearLayers();

    const points = [];
    for (const d of located) {
      const colour = PHASE_COLOUR[d.phase] ?? '#38342F';
      const when = new Date(d.date + 'T12:00:00')
        .toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
      const acts = (d.activities ?? []).map(a => `<li>${escapeHtml(a.title)}</li>`).join('');
      const m = L.marker([d.lat, d.lon], { icon: dot(colour) }).addTo(layer);
      m.bindPopup(
        `<strong>${when}</strong><br>${escapeHtml(d.title ?? '')}` +
        (d.base_location ? `<br><em>${escapeHtml(d.base_location)}</em>` : '') +
        (acts ? `<ul style="margin:6px 0 0 16px;padding:0">${acts}</ul>` : '') +
        `<br><a href="#day-${d.date}">open this day</a>`
      );
      points.push([d.lat, d.lon]);
    }

    // A line through the located days, in date order, so the shape of the trip
    // is visible even where individual days have no coordinate yet.
    if (points.length > 1) {
      L.polyline(points, { color: '#C94F6D', weight: 2, opacity: 0.6, dashArray: '4 6' }).addTo(layer);
    }

    for (const f of gpxFiles) {
      try {
        const text = await (await fetch(publicUrl(f))).text();
        const line = parseGpx(text);
        if (line.length > 1) {
          L.polyline(line, { color: '#2F5D50', weight: 3 }).addTo(layer).bindPopup(escapeHtml(f.filename));
          points.push(...line);
        }
      } catch (e) {
        console.error('could not draw GPX', f.filename, e);
      }
    }

    if (points.length) map.fitBounds(L.latLngBounds(points).pad(0.2));
    status = located.length
      ? t('map.placed', { n: located.length, total: days().length })
      : t('map.none');
  }

  /** Minimal GPX reader: track and route points are all we draw. */
  function parseGpx(text) {
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    if (doc.querySelector('parsererror')) throw new Error('not valid GPX');
    return [...doc.querySelectorAll('trkpt, rtept')]
      .map(p => [parseFloat(p.getAttribute('lat')), parseFloat(p.getAttribute('lon'))])
      .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
  }

  const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
</script>

<section class="map-section">
  <h2>{t('map.title')}</h2>
  <p class="sub">{status}</p>
  <div class="map" bind:this={el}></div>
</section>

<style>
  .map-section { margin-top: 30px; }
  .sub { color: var(--rock-soft); margin: 4px 0 12px; font-size: 13.5px; }
  .map {
    height: 380px; border-radius: var(--radius);
    border: 1px solid var(--line); overflow: hidden; background: var(--ice);
  }
  :global(.day-pin span) {
    display: block; width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid #fff; box-shadow: 0 1px 4px rgba(30,40,35,.4);
  }
  :global(.leaflet-container) { font-family: var(--font-body); }
  @media (max-width: 640px) { .map { height: 300px; } }
</style>
