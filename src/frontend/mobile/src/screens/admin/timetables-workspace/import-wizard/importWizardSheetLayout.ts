import { Dimensions } from 'react-native';

/** Tall scrollable sheet for import-wizard create flows (web pane + mobile). */
export function importWizardSheetHeight(fraction = 0.88, max = 720): number {
  return Math.min(Dimensions.get('window').height * fraction, max);
}
