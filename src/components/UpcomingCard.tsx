import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Booking } from '../types';
import { C, Press, shadow } from '../ui';
import { iso } from '../util';

const daysLeft = (date: string) => Math.round((new Date(date + 'T00:00:00').getTime() - new Date(iso(new Date()) + 'T00:00:00').getTime()) / 86400000);

/** "Next booking" strip shown on the home screen. */
export function UpcomingCard({ b, onPress }: { b: Booking; onPress: () => void }) {
  const d = daysLeft(b.date);
  return (
    <Press onPress={onPress} scaleTo={0.98} style={[{ backgroundColor: C.card, borderRadius: 18, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.ln }, shadow]}>
      <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="calendar" size={22} color={C.pri} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontWeight: '700', color: C.tx }} numberOfLines={1}>{b.roomName}</Text>
        <Text style={{ color: C.mut, marginTop: 2 }}>{b.date} · {b.slotLabel}</Text>
      </View>
      <View style={{ backgroundColor: d === 0 ? C.ok : C.soft, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
        <Text style={{ color: d === 0 ? '#fff' : C.pri, fontWeight: '800', fontSize: 12 }}>{d === 0 ? 'Hôm nay' : `Còn ${d} ngày`}</Text>
      </View>
    </Press>
  );
}
