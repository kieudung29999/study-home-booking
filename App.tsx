import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './src/firebase';
import { useApp } from './src/store';
import { RootStack, TabParamList, UserDoc } from './src/types';
import { Ionicons } from '@expo/vector-icons';
import { C, IonName } from './src/ui';
import { TabBar } from './src/components/TabBar';
import Login from './src/screens/Login';
import Browse from './src/screens/Browse';
import MyBookings from './src/screens/MyBookings';
import Profile from './src/screens/Profile';
import Admin from './src/screens/Admin';
import RoomDetail from './src/screens/RoomDetail';

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 20_000, retry: 1 } } });
const Stack = createNativeStackNavigator<RootStack>();
const Tab = createBottomTabNavigator<TabParamList>();
const icon = (on: IonName, off: IonName) => ({ focused, color, size }: { focused: boolean; color: string; size: number }) => <Ionicons name={focused ? on : off} size={size} color={color} />;

function Tabs() {
  const admin = useApp(s => s.user?.role === 'admin');
  return (
    <Tab.Navigator tabBar={props => <TabBar {...props} />} screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Tab.Screen name="Browse" component={Browse} options={{ title: 'Trang chủ', tabBarIcon: icon('home', 'home-outline') }} />
      <Tab.Screen name="MyBookings" component={MyBookings} options={{ title: 'Đã đặt', tabBarIcon: icon('calendar', 'calendar-outline') }} />
      <Tab.Screen name="Profile" component={Profile} options={{ title: 'Cá nhân', tabBarIcon: icon('person', 'person-outline') }} />
      {admin && <Tab.Screen name="Admin" component={Admin} options={{ title: 'Quản lý', tabBarIcon: icon('settings', 'settings-outline') }} />}
    </Tab.Navigator>
  );
}

export default function App() {
  const { user, setUser } = useApp();
  const [ready, setReady] = useState(false);
  useEffect(() => onAuthStateChanged(auth, async fu => {
    if (!fu) setUser(null);
    else {
      const s = await getDoc(doc(db, 'users', fu.uid));
      if (s.exists()) { const u = s.data() as UserDoc; if (u.disabled) { await signOut(auth); setUser(null); } else setUser(u); }
    }
    setReady(true);
  }), [setUser]);
  if (!ready) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={C.pri} /></View>;
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={qc}>
        <NavigationContainer theme={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: C.bg, card: C.card, primary: C.pri, text: C.tx, border: C.ln } }}>
          <Stack.Navigator screenOptions={{ animation: 'slide_from_right' }}>
            {user ? (<>
              <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
              <Stack.Screen name="RoomDetail" component={RoomDetail} options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
            </>) : <Stack.Screen name="Tabs" component={Login} options={{ headerShown: false }} />}
          </Stack.Navigator>
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
