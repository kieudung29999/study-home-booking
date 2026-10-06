import React, { useRef, useState } from 'react';
import { Alert, Animated, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { bookSlot } from '../api';
import { useBookingsOn, useRoomSlots, useRooms } from '../hooks';
import { useApp } from '../store';
import { RootStack } from '../types';
import { days, isOpenOn } from '../util';
import { Btn, C, Chip, FadeIn, IonName, Press, ProgressBar, shadow } from '../ui';
import { HeartButton } from '../components/RoomCard';

const HERO = 250;

const Info = ({ icon, label, value }: { icon: IonName; label: string; value: string }) => (
  <View style={[{ flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: C.ln }, shadow]}>
    <Ionicons name={icon} size={18} color={C.pri} />
    <Text style={{ color: C.mut, fontSize: 12, marginTop: 6 }}>{label}</Text>
    <Text style={{ color: C.tx, fontWeight: '700', marginTop: 2 }} numberOfLines={2}>{value}</Text>
  </View>
);

export default function RoomDetail({ route, navigation }: NativeStackScreenProps<RootStack, 'RoomDetail'>) {
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const { user, filters, setFilters, favs, toggleFav } = useApp();
  const room = useRooms().data?.find(r => r.id === route.params.roomId);
  const slotsQ = useRoomSlots(route.params.roomId);
  const slots = [...(slotsQ.data ?? [])].sort((a, b) => a.order - b.order);
  const bk = useBookingsOn(filters.date).data ?? [];
  const [pick, setPick] = useState<string[]>([]);
  const scrollY = useRef(new Animated.Value(0)).current;

  const book = useMutation({
    mutationFn: async () => {
      if (!room || !user) return { ok: 0, lost: 0, dup: 0 };
      // Different ca = different documents, so they can be booked in parallel (much faster than one by one).
      const res = await Promise.allSettled(pick.map(id => {
        const s = slots.find(x => x.id === id);
        return s ? bookSlot(room, filters.date, s, user) : Promise.resolve('closed' as const);
      }));
      let ok = 0, lost = 0, dup = 0;
      let failure: unknown;
      for (const r of res) {
        if (r.status === 'rejected') { lost++; failure ??= r.reason; }
        else if (r.value === 'ok' || r.value === 'bumped') ok++;
        else if (r.value === 'dup') dup++;
        else lost++;
      }
      if (!ok && failure) throw failure;      // everything failed with an error -> show the real message
      return { ok, lost, dup };
    },
    onSuccess: ({ ok, lost }) => {
      qc.invalidateQueries({ queryKey: ['bookings'] }); qc.invalidateQueries({ queryKey: ['my'] });
      setPick([]);
      if (ok && !lost) Alert.alert('Đặt phòng thành công', `Đã đặt ${ok} ca.`, [{ text: 'Xem lịch', onPress: () => navigation.navigate('Tabs', { screen: 'MyBookings' }) }, { text: 'Đóng' }]);
      else if (ok && lost) Alert.alert('Đặt một phần', `Đặt được ${ok} ca. ${lost} ca vừa hết chỗ.`);
      else Alert.alert('Không đặt được', 'Các ca bạn chọn đã hết chỗ hoặc bạn đã đặt rồi, hãy chọn ca khác.');
    },
    onError: (e: Error) => Alert.alert('Lỗi', e.message),
  });

  if (!room) return null;
  const today = days(1)[0].key;
  const noSlots = slotsQ.isSuccess && slots.length === 0;
  const openDays = room.openDates
    ? [...room.openDates].sort().filter(k => k >= today).map(k => ({ key: k, label: k === today ? 'Hôm nay' : new Date(k + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' }) }))
    : days(14);
  const closedToday = !isOpenOn(room, filters.date);
  const canBook = !room.locked && !noSlots && !closedToday;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Animated.ScrollView scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}>
        {/* Parallax hero */}
        <Animated.View style={{ height: HERO, backgroundColor: C.pri2, overflow: 'hidden', transform: [
          { translateY: scrollY.interpolate({ inputRange: [-HERO, 0, HERO], outputRange: [-HERO / 2, 0, HERO * 0.4], extrapolate: 'clamp' }) },
          { scale: scrollY.interpolate({ inputRange: [-HERO, 0], outputRange: [2, 1], extrapolateRight: 'clamp' }) }] }}>
          {room.photoUrl ? <Image source={{ uri: room.photoUrl }} style={{ width: '100%', height: '100%' }} />
            : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 56, fontWeight: '800', color: '#fff' }}>{room.name.slice(0, 2).toUpperCase()}</Text></View>}
        </Animated.View>

        <View style={{ marginTop: -26, backgroundColor: C.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 16, paddingTop: 20 }}>
          <FadeIn>
            <Text style={{ fontSize: 26, fontWeight: '800', color: C.tx }}>{room.name}</Text>
            {room.locked && <Text style={{ color: C.bad, fontWeight: '700', marginTop: 4 }}>Phòng đang bảo trì, không thể đặt.</Text>}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Info icon="location-outline" label="Vị trí" value={room.location || 'Chưa cập nhật'} />
              <Info icon="people-outline" label="Sức chứa / ca" value={`${room.seats} người`} />
              <Info icon="time-outline" label="Số ca" value={`${slots.length} ca`} />
            </View>
            <Text style={{ fontWeight: '700', color: C.tx, marginTop: 18, marginBottom: 4 }}>Mô tả</Text>
            <Text style={{ color: room.description ? C.tx : C.mut, lineHeight: 21 }}>{room.description || 'Phòng chưa có mô tả.'}</Text>
          </FadeIn>

          <Text style={{ fontWeight: '700', color: C.tx, marginTop: 18, marginBottom: 8 }}>Chọn ngày</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {openDays.map(d => <Chip key={d.key} label={d.label} on={filters.date === d.key} onPress={() => { setFilters({ date: d.key }); setPick([]); }} />)}
          </ScrollView>
          {openDays.length === 0 && <Text style={{ color: C.bad, marginTop: 6 }}>Phòng chưa mở ngày nào sắp tới.</Text>}
          {openDays.length > 0 && closedToday && <Text style={{ color: C.bad, marginTop: 8 }}>Phòng không mở ngày {filters.date}, hãy chọn ngày khác ở trên.</Text>}
          {noSlots && !room.locked && (
            <View style={{ backgroundColor: C.card, borderRadius: 16, padding: 14, marginTop: 12, borderWidth: 1, borderColor: C.ln }}>
              <Text style={{ color: C.tx, fontWeight: '700' }}>Phòng này chưa có ca</Text>
              <Text style={{ color: C.mut, marginTop: 4 }}>Admin cần vào Quản lý → mở phòng này → thêm ca trước khi đặt được.</Text>
            </View>
          )}

          {!room.locked && !closedToday && slots.length > 0 && (
            <View style={{ marginTop: 16, gap: 10 }}>
              <Text style={{ fontWeight: '700', color: C.tx }}>Chọn ca</Text>
              {slots.map((s, i) => {
                const inSlot = bk.filter(x => x.roomId === room.id && x.slotId === s.id);
                const mine = inSlot.some(x => x.uid === user?.uid);
                const left = room.seats - inSlot.length;
                const full = left <= 0;
                const on = pick.includes(s.id);
                const pct = inSlot.length / Math.max(1, room.seats);
                const barColor = full ? C.bad : pct >= 0.7 ? C.warn : C.ok;
                const names = inSlot.map(x => x.userName);
                // a lecturer may still take a seat in a full ca if a student is in it (priority)
                const bumpable = full && !mine && user?.role === 'lecturer' && inSlot.some(x => x.role === 'student');
                const disabled = mine || (full && !bumpable);
                return (
                  <FadeIn key={s.id} delay={i * 70}>
                    <Press disabled={disabled} scaleTo={0.98} onPress={() => setPick(p => on ? p.filter(x => x !== s.id) : [...p, s.id])}
                      style={[{ padding: 14, borderRadius: 18, borderWidth: 1.5, borderColor: on ? C.pri : mine ? C.ok : C.ln, backgroundColor: on ? C.pri : C.card, opacity: disabled && !mine ? 0.55 : 1 }, !on && shadow]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name={on ? 'checkmark-circle' : mine ? 'checkmark-done-circle' : 'time-outline'} size={20} color={on ? '#fff' : mine ? C.ok : C.pri} />
                          <Text style={{ color: on ? '#fff' : C.tx, fontWeight: '700', fontSize: 16, marginLeft: 8 }}>{s.label}</Text>
                        </View>
                        <Text style={{ color: on ? '#fff' : mine ? C.ok : full ? (bumpable ? C.warn : C.bad) : C.mut, fontWeight: '700' }}>
                          {mine ? 'Bạn đã đặt' : bumpable ? 'Ưu tiên GV' : full ? 'Hết chỗ' : `Còn ${left} chỗ`}
                        </Text>
                      </View>
                      <View style={{ marginTop: 10 }}><ProgressBar value={pct} color={on ? '#fff' : barColor} track={on ? '#ffffff55' : C.ln} /></View>
                      <Text style={{ color: on ? '#fff' : C.mut, fontSize: 12, marginTop: 6 }}>{inSlot.length}/{room.seats} người đã đặt</Text>
                      {names.length > 0 && (
                        <Text style={{ color: on ? '#fff' : C.mut, fontSize: 12, marginTop: 2 }} numberOfLines={2}>
                          {names.slice(0, 4).join(', ')}{names.length > 4 ? ` +${names.length - 4}` : ''}
                        </Text>
                      )}
                    </Press>
                  </FadeIn>
                );
              })}
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* Floating controls */}
      <View style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
        <HeartButton on={favs.includes(room.id)} onPress={() => toggleFav(room.id)} size={38} />
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFDF8E6', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="close" size={22} color={C.tx} />
        </Pressable>
      </View>

      {/* Sticky confirm bar */}
      <View style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 12), flexDirection: 'row', alignItems: 'center' }, shadow]}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.mut, fontSize: 12 }}>{filters.date}</Text>
          <Text style={{ color: C.tx, fontWeight: '800', fontSize: 16 }}>{pick.length} ca đã chọn</Text>
        </View>
        <View style={{ flex: 1.2 }}>
          <Btn label={book.isPending ? 'Đang đặt…' : 'Xác nhận đặt'} icon="checkmark-circle-outline" disabled={book.isPending || !canBook}
            onPress={() => pick.length ? book.mutate() : Alert.alert('Chưa chọn ca', 'Chọn ít nhất 1 ca trước khi xác nhận.')} />
        </View>
      </View>
    </View>
  );
}
