import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { authErrorText, resetPassword, signIn, signUp } from '../api';
import { useApp } from '../store';
import { Ionicons } from '@expo/vector-icons';
import { Btn, C, Chip, FadeIn, Field, shadow } from '../ui';

export default function Login() {
  const setUser = useApp(s => s.setUser);
  const [reg, setReg] = useState(false);
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [pw, setPw] = useState('');
  const [role, setRole] = useState<'student' | 'lecturer'>('student');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || !pw) return Alert.alert('Thiếu thông tin', 'Nhập email và mật khẩu.');
    if (pw.length < 6) return Alert.alert('Mật khẩu quá ngắn', 'Mật khẩu cần tối thiểu 6 ký tự.');
    if (reg && !name.trim()) return Alert.alert('Thiếu thông tin', 'Nhập họ tên.');
    setBusy(true);
    try {
      const u = reg ? await signUp(name.trim(), email, pw, role) : await signIn(email, pw);
      setUser(u);
      Alert.alert(reg ? 'Đăng ký thành công' : 'Đăng nhập thành công', `Chào mừng, ${u.name}!`);
    } catch (e) {
      Alert.alert(reg ? 'Đăng ký thất bại' : 'Đăng nhập thất bại', authErrorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <FadeIn style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={[{ width: 84, height: 84, borderRadius: 28, backgroundColor: C.pri, alignItems: 'center', justifyContent: 'center' }, shadow]}>
            <Ionicons name="library" size={40} color="#fff" />
          </View>
          <Text style={{ fontSize: 30, fontWeight: '800', color: C.tx, marginTop: 14 }}>Studyhome</Text>
          <Text style={{ color: C.mut, marginTop: 2 }}>{reg ? 'Tạo tài khoản' : 'Đặt phòng học nhanh, gọn, đẹp'}</Text>
        </FadeIn>
        {reg && <Field placeholder="Họ tên" value={name} onChangeText={setName} autoCapitalize="words" />}
        <Field placeholder="Email" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Field placeholder="Mật khẩu" secureTextEntry value={pw} onChangeText={setPw} />
        {reg && <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          <Chip label="Sinh viên" on={role === 'student'} onPress={() => setRole('student')} />
          <Chip label="Giảng viên" on={role === 'lecturer'} onPress={() => setRole('lecturer')} />
        </View>}
        <Btn label={busy ? 'Đang xử lý…' : reg ? 'Đăng ký' : 'Đăng nhập'} onPress={submit} disabled={busy} />
        <Btn kind="ghost" label={reg ? 'Đã có tài khoản' : 'Tạo tài khoản mới'} onPress={() => setReg(!reg)} />
        {!reg && <Btn kind="ghost" label="Quên mật khẩu" onPress={() => {
          if (!email.trim()) return Alert.alert('Nhập email trước');
          resetPassword(email).then(() => Alert.alert('Đã gửi email đặt lại mật khẩu')).catch(e => Alert.alert('Lỗi', authErrorText(e)));
        }} />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
