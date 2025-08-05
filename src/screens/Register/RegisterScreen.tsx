import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../context/AuthContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async () => {
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await register({ name, username, email, password, roles: role });
      setSuccess(true);
      // Reset form
      setName('');
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirm('');
      setRole('STUDENT');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Efetuar cadastro</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      {success && <Text style={styles.success}>Conta criada com sucesso! Por favor, efetue o login</Text>}
      <TextInput
        style={styles.input}
        placeholder="Nome completo"
        value={name}
        onChangeText={setName}
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        placeholder="Usuário"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        placeholder="E-mail"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        placeholderTextColor="#888"
      />
      <View style={styles.pickerContainer}>
        <Picker selectedValue={role} onValueChange={(itemValue) => setRole(itemValue as any)} style={styles.picker}>
          <Picker.Item label="Estudante" value="STUDENT" />
          <Picker.Item label="Professor" value="TEACHER" />
        </Picker>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Senha"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        placeholder="Confirmar senha"
        secureTextEntry
        value={confirm}
        onChangeText={setConfirm}
        placeholderTextColor="#888"
      />
      {loading ? (
        <ActivityIndicator size="small" style={{ marginVertical: 12 }} />
      ) : (
        <TouchableOpacity
          style={[styles.button, (!name || !username || !email || !password || !confirm) && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={!name || !username || !email || !password || !confirm}
        >
          <Text style={styles.buttonText}>Registrar</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.linkContainer}>
        <Text style={styles.link}>Já possui uma conta? Efetuar login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#1976d2',
    letterSpacing: 1,
  },
  input: {
    height: 44,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 14,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
    fontSize: 16,
    color: '#222',
  },
  pickerContainer: {
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 14,
    overflow: 'hidden',
    backgroundColor: '#fafafa',
  },
  picker: {
    height: 44,
    width: '100%',
    color: '#222',
  },
  button: {
    backgroundColor: '#1976d2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#b0b0b0',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  error: {
    color: '#d64545',
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 15,
  },
  success: {
    color: '#43a047',
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 15,
  },
  linkContainer: {
    marginTop: 18,
    alignItems: 'center',
  },
  link: {
    color: '#1976d2',
    textDecorationLine: 'underline',
    fontSize: 15,
  },
});