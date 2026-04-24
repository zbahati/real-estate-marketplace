import { View, Text, TextInput, Button } from 'react-native';
import { useState } from 'react';
import { useAuthStore } from '../../src/store/authStore';
import { useRouter } from 'expo-router';

export default function Register() {
  const router = useRouter();
  const { register } = useAuthStore();

  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: ''
  });

  const handleRegister = async () => {
    try {
      await register(form);
      router.replace('/(tabs)');
    } catch (err) {
      alert('Register failed');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Register</Text>

      <TextInput placeholder="Name" onChangeText={(v) => setForm({ ...form, full_name: v })} />
      <TextInput placeholder="Email" onChangeText={(v) => setForm({ ...form, email: v })} />
      <TextInput placeholder="Phone" onChangeText={(v) => setForm({ ...form, phone: v })} />
      <TextInput placeholder="Password" secureTextEntry onChangeText={(v) => setForm({ ...form, password: v })} />

      <Button title="Register" onPress={handleRegister} />
    </View>
  );
}