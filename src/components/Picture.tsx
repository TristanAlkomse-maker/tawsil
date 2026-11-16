// صورة متجر أو منتج مع صورة افتراضية تحتها: رمز تعبيري كبير على خلفية ملوّنة
// يُختار من الاسم (src/lib/defaultImage.ts). الصورة الحقيقية إن وُجدت تغطيه،
// وإن لم توجد أو تعذّر تحميلها بقي الرمز ظاهرًا، فلا يبقى المكان فارغًا.
import { Image, type ImageProps } from 'expo-image';
import { type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { defaultImage } from '@/lib/defaultImage';

type Props = {
  source: string | null;
  name: string; // اسم المتجر أو المنتج: منه يُختار الرمز
  hint?: string; // اسم المتجر أو تصنيفه، يُستعمل إن لم يدل الاسم على شيء
  style: StyleProp<ViewStyle>; // المقاس والاستدارة
  size?: number; // حجم الرمز بالنقاط
  contentPosition?: ImageProps['contentPosition'];
};

export function Picture({ source, name, hint, style, size = 40, contentPosition }: Props) {
  const { emoji, background } = defaultImage(name, hint);

  return (
    <View style={[styles.box, { backgroundColor: background }, style]}>
      {/* دائرة فاتحة خلف الرمز تعطيه عمقًا */}
      <View style={[styles.halo, { width: size * 1.7, height: size * 1.7, borderRadius: size }]}>
        {/* بلا fontFamily: الرموز التعبيرية تُرسم بخط النظام. الرمز زينة، فلا يقرؤه قارئ الشاشة */}
        <Text
          style={{ fontSize: size, lineHeight: size * 1.25 }}
          accessible={false}
          importantForAccessibility="no"
          aria-hidden
        >
          {emoji}
        </Text>
      </View>
      {!!source && <Image source={source} style={StyleSheet.absoluteFill} contentPosition={contentPosition} transition={200} />}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  halo: { backgroundColor: 'rgba(255, 255, 255, 0.55)', alignItems: 'center', justifyContent: 'center' },
});
