import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Button, Modal, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { fetchPost, deletePost } from '../../api/api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation';

interface PostDetail {
  id: number;
  title: string;
  content: string;
  author: {
    id: string;
    name?: string;
    username?: string;
    email?: string;
  };
}

type Props = NativeStackScreenProps<RootStackParamList, 'PostDetail'>;

export default function PostDetailScreen({ route, navigation }: Props) {
  const { user } = useAuth();
  const isTeacher = user?.roles?.includes('TEACHER');
  const { postId } = route.params;
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchPost(postId);
        const postData = res.data as any;
        setPost({
          id: postData.id,
          title: postData.title,
          content: postData.content,
          author: postData.author_id,
        });
      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'Erro ao carregar postagem');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [postId]);

  const handleDelete = async () => {
    try {
      await deletePost(postId);
      setShowDeleteModal(false);
      navigation.goBack();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erro ao deletar postagem');
      setShowDeleteModal(false);
      setShowErrorModal(true);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }


  if (!post) {
    return (
      <View style={styles.center}>
        <Text>Postagem não encontrada</Text>
      </View>
    );
  }

  const canEdit = isTeacher || user?.id === post.author?.id;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.author}>Autor: {post.author?.name || post.author?.username || 'Unknown'}</Text>
      <Text style={styles.content}>{post.content}</Text>
      {canEdit && (
        <View style={styles.buttonRow}>
          <Button title="Editar" onPress={() => navigation.navigate('EditPost', { postId: post.id })} />
          <Button title="Deletar" onPress={() => setShowDeleteModal(true)} color="#d64545" />
        </View>
      )}

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
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setShowDeleteModal(false)} style={styles.modalButton}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={[styles.modalButton, styles.deleteButton]}>
                <Text style={styles.deleteText}>Deletar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showErrorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Erro</Text>
            <Text style={styles.modalText}>{error}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setShowErrorModal(false)} style={styles.modalButton}>
                <Text style={styles.cancelText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  author: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  content: {
    fontSize: 16,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  error: {
    color: '#d64545',
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
    borderRadius: 4,
    marginLeft: 8,
  },
  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});