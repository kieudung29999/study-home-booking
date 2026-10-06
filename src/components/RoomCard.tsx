import React, { memo, useEffect, useRef } from 'react';
import { Animated, Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RoomItem } from '../types';
import { occupancy } from '../util';
import { Badge, C, FadeIn, Press, shadow } from '../ui';

/** Heart that pops when toggled. */
export function HeartButton({ on, onPress, size = 32 }: { on: boolean; onPress: () => void; size?: number }) {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (on) Animated.sequence([
      Animated.timing(v, { toValue: 1.35, duration: 120, useNativeDriver: true }),
      Animated.spring(v, { toValue: 1, useNativeDriver: true, bounciness: 14 }),
    ]).start();
  }, [on, v]);
  return (
    <Pressable onPress={onPress} hitSlop={8} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#FFFDF8E6', alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ transform: [{ scale: v }] }}>
        <Ionicons name={on ? 'heart' : 'heart-outline'} size={size * 0.56} color={on ? C.bad : C.mut} />
      </Animated.View>
    </Pressable>
  );
}

interface Props { r: RoomItem; width: number; index: number; fav: boolean; onPress: (id: string) => void; onFav: (id: string) => void }

export const RoomCard = memo(function RoomCard({ r, width, index, fav, onPress, onFav }: Props) {
  const occ = r.closed && !r.locked ? { color: C.none, text: 'Không mở', bookable: false } : occupancy(r.total, r.free, r.locked, C, r.booked, r.total * r.seats);
  const label = occ.bookable ? (r.booked > 0 ? `${r.booked}/${r.total * r.seats}` : 'ĐẶT NGAY') : occ.text.toUpperCase();
  return (
    <FadeIn delay={Math.min(index, 8) * 60} style={{ width, marginBottom: 14 }}>
      <Press onPress={() => onPress(r.id)} style={[{ backgroundColor: C.card, borderRadius: 20, padding: 8, borderWidth: 1, borderColor: C.ln }, shadow]}>
        <View style={{ height: 150, borderRadius: 14, backgroundColor: C.soft, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
          {r.photoUrl ? <Image source={{ uri: r.photoUrl }} style={{ width: '100%', height: '100%' }} />
            : <Text style={{ fontSize: 30, fontWeight: '800', color: C.pri }}>{r.name.slice(0, 2).toUpperCase()}</Text>}
          <View style={{ position: 'absolute', top: 8, left: 8 }}><Badge color={occ.color} text={label} /></View>
          <View style={{ position: 'absolute', top: 6, right: 6 }}><HeartButton on={fav} onPress={() => onFav(r.id)} /></View>
          <View style={{ position: 'absolute', bottom: 8, left: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFDF8E6', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Ionicons name="people" size={12} color={C.pri} />
            <Text style={{ color: C.pri, fontSize: 12, fontWeight: '800', marginLeft: 4 }}>{r.seats}</Text>
          </View>
        </View>
        <View style={{ paddingHorizontal: 4, paddingTop: 8, paddingBottom: 2 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: C.tx }} numberOfLines={1}>{r.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <Ionicons name="location-outline" size={12} color={C.mut} />
            <Text style={{ color: C.mut, fontSize: 12, marginLeft: 2, flex: 1 }} numberOfLines={1}>{r.location || 'Chưa có vị trí'}</Text>
          </View>
        </View>
      </Press>
    </FadeIn>
  );
});
