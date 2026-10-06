import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, shadow } from '../ui';

function Item({ focused, label, icon, onPress }: { focused: boolean; label: string; icon: React.ReactNode; onPress: () => void }) {
  const v = useRef(new Animated.Value(focused ? 1 : 0)).current;
  useEffect(() => { Animated.spring(v, { toValue: focused ? 1 : 0, useNativeDriver: false, bounciness: 10 }).start(); }, [focused, v]);
  return (
    <Pressable onPress={onPress} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }} hitSlop={4}>
      {/* icon sits in a gold pill that fades in + lifts slightly when active */}
      <Animated.View style={{
        width: 52, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center',
        backgroundColor: v.interpolate({ inputRange: [0, 1], outputRange: ['rgba(184,135,47,0)', 'rgba(184,135,47,0.18)'] }),
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -1] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }],
      }}>
        {icon}
      </Animated.View>
      <Text numberOfLines={1} style={{ marginTop: 3, fontSize: 11, fontWeight: focused ? '800' : '500', color: focused ? C.pri : C.mut }}>{label}</Text>
    </Pressable>
  );
}

/** Floating rounded tab bar (cream + gold). */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingHorizontal: 14, paddingTop: 6, paddingBottom: Math.max(insets.bottom, 10), backgroundColor: C.bg }}>
      <View style={[{ flexDirection: 'row', backgroundColor: C.card, borderRadius: 28, paddingVertical: 8, paddingHorizontal: 6, borderWidth: 1, borderColor: C.ln }, shadow]}>
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const o = descriptors[route.key].options;
          const press = () => {
            const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !e.defaultPrevented) navigation.navigate(route.name, route.params);
          };
          return <Item key={route.key} focused={focused} label={typeof o.title === 'string' ? o.title : route.name} onPress={press}
            icon={o.tabBarIcon?.({ focused, color: focused ? C.pri : C.mut, size: 22 })} />;
        })}
      </View>
    </View>
  );
}
