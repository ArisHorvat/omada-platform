import {
  FadeInDown,
  ZoomIn,
  SlideInRight,
  SlideInUp,
  SlideOutDown,
  LinearTransition,
  FadeOut,
  ZoomOut,
  Easing,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

/**
 * Motion design (Clay / Omada)
 * ---------------------------
 * Durations are intentionally on the slow side so motion reads as a glide,
 * not a pop. Easing is front-loaded (moves at first, eases into place).
 *
 * - `easeOutEmphasis`: long tail — settles gently at the end
 * - `easeOutSoft`: quint for staggered rows — even softer landing than cubic
 *
 * Optional: `ClayAnimationsSpring.*` — heavily damped springs (~no overshoot)
 * for screens that want a tiny bit of life without chaos.
 */

/** Slow deceleration — motion stays visible and “lands” softly */
const easeOutEmphasis = Easing.bezier(0.25, 0.1, 0.25, 1);

/** Staggered lists: very soft final settle (quintic out — gentler than cubic) */
const easeOutSoft = Easing.out(Easing.poly(5));

const D_HEADER = 580;
const D_HERO = 720;
const D_BLOCK = 600;
const D_LIST = 580;
const D_SLIDE = 600;
const D_FAB = 680;
const D_EMPTY = 680;
const D_BOTTOM = 520;
const D_LAYOUT = 420;
const D_LAYOUT_STABLE = 340;

export const ClayAnimations = {
  Header: FadeInDown.duration(D_HEADER).easing(easeOutEmphasis).delay(120),

  Hero: ZoomIn.duration(D_HERO).easing(easeOutEmphasis).delay(140),

  Chip: (index: number) =>
    FadeInDown.duration(D_BLOCK).easing(easeOutEmphasis).delay(120 + index * 68),

  List: (index: number) =>
    FadeInDown.duration(D_LIST).easing(easeOutSoft).delay(200 + index * 78),

  SlideInFlow: (index: number) =>
    SlideInRight.duration(D_SLIDE).easing(easeOutEmphasis).delay(280 + index * 58),

  BottomUp: SlideInUp.duration(D_BOTTOM).easing(easeOutEmphasis),
  BottomDown: SlideOutDown.duration(340).easing(Easing.out(Easing.cubic)),

  /** List/grid reflows: timing only — springs here make siblings jitter */
  Layout: LinearTransition.duration(D_LAYOUT).easing(easeOutSoft),
  LayoutStable: LinearTransition.duration(D_LAYOUT_STABLE).easing(Easing.out(Easing.quad)),

  ExitFade: FadeOut.duration(280).easing(Easing.out(Easing.quad)),
  ExitZoom: ZoomOut.duration(340).easing(Easing.out(Easing.cubic)),

  FAB: ZoomIn.duration(D_FAB).easing(easeOutEmphasis).delay(560),

  EmptyState: ZoomIn.duration(D_EMPTY).easing(easeOutEmphasis).delay(360),

  TabBarSlideUp: SlideInUp.duration(D_BOTTOM).easing(easeOutEmphasis),
  TabBarSlideDown: SlideOutDown.duration(320).easing(Easing.out(Easing.cubic)),

  Pulse: () =>
    withSequence(
      withTiming(1.04, { duration: 220, easing: easeOutSoft }),
      withTiming(1, { duration: 260, easing: easeOutSoft }),
    ),

  // --- Faster / calmer variants (dense screens, reduced motion later)
  HeaderCompact: FadeInDown.duration(400).easing(easeOutSoft).delay(80),
  ListCompact: (index: number) =>
    FadeInDown.duration(420).easing(easeOutSoft).delay(140 + index * 56),
  SlideInFlowCompact: (index: number) =>
    SlideInRight.duration(420).easing(easeOutSoft).delay(220 + index * 48),
  LayoutCompact: LinearTransition.duration(300).easing(Easing.out(Easing.quad)),

  // --- Heavily damped springs (optional — subtle life, minimal overshoot)
  Spring: {
    Header: FadeInDown.springify().damping(26).stiffness(200).delay(120),
    Hero: ZoomIn.springify().damping(24).stiffness(190).delay(140),
    Chip: (index: number) =>
      FadeInDown.springify().damping(27).stiffness(220).delay(110 + index * 64),
    List: (index: number) =>
      FadeInDown.springify().damping(26).stiffness(200).delay(190 + index * 72),
    SlideInFlow: (index: number) =>
      SlideInRight.springify().damping(25).stiffness(205).delay(260 + index * 54),
    FAB: ZoomIn.springify().damping(22).stiffness(185).delay(540),
    EmptyState: ZoomIn.springify().damping(24).stiffness(180).delay(340),
    BottomUp: SlideInUp.springify().damping(26).stiffness(210),
    /** Prefer timing `Layout` for grids; use sparingly */
    Layout: LinearTransition.springify().damping(30).stiffness(300),
  },
};
