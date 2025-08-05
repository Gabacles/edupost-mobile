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
  TouchableOpacity,
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
      setError(err?.response?.data?.message ?? 'Falha ao carregar usuários');
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
      Alert.alert('Validação', 'Todos os campos são obrigatórios');
      return;
    }
    try {
      await createUser({ ...newUser, roles: 'TEACHER' });
      setNewUser({ name: '', username: '', email: '', password: '' });
      setShowAdd(false);
      loadUsers();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Falha ao criar professor');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Confirmação', 'Deseja excluir este professor?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteUser(id);
            setTeachers(prev => prev.filter(t => t.id !== id));
          } catch (err: any) {
            Alert.alert('Erro', err?.response?.data?.message ?? 'Falha ao excluir professor');
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
      Alert.alert('Erro', err?.response?.data?.message ?? 'Falha ao atualizar professor');
    }
  };

  if (!user?.roles?.includes('TEACHER')) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.toggleButton} onPress={() => setShowAdd(!showAdd)}>
        <Text style={styles.toggleButtonText}>{showAdd ? 'Cancelar' : 'Adicionar Professor'}</Text>
      </TouchableOpacity>
      {showAdd && (
        <View style={styles.form}>
          <TextInput
            placeholder="Nome"
            style={styles.input}
            value={newUser.name}
            onChangeText={t => setNewUser({ ...newUser, name: t })}
          />
          <TextInput
            placeholder="Usuário"
            style={styles.input}
            value={newUser.username}
            onChangeText={t => setNewUser({ ...newUser, username: t })}
          />
          <TextInput
            placeholder="E-mail"
            style={styles.input}
            value={newUser.email}
            onChangeText={t => setNewUser({ ...newUser, email: t })}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            placeholder="Senha"
            style={styles.input}
            value={newUser.password}
            onChangeText={t => setNewUser({ ...newUser, password: t })}
            secureTextEntry
          />
          <TouchableOpacity style={styles.createButton} onPress={handleAdd}>
            <Text style={styles.createButtonText}>Criar</Text>
          </TouchableOpacity>
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
                    placeholder="Nome"
                    style={styles.input}
                    value={editForm.name}
                    onChangeText={t => setEditForm(prev => ({ ...prev, name: t }))}
                  />
                  <TextInput
                    placeholder="Usuário"
                    style={styles.input}
                    value={editForm.username}
                    onChangeText={t => setEditForm(prev => ({ ...prev, username: t }))}
                  />
                  <TextInput
                    placeholder="E-mail"
                    style={styles.input}
                    value={editForm.email}
                    onChangeText={t => setEditForm(prev => ({ ...prev, email: t }))}
                  />
                  <TextInput
                    placeholder="Senha (deixe em branco para manter)"
                    style={styles.input}
                    value={editForm.password}
                    onChangeText={t => setEditForm(prev => ({ ...prev, password: t }))}
                    secureTextEntry
                  />
                  <View style={styles.row}>
                    <TouchableOpacity style={styles.saveButton} onPress={() => handleEditSave(item.id)}>
                      <Text style={styles.saveButtonText}>Salvar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => setEditingId(null)}>
                      <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
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
                  <TouchableOpacity style={styles.editButton} onPress={() => {
                    setEditingId(item.id);
                    setEditForm({ name: item.name, username: item.username, email: item.email, password: '' });
                  }}>
                    <Text style={styles.editButtonText}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
                    <Text style={styles.deleteButtonText}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum professor encontrado.</Text>}
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
    padding: 12,
    borderRadius: 8,
  },
  input: {
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: '#fafafa',
    fontSize: 16,
  },
  item: {
    backgroundColor: '#f8f8f8',
    padding: 14,
    marginBottom: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 8,
    gap: 8,
  },
  toggleButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
  },
  toggleButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  createButton: {
    backgroundColor: '#43a047',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    marginTop: 4,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  saveButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    flex: 1,
    marginRight: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  cancelButton: {
    backgroundColor: '#888',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    flex: 1,
    marginLeft: 4,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  editButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    flex: 1,
    marginRight: 4,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  deleteButton: {
    backgroundColor: '#d64545',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    flex: 1,
    marginLeft: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.5,
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