// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { resolve } = require('metro-resolver');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// React Native Skia (CanvasKit WASM) — see https://shopify.github.io/react-native-skia/docs/getting-started/web/
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

// Leaflet on web is loaded from CDN (see loadLeaflet.web.ts) — stub on native.
const LEAFLET_MODULES = /^leaflet(\/|$)/;
const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform !== 'web' && LEAFLET_MODULES.test(moduleName)) {
    return { type: 'empty' };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return resolve(context, moduleName, platform);
};

module.exports = config;
