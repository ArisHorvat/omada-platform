/** Isolated Leaflet document for web iframe — immune to Expo/RN global CSS. */
export const CAMPUS_MAP_FRAME_SOURCE = 'omada-campus-map';

export const CAMPUS_MAP_SRC_DOC = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
  <style>
    html, body { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden; background: #e8eef4; }
    #map { height: 100%; width: 100%; }
    .omada-marker { background: transparent !important; border: none !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  <script>
    (function () {
      var SOURCE = '${CAMPUS_MAP_FRAME_SOURCE}';
      var map = null;
      var tileLayer = null;
      var markers = [];

      function tilesForDark(isDark) {
        if (isDark) {
          return {
            url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            attribution: '&copy; OpenStreetMap &copy; CARTO',
          };
        }
        return {
          url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; OpenStreetMap contributors',
        };
      }

      function markerIcon(color) {
        var safe = String(color || '#137fec').replace(/[<>"']/g, '');
        return L.divIcon({
          className: 'omada-marker',
          html:
            '<div style="width:40px;height:40px;border-radius:20px;background:' +
            safe +
            ';border:2px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 3px 10px rgba(15,23,42,0.35);">' +
            '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">' +
            '<path fill="currentColor" d="M12 7V3H2v18h20V7H12zm-2 14H4v-2h6v2zm0-4H4v-2h6v2zm0-4H4v-2h6v2zm0-4H4V7h6v2zm10 12h-6v-2h6v2zm0-4h-6v-2h6v2zm0-4h-6v-2h6v2zm0-4h-6V7h6v2z"/>' +
            '</svg></div>',
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        });
      }

      function refreshSize() {
        if (!map) return;
        map.invalidateSize({ animate: false });
      }

      function sync(data) {
        if (!map || !window.L) return;
        var L = window.L;
        var buildings = data.buildings || [];
        var isDark = !!data.isDark;
        var primaryColor = data.primaryColor || '#137fec';

        if (tileLayer) {
          map.removeLayer(tileLayer);
        }
        var t = tilesForDark(isDark);
        tileLayer = L.tileLayer(t.url, { attribution: t.attribution, maxZoom: 19 }).addTo(map);

        markers.forEach(function (m) {
          map.removeLayer(m);
        });
        markers = [];

        var coords = [];
        buildings.forEach(function (b) {
          if (b.latitude == null || b.longitude == null) return;
          var marker = L.marker([b.latitude, b.longitude], { icon: markerIcon(primaryColor) }).addTo(map);
          marker.on('click', function () {
            parent.postMessage({ source: SOURCE, type: 'markerClick', buildingId: b.id }, '*');
          });
          markers.push(marker);
          coords.push([b.latitude, b.longitude]);
        });

        if (coords.length) {
          map.fitBounds(L.latLngBounds(coords), { padding: [100, 48] });
        }
        setTimeout(refreshSize, 0);
        setTimeout(refreshSize, 200);
        setTimeout(refreshSize, 500);
      }

      function boot() {
        var L = window.L;
        map = L.map('map', {
          center: [46.7699, 23.6062],
          zoom: 13,
          scrollWheelZoom: true,
        });
        map.whenReady(function () {
          parent.postMessage({ source: SOURCE, type: 'ready' }, '*');
          setTimeout(refreshSize, 50);
          setTimeout(refreshSize, 300);
        });
      }

      window.addEventListener('message', function (e) {
        var d = e.data;
        if (!d || d.source !== SOURCE || d.type !== 'sync') return;
        sync(d);
      });

      window.addEventListener('resize', function () {
        refreshSize();
      });

      if (document.readyState === 'complete') {
        boot();
      } else {
        window.addEventListener('load', boot);
      }
    })();
  </script>
</body>
</html>`;

export type CampusMapFrameMessage =
  | { source: typeof CAMPUS_MAP_FRAME_SOURCE; type: 'ready' }
  | { source: typeof CAMPUS_MAP_FRAME_SOURCE; type: 'markerClick'; buildingId: string };
