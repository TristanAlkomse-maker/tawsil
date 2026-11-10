// الشريط السفلي. فيه الآن تبويبان فقط؛ السلة تُضاف في المرحلة 6 وطلباتي في المرحلة 8.
import { Tabs } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors, fonts } from '@/theme';

// خصائص الرسم المشتركة بين أيقونات الشريط (من ملف التصميم)
const icon = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontFamily: fonts.regular, fontSize: 12 },
        tabBarStyle: { height: 64, backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => (
            <Svg {...icon} stroke={color}>
              <Path d="M3 11l9-8 9 8" />
              <Path d="M5 10v10h14V10" />
            </Svg>
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t('tabs.account'),
          tabBarIcon: ({ color }) => (
            <Svg {...icon} stroke={color}>
              <Circle cx={12} cy={8} r={4} />
              <Path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
            </Svg>
          ),
        }}
      />
    </Tabs>
  );
}
