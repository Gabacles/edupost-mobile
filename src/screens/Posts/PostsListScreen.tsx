import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Button,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { fetchPosts } from '../../api/api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation';

interface Post {
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

type Props = NativeStackScreenProps<RootStackParamList, 'PostsList'>;

export default function PostsListScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const isTeacher = user?.roles?.includes('TEACHER');
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadPosts = async (reset = false) => {
    if (loading || (!reset && !hasMore)) return;
    setLoading(true);
    setError(null);
    try {
      const nextPage = reset ? 1 : page;
      const res = await fetchPosts({ page: nextPage, limit: 10, search: search.trim() });
      // Mapeia corretamente o autor para o formato esperado pelo componente
      const data = (res.data.data as any[]).map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        author: post.author_id, // Usa o objeto author_id como author
      }));
      setPosts(prev => (reset ? data : Array.isArray(prev) ? [...prev, ...data] : data));
      setPage(nextPage + 1);
      setHasMore(data.length > 0);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load posts');
    } finally {
      setLoading(false);
      if (refreshing) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    setPage(1);
    setHasMore(true);
    loadPosts(true);
  };

  const renderItem = ({ item }: { item: Post }) => (
    <TouchableOpacity style={styles.postCard} onPress={() => navigation.navigate('PostDetail', { postId: item.id })}>
      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postAuthor}>
        Autor: {item.author?.name || item.author?.username || 'Unknown'}
      </Text>
      <Text numberOfLines={2} style={styles.postExcerpt}>{item.content}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar posts..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <Button title="Buscar" onPress={handleSearch} />
      </View>
      {isTeacher && (
        <View style={styles.actionsRow}>
          <Button title="Publicar" onPress={() => navigation.navigate('CreatePost')} />
          <Button title="Admin" onPress={() => navigation.navigate('AdminDashboard')} />
        </View>
      )}
      <FlatList
        data={posts}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        onEndReached={() => loadPosts()}
        onEndReachedThreshold={0.5}
        onRefresh={() => {
          setRefreshing(true);
          setPage(1);
          setHasMore(true);
          loadPosts(true);
        }}
        refreshing={refreshing}
        ListFooterComponent={loading ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No posts found.</Text> : null}
      />
      <View style={styles.logoutContainer}>
        <Button title="Sair" onPress={logout} color="#d64545" />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  postCard: {
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 6,
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  postAuthor: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  postExcerpt: {
    fontSize: 14,
    color: '#333',
  },
  empty: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  logoutContainer: {
    marginTop: 8,
  },
  error: {
    color: '#d64545',
    marginTop: 8,
    textAlign: 'center',
  },
});