import { useQuery } from '@tanstack/react-query';
import { getAllBookings, getBookingsOn, getMyBookings, getNotices, getRooms, getSlotsForRoom, getUsers } from './api';

export const useRooms = () => useQuery({ queryKey: ['rooms'], queryFn: getRooms, staleTime: 30_000 });
export const useRoomSlots = (roomId: string) => useQuery({ queryKey: ['slots', roomId], queryFn: () => getSlotsForRoom(roomId), enabled: !!roomId });
export const useBookingsOn = (date: string) => useQuery({ queryKey: ['bookings', date], queryFn: () => getBookingsOn(date), refetchInterval: 15_000 });
export const useMyBookings = (uid: string) => useQuery({ queryKey: ['my', uid], queryFn: () => getMyBookings(uid), refetchInterval: 15_000 });
export const useAllBookings = () => useQuery({ queryKey: ['all'], queryFn: getAllBookings });
export const useUsers = () => useQuery({ queryKey: ['users'], queryFn: getUsers });
export const useNotices = (uid: string) => useQuery({ queryKey: ['notices', uid], queryFn: () => getNotices(uid), refetchInterval: 15_000 });
