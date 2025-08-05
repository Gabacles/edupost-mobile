import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Button, Alert, StyleSheet, ScrollView } from 'react-native';
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

  const handleDelete = () => {
    Alert.alert('Confirmar', 'Tem certeza de que deseja deletar esta postagem?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Deletar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePost(postId);
            navigation.goBack();
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message ?? 'Erro ao deletar postagem');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
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
          <Button title="Deletar" onPress={handleDelete} color="#d64545" />
        </View>
      )}
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
});