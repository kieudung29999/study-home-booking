import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Modal, Pressable, PressableProps, StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/** Warm cream + gold palette. */
export const C = {
  bg: '#FAF5EA', card: '#FFFDF8', tx: '#2A2318', mut: '#8C8372',
  pri: '#B8872F', pri2: '#E3C98A', soft: '#F3E6C4', banner: '#E9D8AE', acc: '#C99A3E',
  ok: '#3E9B5A', warn: '#D98A2B', bad: '#CF4F45', none: '#A39A88',
  ln: '#EDE3CC',
};
export type IonName = React.ComponentProps<typeof Ionicons>['name'];

export const shadow: ViewStyle = { shadowColor: '#8A6A22', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 };

// ---------------------------------------------------------------- animation primitives
const APressable = Animated.createAnimatedComponent(Pressable);

/** Pressable that springs down a little while pressed. */
export function Press({ style, scaleTo = 0.96, onPressIn, onPressOut, ...rest }: Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; scaleTo?: number }) {
  const v = useRef(new Animated.Value(1)).current;
  const go = (n: number) => Animated.spring(v, { toValue: n, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  return <APressable {...rest} onPressIn={e => { go(scaleTo); onPressIn?.(e); }} onPressOut={e => { go(1); onPressOut?.(e); }} style={[style, { transform: [{ scale: v }] }]} />;
}

/** Fades + slides its children in on mount (use `delay` for staggered lists). */
export function FadeIn({ children, delay = 0, y = 14, style }: { children: React.ReactNode; delay?: number; y?: number; style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(v, { toValue: 1, duration: 420, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(); }, [v, delay]);
  return <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [y, 0] }) }] }]}>{children}</Animated.View>;
}

/** Width animates smoothly whenever `value` (0..1) changes. */
export function ProgressBar({ value, color, track = C.ln, height = 6 }: { value: number; color: string; track?: string; height?: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(v, { toValue: Math.max(0, Math.min(1, value)), duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(); }, [v, value]);
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: track, overflow: 'hidden' }}>
      <Animated.View style={{ height, borderRadius: height / 2, backgroundColor: color, width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
    </View>
  );
}

/** Pulsing placeholder block shown while data loads. */
export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(v, { toValue: 0.45, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [v]);
  return <Animated.View style={[{ backgroundColor: C.soft, borderRadius: 16, opacity: v }, style]} />;
}

/** Bottom sheet with animated backdrop + slide-up panel. */
export function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);
  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(v, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    } else {
      Animated.timing(v, { toValue: 0, duration: 200, useNativeDriver: true }).start(({ finished }) => { if (finished) setMounted(false); });
    }
  }, [visible, v]);
  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000A', opacity: v }]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>
        <Animated.View style={{ backgroundColor: C.card, borderTopLeftRadius: 26, borderTopRightRadius: 26, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [420, 0] }) }] }}>
          <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: C.ln, marginTop: 8 }} />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------- basic controls
