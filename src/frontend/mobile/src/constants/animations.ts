import { 
  FadeInDown, 
  ZoomIn, 
  SlideInRight, 
  SlideInDown, 
  SlideInUp,    
  SlideOutDown, 
  LinearTransition, // Replaces deprecated Layout
  FadeOut,
  ZoomOut,
  Easing 
} from 'react-native-reanimated';

export const ClayAnimations = {
  // 1. HEADER: Heavy, slow slide from top/mid.
  Header: FadeInDown.springify().damping(18).mass(1).stiffness(100).delay(100),

  // 2. HERO CARD: Pops in with energy.
  Hero: ZoomIn.springify().damping(16).mass(1).stiffness(120).delay(200),

  // 3. LIST ITEMS: The "Waterfall".
  List: (index: number) => 
    FadeInDown.springify().damping(18).mass(0.8).stiffness(150).delay(300 + (index * 80)),

  // 4. HORIZONTAL SCROLL ITEMS
  SlideInFlow: (index: number) =>
    SlideInRight.springify().damping(20).mass(0.5).stiffness(120).delay(400 + (index * 50)),

  // 5. GENERIC BOTTOM SHEETS / MODALS
  BottomUp: SlideInUp.springify().damping(18).stiffness(120),
  BottomDown: SlideOutDown.duration(250).easing(Easing.linear),

  // 6. LAYOUT: Handles smooth resizing (Delete/Add items)
  // Usage: layout={ClayAnimations.Layout}
  Layout: LinearTransition.springify().damping(15).stiffness(120),

  // NEW: STABLE LAYOUT (No bounce/shake - just smooth sliding)
  LayoutStable: LinearTransition
    .duration(250)
    .easing(Easing.out(Easing.quad)), // Smooth ease-out

  // 7. EXITS (For removing items from lists)
  ExitFade: FadeOut.duration(200),
  ExitZoom: ZoomOut.duration(250),

  // --- TAB BAR ANIMATIONS ---

  // 8. TAB BAR ENTER
  TabBarSlideUp: SlideInUp
    .springify()
    .damping(18)
    .stiffness(100)
    .mass(1),

  // 9. TAB BAR EXIT
  TabBarSlideDown: SlideOutDown
    .duration(250) 
    .easing(Easing.linear),
};