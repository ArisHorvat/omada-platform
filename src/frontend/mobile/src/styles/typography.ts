import { Platform, type TextStyle } from 'react-native';

const WEB_OUTFIT = 'Outfit, system-ui, -apple-system, sans-serif';

export function inputTextStyle(): TextStyle {
  if (Platform.OS === 'web') {
    return {
      fontFamily: WEB_OUTFIT,
      fontWeight: '400',
      fontSize: 16,
    };
  }
  return {
    fontFamily: 'Body',
    fontSize: 16,
  };
}
