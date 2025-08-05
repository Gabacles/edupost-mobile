import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Button,
  TextInput,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { fetchUsers, createUser, updateUser, deleteUser } from '../../api/api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation';

interface AppUser {
  id: string;
  name: string;
  username: string;
  email: string;
  roles: string[];
}

type Props = NativeStackScreenProps<RootStackParamList, 'Teachers'>;

export default function TeachersScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', username: '', email: '', password: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', username: '', email: '', password: '' });

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchUsers({ page: 1, limit: 100 });
      const allUsers = res.data as AppUser[];
      setTeachers(allUsers.filter(u => u.roles?.includes('TEACHER')));
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAdd = async () => {
    const { name, username, email, password } = newUser;
    if (!name || !username || !email || !password) {
      Alert.alert('Validation', 'All fields are required');
      return;
    }
    try {
      await createUser({ ...newUser, roles: 'TEACHER' });
      setNewUser({ name: '', username: '', email: '', password: '' });
      setShowAdd(false);
      loadUsers();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed to create teacher');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Confirm', 'Delete this teacher?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteUser(id);
            setTeachers(prev => prev.filter(t => t.id !== id));
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message ?? 'Failed to delete teacher');
          }
        },
      },
    ]);
  };

  const handleEditSave = async (id: string) => {
    try {
      const updated: any = {};
      if (editForm.name) updated.name = editForm.name;
      if (editForm.username) updated.username = editForm.username;
      if (editForm.email) updated.email = editForm.email;
      if (editForm.password) updated.password = editForm.password;
      if (Object.keys(updated).length === 0) {
        setEditingId(null);
        return;
      }
      await updateUser(id, { ...updated, roles: 'TEACHER' });
      setEditingId(null);
      setEditForm({ name: '', username: '', email: '', password: '' });
      loadUsers();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed to update teacher');
    }
  };

  if (!user?.roles?.includes('TEACHER')) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Button title={showAdd ? 'Cancel' : 'Add Teacher'} onPress={() => setShowAdd(!showAdd)} />
      {showAdd && (
        <View style={styles.form}>
          <TextInput
            placeholder="Name"
            style={styles.input}
            value={newUser.name}
            onChangeText={t => setNewUser({ ...newUser, name: t })}
          />
          <TextInput
            placeholder="Username"
            style={styles.input}
            value={newUser.username}
            onChangeText={t => setNewUser({ ...newUser, username: t })}
          />
          <TextInput
            placeholder="Email"
            style={styles.input}
            value={newUser.email}
            onChangeText={t => setNewUser({ ...newUser, email: t })}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            placeholder="Password"
            style={styles.input}
            value={newUser.password}
            onChangeText={t => setNewUser({ ...newUser, password: t })}
            secureTextEntry
          />
          <Button title="Create" onPress={handleAdd} />
        </View>
      )}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 16 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={teachers}
          keyExtractor={item => item.id}
          onRefresh={() => {
            setRefreshing(true);
            loadUsers().finally(() => setRefreshing(false));
          }}
          refreshing={refreshing}
          renderItem={({ item }) => (
            <View style={styles.item}>
              {editingId === item.id ? (
                <View style={{ flex: 1 }}>
                  <TextInput
                    placeholder="Name"
                    style={styles.input}
                    value={editForm.name}
                    onChangeText={t => setEditForm(prev => ({ ...prev, name: t }))}
                  />
                  <TextInput
                    placeholder="Username"
                    style={styles.input}
                    value={editForm.username}
                    onChangeText={t => setEditForm(prev => ({ ...prev, username: t }))}
                  />
                  <TextInput
                    placeholder="Email"
                    style={styles.input}
                    value={editForm.email}
                    onChangeText={t => setEditForm(prev => ({ ...prev, email: t }))}
                  />
                  <TextInput
                    placeholder="Password (leave blank to keep)"
                    style={styles.input}
                    value={editForm.password}
                    onChangeText={t => setEditForm(prev => ({ ...prev, password: t }))}
                    secureTextEntry
                  />
                  <View style={styles.row}>
                    <Button title="Save" onPress={() => handleEditSave(item.id)} />
                    <Button title="Cancel" onPress={() => setEditingId(null)} />
                  </View>
                </View>
              ) : (
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.small}>@{item.username}</Text>
                  <Text style={styles.small}>{item.email}</Text>
                </View>
              )}
              {editingId !== item.id && (
                <View style={styles.row}>
                  <Button title="Edit" onPress={() => {
                    setEditingId(item.id);
                    setEditForm({ name: item.name, username: item.username, email: item.email, password: '' });
                  }} />
                  <Button title="Delete" color="#d64545" onPress={() => handleDelete(item.id)} />
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No teachers found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  form: {
    marginVertical: 12,
    backgroundColor: '#f8f8f8',
    padding: 8,
    borderRadius: 4,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  item: {
    backgroundColor: '#f8f8f8',
    padding: 8,
    marginBottom: 8,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  small: {
    fontSize: 12,
    color: '#666',
  },
  error: {
    color: '#d64545',
    textAlign: 'center',
    marginTop: 20,
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
  },
});