export const Chip = ({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) => (
  <Press onPress={onPress} scaleTo={0.93} style={[s.chip, on && { backgroundColor: C.pri, borderColor: C.pri }]}>
    <Text style={{ color: on ? '#fff' : C.tx, fontSize: 13, fontWeight: on ? '700' : '500' }}>{label}</Text>
  </Press>
);

export const Btn = ({ label, onPress, kind = 'main', disabled, icon }: { label: string; onPress: () => void; kind?: 'main' | 'ghost' | 'danger' | 'outlineDanger'; disabled?: boolean; icon?: IonName }) => {
  const fg = kind === 'ghost' ? C.tx : kind === 'outlineDanger' ? C.bad : '#fff';
  return (
    <Press disabled={disabled} onPress={onPress} style={[s.btn, kind === 'main' && shadow, kind === 'ghost' && s.ghost, kind === 'outlineDanger' && s.outlineDanger, kind === 'danger' && { backgroundColor: C.bad }, disabled && { opacity: 0.5 }]}>
      {icon && <Ionicons name={icon} size={20} color={fg} style={{ marginRight: 8 }} />}
      <Text style={{ fontWeight: '700', fontSize: 15, color: fg, includeFontPadding: false }}>{label}</Text>
    </Press>
  );
};

export function Field(p: TextInputProps) {
  const [focus, setFocus] = useState(false);
  return (
    <TextInput placeholderTextColor={C.mut} autoCapitalize="none" {...p}
      onFocus={e => { setFocus(true); p.onFocus?.(e); }} onBlur={e => { setFocus(false); p.onBlur?.(e); }}
      style={[s.input, focus && { borderColor: C.pri }, p.style]} />
  );
}

/** Search box with an optional gold filter button (with a count badge). */
export function SearchBar({ value, onChangeText, placeholder, onFilter, badge = 0 }: { value: string; onChangeText: (t: string) => void; placeholder: string; onFilter?: () => void; badge?: number }) {
  return (
    <View style={[s.search, shadow]}>
      <Ionicons name="search-outline" size={20} color={C.mut} />
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={C.mut} style={{ flex: 1, marginHorizontal: 8, fontSize: 15, color: C.tx, paddingVertical: 10 }} returnKeyType="search" />
      {!!value && <Pressable onPress={() => onChangeText('')} hitSlop={8} style={{ marginRight: 6 }}><Ionicons name="close-circle" size={18} color={C.none} /></Pressable>}
      {onFilter && (
        <Press onPress={onFilter} scaleTo={0.9} style={s.filterBtn}>
          <Ionicons name="options-outline" size={20} color="#fff" />
          {badge > 0 && <View style={s.filterBadge}><Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{badge}</Text></View>}
        </Press>
      )}
    </View>
  );
}

/** Status pill: colored dot + label. */
export const Badge = ({ color, text }: { color: string; text: string }) => (
  <View style={[s.badge, { backgroundColor: color }]}><Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{text}</Text></View>
);

/** Text tabs with an animated gold dot under the active one (like "All Genre •"). */
export function TextTabs<K extends string>({ items, value, onChange }: { items: ReadonlyArray<readonly [K, string]>; value: K; onChange: (k: K) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 20, paddingHorizontal: 16 }}>
      {items.map(([k, l]) => <TabLabel key={k} label={l} on={value === k} onPress={() => onChange(k)} />)}
    </View>
  );
}
function TabLabel({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const v = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => { Animated.spring(v, { toValue: on ? 1 : 0, useNativeDriver: true, bounciness: 12 }).start(); }, [on, v]);
  return (
    <Pressable onPress={onPress} hitSlop={8} style={{ alignItems: 'center' }}>
      <Text style={{ color: on ? C.pri : C.mut, fontWeight: on ? '700' : '500', fontSize: 15 }}>{label}</Text>
      <Animated.View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: C.pri, marginTop: 4, opacity: v, transform: [{ scale: v }] }} />
    </Pressable>
  );
}

export const Avatar = ({ uri, name, size = 44 }: { uri?: string; name: string; size?: number }) => uri
  ? <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
  : <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.pri2, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.4 }}>{(name[0] ?? '?').toUpperCase()}</Text>
    </View>;

export const Empty = ({ icon, title, hint, action }: { icon: IonName; title: string; hint?: string; action?: React.ReactNode }) => (
  <FadeIn style={{ alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24 }}>
    <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
      <Ionicons name={icon} size={32} color={C.pri} />
    </View>
    <Text style={{ fontSize: 16, fontWeight: '700', color: C.tx }}>{title}</Text>
    {!!hint && <Text style={{ color: C.mut, textAlign: 'center', marginTop: 4 }}>{hint}</Text>}
    {action}
  </FadeIn>
);

/** Small colored dot. */
export const Dot = ({ color, size = 8 }: { color: string; size?: number }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
);

export const Title = ({ children }: { children: string }) => <Text style={{ fontSize: 26, fontWeight: '800', color: C.tx, padding: 16, paddingBottom: 8 }}>{children}</Text>;

const s = StyleSheet.create({
  chip: { borderWidth: 1, borderColor: C.ln, backgroundColor: C.card, borderRadius: 20, paddingVertical: 7, paddingHorizontal: 14, marginRight: 8 },
  btn: { backgroundColor: C.pri, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 8 },
  ghost: { backgroundColor: C.card, borderWidth: 1, borderColor: C.ln },
  outlineDanger: { backgroundColor: '#CF4F4510', borderWidth: 1.5, borderColor: C.bad },
  input: { backgroundColor: C.card, borderWidth: 1.5, borderColor: C.ln, borderRadius: 14, padding: 12, fontSize: 15, color: C.tx, marginBottom: 8 },
  search: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 18, paddingLeft: 14, paddingRight: 6, height: 50 },
  filterBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.pri, alignItems: 'center', justifyContent: 'center' },
  filterBadge: { position: 'absolute', top: -3, right: -3, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: C.bad, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badge: { borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'flex-start' },
});
