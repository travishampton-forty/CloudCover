const { useEffect, useRef } = React;

function waitForLeaflet(cb, tries = 0) {
  if (window.L && window.L.map) return cb();
  if (tries > 100) return;
  setTimeout(() => waitForLeaflet(cb, tries + 1), 50);
}

function FacilityMap({ facilities = [], onOpen }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const openRef = useRef(onOpen);
  openRef.current = onOpen;

  useEffect(() => {
    let cancelled = false;
    waitForLeaflet(() => {
      if (cancelled || !elRef.current || mapRef.current) return;
      const L = window.L;
      const map = L.map(elRef.current, { scrollWheelZoom: false, zoomControl: true, attributionControl: true });
      mapRef.current = map;
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 18,
      }).addTo(map);
      map.setView([39.5, -98.35], 4);
      layerRef.current = L.layerGroup().addTo(map);
      draw();
    });
    return () => { cancelled = true; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  useEffect(() => { draw(); }, [facilities]);

  function draw() {
    const L = window.L;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!L || !map || !layer) return;
    layer.clearLayers();
    const pts = facilities.filter(f => typeof f.lat === 'number' && typeof f.lng === 'number');
    pts.forEach(f => {
      const m = L.circleMarker([f.lat, f.lng], {
        radius: 9, color: '#fff', weight: 2.5, fillColor: f.color, fillOpacity: 1,
      }).addTo(layer);
      m.bindTooltip(
        `<div style="font-family:'Archivo',system-ui,sans-serif;min-width:150px">
           <div style="font-weight:700;font-size:12px;color:#0D1B2A;line-height:15px">${f.name}</div>
           <div style="font-size:11px;color:#5b6672;margin-top:1px">${f.city || ''}</div>
           <div style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:#0D1B2A;margin-top:5px">
             <span style="width:8px;height:8px;border-radius:50%;background:${f.color};display:inline-block"></span>${f.tierLabel || ''}
           </div>
         </div>`,
        { direction: 'top', offset: [0, -8], opacity: 1 }
      );
      m.on('mouseover', () => m.setStyle({ radius: 11 }));
      m.on('mouseout', () => m.setStyle({ radius: 9 }));
      m.on('click', () => { if (openRef.current) openRef.current(f.id); });
    });
    if (pts.length) {
      const b = L.latLngBounds(pts.map(f => [f.lat, f.lng]));
      map.fitBounds(b, { padding: [50, 50], maxZoom: 6 });
    }
  }

  return React.createElement('div', {
    ref: elRef,
    style: { position: 'absolute', inset: 0, borderRadius: '12px' },
  });
}

module.exports = { FacilityMap };
