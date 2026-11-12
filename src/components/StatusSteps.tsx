// شريط المراحل الخمس في شاشة التتبع (من ملف التصميم):
// منجزة = دائرة داكنة بعلامة صح، الحالية = دائرة برتقالية، القادمة = دائرة فارغة.
// منطق "أي مرحلة منجزة" في src/lib/orderStatus.ts ومختبر هناك؛ هذا الملف رسم فقط.
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { type OrderStatus, STAGES, stageState, statusLabel } from '@/lib/orderStatus';
import { colors, fonts } from '@/theme';

type Props = {
  status: OrderStatus;
  times: Partial<Record<OrderStatus, string>>; // وقت الوصول لكل مرحلة، مثل 12:40
};

export function StatusSteps({ status, times }: Props) {
  return (
    <View>
      {STAGES.map((stage, i) => {
        const state = stageState(stage, status);
        const last = i === STAGES.length - 1;
        return (
          <View key={stage} style={styles.row}>
            <View style={styles.rail}>
              <View style={[styles.dot, styles[state]]}>
                {state === 'done' && (
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.surface} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M5 12l5 5 9-10" />
                  </Svg>
                )}
              </View>
              {!last && <View style={[styles.line, state === 'done' && styles.lineDone]} />}
            </View>
            <View style={styles.label}>
              <Text style={[styles.name, state === 'upcoming' && styles.nameIdle, state === 'current' && styles.nameCurrent]}>
                {statusLabel(stage)}
              </Text>
              {times[stage] && <Text style={styles.time}>{times[stage]}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 14 },
  rail: { alignItems: 'center' },
  dot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  done: { backgroundColor: colors.text },
  current: { backgroundColor: colors.primary, borderWidth: 4, borderColor: colors.primarySoft },
  upcoming: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.stepIdle },
  line: { width: 2, flex: 1, minHeight: 26, backgroundColor: colors.stepIdle },
  lineDone: { backgroundColor: colors.text },
  label: { gap: 2, paddingBottom: 14 },
  name: { fontFamily: fonts.regular, fontSize: 16, color: colors.text },
  nameCurrent: { fontFamily: fonts.bold },
  nameIdle: { color: colors.textSecondary },
  time: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, writingDirection: 'ltr', textAlign: 'right' },
});
