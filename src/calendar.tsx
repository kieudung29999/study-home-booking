import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, Press, Sheet } from './ui';
import { iso } from './util';

const WD = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/** Month calendar in a bottom sheet. Tap days to toggle them (one or many). Past days are disabled. */
export function CalendarPicker({ visible, selected, onChange, onClose }: { visible: boolean; selected: string[]; onChange: (v: string[]) => void; onClose: () => void }) {
  const todayKey = iso(new Date());
  const first = [...selected].sort().find(k => k >= todayKey) ?? todayKey;
  const [cur, setCur] = useState(() => ({ y: +first.slice(0, 4), m: +first.slice(5, 7) - 1 }));
  const move = (n: number) => setCur(c => { const d = new Date(c.y, c.m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });

  const daysInMonth = new Date(cur.y, cur.m + 1, 0).getDate();
  const offset = (new Date(cur.y, cur.m, 1).getDay() + 6) % 7; // Monday first
  const keys = Array.from({ length: daysInMonth }, (_, i) => iso(new Date(cur.y, cur.m, i + 1)));
  const usable = keys.filter(k => k >= todayKey);
  const cells: (string | null)[] = [...Array(offset).fill(null), ...keys];
  const toggle = (k: string) => onChange(selected.includes(k) ? selected.filter(x => x !== k) : [...selected, k].sort());
  const monthAll = usable.length > 0 && usable.every(k => selected.includes(k));

  return (
    <Sheet visible={visible} onClose={onClose}>
        <View style={{ padding: 16, paddingBottom: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Pressable onPress={() => move(-1)} hitSlop={10}><Ionicons name="chevron-back" size={24} color={C.tx} /></Pressable>
            <Text style={{ fontSize: 17, fontWeight: '800', color: C.tx }}>Tháng {cur.m + 1}/{cur.y}</Text>
            <Pressable onPress={() => move(1)} hitSlop={10}><Ionicons name="chevron-forward" size={24} color={C.tx} /></Pressable>
          </View>
          <View style={{ flexDirection: 'row' }}>
            {WD.map(w => <Text key={w} style={{ width: '14.285%', textAlign: 'center', color: C.mut, fontSize: 12, marginBottom: 6 }}>{w}</Text>)}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {cells.map((k, i) => {
              if (!k) return <View key={`e${i}`} style={{ width: '14.285%', height: 42 }} />;
              const past = k < todayKey, on = selected.includes(k), today = k === todayKey;
              return (
                <Pressable key={k} disabled={past} onPress={() => toggle(k)} style={{ width: '14.285%', height: 42, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? C.pri : 'transparent', borderWidth: today && !on ? 1.5 : 0, borderColor: C.pri }}>
                    <Text style={{ color: on ? '#fff' : past ? C.ln : C.tx, fontWeight: on || today ? '700' : '400' }}>{+k.slice(8)}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <Pressable style={{ flex: 1, padding: 11, borderRadius: 12, borderWidth: 1, borderColor: C.ln, alignItems: 'center' }}
              onPress={() => onChange(monthAll ? selected.filter(k => !usable.includes(k)) : [...new Set([...selected, ...usable])].sort())}>
              <Text style={{ color: C.tx, fontWeight: '600' }}>{monthAll ? 'Bỏ cả tháng' : 'Chọn cả tháng'}</Text>
            </Pressable>
            <Pressable style={{ flex: 1, padding: 11, borderRadius: 12, borderWidth: 1, borderColor: C.ln, alignItems: 'center' }} onPress={() => onChange([])}>
              <Text style={{ color: C.bad, fontWeight: '600' }}>Xoá hết</Text>
            </Pressable>
          </View>
          <Text style={{ color: C.mut, textAlign: 'center', marginTop: 10 }}>Đã chọn {selected.filter(k => k >= todayKey).length} ngày</Text>
          <Press onPress={onClose} style={{ backgroundColor: C.pri, borderRadius: 16, padding: 14, alignItems: 'center', marginTop: 10 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Xong</Text>
          </Press>
        </View>
    </Sheet>
  );
}
