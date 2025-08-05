import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Button,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { fetchPosts, deletePost } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation';

interface PostItem {
  id: number;
  title: string;
  author_id: {
    id: string;
    name: string;
    username: string;
    email: string;
  };
}

type Props = NativeStackScreenProps<RootStackParamList, 'AdminDashboard'>;

export default function AdminDashboardScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPosts({ page: 1, limit: 50 });
      const postsRaw = res.data.data as any[];
      setPosts(postsRaw.map(post => ({
        id: post.id,
        title: post.title,
        author_id: {
          id: post.author_id.id,
          name: post.author_id.name,
          username: post.author_id.username,
          email: post.author_id.email,
        },
      })));
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleDelete = (id: number) => {
    setPostToDelete(id);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (postToDelete == null) return;
    try {
      await deletePost(postToDelete);
      setPosts(prev => prev.filter(p => p.id !== postToDelete));
      setShowDeleteModal(false);
      setPostToDelete(null);
    } catch (err: any) {
      setDeleteError(err?.response?.data?.message ?? 'Failed to delete post');
    }
  };

  if (!user?.roles?.includes('TEACHER')) {
    return null;
  }

  const renderItem = ({ item }: { item: PostItem }) => (
    <View style={styles.postRow}>
      <TouchableOpacity
        style={{ flex: 1 }}
        onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
      >
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postAuthor}>
          Autor: {item.author_id.name || item.author_id.username || 'Unknown'}
        </Text>
      </TouchableOpacity>
      <View style={styles.postActions}>
        <Button
          title="Editar"
          onPress={() => navigation.navigate('EditPost', { postId: item.id })}
        />
        <Button title="Deletar" color="#d64545" onPress={() => handleDelete(item.id)} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.buttonsRow}>
        <Button title="Professores" onPress={() => navigation.navigate('Teachers')} />
        <Button title="Alunos" onPress={() => navigation.navigate('Students')} />
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 16 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          onRefresh={() => {
            setRefreshing(true);
            loadPosts().finally(() => setRefreshing(false));
          }}
          refreshing={refreshing}
          ListEmptyComponent={<Text style={styles.empty}>No posts found.</Text>}
        />
      )}

      {/* Modal de confirmação de deleção */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Confirmar deleção</Text>
            <Text>Deseja realmente deletar este post?</Text>
            {deleteError && <Text style={styles.error}>{deleteError}</Text>}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <Button title="Cancelar" onPress={() => setShowDeleteModal(false)} />
              <View style={{ width: 12 }} />
              <Button title="Deletar" color="#d64545" onPress={confirmDelete} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  postRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#f8f8f8',
    padding: 8,
    borderRadius: 4,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  postAuthor: {
    fontSize: 12,
    color: '#666',
  },
  postActions: {
    justifyContent: 'space-between',
    height: '100%',
    gap: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 8,
    minWidth: 260,
    elevation: 4,
  },
});