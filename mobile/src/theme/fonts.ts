import { useFonts } from 'expo-font';

/**
 * Editorial serif loader. We ship Playfair Display as a license-free stand-in
 * for the Canela / Reckless / GT Sectra vibe; drop the licensed .otf files in
 * assets/fonts and re-point these paths — no call sites change (they use the
 * `fonts.serif` token). SF Pro (UI/body) is the system font, nothing to load.
 */
export function useEditorialFonts() {
  return useFonts({
    // ponytail: free stand-in for the licensed display face; swap files, keep keys.
    EditorialSerif: require('../../assets/fonts/PlayfairDisplay-Regular.ttf'),
    'EditorialSerif-Medium': require('../../assets/fonts/PlayfairDisplay-Medium.ttf'),
  });
}
