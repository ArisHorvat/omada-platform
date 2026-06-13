/** Visible height of the floating tab bar strap (excludes safe area). */
export const TAB_BAR_HEIGHT = 80;

/** Scroll padding so lists clear the floating tab bar + FAB protrusion. */
export const BOTTOM_SPACER = 150;

/** Responsive breakpoints (viewport width in px). */
export const BREAKPOINTS = {
  medium: 768,
  wide: 1024,
} as const;

/** Max width for main app content on wide layouts. */
export const CONTENT_MAX_WIDTH = 1200;

/** Left navigation rail width when using the wide shell. */
export const SIDEBAR_WIDTH = 240;

/** Secondary column in split layouts (schedule filters, chat info). */
export const SPLIT_PANE_SIDEBAR_WIDTH = 320;

/** List column in master-detail feeds (news, directory, rooms). */
export const SPLIT_PANE_LIST_WIDTH = 400;

/** Default horizontal inset inside `PageContainer` on wide layouts. */
export const PAGE_HORIZONTAL_PADDING = 20;

/** Minimum top breathing room on web (desktop browsers report 0 safe-area). */
export const WEB_TOP_INSET = 28;

/** Max width for sign-in / landing forms on wide web. */
export const AUTH_CONTENT_MAX_WIDTH = 480;

/** Max width for multi-step registration wizard on wide web. */
export const AUTH_WIZARD_MAX_WIDTH = 720;

export type Breakpoint = 'compact' | 'medium' | 'wide';
