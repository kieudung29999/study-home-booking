import { DocumentReference, Query, addDoc, collection, deleteDoc, doc, getDoc, getDocs, increment, orderBy, query, runTransaction, serverTimestamp, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updatePassword, sendPasswordResetEmail } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { auth, authCreator, db } from './firebase';
import { Booking, Role, Room, Slot, UserDoc } from './types';

const list = async <T,>(q: Query) => (await getDocs(q)).docs.map(d => ({ ...(d.data() as object), id: d.id }) as T);

// ---------- Auth error messages ----------
const AUTH_ERR: Record<string, string> = {
  'auth/invalid-email': 'Email không hợp lệ.',
  'auth/user-not-found': 'Không tìm thấy tài khoản với email này.',
  'auth/wrong-password': 'Sai mật khẩu.',
  'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
  'auth/email-already-in-use': 'Email này đã được đăng ký.',
  'auth/weak-password': 'Mật khẩu quá yếu (tối thiểu 6 ký tự).',
  'auth/too-many-requests': 'Bạn thử sai quá nhiều lần, vui lòng thử lại sau.',
  'auth/network-request-failed': 'Lỗi mạng, kiểm tra kết nối Internet.',
  'auth/configuration-not-found': 'Firebase Authentication chưa được bật trong Console.',
};
export function authErrorText(e: unknown): string {
  const code = (e as { code?: string })?.code;
  if (code && AUTH_ERR[code]) return AUTH_ERR[code];
  return (e as Error)?.message || 'Đã xảy ra lỗi, vui lòng thử lại.';
}

// ---------- Auth ----------
export async function signIn(email: string, pw: string): Promise<UserDoc> {
  const c = await signInWithEmailAndPassword(auth, email.trim(), pw);
  const s = await getDoc(doc(db, 'users', c.user.uid));
  const u = s.data() as UserDoc | undefined;
  if (!u || u.disabled) { await signOut(auth); throw new Error('Tài khoản không tồn tại hoặc đã bị khoá'); }
  return u;
}
export async function signUp(name: string, email: string, pw: string, role: Exclude<Role, 'admin'>): Promise<UserDoc> {
  const c = await createUserWithEmailAndPassword(auth, email.trim(), pw);
  const u: UserDoc = { uid: c.user.uid, name, email: email.trim().toLowerCase(), role, disabled: false };
  await setDoc(doc(db, 'users', u.uid), u);
  return u;
}
export const logout = () => signOut(auth);
export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email.trim());

// ---------- Rooms ----------
export const getRooms = () => list<Room>(query(collection(db, 'rooms'), orderBy('name')));

/** Creates or updates a room. Returns the room's id (so the caller can immediately
 *  open its editor — e.g. right after creating a new room — to add photo/description/slots). */
export async function saveRoom(r: Partial<Room> & { id?: string }): Promise<string> {
  const { id, ...data } = r;
  if (id) { await updateDoc(doc(db, 'rooms', id), data); return id; }
  const ref = await addDoc(collection(db, 'rooms'), { name: 'Phòng mới', location: '', seats: 10, description: '', locked: false, slotCount: 0, openDates: [], ...data });
  return ref.id;
}
/** Deletes the room together with all its ca and bookings (so no orphan data is left behind). */
export async function deleteRoom(id: string) {
  const refs = [
    ...(await getDocs(query(collection(db, 'slots'), where('roomId', '==', id)))).docs.map(d => d.ref),
    ...(await getDocs(query(collection(db, 'bookings'), where('roomId', '==', id)))).docs.map(d => d.ref),
    ...(await getDocs(query(collection(db, 'slotStats'), where('roomId', '==', id)))).docs.map(d => d.ref),
  ];
  for (let i = 0; i < refs.length; i += 400) {
    const b = writeBatch(db);
    refs.slice(i, i + 400).forEach(r => b.delete(r));
    await b.commit();
  }
  await deleteDoc(doc(db, 'rooms', id));
}

// ---------- Slots (ca) — each one belongs to a single room ----------
// No orderBy here on purpose: where(==) + orderBy(different field) needs a Firestore composite index.
// Callers sort the small result client-side instead, so no index setup is required in Console.
export const getSlotsForRoom = (roomId: string) => list<Slot>(query(collection(db, 'slots'), where('roomId', '==', roomId)));

