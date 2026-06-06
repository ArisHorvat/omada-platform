/** Shared building pin sizing for campus macro map (native + web). */
export const BUILDING_MARKER_SIZE = 40;

export function buildingMarkerHtml(primaryColor: string): string {
  const safe = primaryColor.replace(/[<>"']/g, '');
  return `<div style="width:${BUILDING_MARKER_SIZE}px;height:${BUILDING_MARKER_SIZE}px;border-radius:${BUILDING_MARKER_SIZE / 2}px;background:${safe};border:2px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 3px 10px rgba(15,23,42,0.35);">
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 7V3H2v18h20V7H12zm-2 14H4v-2h6v2zm0-4H4v-2h6v2zm0-4H4v-2h6v2zm0-4H4V7h6v2zm10 12h-6v-2h6v2zm0-4h-6v-2h6v2zm0-4h-6v-2h6v2zm0-4h-6V7h6v2z"/>
    </svg>
  </div>`;
}
