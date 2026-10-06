import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Filters, useApp } from '../store';
import { days } from '../util';
import { Btn, C, Chip, Sheet } from '../ui';

type Opt<K extends string> = ReadonlyArray<readonly [K, string]>;
const STATUS: Opt<Filters['status']> = [['all', 'Tất cả'], ['available', 'Còn trống'], ['full', 'Hết chỗ']];
const SIZE: Opt<Filters['size']> = [['all', 'Mọi cỡ'], ['s', '≤10 chỗ'], ['m', '11–30 chỗ'], ['l', '>30 chỗ']];
const SORT: Opt<Filters['sort']> = [['default', 'Mặc định'], ['name', 'Tên A–Z'], ['free', 'Nhiều ca trống'], ['seats', 'Nhiều chỗ nhất']];

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={{ marginTop: 14 }}>
    <Text style={{ fontWeight: '700', color: C.tx, marginBottom: 8 }}>{title}</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 }}>{children}</View>
  </View>
);

/** Multi-parameter filter: status, size, sort, favourites and date — all applied instantly. */
export function FilterSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { filters: f, setFilters, resetFilters } = useApp();
  const row = <K extends string>(opts: Opt<K>, cur: K, set: (k: K) => void) => opts.map(([k, l]) => <Chip key={k} label={l} on={cur === k} onPress={() => set(k)} />);
  return (
    <Sheet visible={visible} onClose={onClose}>
      <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ padding: 20, paddingBottom: 30 }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: C.tx }}>Bộ lọc</Text>
        <Section title="Ngày">{days(14).map(d => <Chip key={d.key} label={d.label} on={f.date === d.key} onPress={() => setFilters({ date: d.key })} />)}</Section>
        <Section title="Trạng thái">{row(STATUS, f.status, status => setFilters({ status }))}</Section>
        <Section title="Kích cỡ phòng">{row(SIZE, f.size, size => setFilters({ size }))}</Section>
        <Section title="Sắp xếp">{row(SORT, f.sort, sort => setFilters({ sort }))}</Section>
        <Section title="Khác"><Chip label="Chỉ phòng yêu thích" on={f.favOnly} onPress={() => setFilters({ favOnly: !f.favOnly })} /></Section>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <View style={{ flex: 1 }}><Btn kind="ghost" label="Đặt lại" onPress={resetFilters} /></View>
          <View style={{ flex: 1 }}><Btn label="Xong" onPress={onClose} /></View>
        </View>
      </ScrollView>
    </Sheet>
  );
}
