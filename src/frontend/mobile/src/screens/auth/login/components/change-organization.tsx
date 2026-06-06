import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, View, StyleSheet, Dimensions } from 'react-native';
import { useLocalSearchParams, useRootNavigationState, useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { useQueryClient } from '@tanstack/react-query';
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withTiming, 
  Easing, 
  runOnJS,
  useAnimatedStyle,
  interpolate
} from 'react-native-reanimated';

// UI Imports
import { AppButton, AppText, Icon, ProgressiveImage } from '@/src/components/ui';
import { ClayView } from '@/src/components/ui/ClayView'; 
import { ClayAnimations } from '@/src/constants/animations'; 
import { useThemeColors } from '@/src/hooks';
import { useAuth } from '@/src/context/AuthContext';
import { authApi, orgApi, unwrap } from '@/src/api';
import { resolveMediaUrl } from '@/src/utils/resolveMediaUrl';
import { setCompletingLoginOrgPick } from '@/src/utils/loginOrgPick';
import { homeHrefForRole } from '@/src/utils/authRoutes';
import { OrganizationType } from '@/src/api/generatedClient';
import { SwitchOrgRequest } from '@/src/api/generatedClient';
import { AUTH_CONTENT_MAX_WIDTH } from '@/src/constants/layout';

const { width } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// --- CONFIG ---
const RADIUS = 65; 
const STROKE_WIDTH = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const VIEW_SIZE = (RADIUS + STROKE_WIDTH) * 2;

// FIXED DIMENSIONS
const CARD_WIDTH = Math.min(width * 0.85, AUTH_CONTENT_MAX_WIDTH + 40, 400);
const CARD_HEIGHT = 420; // Fixed height to prevent vertical jumping

function normalizeRouteParam(value: string | string[] | undefined): string {
  if (value == null) return '';
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw == null || raw === 'null' || raw === 'undefined') return '';
  return String(raw).trim();
}

