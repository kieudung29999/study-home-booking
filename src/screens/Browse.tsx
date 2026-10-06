import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useBookingsOn, useMyBookings, useNotices, useRooms } from '../hooks';
import { Filters, useApp } from '../store';
import { RoomItem, TabScreenNav } from '../types';
import { days, iso, isOpenOn } from '../util';
import { Avatar, Btn, C, Chip, Empty, FadeIn, SearchBar, Skeleton, TextTabs } from '../ui';
import { RoomCard } from '../components/RoomCard';
import { FeaturedCarousel } from '../components/FeaturedCarousel';
import { FilterSheet } from '../components/FilterSheet';
import { UpcomingCard } from '../components/UpcomingCard';

const STATUS_TABS: ReadonlyArray<readonly [Filters['status'], string]> = [['all', 'Tất cả'], ['available', 'Còn trống'], ['full', 'Hết chỗ']];
const SIZE_OK = { all: () => true, s: (n: number) => n <= 10, m: (n: number) => n > 10 && n <= 30, l: (n: number) => n > 30 } as const;
const GAP = 12;

export default function Browse() {
  const nav = useNavigation<TabScreenNav<'Browse'>>();
  const { width } = useWindowDimensions();
  const cardW = (width - 32 - GAP) / 2;
  const { filters: f, setFilters, resetFilters, user, favs, toggleFav } = useApp();
  const [q, setQ] = useState(f.q);
  const [sheet, setSheet] = useState(false);
  useEffect(() => { const t = setTimeout(() => setFilters({ q }), 200); return () => clearTimeout(t); }, [q, setFilters]);
  useEffect(() => { if (f.q === '' && q !== '') setQ(''); }, [f.q]); // eslint-disable-line react-hooks/exhaustive-deps -- "Đặt lại" clears the box

  const rooms = useRooms(), bk = useBookingsOn(f.date);
  const mine = useMyBookings(user!.uid), notices = useNotices(user!.uid);

  /** Rooms with per-date availability. Recomputed only when rooms / bookings / filters change. */
  const all = useMemo<RoomItem[]>(() => {
    const perSlot = new Map<string, number>(), perRoom = new Map<string, number>();
    bk.data?.forEach(b => {
      const k = `${b.roomId}|${b.slotId}`;
      perSlot.set(k, (perSlot.get(k) ?? 0) + 1);
      perRoom.set(b.roomId, (perRoom.get(b.roomId) ?? 0) + 1);
    });
    return (rooms.data ?? []).map(r => {
      const total = r.slotCount ?? 0;
      let fullCa = 0;
      perSlot.forEach((n, key) => { if (key.startsWith(r.id + '|') && n >= r.seats) fullCa++; });
      return { ...r, closed: !isOpenOn(r, f.date), total, booked: perRoom.get(r.id) ?? 0, free: r.locked ? 0 : total - fullCa };
    });
  }, [rooms.data, bk.data, f.date]);

  const data = useMemo<RoomItem[]>(() => {
    const k = f.q.trim().toLowerCase();
    const out = all.filter(r => {
      if (k && !`${r.name} ${r.location}`.toLowerCase().includes(k)) return false;
      if (!SIZE_OK[f.size](r.seats)) return false;
      if (f.favOnly && !favs.includes(r.id)) return false;
      const noSlots = (r.total === 0 || r.closed) && !r.locked;
      const full = !noSlots && (r.locked || r.free === 0);
      if (f.status === 'available') return !full && !noSlots;
      if (f.status === 'full') return full;
      return true;
    });
    if (f.sort === 'name') out.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    else if (f.sort === 'free') out.sort((a, b) => b.free - a.free);
    else if (f.sort === 'seats') out.sort((a, b) => b.seats - a.seats);
    return out;
  }, [all, f, favs]);

  const featured = useMemo(() => all.filter(r => !r.locked && !r.closed && r.free > 0)
    .sort((a, b) => b.booked - a.booked || b.seats - a.seats).slice(0, 4), [all]);

  const next = useMemo(() => {
    const today = iso(new Date());
    return [...(mine.data ?? [])].filter(b => b.date >= today).sort((a, b) => (a.date + a.slotLabel).localeCompare(b.date + b.slotLabel))[0];
  }, [mine.data]);

  const activeFilters = (f.status !== 'all' ? 1 : 0) + (f.size !== 'all' ? 1 : 0) + (f.sort !== 'default' ? 1 : 0) + (f.favOnly ? 1 : 0);
  const open = useCallback((roomId: string) => nav.navigate('RoomDetail', { roomId }), [nav]);
  const refresh = () => { rooms.refetch(); bk.refetch(); mine.refetch(); };

  const header = (
    <View>
      {!f.q && !f.favOnly && <FeaturedCarousel rooms={featured} onOpen={open} />}
      {!!next && !f.q && (
        <FadeIn delay={120} style={{ paddingHorizontal: 16, marginTop: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: C.tx }}>Lịch sắp tới</Text>
            <Pressable onPress={() => nav.navigate('MyBookings')}><Text style={{ color: C.pri, fontWeight: '600' }}>Xem tất cả ›</Text></Pressable>
          </View>
          <UpcomingCard b={next} onPress={() => nav.navigate('MyBookings')} />
        </FadeIn>
      )}
      <View style={{ marginTop: 18 }}>
        <TextTabs items={STATUS_TABS} value={f.status} onChange={status => setFilters({ status })} />
      </View>
      <FlatList horizontal data={days(14)} keyExtractor={d => d.key} showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        renderItem={({ item: d }) => <Chip label={d.label} on={f.date === d.key} onPress={() => setFilters({ date: d.key })} />} />
      <Text style={{ paddingHorizontal: 16, marginBottom: 10, color: C.mut }}>{data.length} phòng · {f.date}</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10 }}>
        <Avatar uri={user?.avatarUrl} name={user?.name ?? '?'} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={{ fontWeight: '800', color: C.tx, fontSize: 16 }} numberOfLines={1}>{user?.name}</Text>
          <Text style={{ color: C.mut, fontSize: 12 }} numberOfLines={1}>{user?.email}</Text>
        </View>
        <Pressable onPress={() => setFilters({ favOnly: !f.favOnly })} style={hdrBtn}>
          <Ionicons name={f.favOnly ? 'heart' : 'heart-outline'} size={20} color={f.favOnly ? C.bad : C.tx} />
        </Pressable>
        <Pressable onPress={() => nav.navigate('MyBookings')} style={[hdrBtn, { marginLeft: 8 }]}>
          <Ionicons name="notifications-outline" size={20} color={C.tx} />
          {!!notices.data?.length && <View style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: C.bad, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{notices.data.length}</Text></View>}
        </Pressable>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
        <SearchBar value={q} onChangeText={setQ} placeholder="Tìm phòng, tòa nhà…" onFilter={() => setSheet(true)} badge={activeFilters} />
      </View>

      {rooms.isLoading ? (
        <View style={{ padding: 16, gap: 12 }}>
          <Skeleton style={{ height: 150, borderRadius: 24 }} />
          <View style={{ flexDirection: 'row', gap: GAP }}><Skeleton style={{ width: cardW, height: 200 }} /><Skeleton style={{ width: cardW, height: 200 }} /></View>
        </View>
      ) : (
        <FlatList data={data} keyExtractor={r => r.id} numColumns={2}
          columnWrapperStyle={{ paddingHorizontal: 16, justifyContent: 'space-between' }}
          ListHeaderComponent={header}
          renderItem={({ item, index }) => <RoomCard r={item} width={cardW} index={index} fav={favs.includes(item.id)} onPress={open} onFav={toggleFav} />}
          initialNumToRender={8} windowSize={7} removeClippedSubviews contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={bk.isFetching && !bk.isLoading} onRefresh={refresh} tintColor={C.pri} colors={[C.pri]} />}
          ListEmptyComponent={<Empty icon="search" title="Không có phòng phù hợp" hint="Thử đổi ngày hoặc bỏ bớt bộ lọc."
            action={<View style={{ width: 180 }}><Btn kind="ghost" label="Xoá bộ lọc" onPress={() => { resetFilters(); setQ(''); }} /></View>} />} />
      )}
      <FilterSheet visible={sheet} onClose={() => setSheet(false)} />
    </SafeAreaView>
  );
}

const hdrBtn = { width: 40, height: 40, borderRadius: 20, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.ln } as const;
