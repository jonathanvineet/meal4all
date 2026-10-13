import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
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
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { STATUS_LABEL, timeLeft } from '@/lib/format';
import { isExpired } from '@/lib/store';
import { useNow } from '@/lib/useNow';
import type { Donation, DonationStatus } from '@/lib/types';
import { C, F, radius, shadow, STATUS_COLOR } from './theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

const NATIVE = Platform.OS !== 'web';
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function tap(kind: 'light' | 'select' | 'success' = 'light') {
  if (!NATIVE) return;
  if (kind === 'select') Haptics.selectionAsync();
  else if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Pressable that settles down slightly under the finger. */
export function PressableScale({
  onPress,
  disabled,
  style,
  children,
  haptic = true,
  to = 0.97,
}: {
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  haptic?: boolean;
  to?: number;
}) {
  const [scale] = useState(() => new Animated.Value(1));
  const spring = (v: number) => Animated.spring(scale, { toValue: v, useNativeDriver: NATIVE, speed: 40, bounciness: 4 }).start();
  return (
    <AnimatedPressable
      onPress={() => {
        if (haptic) tap();
        onPress?.();
      }}
      onPressIn={() => spring(to)}
      onPressOut={() => spring(1)}
      disabled={disabled}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}

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
          <ScrollView contentContainerStyle={[inner, { paddingBottom: 48 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1 }, inner]}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function H1({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.h1, style]}>{children}</Text>;
}

export function Sub({ children, style, numberOfLines }: { children: ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  return (
    <Text style={[styles.sub, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

/** Page title with an optional line of context underneath. */
export function PageHead({ title, body, right }: { title: string; body?: string; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: 8 }}>
      <View style={{ flex: 1, gap: 6 }}>
        <H1>{title}</H1>
        {body && <Sub style={{ maxWidth: 520 }}>{body}</Sub>}
      </View>
      {right}
    </View>
  );
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <View style={{ marginTop: 28 }}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action}
      </View>
      <View style={{ gap: 12 }}>{children}</View>
    </View>
  );
}

export function LinkText({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={10}>
      {({ pressed }) => <Text style={[styles.link, pressed && { opacity: 0.6 }]}>{title}</Text>}
    </Pressable>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress)
    return (
      <PressableScale onPress={onPress} style={[styles.card, style]} to={0.985}>
        {children}
      </PressableScale>
    );
  return <View style={[styles.card, style]}>{children}</View>;
}

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent' | 'light';

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
  const off = disabled || loading;
  return (
    <PressableScale
      onPress={onPress}
      disabled={off}
      style={[
        styles.btn,
        small && styles.btnSmall,
        { backgroundColor: v.bg, borderColor: v.border },
        v.lift && !off && shadow.card,
        off && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={small ? 16 : 19} color={v.fg} />}
          <Text style={[styles.btnText, small && { fontSize: 14 }, { color: v.fg }]}>{title}</Text>
        </>
      )}
    </PressableScale>
  );
}

const BTN: Record<BtnVariant, { bg: string; fg: string; border: string; lift?: boolean }> = {
  primary: { bg: C.primary, fg: '#fff', border: C.primary, lift: true },
  accent: { bg: C.accent, fg: C.ink, border: C.accent, lift: true },
  secondary: { bg: C.card, fg: C.ink, border: C.line },
  ghost: { bg: 'transparent', fg: C.primary, border: 'transparent' },
  danger: { bg: C.dangerSoft, fg: C.danger, border: C.dangerSoft },
  light: { bg: '#ffffff1f', fg: '#fff', border: '#ffffff33' },
};