export default function ChangeOrganizationScreen() {
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const navigationReady = Boolean(navigationState?.key);
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const sequenceStartedRef = useRef(false);
  const [paramsSettled, setParamsSettled] = useState(false);
  
  const params = useLocalSearchParams<{
    targetOrgId?: string | string[];
    targetOrgName?: string | string[];
    targetLogoUrl?: string | string[];
    currentOrgColor?: string | string[];
    currentOrgLogo?: string | string[];
    targetOrgType?: string | string[];
    targetRole?: string | string[];
    animate?: string | string[];
  }>();

  const targetOrgId = normalizeRouteParam(params.targetOrgId);
  const targetLogoUrl = normalizeRouteParam(params.targetLogoUrl);
  const currentOrgColor = normalizeRouteParam(params.currentOrgColor);
  const currentOrgLogo = normalizeRouteParam(params.currentOrgLogo);
  const orgTypeParam = normalizeRouteParam(params.targetOrgType);
  const roleParam = normalizeRouteParam(params.targetRole);
  const shouldAnimate = normalizeRouteParam(params.animate) === '1';

  const { switchSession, addSession, availableSessions, activeSession } = useAuth();

  const [statusText, setStatusText] = useState('Syncing...');
  const [displayName, setDisplayName] = useState(
    () => normalizeRouteParam(params.targetOrgName) || 'Organization',
  );
  const orgInitial = (displayName.charAt(0) || 'O').toUpperCase();

  const [finalTargetColor, setFinalTargetColor] = useState<string>(colors.primary);

  const [finalTargetLogo, setFinalTargetLogo] = useState<string | null>(() => {
    if (targetLogoUrl) {
      return resolveMediaUrl(targetLogoUrl) ?? null;
    }
    return null;
  });

  const targetTypeLabel =
    orgTypeParam === '0' || orgTypeParam === String(OrganizationType.University)
      ? 'University'
      : orgTypeParam === '1' || orgTypeParam === String(OrganizationType.Corporate)
        ? 'Workspace'
        : null;
  const targetRoleLabel =
    roleParam && roleParam !== 'null' && roleParam !== 'undefined' && roleParam.trim() !== ''
      ? roleParam === 'Unknown'
        ? 'Member'
        : roleParam
      : null;

  // Animations
  const disconnectProgress = useSharedValue(0); 
  const connectProgress = useSharedValue(0); 
  const currentLogoOpacity = useSharedValue(1);
  const targetLogoOpacity = useSharedValue(0);
  const scale = useSharedValue(1);

  const exitScreen = useCallback(() => {
    setCompletingLoginOrgPick(false);
    if (!navigationReady) return;
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/dashboard');
  }, [navigationReady, router]);

  useEffect(() => {
    if (!navigationReady) return;
    const t = setTimeout(() => setParamsSettled(true), 150);
    return () => clearTimeout(t);
  }, [navigationReady]);

  const performSwitchAndFetch = useCallback(async () => {
    if (!targetOrgId) return;

    const existing = availableSessions.find(
      (s) => s.orgId && s.orgId.toLowerCase() === targetOrgId.toLowerCase(),
    );

    if (existing) {
      await switchSession(existing.orgId);
    } else {
      const request = new SwitchOrgRequest();
      request.organizationId = targetOrgId;

      const response = await unwrap(authApi.switchOrganization(request));
      await addSession(response.accessToken);
    }

    try {
      const orgDetails = await unwrap(orgApi.getById(targetOrgId));
      if (orgDetails?.name?.trim()) setDisplayName(orgDetails.name.trim());
      if (orgDetails?.primaryColor) setFinalTargetColor(orgDetails.primaryColor);
      if (orgDetails?.logoUrl) setFinalTargetLogo(resolveMediaUrl(orgDetails.logoUrl) ?? null);
    } catch (e) {
      console.log('Failed to fetch details', e);
    }
  }, [targetOrgId, availableSessions, switchSession, addSession]);

  const runQuickSwitch = useCallback(async () => {
    setStatusText('Switching workspace...');
    try {
      await performSwitchAndFetch();
      queryClient.clear();
      setCompletingLoginOrgPick(false);
      if (navigationReady) {
        router.replace(homeHrefForRole(roleParam || activeSession?.role) as never);
      }
    } catch (e) {
      console.error('Quick switch failed', e);
      setStatusText('Switch failed');
      setTimeout(() => exitScreen(), 800);
    }
  }, [navigationReady, queryClient, router, exitScreen, performSwitchAndFetch, roleParam, activeSession?.role]);

  useEffect(() => {
    if (!navigationReady || !paramsSettled || !targetOrgId || sequenceStartedRef.current) return;
    sequenceStartedRef.current = true;
    if (shouldAnimate) {
      void runAnimationSequence();
    } else {
      void runQuickSwitch();
    }
  }, [navigationReady, paramsSettled, targetOrgId, shouldAnimate, runQuickSwitch]);

  const runAnimationSequence = async () => {
    setStatusText("Disconnecting...");
    
    // 1. UNDRAW OLD RING (0 -> Full Erase) & FADE OUT OLD LOGO
    disconnectProgress.value = withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) });
    currentLogoOpacity.value = withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) });

    // 2. Perform Switch Logic
    try {
        await performSwitchAndFetch();
    } catch (e) {
        console.error('Switch failed', e);
        setStatusText('Switch failed');
        setTimeout(() => exitScreen(), 0);
        return;
    }

    await new Promise(r => setTimeout(r, 2000));

    // 3. Connect Phase
    setStatusText(`Joining ${displayName}...`);

    // 4. DRAW NEW RING (Empty -> Full Draw) & FADE IN NEW LOGO
    targetLogoOpacity.value = withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) });
    
    connectProgress.value = withTiming(1, { 
        duration: 2000, 
        easing: Easing.inOut(Easing.ease) 
    }, (finished) => {
        if (finished) runOnJS(handleSuccess)();
    });
  };

  const handleSuccess = () => {
    queryClient.clear();
    setStatusText('Successfully Connected');
    scale.value = ClayAnimations.Pulse();
    setTimeout(() => {
      setCompletingLoginOrgPick(false);
      if (navigationReady) router.replace(homeHrefForRole(roleParam || activeSession?.role) as never);
    }, 1000);
  };

  // --- ANIMATED PROPS ---
  const disconnectRingProps = useAnimatedProps(() => ({
      strokeDashoffset: interpolate(disconnectProgress.value, [0, 1], [0, CIRCUMFERENCE]), 
  }));

  const connectRingProps = useAnimatedProps(() => ({
      strokeDashoffset: interpolate(connectProgress.value, [0, 1], [CIRCUMFERENCE, 0]),
  }));

  const containerStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const oldLogoStyle = useAnimatedStyle(() => ({ opacity: currentLogoOpacity.value }));
  const newLogoStyle = useAnimatedStyle(() => ({ opacity: targetLogoOpacity.value }));

  const startColor = currentOrgColor || colors.text;
  const backdropTint = finalTargetColor || colors.primary;

  const renderBackdrop = () => (
    <>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: `${backdropTint}28` }]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primaryContainer, opacity: 0.35 }]} />
    </>
  );

  if (!navigationReady || (!paramsSettled && !targetOrgId)) {
    return (
      <View style={styles.container}>
        {renderBackdrop()}
        <View style={styles.cardWrapper}>
          <ClayView depth={20} puffy={30} color={colors.card} style={styles.card}>
            <ActivityIndicator size="large" color={colors.primary} />
          </ClayView>
        </View>
      </View>
    );
  }

  if (paramsSettled && !targetOrgId) {
    return (
      <View style={styles.container}>
        {renderBackdrop()}
        <View style={styles.cardWrapper}>
          <ClayView depth={20} puffy={30} color={colors.card} style={styles.card}>
            <AppText variant="h3" style={{ textAlign: 'center', marginBottom: 8 }}>
              Unable to switch
            </AppText>
            <AppText style={{ color: colors.subtle, textAlign: 'center', marginBottom: 20 }}>
              Missing organization details. Open the switcher from your profile and try again.
            </AppText>
            <AppButton title="Go back" onPress={exitScreen} style={{ width: '100%' }} />
          </ClayView>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderBackdrop()}

      {/* FIXED SIZE CONTAINER */}
      <View style={styles.cardWrapper}>
        <Animated.View entering={ClayAnimations.Hero}>
            <ClayView 
                depth={20} 
                puffy={30} 
                color={colors.card}
                style={styles.card}
            >
                <Animated.View style={[styles.animationWrapper, containerStyle]}>
                    
                    {/* AVATAR CONTAINER */}
                    <View style={[styles.avatarContainer, { backgroundColor: '#fff' }]}>
                        
                        {/* OLD LOGO */}
                        <Animated.View style={[StyleSheet.absoluteFill, oldLogoStyle, styles.centered]}>
                            {currentOrgLogo ? (
                                <ProgressiveImage 
                                    source={{ uri: currentOrgLogo }} 
                                    style={styles.avatarImage} 
                                    resizeMode="cover"
                                />
                            ) : (
                                <Icon name="business" size={40} color={colors.subtle} />
                            )}
                        </Animated.View>

                        {/* NEW LOGO */}
                        <Animated.View style={[StyleSheet.absoluteFill, newLogoStyle, styles.centered]}>
                            {finalTargetLogo ? (
                                <ProgressiveImage 
                                    source={{ uri: finalTargetLogo }} 
                                    style={styles.avatarImage} 
                                    resizeMode="cover"
                                />
                            ) : (
                                <AppText weight="bold" style={{ fontSize: 32, color: finalTargetColor }}>
                                    {orgInitial}
                                </AppText>
                            )}
                        </Animated.View>
                    </View>

                    {/* SVG RINGS */}
                    <Svg width={VIEW_SIZE} height={VIEW_SIZE} style={styles.svgContainer}>
                        {/* 1. OLD RING (Disconnecting) */}
                        <AnimatedCircle
                            cx={VIEW_SIZE/2} cy={VIEW_SIZE/2} r={RADIUS}
                            stroke={startColor} strokeWidth={STROKE_WIDTH}
                            strokeDasharray={CIRCUMFERENCE} strokeLinecap="round"
                            rotation="-90" origin={`${VIEW_SIZE/2}, ${VIEW_SIZE/2}`}
                            fill="none"
                            animatedProps={disconnectRingProps}
                        />

                        {/* 2. NEW RING (Connecting) */}
                        <AnimatedCircle
                            cx={VIEW_SIZE/2} cy={VIEW_SIZE/2} r={RADIUS}
                            stroke={finalTargetColor} strokeWidth={STROKE_WIDTH}
                            strokeDasharray={CIRCUMFERENCE} strokeLinecap="round"
                            rotation="-90" origin={`${VIEW_SIZE/2}, ${VIEW_SIZE/2}`}
                            fill="none"
                            animatedProps={connectRingProps}
                        />
                    </Svg>
                </Animated.View>

                {/* TEXT CONTAINER */}
                <View style={styles.textContainer}>
                    <AppText variant="h3" style={{ marginBottom: 8, textAlign: 'center' }}>
                        {statusText}
                    </AppText>
                    <AppText style={{ color: colors.subtle, textAlign: 'center' }} numberOfLines={1}>
                        {displayName}
                    </AppText>
                    {(targetRoleLabel || targetTypeLabel) ? (
                      <AppText variant="caption" style={{ color: colors.subtle, textAlign: 'center', marginTop: 6 }} numberOfLines={2}>
                        {[targetRoleLabel, targetTypeLabel].filter(Boolean).join(' · ')}
                      </AppText>
                    ) : null}
                </View>

            </ClayView>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 200,
    elevation: 200,
    ...Platform.select({
      web: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
      },
      default: {},
    }),
  },
  cardWrapper: {
    // Explicit fixed dimensions wrapper
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { 
    width: CARD_WIDTH, // FORCE FIXED WIDTH
    height: CARD_HEIGHT, // FORCE FIXED HEIGHT
    paddingVertical: 50, // Adjusted padding
    alignItems: 'center', 
    borderRadius: 32,
    justifyContent: 'center' // Center content vertically
  },
  animationWrapper: { 
    width: VIEW_SIZE, 
    height: VIEW_SIZE, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 30, 
    position: 'relative' 
  },
  avatarContainer: {
    width: (RADIUS * 2) - 4, 
    height: (RADIUS * 2) - 4,
    borderRadius: RADIUS,
    overflow: 'hidden', 
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  avatarImage: { width: '100%', height: '100%' },
  centered: { justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' },
  svgContainer: { position: 'absolute', top: 0, left: 0, zIndex: 2 },
  textContainer: { 
    height: 80, // Fixed text height
    width: '100%',
    paddingHorizontal: 20, // Prevent text touching edges
    justifyContent: 'center', 
    alignItems: 'center' 
  }
});