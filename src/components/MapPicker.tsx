// الخريطة بالدبوس: كل كود الخريطة هنا فقط (القسم 2 من المواصفات)، فإذا غيّرنا المكتبة قبل النشر نغيّر هذا الملف وحده.
// الدبوس ثابت في وسط الخريطة، والعميل يحرّك الخريطة تحته. عند توقف الحركة نرسل موقع الوسط إلى الشاشة.
import * as Location from 'expo-location';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView from 'react-native-maps';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors, fonts } from '@/theme';

export type Point = { lat: number; lng: number };

// وسط طرابلس: الخريطة تفتح هنا، وتبقى هنا إذا رُفض إذن الموقع (القسم 8)
export const TRIPOLI_CENTER: Point = { lat: 32.8872, lng: 13.1913 };

// مقدار التقريب: نحو حيّ واحد على الشاشة
const ZOOM = { latitudeDelta: 0.01, longitudeDelta: 0.01 };

type Props = { onChange: (point: Point) => void };

export function MapPicker({ onChange }: Props) {
  const { t } = useTranslation();
  const map = useRef<MapView>(null);

  // يطلب الإذن ثم ينقل الخريطة إلى موقع العميل. إذا رفض لا يحدث شيء ويحرّك الدبوس يدويًا.
  async function goToMyLocation() {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) return;
    const { coords } = await Location.getCurrentPositionAsync();
    map.current?.animateToRegion({ latitude: coords.latitude, longitude: coords.longitude, ...ZOOM });
  }

  // عند فتح الشاشة: الموقع المبدئي وسط طرابلس، ثم نحاول الانتقال لموقع العميل
  useEffect(() => {
    onChange(TRIPOLI_CENTER);
    goToMyLocation().catch(() => {}); // تعذّر تحديد الموقع (مثلًا GPS مطفأ): يبقى على وسط طرابلس
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.box} accessibilityLabel={t('addresses.mapLabel')}>
      <MapView
        ref={map}
        style={StyleSheet.absoluteFill}
        initialRegion={{ latitude: TRIPOLI_CENTER.lat, longitude: TRIPOLI_CENTER.lng, ...ZOOM }}
        onRegionChangeComplete={(r) => onChange({ lat: r.latitude, lng: r.longitude })}
      />

      {/* الدبوس فوق الخريطة، رأسه السفلي على وسطها تمامًا. pointerEvents="none" كي لا يمنع تحريك الخريطة */}
      <View style={styles.pin} pointerEvents="none">
        <Svg width={40} height={48} viewBox="0 0 40 48">
          <Path
            d="M20 2C10 2 2 9.7 2 19.3 2 32 20 46 20 46s18-14 18-26.7C38 9.7 30 2 20 2z"
            fill={colors.primary}
            stroke={colors.surface}
            strokeWidth={2}
          />
          <Circle cx={20} cy={19} r={6} fill={colors.surface} />
        </Svg>
      </View>

      <Pressable style={styles.myLocation} onPress={() => goToMyLocation().catch(() => {})} accessibilityRole="button">
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.primaryDark} strokeWidth={2} strokeLinecap="round">
          <Circle cx={12} cy={12} r={3} />
          <Path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </Svg>
        <Text style={styles.myLocationText}>{t('addresses.myLocation')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    height: 220,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.placeholder,
  },
  // الدبوس 40×48: نزيحه نصف عرضه يسارًا وكامل طوله لأعلى، فيقع رأسه على وسط الخريطة
  pin: { position: 'absolute', left: '50%', top: '50%', marginLeft: -20, marginTop: -48 },
  myLocation: {
    position: 'absolute',
    bottom: 12,
    end: 12, // "النهاية" في واجهة عربية هي اليسار، كما في ملف التصميم
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  myLocationText: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
});
