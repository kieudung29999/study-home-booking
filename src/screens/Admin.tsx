import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addSlot, cancelBooking, createAccount, getSlotsForRoom, pickImage, removeSlot, renameSlot,
  deleteRoom, saveRoom, seedDefaultSlots, setUserFlags, uploadImage,
} from '../api';
import { useAllBookings, useRooms, useUsers } from '../hooks';
import { useApp } from '../store';
import { Booking, Role, Room } from '../types';
import { days, iso } from '../util';
import { CalendarPicker } from '../calendar';
import { Btn, C, Chip, FadeIn, Field, Title, shadow } from '../ui';

const Box = ({ children }: { children: React.ReactNode }) => <FadeIn style={[{ backgroundColor: C.card, borderRadius: 18, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: C.ln }, shadow]}>{children}</FadeIn>;
const err = (e: unknown) => Alert.alert('Lỗi', (e as Error).message);

/** One row for an existing ca: inline rename (saves on blur if changed) + remove. */
function SlotRow({ roomId, slot, done }: { roomId: string; slot: { id: string; label: string }; done: () => void }) {
  const [label, setLabel] = useState(slot.label);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 }}>
      <Field value={label} onChangeText={setLabel} style={{ flex: 1, marginBottom: 0 }}
        onBlur={() => { if (label.trim() && label !== slot.label) renameSlot(slot.id, label.trim()).then(done).catch(err); }} />
      <Btn kind="danger" label="Xoá" onPress={() => removeSlot(roomId, slot.id).then(done).catch(err)} />
    </View>
  );
}

/** Everything about one room lives here: photo, name, description, size, and its own ca list —
 *  one combined form, not separate "Phòng" / "Ca" tabs. */
function RoomEditor({ room, startOpen, done }: { room: Room; startOpen?: boolean; done: () => void }) {
  const [open, setOpen] = useState(!!startOpen);
  const [name, setName] = useState(room.name);
  const [desc, setDesc] = useState(room.description ?? '');
  const [loc, setLoc] = useState(room.location);
  const [seats, setSeats] = useState(String(room.seats));
  const [photo, setPhoto] = useState(room.photoUrl);
  const [newCa, setNewCa] = useState('');
  const [openDates, setOpenDates] = useState<string[]>(room.openDates ?? days(14).map(d => d.key));
  const [calOpen, setCalOpen] = useState(false);
  const todayKey = iso(new Date());
  const upcoming = openDates.filter(k => k >= todayKey);
  const qc = useQueryClient();

  const slotsQ = useQuery({ queryKey: ['slots', room.id], queryFn: () => getSlotsForRoom(room.id), enabled: open });
  const slots = [...(slotsQ.data ?? [])].sort((a, b) => a.order - b.order);
  const refreshSlots = () => { qc.invalidateQueries({ queryKey: ['slots', room.id] }); qc.invalidateQueries({ queryKey: ['rooms'] }); };

  const photoPick = async () => { try { const uri = await pickImage(); if (uri) setPhoto(await uploadImage(`rooms/${room.id}`, uri)); } catch (e) { err(e); } };
  const save = (locked = room.locked) => saveRoom({ id: room.id, name, description: desc, location: loc, seats: Math.max(1, +seats || 1), photoUrl: photo, locked, openDates })
    .then(() => { done(); Alert.alert('Đã lưu phòng'); }).catch(err);
  const remove = () => Alert.alert('Xoá phòng?', `Xoá "${room.name}" cùng toàn bộ ca và lượt đặt của phòng này. Không hoàn tác được.`, [
    { text: 'Không' },
    { text: 'Xoá', style: 'destructive', onPress: () => deleteRoom(room.id).then(done).catch(err) },
  ]);
  const addCa = () => { if (!newCa.trim()) return; addSlot(room.id, newCa.trim()).then(() => { setNewCa(''); refreshSlots(); }).catch(err); };

  return (
    <Box>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {room.photoUrl ? <Image source={{ uri: room.photoUrl }} style={{ width: 52, height: 52, borderRadius: 10 }} />
          : <View style={{ width: 52, height: 52, borderRadius: 10, backgroundColor: C.pri2, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>{room.name.slice(0, 2).toUpperCase()}</Text>
            </View>}
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700', color: C.tx }}>{room.name}{room.locked ? ' (bảo trì)' : ''}</Text>
          <Text style={{ color: C.mut, fontSize: 13 }}>{room.location} · {room.seats} chỗ/ca · {room.slotCount ?? 0} ca · {room.openDates ? `${room.openDates.length} ngày mở` : 'mở mọi ngày'}</Text>
        </View>
        <Btn kind="ghost" label={open ? 'Thu gọn' : 'Chỉnh sửa'} onPress={() => setOpen(o => !o)} />
      </View>

      {open && (
        <View style={{ marginTop: 12 }}>
          {photo ? <Image source={{ uri: photo }} style={{ height: 120, borderRadius: 12, marginBottom: 8 }} /> : null}
          <Btn kind="ghost" label="Upload ảnh phòng" onPress={photoPick} />
          <Field value={name} onChangeText={setName} placeholder="Tên phòng" autoCapitalize="words" />
          <Field value={desc} onChangeText={setDesc} placeholder="Mô tả phòng (tiện ích, ghi chú...)" multiline style={{ minHeight: 70, textAlignVertical: 'top' }} />
          <Field value={loc} onChangeText={setLoc} placeholder="Vị trí" autoCapitalize="words" />
          <Field value={seats} onChangeText={setSeats} keyboardType="number-pad" placeholder="Số chỗ tối đa mỗi ca" />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: C.tx }}>Khoá bảo trì</Text><Switch value={room.locked} onValueChange={v => save(v)} />
          </View>
          <Text style={{ fontWeight: '700', color: C.tx, marginTop: 8, marginBottom: 4 }}>Ngày mở phòng</Text>
          <Text style={{ color: C.mut, fontSize: 12, marginBottom: 8 }}>Bấm nút bên dưới để mở lịch, chọn 1 hoặc nhiều ngày. Nhớ bấm "Lưu thông tin phòng".</Text>
          <Btn kind="ghost" label={upcoming.length ? `Mở lịch chọn ngày (${upcoming.length} ngày)` : 'Mở lịch chọn ngày'} onPress={() => setCalOpen(true)} />
          {upcoming.length > 0
            ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 }}>
                {upcoming.map(k => <View key={k} style={{ backgroundColor: C.pri, borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10 }}><Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{k.slice(8)}/{k.slice(5, 7)}</Text></View>)}
              </View>
            : <Text style={{ color: C.bad, marginVertical: 8 }}>Chưa chọn ngày nào, người dùng sẽ không đặt được.</Text>}
          <CalendarPicker visible={calOpen} selected={openDates} onChange={setOpenDates} onClose={() => setCalOpen(false)} />
          <Btn label="Lưu thông tin phòng" onPress={() => save()} />

          <Text style={{ fontWeight: '700', color: C.tx, marginTop: 16, marginBottom: 8 }}>Ca đặt phòng</Text>
          {slotsQ.isLoading && <Text style={{ color: C.mut }}>Đang tải…</Text>}
          {slots.map(s => <SlotRow key={s.id} roomId={room.id} slot={s} done={refreshSlots} />)}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Field value={newCa} onChangeText={setNewCa} placeholder="VD: 07:00–09:00" style={{ flex: 1, marginBottom: 0 }} />
            <Btn label="Thêm" onPress={addCa} />
          </View>
          {!slotsQ.isLoading && slots.length === 0 && (
            <Btn kind="ghost" label="Tạo 5 ca mặc định" onPress={() => seedDefaultSlots(room.id).then(refreshSlots).catch(err)} />
          )}
          <Btn kind="danger" label="Xoá phòng này" onPress={remove} />
        </View>
      )}
    </Box>
  );
}

