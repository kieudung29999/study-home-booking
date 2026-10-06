export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const days = (n = 5) => Array.from({ length: n }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() + i);
  return { key: iso(d), label: i ? d.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' }) : 'Hôm nay' };
});

export interface Occupancy { color: string; text: string; bookable: boolean }
/** total = number of ca, free = ca that still have a seat, booked/cap = people booked / total seats across all ca that day. */
export function occupancy(total: number, free: number, locked: boolean, C: { ok: string; warn: string; bad: string; none: string }, booked = 0, cap = 0): Occupancy {
  if (locked) return { color: C.bad, text: 'Bảo trì', bookable: false };
  if (total === 0) return { color: C.none, text: 'Chưa mở ca', bookable: false };
  if (free === 0) return { color: C.bad, text: 'Hết chỗ', bookable: false };
  if (booked > 0) return { color: C.warn, text: `${booked}/${cap} chỗ đã đặt`, bookable: true };
  return { color: C.ok, text: 'Còn trống', bookable: true };
}

/** undefined openDates = legacy room, open every day. */
export const isOpenOn = (r: { openDates?: string[] }, date: string) => !r.openDates || r.openDates.includes(date);
