import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type Role = 'student' | 'lecturer' | 'admin';
export interface UserDoc { uid: string; name: string; email: string; role: Role; avatarUrl?: string; disabled?: boolean; birthYear?: number }
export interface Room { id: string; name: string; location: string; seats: number; description?: string; photoUrl?: string; locked: boolean; slotCount?: number; openDates?: string[] }
/** Each slot (ca) belongs to exactly one room — created inside that room's own editor, not shared globally. */
export interface Slot { id: string; roomId: string; label: string; order: number }
export interface Booking { id: string; roomId: string; roomName: string; date: string; slotId: string; slotLabel: string; uid: string; userName: string; role: Role }
/** Room + numbers computed for the selected date (used by the list, cards and carousel). */
export type RoomItem = Room & { free: number; total: number; booked: number; closed: boolean };

// ---- Navigation (all params typed) ----
export type TabParamList = { Browse: undefined; MyBookings: undefined; Profile: undefined; Admin: undefined };
export type RootStack = { Tabs: NavigatorScreenParams<TabParamList> | undefined; RoomDetail: { roomId: string } };
/** Navigation prop for tab screens that also push Stack screens (e.g. open RoomDetail from Browse). */
export type TabScreenNav<T extends keyof TabParamList> = CompositeNavigationProp<BottomTabNavigationProp<TabParamList, T>, NativeStackNavigationProp<RootStack>>;
