// الملف الجذر: يُنفَّذ مرة واحدة قبل أي شاشة.
// يحمّل الخط العربي ويشغّل الترجمة، ثم يعرض الشاشات.
import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_700Bold,
  useFonts,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import { Stack } from 'expo-router';
import { View } from 'react-native';

import { colors } from '@/theme';

import '@/i18n';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_700Bold,
  });

  // لا نعرض شيئًا حتى يجهز الخط، كي لا يظهر النص بخط النظام ثم يتبدل.
  if (!loaded && !error) return null;

  // على الهاتف يُفرض RTL من app.json (forcesRTL). المتصفح يحتاج direction هنا.
  return (
    <View style={{ flex: 1, direction: "rtl" }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
    </View>
  );
}
