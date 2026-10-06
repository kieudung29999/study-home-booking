import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { logout, pickImage, updateProfile, uploadImage } from '../api';
import { useApp } from '../store';
import { Avatar, Btn, C, FadeIn, Field, Title } from '../ui';

const ROLE = { admin: 'Quản trị viên', lecturer: 'Giảng viên · ưu tiên cao', student: 'Sinh viên' } as const;
const thisYear = new Date().getFullYear();

export default function Profile() {
  const { user, setUser } = useApp();
  const [name, setName] = useState(user!.name);
  const [byear, setByear] = useState(user!.birthYear ? String(user!.birthYear) : '');
  const [pw, setPw] = useState('');

  const save = async (avatarUrl?: string) => {
    if (!name.trim()) return Alert.alert('Tên không được trống');
    if (pw && pw.length < 6) return Alert.alert('Mật khẩu ≥ 6 ký tự');
    const y = byear ? parseInt(byear, 10) : undefined;
    if (byear && (!y || y < 1950 || y > thisYear)) return Alert.alert(`Năm sinh không hợp lệ (1950–${thisYear})`);
    try {
      const data: { name: string; avatarUrl?: string; birthYear?: number } = { name: name.trim(), ...(avatarUrl ? { avatarUrl } : {}) };
      if (byear) data.birthYear = y;
      await updateProfile(user!.uid, data, pw || undefined);
      setUser({ ...user!, ...data }); setPw(''); Alert.alert('Đã lưu hồ sơ');
    } catch (e) { Alert.alert('Lỗi', (e as Error).message + '\n(Đổi mật khẩu có thể cần đăng nhập lại)'); }
  };
  const changeAvatar = async () => { try { const uri = await pickImage(); if (uri) await save(await uploadImage(`avatars/${user!.uid}`, uri)); } catch (e) { Alert.alert('Lỗi', (e as Error).message); } };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <FadeIn>
        <Title>Cá nhân</Title>
        <Pressable onPress={changeAvatar} style={{ alignSelf: 'center', marginVertical: 8 }}>
          <Avatar uri={user!.avatarUrl} name={user!.name} size={96} />
          <Text style={{ color: C.pri, textAlign: 'center', marginTop: 6 }}>Đổi ảnh</Text>
        </Pressable>
        <Text style={{ textAlign: 'center', color: C.mut, marginBottom: 16 }}>{ROLE[user!.role]}</Text>

        <Text style={{ color: C.mut }}>Họ tên</Text>
        <Field value={name} onChangeText={setName} autoCapitalize="words" />

        <Text style={{ color: C.mut }}>Năm sinh</Text>
        <Field value={byear} onChangeText={t => setByear(t.replace(/[^0-9]/g, '').slice(0, 4))} keyboardType="number-pad" placeholder="VD: 2004" />

        <Text style={{ color: C.mut }}>Email (không đổi được)</Text>
        <Field value={user!.email} editable={false} />

        <Text style={{ color: C.mut }}>Mật khẩu mới</Text>
        <Field placeholder="Bỏ trống nếu không đổi" secureTextEntry value={pw} onChangeText={setPw} />

        <Btn label="Lưu thay đổi" onPress={() => save()} />
        <Btn kind="outlineDanger" icon="log-out-outline" label="Đăng xuất" onPress={() => Alert.alert('Đăng xuất?', 'Bạn sẽ cần đăng nhập lại.', [
          { text: 'Ở lại' },
          { text: 'Đăng xuất', style: 'destructive', onPress: async () => { await logout(); setUser(null); } },
        ])} />
        </FadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}
