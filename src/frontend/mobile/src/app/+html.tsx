import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Web-only document shell: full-height app, sensible defaults for desktop browsers.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;800&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBgIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root {
                height: 100%;
                width: 100%;
              }
              body {
                margin: 0;
                overflow: hidden;
                font-family: 'Outfit', system-ui, -apple-system, sans-serif;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
              #root {
                display: flex;
                flex-direction: column;
              }
              * {
                box-sizing: border-box;
              }
              button, a, [role="button"], input, textarea, select {
                font-family: 'Outfit', system-ui, -apple-system, sans-serif;
              }
              input, textarea {
                font-size: 16px;
                font-weight: 400;
                outline: none !important;
                background-color: transparent;
                border: none !important;
                box-shadow: none !important;
              }
              input:focus,
              input:focus-visible,
              textarea:focus,
              textarea:focus-visible {
                outline: none !important;
                border: none !important;
                box-shadow: none !important;
                background-color: transparent !important;
              }
              .omada-icon-input__field,
              .omada-icon-input__field:focus,
              .omada-icon-input__field:focus-visible,
              .omada-icon-input input,
              .omada-icon-input input:focus,
              .omada-icon-input input:focus-visible {
                outline: none !important;
                border: none !important;
                box-shadow: none !important;
                background: transparent !important;
                -webkit-appearance: none;
                appearance: none;
              }
              input:-webkit-autofill,
              input:-webkit-autofill:hover,
              input:-webkit-autofill:focus,
              textarea:-webkit-autofill {
                -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
                box-shadow: 0 0 0 1000px transparent inset !important;
                -webkit-text-fill-color: inherit;
                transition: background-color 9999s ease-out 0s;
              }
              /* Theme-aware scrollbars (see WebDocumentThemeSync) */
              html[data-omada-theme="light"] {
                color-scheme: light;
              }
              html[data-omada-theme="dark"] {
                color-scheme: dark;
              }
              html[data-omada-theme="light"] * {
                scrollbar-color: rgba(100, 116, 139, 0.55) rgba(241, 245, 249, 0.9);
              }
              html[data-omada-theme="dark"] * {
                scrollbar-color: rgba(148, 163, 184, 0.45) rgba(15, 23, 42, 0.85);
              }
              html[data-omada-theme="light"] ::-webkit-scrollbar {
                width: 10px;
                height: 10px;
              }
              html[data-omada-theme="light"] ::-webkit-scrollbar-track {
                background: rgba(241, 245, 249, 0.9);
              }
              html[data-omada-theme="light"] ::-webkit-scrollbar-thumb {
                background: rgba(100, 116, 139, 0.55);
                border-radius: 999px;
                border: 2px solid rgba(241, 245, 249, 0.9);
              }
              html[data-omada-theme="dark"] ::-webkit-scrollbar {
                width: 10px;
                height: 10px;
              }
              html[data-omada-theme="dark"] ::-webkit-scrollbar-track {
                background: rgba(15, 23, 42, 0.85);
              }
              html[data-omada-theme="dark"] ::-webkit-scrollbar-thumb {
                background: rgba(148, 163, 184, 0.45);
                border-radius: 999px;
                border: 2px solid rgba(15, 23, 42, 0.85);
              }
              ::selection {
                background: rgba(99, 102, 241, 0.35);
              }
              /* expo-image uses native <img> + object-fit — avoid blurry RN-web scaling */
              #root img:not(.leaflet-tile):not(.leaflet-marker-icon):not(.leaflet-marker-shadow) {
                image-rendering: auto;
                -webkit-backface-visibility: hidden;
                backface-visibility: hidden;
              }
              /* Leaflet tiles use CSS transforms — global img rules break the tile grid */
              .leaflet-container img.leaflet-tile,
              .leaflet-container img.leaflet-marker-icon,
              .leaflet-container img.leaflet-marker-shadow {
                backface-visibility: visible !important;
                -webkit-backface-visibility: visible !important;
                max-width: none !important;
                max-height: none !important;
                width: auto !important;
                height: auto !important;
              }
              /* Horizontal strips: scroll with wheel/drag, hide scrollbar chrome */
              .omada-h-scroll-hidden {
                scrollbar-width: none;
                -ms-overflow-style: none;
              }
              .omada-h-scroll-hidden::-webkit-scrollbar {
                display: none;
                height: 0;
                width: 0;
              }
              /* Leaflet campus map (web) — global border-box breaks the 256px tile grid */
              .leaflet-container,
              .leaflet-container *,
              .leaflet-container *::before,
              .leaflet-container *::after {
                box-sizing: content-box !important;
              }
              #omada-campus-map-portal {
                position: static;
                z-index: 0;
              }
              .omada-campus-map-root {
                z-index: 0;
                overflow: hidden;
              }
              .omada-campus-map-root.leaflet-container,
              .omada-campus-map-root .leaflet-container {
                width: 100% !important;
                height: 100% !important;
                font-family: inherit;
                background: #e8eef4;
              }
              .leaflet-container {
                font-family: inherit;
                background: #e8eef4;
              }
              .leaflet-pane {
                z-index: auto;
              }
              .omada-campus-marker {
                background: transparent !important;
                border: none !important;
              }
              .omada-campus-marker-bubble {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                border-radius: 20px;
                color: #fff;
                background: var(--omada-marker, #137fec);
                border: 2px solid #fff;
                box-shadow: 0 3px 10px rgba(15, 23, 42, 0.35);
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