export function Field({ label, error, hint, ...props }: TextInputProps & { label: string; error?: string; hint?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={C.faint}
        selectionColor={C.primary}
        {...props}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        style={[
          styles.input,
          props.multiline && { minHeight: 88, textAlignVertical: 'top' },
          focused && styles.inputFocus,
          !!error && { borderColor: C.danger, backgroundColor: '#FFF8F6' },
          props.style,
        ]}
      />
      {error ? (
        <View style={styles.row}>
          <Ionicons name="alert-circle" size={14} color={C.danger} style={{ marginTop: 1 }} />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

export function FormError({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <View style={styles.formError}>
      <Ionicons name="alert-circle" size={18} color={C.danger} />
      <Text style={[styles.error, { fontSize: 14, flex: 1 }]}>{text}</Text>
    </View>
  );
}

export function Chips<T extends string | number>({
  options,
  value,
  onChange,
  label,
  scroll,
}: {
  options: readonly { value: T; label: string; icon?: IconName }[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
  /** Lay the chips out in one swipeable line instead of wrapping. */
  scroll?: boolean;
}) {
  const chips = options.map((o) => {
    const on = o.value === value;
    return (
      <Pressable
        key={String(o.value)}
        onPress={() => {
          if (!on) tap('select');
          onChange(o.value);
        }}
        style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && !on && { backgroundColor: C.sunk }]}
      >
        {o.icon && <Ionicons name={o.icon} size={15} color={on ? '#fff' : C.sub} />}
        <Text style={[styles.chipText, on && { color: '#fff' }]}>{o.label}</Text>
      </Pressable>
    );
  });
  return (
    <View style={{ gap: 8 }}>
      {label && <Text style={styles.label}>{label}</Text>}
      {scroll ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }} style={{ marginHorizontal: -20 }}>
          {chips}
        </ScrollView>
      ) : (
        <View style={styles.chipRow}>{chips}</View>
      )}
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
  return <Badge icon="time-outline" text={timeLeft(d.expiresAt, now)} fg={urgent ? C.danger : C.sub} bg={urgent ? C.dangerSoft : C.sunk} />;
}

/** Share of the food's safe-to-eat window that is still left, 0–1. */
export function freshness(d: Donation, now: number) {
  const total = d.expiresAt - d.createdAt;
  return total > 0 ? Math.max(0, Math.min(1, (d.expiresAt - now) / total)) : 0;
}

export function freshnessColor(f: number) {
  return f > 0.5 ? C.primary : f > 0.2 ? C.accent : C.danger;
}

/** Bar that drains from leaf to turmeric to chili as the food approaches its best-before time. */
export function FreshnessMeter({ d, big }: { d: Donation; big?: boolean }) {
  const now = useNow();
  const f = freshness(d, now);
  const color = freshnessColor(f);
  const h = big ? 10 : 6;
  return (
    <View style={{ gap: big ? 8 : 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text style={{ fontFamily: F.bold, fontSize: big ? 15 : 12, color: f > 0.2 ? C.ink : C.danger }}>{timeLeft(d.expiresAt, now)}</Text>
        <Text style={{ fontFamily: F.medium, fontSize: big ? 13 : 11, color: C.faint }}>{f > 0.5 ? 'Fresh' : f > 0.2 ? 'Collect soon' : 'Urgent'}</Text>
      </View>
      <View style={{ height: h, borderRadius: h, backgroundColor: C.sunk, overflow: 'hidden' }}>
        <View style={{ height: h, width: `${Math.max(f * 100, 3)}%`, borderRadius: h, backgroundColor: color }} />
      </View>
    </View>
  );
}

const JOURNEY: DonationStatus[] = ['available', 'accepted', 'assigned', 'picked', 'delivered'];
const JOURNEY_ICON: IconName[] = ['restaurant', 'home', 'person', 'bicycle', 'checkmark'];

/** Five stops from posted to delivered, with the current one highlighted. */
export function JourneyTrack({ status }: { status: DonationStatus }) {
  const at = JOURNEY.indexOf(status);
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {JOURNEY.map((s, i) => {
          const done = i <= at;
          const current = i === at;
          return (
            <View key={s} style={{ flexDirection: 'row', alignItems: 'center', flex: i ? 1 : 0 }}>
              {i > 0 && <View style={{ flex: 1, height: 2, backgroundColor: i <= at ? C.primary : C.line }} />}
              <View
                style={{
                  width: current ? 24 : 16,
                  height: current ? 24 : 16,
                  borderRadius: 12,
                  backgroundColor: done ? C.primary : C.card,
                  borderWidth: done ? 0 : 2,
                  borderColor: C.line,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {done && <Ionicons name={current ? JOURNEY_ICON[i] : 'checkmark'} size={current ? 13 : 10} color="#fff" />}
              </View>
            </View>
          );
        })}
      </View>
      <Text style={{ fontFamily: F.semibold, fontSize: 12, color: C.sub }}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

/** Rounded square holding an icon, tinted by meaning. */
export function IconTile({ icon, tint = C.primary, bg, size = 44 }: { icon: IconName; tint?: string; bg?: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.32, backgroundColor: bg ?? tint + '1F', alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={icon} size={size * 0.5} color={tint} />
    </View>
  );
}

export function Stat({ label, value, icon, tint = C.primary }: { label: string; value: string | number; icon: IconName; tint?: string }) {
  return (
    <View style={[styles.stat, shadow.card]}>
      <IconTile icon={icon} tint={tint} size={30} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function StatRow({ children }: { children: ReactNode }) {
  return <View style={styles.statRow}>{children}</View>;
}

export function Empty({ icon, title, body, action }: { icon: IconName; title: string; body?: string; action?: ReactNode }) {
  return (
    <View style={styles.empty}>
      <IconTile icon={icon} tint={C.faint} bg={C.sunk} size={52} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {body && <Text style={[styles.sub, { textAlign: 'center', maxWidth: 300 }]}>{body}</Text>}
      {action && <View style={{ marginTop: 6, alignSelf: 'stretch' }}>{action}</View>}
    </View>
  );
}

export function Row({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={16} color={C.faint} style={{ marginTop: 2 }} />
      <Text style={[styles.body, { flex: 1 }]}>{children}</Text>
    </View>
  );
}

const AVATAR_TINTS = [C.primary, C.purple, C.blue, C.accentInk, '#B23A6B', '#2F7F86'];

export function Avatar({ name, size = 40, tint }: { name: string; size?: number; tint?: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  const hash = [...name].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const t = tint ?? AVATAR_TINTS[hash % AVATAR_TINTS.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t + '1F', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: t, fontFamily: F.displayBold, fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  padded: { padding: 20 },
  h1: { fontSize: 32, fontFamily: F.display, color: C.ink, letterSpacing: -0.8, lineHeight: 36 },
  sub: { fontSize: 14, fontFamily: F.regular, color: C.sub, lineHeight: 20 },
  body: { fontSize: 15, fontFamily: F.regular, color: C.ink, lineHeight: 21 },
  link: { color: C.primary, fontFamily: F.bold, fontSize: 14 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontFamily: F.displayBold, color: C.ink, letterSpacing: -0.3 },
  card: { backgroundColor: C.card, borderRadius: radius, padding: 16, ...shadow.card },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 54,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  btnSmall: { minHeight: 42, paddingHorizontal: 14, borderRadius: 12 },
  btnText: { fontSize: 16, fontFamily: F.bold },
  label: { fontSize: 14, fontFamily: F.semibold, color: C.ink },
  input: {
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    fontFamily: F.regular,
    color: C.ink,
  },
  inputFocus: { borderColor: C.primary, boxShadow: `0 0 0 4px ${C.primarySoft}` },
  error: { color: C.danger, fontSize: 13, fontFamily: F.medium },
  formError: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: C.dangerSoft },
  hint: { color: C.faint, fontSize: 13, fontFamily: F.regular },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: C.line,
    backgroundColor: C.card,
  },
  chipOn: { backgroundColor: C.ink, borderColor: C.ink },
  chipText: { fontSize: 14, color: C.ink, fontFamily: F.semibold },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontFamily: F.bold },
  statRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, backgroundColor: C.card, borderRadius: radius, padding: 14, gap: 2 },
  statValue: { fontSize: 26, fontFamily: F.display, color: C.ink, marginTop: 8, letterSpacing: -0.5 },
  statLabel: { fontSize: 12, fontFamily: F.medium, color: C.sub, lineHeight: 16 },
  empty: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20, gap: 8, borderRadius: radius, borderWidth: 1.5, borderColor: C.line, borderStyle: 'dashed' },
  emptyTitle: { fontSize: 17, fontFamily: F.displayBold, color: C.ink, marginTop: 4 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
});
