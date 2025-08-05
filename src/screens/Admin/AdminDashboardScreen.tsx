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
        <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditPost', { postId: item.id })}>
          <Text style={styles.editButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButtonAction} onPress={() => handleDelete(item.id)}>
          <Text style={styles.deleteButtonText}>Deletar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.buttonsRow}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('Teachers')}>
          <Text style={styles.headerButtonText}>Professores</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('Students')}>
          <Text style={styles.headerButtonText}>Alunos</Text>
        </TouchableOpacity>
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
            <Text style={styles.modalTitle}>Confirmar</Text>
            <Text style={styles.modalText}>Tem certeza de que deseja deletar esta postagem?</Text>
            {deleteError && <Text style={styles.error}>{deleteError}</Text>}
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setShowDeleteModal(false)} style={styles.modalButton}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDelete} style={[styles.modalButton, styles.deleteButton]}>
                <Text style={styles.deleteText}>Deletar</Text>
              </TouchableOpacity>
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
    marginBottom: 16,
    gap: 12,
  },
  headerButton: {
    flex: 1,
    backgroundColor: '#1976d2',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
  },
  headerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  postRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: '#f8f8f8',
    padding: 14,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  editButton: {
    backgroundColor: '#43a047',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 6,
    elevation: 2,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  deleteButtonAction: {
    backgroundColor: '#d64545',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.5,
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#d64545',
    borderRadius: 8,
    marginLeft: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    elevation: 2,
  },
  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});