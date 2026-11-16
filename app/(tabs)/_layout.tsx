// الشريط السفلي بأربع تبويبات (القسم 6): الرئيسية، السلة، طلباتي، حسابي.
import { Tabs } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Path } from 'react-native-svg';

import { cartCount, useCart } from '@/stores/cart';
import { colors, fonts } from '@/theme';

// خصائص الرسم المشتركة بين أيقونات الشريط (من ملف التصميم)
const icon = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export default function TabsLayout() {
  const { t } = useTranslation();
  // عدد القطع في السلة يظهر شارةً على أيقونتها
  const count = useCart((s) => cartCount(s.items));

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12 },
        tabBarStyle: {
          height: 68,
          paddingTop: 6,
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          boxShadow: '0 -4px 16px rgba(31, 41, 55, 0.06)',
        },
        tabBarBadgeStyle: { backgroundColor: colors.primary, color: colors.text, fontFamily: fonts.bold, fontSize: 11 },
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
        name="cart"
        options={{
          title: t('tabs.cart'),
          tabBarBadge: count > 0 ? count : undefined,
          tabBarIcon: ({ color }) => (
            <Svg {...icon} stroke={color}>
              <Circle cx={9} cy={20} r={1.5} />
              <Circle cx={18} cy={20} r={1.5} />
              <Path d="M2 3h3l3 12h11l2-8H7" />
            </Svg>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t('tabs.orders'),
          tabBarIcon: ({ color }) => (
            <Svg {...icon} stroke={color}>
              <Path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
              <Path d="M9 8h6M9 12h6" />
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
