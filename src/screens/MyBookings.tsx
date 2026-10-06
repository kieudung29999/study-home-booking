import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { cancelBooking, dismissNotice } from '../api';
import { useMyBookings, useNotices } from '../hooks';
import { useApp } from '../store';
import { Booking } from '../types';
import { iso } from '../util';
import { Btn, C, Empty, FadeIn, Press, Sheet, TextTabs, Title, shadow } from '../ui';

const ROLE = { admin: 'Quản trị viên', lecturer: 'Giảng viên', student: 'Sinh viên' } as const;
type Tab = 'up' | 'past';
const TABS: ReadonlyArray<readonly [Tab, string]> = [['up', 'Sắp tới'], ['past', 'Đã qua']];
const MONTH = (d: string) => `Th${+d.slice(5, 7)}`;

export default function MyBookings() {
  const uid = useApp(s => s.user!.uid);
  const qc = useQueryClient();
  const q = useMyBookings(uid);
  const del = useMutation({ mutationFn: cancelBooking, onSuccess: () => qc.invalidateQueries() });
  const notices = useNotices(uid);
  const [sel, setSel] = useState<Booking | null>(null);
  const [tab, setTab] = useState<Tab>('up');

  const data = useMemo(() => {
    const today = iso(new Date());
    const sorted = [...(q.data ?? [])].sort((a, b) => (a.date + a.slotLabel).localeCompare(b.date + b.slotLabel));
    return tab === 'up' ? sorted.filter(b => b.date >= today) : sorted.filter(b => b.date < today).reverse();
  }, [q.data, tab]);

  const doCancel = (b: Booking) => Alert.alert('Huỷ đặt phòng?', `${b.roomName} · ${b.date} · ${b.slotLabel}`, [
    { text: 'Không' },
    { text: 'Huỷ', style: 'destructive', onPress: () => { del.mutate(b.id); setSel(null); } },
  ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <Title>Phòng đã đặt</Title>
      <TextTabs items={TABS} value={tab} onChange={setTab} />
      {(notices.data ?? []).map(n => (
        <FadeIn key={n.id} style={{ marginHorizontal: 16, marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.bad }}>
          <View style={{ flexDirection: 'row' }}>
            <Ionicons name="alert-circle" size={20} color={C.bad} />
            <Text style={{ color: C.tx, flex: 1, marginLeft: 8 }}>{n.text}</Text>
          </View>
          <Pressable onPress={() => dismissNotice(n.id).then(() => notices.refetch())} style={{ marginTop: 6, alignSelf: 'flex-end' }}><Text style={{ color: C.pri, fontWeight: '700' }}>Đã hiểu</Text></Pressable>
        </FadeIn>
      ))}
      <FlatList data={data} keyExtractor={b => b.id} contentContainerStyle={{ padding: 16 }} refreshing={q.isFetching} onRefresh={() => q.refetch()}
        ListEmptyComponent={<Empty icon="calendar-outline" title={tab === 'up' ? 'Chưa có lịch sắp tới' : 'Chưa có lịch đã qua'} hint="Vào Trang chủ để chọn phòng và đặt ca." />}
        renderItem={({ item: b, index }) => (
          <FadeIn delay={Math.min(index, 8) * 60}>
            <Press onPress={() => setSel(b)} scaleTo={0.98} style={[{ backgroundColor: C.card, borderRadius: 18, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.ln }, shadow]}>
              <View style={{ width: 54, height: 58, borderRadius: 14, backgroundColor: tab === 'up' ? C.soft : C.ln, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: tab === 'up' ? C.pri : C.mut }}>{b.date.slice(8)}</Text>
                <Text style={{ fontSize: 11, color: C.mut, fontWeight: '600' }}>{MONTH(b.date)}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: '700', color: C.tx, fontSize: 15 }} numberOfLines={1}>{b.roomName}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                  <Ionicons name="time-outline" size={14} color={C.mut} />
                  <Text style={{ color: C.mut, marginLeft: 4 }}>{b.slotLabel}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={C.none} />
            </Press>
          </FadeIn>
        )} />

      <Sheet visible={!!sel} onClose={() => setSel(null)}>
        {sel && (
          <View style={{ padding: 20, paddingBottom: 32 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: C.tx }}>{sel.roomName}</Text>
            <View style={{ marginTop: 14, gap: 4 }}>
              <Text style={{ color: C.mut }}>Ngày</Text><Text style={{ color: C.tx, fontSize: 16 }}>{sel.date}</Text>
              <Text style={{ color: C.mut, marginTop: 8 }}>Ca</Text><Text style={{ color: C.tx, fontSize: 16 }}>{sel.slotLabel}</Text>
              <Text style={{ color: C.mut, marginTop: 8 }}>Người đặt</Text><Text style={{ color: C.tx, fontSize: 16 }}>{sel.userName} ({ROLE[sel.role]})</Text>
              <Text style={{ color: C.mut, marginTop: 8 }}>Mã đặt phòng</Text><Text style={{ color: C.mut, fontSize: 12 }}>{sel.id}</Text>
            </View>
            {sel.date >= iso(new Date()) && <Btn kind="danger" icon="trash-outline" label="Huỷ đặt phòng" onPress={() => doCancel(sel)} />}
            <Btn kind="ghost" label="Đóng" onPress={() => setSel(null)} />
          </View>
        )}
      </Sheet>
    </SafeAreaView>
  );
}
