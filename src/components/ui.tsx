import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { STATUS_LABEL, timeLeft } from '@/lib/format';
import { isExpired } from '@/lib/store';
import { useNow } from '@/lib/useNow';
import type { Donation } from '@/lib/types';
import { C, radius, STATUS_COLOR } from './theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Screen({
  children,
  scroll = true,
  edges = ['top'],
  padded = true,
}: {
  children: ReactNode;
  scroll?: boolean;
  edges?: ('top' | 'bottom')[];
  padded?: boolean;
}) {
  const inner = padded ? styles.padded : undefined;
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView contentContainerStyle={[inner, { paddingBottom: 40 }]} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1 }, inner]}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function H1({ children }: { children: ReactNode }) {
  return <Text style={styles.h1}>{children}</Text>;
}

export function Sub({ children, style }: { children: ReactNode; style?: StyleProp<any> }) {
  return <Text style={[styles.sub, style]}>{children}</Text>;
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <View style={{ marginTop: 24 }}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action}
      </View>
      <View style={{ gap: 10 }}>{children}</View>
    </View>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress)
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.85 }]}>
        {children}
      </Pressable>
    );
  return <View style={[styles.card, style]}>{children}</View>;
}

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  small,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: BtnVariant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const v = BTN[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        { backgroundColor: v.bg, borderColor: v.border },
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={small ? 16 : 18} color={v.fg} />}
          <Text style={[styles.btnText, small && { fontSize: 14 }, { color: v.fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const BTN: Record<BtnVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: C.primary, fg: '#fff', border: C.primary },
  accent: { bg: C.accent, fg: '#fff', border: C.accent },
  secondary: { bg: C.card, fg: C.ink, border: C.line },
  ghost: { bg: 'transparent', fg: C.primary, border: 'transparent' },
  danger: { bg: C.dangerSoft, fg: C.danger, border: C.dangerSoft },
};

export function Field({ label, error, hint, ...props }: TextInputProps & { label: string; error?: string; hint?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={C.faint}
        {...props}
        style={[styles.input, props.multiline && { minHeight: 84, textAlignVertical: 'top' }, error && { borderColor: C.danger }, props.style]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Chips<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.chipRow}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable key={String(o.value)} onPress={() => onChange(o.value)} style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.chipText, on && { color: '#fff' }]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Badge({ text, fg, bg, icon }: { text: string; fg: string; bg: string; icon?: IconName }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {icon && <Ionicons name={icon} size={12} color={fg} />}
      <Text style={[styles.badgeText, { color: fg }]}>{text}</Text>
    </View>
  );
}

export function StatusBadge({ d }: { d: Donation }) {
  const key = isExpired(d) ? 'expired' : d.status;
  const c = STATUS_COLOR[key];
  return <Badge text={key === 'expired' ? 'Expired' : STATUS_LABEL[d.status]} fg={c.fg} bg={c.bg} />;
}

export function UrgencyBadge({ d }: { d: Donation }) {
  const now = useNow();
  if (d.status !== 'available' || isExpired(d, now)) return null;
  const mins = (d.expiresAt - now) / 60000;
  const urgent = mins < 120;
  return (
    <Badge
      icon="time-outline"
      text={timeLeft(d.expiresAt, now)}
      fg={urgent ? C.danger : C.sub}
      bg={urgent ? C.dangerSoft : '#F0EEE8'}
    />
  );
}

export function Stat({ label, value, icon, tint = C.primary }: { label: string; value: string | number; icon: IconName; tint?: string }) {
  return (
    <View style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: tint + '1A' }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function StatRow({ children }: { children: ReactNode }) {
  return <View style={styles.statRow}>{children}</View>;
}

export function Empty({ icon, title, body }: { icon: IconName; title: string; body?: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={32} color={C.faint} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {body && <Text style={[styles.sub, { textAlign: 'center' }]}>{body}</Text>}
    </View>
  );
}

export function Row({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={15} color={C.sub} style={{ marginTop: 2 }} />
      <Text style={[styles.sub, { flex: 1 }]}>{children}</Text>
    </View>
  );
}

export function Avatar({ name, size = 40, tint = C.primary }: { name: string; size?: number; tint?: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: tint + '22', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: tint, fontWeight: '700', fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  padded: { padding: 20 },
  h1: { fontSize: 28, fontWeight: '800', color: C.ink, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: C.sub, lineHeight: 20 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: C.ink },
  card: { backgroundColor: C.card, borderRadius: radius, padding: 16, borderWidth: 1, borderColor: C.line },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
  },
  btnSmall: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10 },
  btnText: { fontSize: 16, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600', color: C.ink },
  input: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: C.ink,
  },
  error: { color: C.danger, fontSize: 12 },
  hint: { color: C.faint, fontSize: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: C.line, backgroundColor: C.card },
  chipOn: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 14, color: C.ink, fontWeight: '600' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  statRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, backgroundColor: C.card, borderRadius: radius, padding: 14, borderWidth: 1, borderColor: C.line, gap: 4 },
  statIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800', color: C.ink },
  statLabel: { fontSize: 12, color: C.sub },
  empty: { alignItems: 'center', padding: 28, gap: 8, backgroundColor: C.card, borderRadius: radius, borderWidth: 1, borderColor: C.line, borderStyle: 'dashed' },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: C.ink },
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
});
