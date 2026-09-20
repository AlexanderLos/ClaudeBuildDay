// <agua-map> — Leaflet map for Agua Vecina (San Juan–Carolina). Waits for window.L (loaded in <helmet>).
(function () {
  if (customElements.get('agua-map')) return;
  const SVG = {
    drop: '<svg viewBox="0 0 24 24" width="15" height="15"><path d="M12 2.5C9 6.8 6 10 6 13.8a6 6 0 0 0 12 0C18 10 15 6.8 12 2.5z" fill="#fff"/></svg>',
    truck: '<svg viewBox="0 0 24 24" width="16" height="16" fill="#fff"><rect x="2" y="6" width="11" height="9" rx="1"/><path d="M13 9h4.2l3.3 3.4V15H13z"/><circle cx="6.5" cy="17.2" r="2.2"/><circle cx="17" cy="17.2" r="2.2"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="17" height="17"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    locate: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#0F1F3D" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v3.5M12 18v3.5M2.5 12H6M18 12h3.5"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#4B5875" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };
  const SRC_AAA = 'Source: Official AAA notice';
  const SITES = [
    { id: 'escorial', type: 'official', name: 'Pozo Escorial', ll: [18.392, -65.962], hours: 'Open until 7:00 p.m.', note: 'Bring your own containers', source: SRC_AAA, updated: 'Updated 32 minutes ago' },
    { id: 'julia', type: 'official', name: 'Julia de Burgos Park cistern', ll: [18.372, -65.985], hours: 'Open until 6:00 p.m.', note: 'Street-level access', source: SRC_AAA, updated: 'Updated 1 hour ago' },
    { id: 'riopiedras', type: 'official', name: 'Río Piedras Plaza oasis', ll: [18.400, -66.050], hours: 'Open until 8:00 p.m.', note: 'Estimated wait: 15 minutes', source: SRC_AAA, updated: 'Updated 45 minutes ago' },
    { id: 'islaverde', type: 'official', name: 'Isla Verde water truck', ll: [18.443, -66.018], hours: 'Open until 5:00 p.m.', note: 'Maximum 5 gallons per person', source: SRC_AAA, updated: 'Updated 20 minutes ago' },
    { id: 'villa', type: 'delivery', recommended: true, name: 'Community delivery · Villa Carolina', ll: [18.418, -65.978], hours: 'Delivery window: 4:00–4:30 p.m.', note: 'Water from a verified official point', source: 'Source: Community coordination', updated: 'Updated 8 minutes ago' },
    { id: 'sabana', type: 'delivery', name: 'Sabana Gardens route', ll: [18.425, -66.045], hours: 'Next departure: 5:15 p.m.', note: '2 spots available', source: 'Source: Community coordination', updated: 'Updated 14 minutes ago' }
  ];
  const BY_ID = Object.fromEntries(SITES.map(s => [s.id, s]));
  const ZONE = [18.386, -65.996];
  const ROUTE = [[18.418, -65.978], [18.412, -65.986], [18.400, -65.990], [18.392, -65.998], [18.386, -65.996]];
  const AREA = [[18.436, -65.992], [18.442, -65.952], [18.405, -65.922], [18.362, -65.930], [18.354, -65.986], [18.376, -66.008], [18.408, -66.004]];
  const CSS = `
.agua-map{display:block;position:relative;width:100%;height:100%;overflow:hidden;font-family:"Instrument Sans",system-ui,sans-serif;color:#0F1F3D;background:#EEF2F0}
.agua-map .lmap{position:absolute;inset:0;background:#EEF2F0}
.agua-map[calm]:not([calm="false"]) .leaflet-tile-pane{filter:saturate(.7) contrast(.97)}
.agua-map .am-icon{background:none;border:0}
.am-pin{position:relative;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(15,31,61,.28);box-sizing:border-box;transition:transform .2s}
.am-pin.official{background:#1A86C6}.am-pin.delivery{background:#6B4FBB}.am-pin.rec{background:#1F8A5B;width:36px;height:36px}
.am-pin.sel{box-shadow:0 0 0 3px #FFFDFA,0 0 0 5px #0F1F3D,0 4px 10px rgba(15,31,61,.3);transform:scale(1.08)}
.am-pulse{position:absolute;inset:-4px;border-radius:50%;border:2px solid #1F8A5B;animation:amPulse 2s ease-out infinite;pointer-events:none}
@keyframes amPulse{0%{transform:scale(.75);opacity:.9}100%{transform:scale(1.9);opacity:0}}
.am-route{stroke-dasharray:7 9;stroke-linecap:round;animation:amDash 1.4s linear infinite}
@keyframes amDash{to{stroke-dashoffset:-32}}
@keyframes amIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.am-card{position:absolute;left:16px;bottom:18px;width:272px;background:#FFFDFA;border:1px solid #E8E1D6;border-radius:12px;box-shadow:0 8px 24px rgba(15,31,61,.12);padding:14px 16px 13px;z-index:800;animation:amIn .25s ease-out;box-sizing:border-box}
.am-card-head{display:flex;align-items:flex-start;gap:10px}
.am-dot{width:10px;height:10px;border-radius:50%;flex:none;margin-top:5px}
.am-title{font-size:15px;font-weight:600;line-height:1.25}
.am-kind{font-size:12px;color:#4B5875;margin-top:2px}
.am-close{margin-left:auto;background:none;border:0;padding:4px;cursor:pointer;border-radius:6px;display:flex}
.am-close:hover{background:#F1ECE3}
.am-rows{margin-top:10px;display:grid;gap:4px;font-size:13px;line-height:1.35}
.am-meta{margin-top:10px;padding-top:9px;border-top:1px solid #EFE9DF;font-size:11.5px;line-height:1.45;color:#4B5875}
.am-legend{position:absolute;right:16px;bottom:34px;background:rgba(255,253,250,.94);border:1px solid #E8E1D6;border-radius:10px;padding:9px 12px;z-index:800;font-size:11.5px;display:grid;gap:6px;line-height:1.2}
.am-legend div{display:flex;align-items:center;gap:8px}
.am-legend i{width:10px;height:10px;border-radius:50%;flex:none;display:block}
.am-legend i.area{border-radius:2px;border:1.5px dashed #E39B1B;background:rgba(227,155,27,.15)}
.agua-map .leaflet-bar{border:1px solid #E8E1D6;border-radius:10px;box-shadow:0 2px 8px rgba(15,31,61,.1);overflow:hidden}
.agua-map .leaflet-bar a{background:#FFFDFA;color:#0F1F3D;border-bottom-color:#EFE9DF;width:32px;height:32px;line-height:30px;font-weight:400;display:flex;align-items:center;justify-content:center}
.agua-map .leaflet-bar a:hover{background:#F6F1E8}
.agua-map .leaflet-control-zoom-in,.agua-map .leaflet-control-zoom-out{font-size:18px;font-family:"Instrument Sans",system-ui,sans-serif}
.agua-map .leaflet-top.leaflet-right{margin:12px 12px 0 0}
.agua-map .leaflet-control-attribution{font-size:9.5px;background:rgba(255,253,250,.8);color:#4B5875;font-family:"Instrument Sans",system-ui,sans-serif}
.agua-map .leaflet-control-attribution a{color:#4B5875}
.agua-map .leaflet-tooltip.am-area-label{background:none;border:0;box-shadow:none;color:#9A6206;font-size:11px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;font-family:"Instrument Sans",system-ui,sans-serif}
.agua-map .leaflet-tooltip.am-zone-label{background:rgba(255,253,250,.9);border:1px solid #E8E1D6;border-radius:6px;box-shadow:none;color:#4B5875;font-size:11px;padding:2px 7px;font-family:"Instrument Sans",system-ui,sans-serif}
.agua-map .leaflet-tooltip.am-zone-label:before{display:none}
.agua-map[compact]:not([compact="false"]) .am-legend,.agua-map[compact]:not([compact="false"]) .leaflet-control-attribution{display:none}
.agua-map[compact]:not([compact="false"]) .am-card{left:12px;right:12px;width:auto;bottom:auto;top:108px;padding:11px 14px 10px}
`;
  function ensureStyle() {
    if (document.getElementById('agua-map-style')) return;
    const s = document.createElement('style'); s.id = 'agua-map-style'; s.textContent = CSS; document.head.appendChild(s);
  }
  const isOn = (el, a) => el.hasAttribute(a) && !/^(false|0)$/i.test(el.getAttribute(a) || '');

  class AguaMap extends HTMLElement {
    static get observedAttributes() { return ['selected', 'show-route', 'showroute', 'compact', 'calm']; }
    connectedCallback() {
      if (this._started) return; this._started = true;
      ensureStyle(); this.classList.add('agua-map');
      this.innerHTML = '<div class="lmap"></div>';
      const wait = () => { if (!this.isConnected) return; if (window.L && this.clientWidth > 0) this._build(); else setTimeout(wait, 60); };
      wait();
    }
    attributeChangedCallback() { if (this._map) this._sync(); }
    get selected() { return this.getAttribute('selected'); }
    set selected(v) { v == null || v === '' ? this.removeAttribute('selected') : this.setAttribute('selected', v); }
    get showRoute() { return isOn(this, 'show-route') || isOn(this, 'showroute'); }
    set showRoute(v) { if (v && v !== 'false') this.setAttribute('showroute', ''); else { this.removeAttribute('showroute'); this.removeAttribute('show-route'); } }
    get compact() { return isOn(this, 'compact'); }
    set compact(v) { v && v !== 'false' ? this.setAttribute('compact', '') : this.removeAttribute('compact'); }
    get calm() { return isOn(this, 'calm'); }
    set calm(v) { v && v !== 'false' ? this.setAttribute('calm', '') : this.removeAttribute('calm'); }

    _icon(s, sel) {
      const size = s.recommended ? 36 : 30;
      const cls = 'am-pin ' + (s.recommended ? 'rec' : s.type) + (sel ? ' sel' : '');
      const glyph = s.recommended ? SVG.check : s.type === 'official' ? SVG.drop : SVG.truck;
      return L.divIcon({ html: `<div class="${cls}">${s.recommended ? '<span class="am-pulse"></span>' : ''}${glyph}</div>`, className: 'am-icon', iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
    }
    _build() {
      const compact = this.compact;
      const map = this._map = L.map(this.querySelector('.lmap'), {
        zoomControl: false, zoomSnap: .5,
        center: compact ? [18.372, -65.988] : [18.405, -65.995], zoom: compact ? 12.5 : 12.5
      });
      const tiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', attribution: '© OpenStreetMap contributors © CARTO', maxZoom: 19 }).addTo(map);
      tiles.once('tileerror', () => { tiles.remove(); L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors', maxZoom: 19 }).addTo(map); });
      L.control.zoom({ position: 'topright', zoomInTitle: 'Zoom in', zoomOutTitle: 'Zoom out' }).addTo(map);
      const Loc = L.Control.extend({ onAdd: () => {
        const d = L.DomUtil.create('div', 'leaflet-bar am-locate');
        d.innerHTML = '<a href="#" title="My approximate location" role="button">' + SVG.locate + '</a>';
        L.DomEvent.on(d, 'click', e => { L.DomEvent.stop(e); map.flyTo(ZONE, 14, { duration: 1 }); });
        return d;
      } });
      new Loc({ position: 'topright' }).addTo(map);
      L.polygon(AREA, { color: '#E39B1B', weight: 1.5, dashArray: '4 6', fillColor: '#E39B1B', fillOpacity: .09, interactive: false }).addTo(map)
        .bindTooltip('Affected area · AAA notice', { permanent: true, direction: 'center', className: 'am-area-label', offset: [70, -140] });
      L.circle(ZONE, { radius: 550, color: '#0F1F3D', weight: 1, dashArray: '3 5', fillColor: '#0F1F3D', fillOpacity: .05, interactive: false }).addTo(map)
        .bindTooltip('Your approximate area', { permanent: true, direction: 'bottom', className: 'am-zone-label', offset: [0, 14] });
      this._markers = {};
      SITES.forEach(s => {
        const m = L.marker(s.ll, { icon: this._icon(s, false), riseOnHover: true, keyboard: false, zIndexOffset: s.recommended ? 600 : 0, title: s.name }).addTo(map);
        m.on('click', () => { this.setAttribute('selected', s.id); this.dispatchEvent(new CustomEvent('site-select', { detail: s, bubbles: true })); });
        this._markers[s.id] = m;
      });
      this._route = L.polyline(ROUTE, { color: '#1F8A5B', weight: 3.5, opacity: .9, className: 'am-route', interactive: false });
      this._card = document.createElement('div'); this._card.className = 'am-card'; this._card.style.display = 'none'; this.appendChild(this._card);
      const legend = document.createElement('div'); legend.className = 'am-legend';
      legend.innerHTML = '<div><i style="background:#1A86C6"></i>Verified official pickup</div><div><i style="background:#6B4FBB"></i>Community delivery available</div><div><i style="background:#1F8A5B"></i>Recommended option</div><div><i class="area"></i>Affected service area</div>';
      this.appendChild(legend);
      this._sync();
      setTimeout(() => map.invalidateSize(), 80);
      new ResizeObserver(() => map.invalidateSize()).observe(this);
      if (!compact && this.showRoute) setTimeout(() => map.flyTo([18.403, -65.99], 13, { duration: 1.6 }), 1100);
    }
    _sync() {
      const sel = this.getAttribute('selected');
      Object.entries(this._markers).forEach(([id, m]) => m.setIcon(this._icon(BY_ID[id], id === sel)));
      if (this.showRoute) { if (!this._map.hasLayer(this._route)) this._route.addTo(this._map); } else this._route.remove();
      const s = BY_ID[sel];
      if (!s) { this._card.style.display = 'none'; return; }
      const color = s.recommended ? '#1F8A5B' : s.type === 'official' ? '#1A86C6' : '#6B4FBB';
      const kind = s.recommended ? 'Recommended option · Community delivery' : s.type === 'official' ? 'Verified official pickup' : 'Community delivery';
      this._card.style.display = 'block';
      this._card.innerHTML = `<div class="am-card-head"><span class="am-dot" style="background:${color}"></span><div><div class="am-title">${s.name}</div><div class="am-kind">${kind}</div></div><button class="am-close" aria-label="Close">${SVG.close}</button></div><div class="am-rows"><div>${s.hours}</div><div>${s.note}</div></div><div class="am-meta">${s.source}<br>${s.updated}</div>`;
      this._card.querySelector('.am-close').onclick = () => this.removeAttribute('selected');
    }
  }
  customElements.define('agua-map', AguaMap);
})();