/** Adds one ca. Uses a batch + increment() instead of a read-then-write transaction, so adding several
 *  ca quickly (or double-tapping) no longer fails with "failed-precondition". */
export async function addSlot(roomId: string, label: string, order = Date.now()) {
  const batch = writeBatch(db);
  batch.set(doc(collection(db, 'slots')), { roomId, label, order });
  batch.update(doc(db, 'rooms', roomId), { slotCount: increment(1) });
  await batch.commit();
}
export const renameSlot = (id: string, label: string) => updateDoc(doc(db, 'slots', id), { label });
export async function removeSlot(roomId: string, slotId: string) {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'slots', slotId));
  batch.update(doc(db, 'rooms', roomId), { slotCount: increment(-1) });
  await batch.commit();
}
export async function seedDefaultSlots(roomId: string) {
  const L = ['07:00–09:00', '09:00–11:00', '13:00–15:00', '15:00–17:00', '17:00–19:00'];
  const base = Date.now();
  for (let i = 0; i < L.length; i++) await addSlot(roomId, L[i], base + i);
}

// ---------- Bookings ----------
export const getBookingsOn = (date: string) => list<Booking>(query(collection(db, 'bookings'), where('date', '==', date)));
export const getMyBookings = (uid: string) => list<Booking>(query(collection(db, 'bookings'), where('uid', '==', uid)));
export const getAllBookings = () => list<Booking>(query(collection(db, 'bookings')));
const slotKey = (roomId: string, date: string, slotId: string) => `${roomId}_${date}_${slotId}`;

/** Cancels a booking and keeps the per-ca counter (slotStats) in sync, atomically. */
export async function cancelBooking(id: string) {
  const bRef = doc(db, 'bookings', id);
  await runTransaction(db, async t => {
    const b = await t.get(bRef);
    if (!b.exists()) return;
    const d = b.data() as Booking;
    const sRef = doc(db, 'slotStats', slotKey(d.roomId, d.date, d.slotId));
    const st = await t.get(sRef);
    t.delete(bRef);
    if (st.exists()) {
      const x = st.data() as { count?: number; studentUids?: string[] };
      t.update(sRef, { count: Math.max(0, (x.count ?? 1) - 1), studentUids: (x.studentUids ?? []).filter(u => u !== d.uid) });
    }
  });
}

export const getNotices = (uid: string) => list<{ id: string; uid: string; text: string }>(query(collection(db, 'notices'), where('uid', '==', uid)));
export const dismissNotice = (id: string) => deleteDoc(doc(db, 'notices', id));

/**
 * Booking rules (decided on the server inside ONE transaction, so two people pressing at the same time are
 * serialized by Firestore — whoever commits first gets the seat, the other transaction retries and sees the new count):
 *  1. A ca holds up to room.seats people; seats are first-come-first-served.
 *  2. If the ca is full and the booker is a LECTURER, the most recent STUDENT in that ca is bumped out
 *     (their booking is deleted and they get a notice). Lecturers never bump lecturers; students never bump anyone.
 *  3. One person can hold a ca only once (doc ID = roomId_date_slotId_uid).
 * slotStats/{roomId_date_slotId} stores { count, studentUids (in booking order) } so no query is needed in the transaction.
 */