/** Bookings grouped by room → ca, filterable by date and room. */
function BookingsTab({ bookings, rooms, onCancel }: { bookings: Booking[]; rooms: Room[]; onCancel: (id: string) => void }) {
  const [date, setDate] = useState<string>(days(1)[0].key);
  const [typed, setTyped] = useState('');
  const [roomId, setRoomId] = useState<string>('all');
  const seats = new Map(rooms.map(r => [r.id, r.seats]));
  const list = bookings.filter(b => (date === 'all' || b.date === date) && (roomId === 'all' || b.roomId === roomId));
  // group: roomName -> slotLabel(date) -> bookings
  const groups = new Map<string, Booking[]>();
  list.forEach(b => { const k = `${b.date}|${b.roomId}|${b.slotId}`; groups.set(k, [...(groups.get(k) ?? []), b]); });
  const rows = [...groups.values()].sort((a, b) => (a[0].date + a[0].roomName + a[0].slotLabel).localeCompare(b[0].date + b[0].roomName + b[0].slotLabel));
  const pickTyped = (t: string) => { setTyped(t); if (/^\d{4}-\d{2}-\d{2}$/.test(t)) setDate(t); };
  return (
    <>
      <Text style={{ color: C.mut, marginBottom: 6 }}>Ngày</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        <Chip label="Tất cả" on={date === 'all'} onPress={() => { setDate('all'); setTyped(''); }} />
        {days(7).map(d => <Chip key={d.key} label={d.label} on={date === d.key} onPress={() => { setDate(d.key); setTyped(''); }} />)}
      </ScrollView>
      <Field value={typed} onChangeText={pickTyped} placeholder="Hoặc nhập ngày: YYYY-MM-DD (VD: 2026-10-08)" keyboardType="numbers-and-punctuation" />
      <Text style={{ color: C.mut, marginBottom: 6 }}>Phòng</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <Chip label="Tất cả" on={roomId === 'all'} onPress={() => setRoomId('all')} />
        {rooms.map(r => <Chip key={r.id} label={r.name} on={roomId === r.id} onPress={() => setRoomId(r.id)} />)}
      </ScrollView>
      <Text style={{ color: C.mut, marginBottom: 8 }}>{list.length} lượt đặt{date !== 'all' ? ` · ${date}` : ''}</Text>
      {rows.length === 0 && <Text style={{ color: C.mut }}>Không có lượt đặt nào.</Text>}
      {rows.map(g => {
        const h = g[0];
        return (
          <Box key={`${h.date}${h.roomId}${h.slotId}`}>
            <Text style={{ fontWeight: '700', color: C.tx }}>{h.roomName} · {h.slotLabel}</Text>
            <Text style={{ color: C.mut, marginBottom: 6 }}>{h.date} · {g.length}/{seats.get(h.roomId) ?? '?'} người</Text>
            {g.map(b => (
              <View key={b.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={{ color: C.tx, flex: 1 }}>{b.userName} <Text style={{ color: C.mut }}>({b.role})</Text></Text>
                <Pressable onPress={() => onCancel(b.id)} hitSlop={8}><Text style={{ color: C.bad, fontWeight: '700' }}>Huỷ</Text></Pressable>
              </View>
            ))}
          </Box>
        );
      })}
    </>
  );
}

function NewUser({ done }: { done: () => void }) {
  const [n, setN] = useState(''), [e, setE] = useState(''), [p, setP] = useState(''), [r, setR] = useState<Role>('student');
  const go = () => n && e && p.length >= 6 ? createAccount(n, e, p, r).then(() => { setN(''); setE(''); setP(''); done(); }).catch(err) : Alert.alert('Điền đủ, mật khẩu ≥ 6 ký tự');
  return (
    <Box><Text style={{ fontWeight: '700', marginBottom: 8, color: C.tx }}>Thêm tài khoản</Text>
      <Field placeholder="Họ tên" value={n} onChangeText={setN} autoCapitalize="words" /><Field placeholder="Email" value={e} onChangeText={setE} keyboardType="email-address" />
      <Field placeholder="Mật khẩu" secureTextEntry value={p} onChangeText={setP} />
      <View style={{ flexDirection: 'row' }}>{(['student', 'lecturer', 'admin'] as Role[]).map(x => <Chip key={x} label={x} on={r === x} onPress={() => setR(x)} />)}</View>
      <Btn label="Tạo tài khoản" onPress={go} /></Box>
  );
}

export default function Admin() {
  const [tab, setTab] = useState<'r' | 'u' | 'b'>('r');
  const [justCreated, setJustCreated] = useState<string | null>(null);
  const qc = useQueryClient(), me = useApp(s => s.user!);
  const rooms = useRooms(), users = useUsers(), all = useAllBookings();
  const refresh = () => qc.invalidateQueries();
  const cancel = useMutation({ mutationFn: cancelBooking, onSuccess: refresh });

  const addRoom = () => saveRoom({}).then(id => { refresh(); setJustCreated(id); }).catch(err);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <Title>Quản lý</Title>
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8 }}>
        {([['r', 'Phòng'], ['u', 'Tài khoản'], ['b', 'Lịch đặt']] as const).map(([k, l]) => <Chip key={k} label={l} on={tab === k} onPress={() => setTab(k)} />)}
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {tab === 'r' && <>
          <Text style={{ color: C.mut, marginBottom: 10 }}>Bấm "Chỉnh sửa" để đổi ảnh, mô tả và quản lý ca của từng phòng.</Text>
          {rooms.data?.map(r => <RoomEditor key={r.id} room={r} startOpen={r.id === justCreated} done={refresh} />)}
          <Btn label="+ Thêm phòng mới" onPress={addRoom} />
        </>}
        {tab === 'u' && <>{users.data?.map(u => (
          <Box key={u.uid}><Text style={{ fontWeight: '700', color: C.tx }}>{u.name}{u.disabled ? ' (đã khoá)' : ''}</Text><Text style={{ color: C.mut }}>{u.email} · {u.role}</Text>
            {u.uid !== me.uid && <Btn kind={u.disabled ? 'ghost' : 'danger'} label={u.disabled ? 'Mở khoá' : 'Khoá tài khoản'} onPress={() => setUserFlags(u.uid, { disabled: !u.disabled }).then(refresh)} />}</Box>))}
          <NewUser done={refresh} /></>}
        {tab === 'b' && <BookingsTab bookings={all.data ?? []} rooms={rooms.data ?? []} onCancel={id => cancel.mutate(id)} />}
      </ScrollView>
    </SafeAreaView>
  );
}
