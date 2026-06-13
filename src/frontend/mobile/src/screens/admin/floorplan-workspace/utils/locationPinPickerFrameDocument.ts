export const LOCATION_PIN_PICKER_SOURCE = 'omada-location-pin-picker';

export type LocationPinPickerFrameMessage =
  | { source: typeof LOCATION_PIN_PICKER_SOURCE; type: 'ready' }
  | { source: typeof LOCATION_PIN_PICKER_SOURCE; type: 'pin'; lat: number; lng: number };

export const LOCATION_PIN_PICKER_SRC_DOC = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
  <style>
    html, body { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden; background: #e8eef4; }
    #map { height: 100%; width: 100%; cursor: crosshair; }
    .omada-pin-marker { background: transparent !important; border: none !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  <script>
    (function () {
      var SOURCE = '${LOCATION_PIN_PICKER_SOURCE}';
      var map = null;
      var tileLayer = null;
      var marker = null;
      var primaryColor = '#137fec';

      function markerIcon(color) {
        var safe = String(color || '#137fec').replace(/[<>"']/g, '');
        return L.divIcon({
          className: 'omada-pin-marker',
          html:
            '<div style="width:36px;height:36px;border-radius:18px;background:' +
            safe +
            ';border:2px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 3px 10px rgba(15,23,42,0.35);">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">' +
            '<path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>' +
            '</svg></div>',
          iconSize: [36, 36],
          iconAnchor: [18, 36],
        });
      }

      function postPin(lat, lng) {
        parent.postMessage({ source: SOURCE, type: 'pin', lat: lat, lng: lng }, '*');
      }

      function setPin(lat, lng, draggable) {
        if (!map || lat == null || lng == null || isNaN(lat) || isNaN(lng)) return;
        if (marker) map.removeLayer(marker);
        marker = L.marker([lat, lng], { icon: markerIcon(primaryColor), draggable: !!draggable }).addTo(map);
        if (draggable) {
          marker.on('dragend', function () {
            var p = marker.getLatLng();
            postPin(p.lat, p.lng);
          });
        }
        map.setView([lat, lng], Math.max(map.getZoom(), 15));
      }

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

      function sync(data) {
        if (!map || !window.L) return;
        var L = window.L;
        primaryColor = data.primaryColor || '#137fec';
        var isDark = !!data.isDark;

        if (tileLayer) map.removeLayer(tileLayer);
        var t = tilesForDark(isDark);
        tileLayer = L.tileLayer(t.url, { attribution: t.attribution, maxZoom: 19 }).addTo(map);

        if (data.lat != null && data.lng != null && !isNaN(data.lat) && !isNaN(data.lng)) {
          setPin(data.lat, data.lng, true);
        } else if (marker) {
          map.removeLayer(marker);
          marker = null;
        }

        setTimeout(function () { map.invalidateSize({ animate: false }); }, 0);
      }

      function boot() {
        map = L.map('map', { center: [46.7699, 23.6062], zoom: 13, scrollWheelZoom: true });
        map.on('click', function (e) {
          setPin(e.latlng.lat, e.latlng.lng, true);
          postPin(e.latlng.lat, e.latlng.lng);
        });
        map.whenReady(function () {
          parent.postMessage({ source: SOURCE, type: 'ready' }, '*');
          setTimeout(function () { map.invalidateSize({ animate: false }); }, 50);
        });
      }

      window.addEventListener('message', function (e) {
        var d = e.data;
        if (!d || d.source !== SOURCE || d.type !== 'sync') return;
        sync(d);
      });

      if (document.readyState === 'complete') boot();
      else window.addEventListener('load', boot);
    })();
  </script>
</body>
</html>`;
