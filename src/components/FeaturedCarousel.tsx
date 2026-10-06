import React, { useRef } from 'react';
import { Animated, FlatList, Image, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RoomItem } from '../types';
import { C, FadeIn, Press, shadow } from '../ui';

/** Paged hero banner of popular rooms, with animated page dots. */
export function FeaturedCarousel({ rooms, onOpen }: { rooms: RoomItem[]; onOpen: (id: string) => void }) {
  const { width: screen } = useWindowDimensions();
  const W = screen - 32;
  const x = useRef(new Animated.Value(0)).current;
  if (!rooms.length) return null;
  return (
    <FadeIn style={{ marginTop: 14 }}>
      <Animated.FlatList
        data={rooms} horizontal pagingEnabled showsHorizontalScrollIndicator={false} keyExtractor={r => r.id}
        snapToInterval={W + 0} decelerationRate="fast" contentContainerStyle={{ paddingHorizontal: 16 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x } } }], { useNativeDriver: true })} scrollEventThrottle={16}
        renderItem={({ item }) => (
          <Press onPress={() => onOpen(item.id)} scaleTo={0.98} style={[{ width: W, height: 150, borderRadius: 24, backgroundColor: C.banner, padding: 16, flexDirection: 'row', alignItems: 'center' }, shadow]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: C.card, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Ionicons name="flame" size={13} color={C.warn} />
                <Text style={{ marginLeft: 4, fontSize: 12, color: C.tx, fontWeight: '600' }}>Nổi bật</Text>
              </View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: C.tx, marginTop: 8 }} numberOfLines={2}>{item.name}</Text>
              <Text style={{ color: C.mut, marginTop: 2 }} numberOfLines={1}>{item.location} · {item.seats} chỗ/ca</Text>
              <Text style={{ color: C.pri, fontWeight: '700', marginTop: 8 }}>Xem phòng…</Text>
            </View>
            <View style={[{ width: 96, height: 124, borderRadius: 14, backgroundColor: C.card, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, shadow]}>
              {item.photoUrl ? <Image source={{ uri: item.photoUrl }} style={{ width: '100%', height: '100%' }} />
                : <Text style={{ fontSize: 28, fontWeight: '800', color: C.pri }}>{item.name.slice(0, 2).toUpperCase()}</Text>}
            </View>
          </Press>
        )}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 6 }}>
        {rooms.map((r, i) => {
          const range = [(i - 1) * W, i * W, (i + 1) * W];
          return <Animated.View key={r.id} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.pri,
            opacity: x.interpolate({ inputRange: range, outputRange: [0.25, 1, 0.25], extrapolate: 'clamp' }),
            transform: [{ scaleX: x.interpolate({ inputRange: range, outputRange: [1, 2, 1], extrapolate: 'clamp' }) }] }} />;
        })}
      </View>
    </FadeIn>
  );
}