export async function bookSlot(room: Room, date: string, slot: Slot, u: UserDoc): Promise<'ok' | 'bumped' | 'full' | 'dup' | 'closed'> {
  const key = slotKey(room.id, date, slot.id);
  const sRef = doc(db, 'slotStats', key);
  const mineRef = doc(db, 'bookings', `${key}_${u.uid}`);
  const roomRef = doc(db, 'rooms', room.id);

  type Seed = { count: number; studentUids: string[] };
  const run = (seed: Seed | null) => runTransaction(db, async t => {
    // ---- all reads first, in ONE round trip (parallel) ----
    const [roomSnap, mine, st] = await Promise.all([t.get(roomRef), t.get(mineRef), t.get(sRef)]);
    const r = roomSnap.data() as Room | undefined;
    if (!r || r.locked) return 'full' as const;
    if (r.openDates && !r.openDates.includes(date)) return 'closed' as const;
    if (mine.exists()) return 'dup' as const;
    // Counter missing = first booking of this ca (or bookings made before slotStats existed): ask caller to seed it.
    if (!st.exists() && !seed) throw new Error('NEED_SEED');
    const cur = st.exists() ? (st.data() as { count?: number; studentUids?: string[] }) : seed!;
    let count = cur.count ?? 0;
    let students = [...(cur.studentUids ?? [])];

    let victimRef: DocumentReference | null = null;
    let victimUid = '';
    let bumped = false;
    if (count >= r.seats) {
      if (u.role !== 'lecturer' || students.length === 0) return 'full' as const;
      victimUid = students[students.length - 1];
      const vRef = doc(db, 'bookings', `${key}_${victimUid}`);
      if ((await t.get(vRef)).exists()) victimRef = vRef;
      students = students.slice(0, -1);
      count -= 1;           // victim leaves (or the stale entry is dropped)…
      bumped = true;
    }

    // ---- writes ----
    if (victimRef) {
      t.delete(victimRef);
      t.set(doc(collection(db, 'notices')), {
        uid: victimUid, createdAt: serverTimestamp(),
        text: `Lượt đặt ${room.name} · ${date} · ${slot.label} của bạn đã được nhường cho giảng viên (ưu tiên).`,
      });
    }
    t.set(mineRef, { roomId: room.id, roomName: room.name, date, slotId: slot.id, slotLabel: slot.label, uid: u.uid, userName: u.name, role: u.role, createdAt: serverTimestamp() });
    t.set(sRef, { roomId: room.id, date, slotId: slot.id, count: count + 1, studentUids: u.role === 'student' ? [...students, u.uid] : students });
    return bumped ? ('bumped' as const) : ('ok' as const);
  }, { maxAttempts: 10 });

  try {
    return await run(null);                      // fast path: 1 transaction, no extra reads
  } catch (e) {
    if ((e as Error).message !== 'NEED_SEED') throw e;
    const ex = (await getBookingsOn(date)).filter(b => b.roomId === room.id && b.slotId === slot.id)
      .sort((a, b) => ((a as any).createdAt?.seconds ?? 0) - ((b as any).createdAt?.seconds ?? 0));
    return run({ count: ex.length, studentUids: ex.filter(b => b.role === 'student').map(b => b.uid) });
  }
}

// ---------- Profile & users ----------
/** Returns the picked image as a base64 data URL (picker does the encoding, so no expo-file-system needed). */
export async function pickImage() {
  const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.4, allowsEditing: true, base64: true });
  if (r.canceled) return null;
  const a = r.assets[0];
  if (!a.base64) throw new Error('Không đọc được ảnh, thử ảnh khác.');
  return `data:${a.mimeType ?? 'image/jpeg'};base64,${a.base64}`;
}
/** Stored inline in Firestore (no Firebase Storage / Blaze plan). Firestore docs are capped at 1 MB. */
export async function uploadImage(_path: string, dataUrl: string): Promise<string> {
  if (dataUrl.length > 900_000) throw new Error('Ảnh quá lớn (>~650KB), hãy chọn ảnh nhỏ hơn.');
  return dataUrl;
}
export async function updateProfile(uid: string, data: { name?: string; avatarUrl?: string; birthYear?: number }, newPassword?: string) {
  await updateDoc(doc(db, 'users', uid), data);
  if (newPassword && auth.currentUser) await updatePassword(auth.currentUser, newPassword);
}
export const getUsers = () => list<UserDoc>(query(collection(db, 'users'))).then(a => a.map(u => ({ ...u, uid: u.uid ?? (u as unknown as { id: string }).id })));
export async function createAccount(name: string, email: string, pw: string, role: Role) {
  const c = await createUserWithEmailAndPassword(authCreator, email.trim(), pw);
  await setDoc(doc(db, 'users', c.user.uid), { uid: c.user.uid, name, email: email.trim().toLowerCase(), role, disabled: false });
  await signOut(authCreator);
}
export const setUserFlags = (uid: string, d: { disabled?: boolean; role?: Role }) => updateDoc(doc(db, 'users', uid), d);
