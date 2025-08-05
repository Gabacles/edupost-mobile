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
    const unsubscribe = navigation.addListener('focus', () => {
      loadPosts(true);
    });
    return unsubscribe;
  }, [navigation, search]);

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
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Buscar</Text>
        </TouchableOpacity>
      </View>
      {isTeacher && (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('CreatePost')}>
            <Text style={styles.actionButtonText}>Publicar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('AdminDashboard')}>
            <Text style={styles.actionButtonText}>Admin</Text>
          </TouchableOpacity>
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
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Sair</Text>
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 0,
    backgroundColor: '#fafafa',
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#43a047',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  postCard: {
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  postTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#222',
  },
  postAuthor: {
    fontSize: 13,
    color: '#888',
    marginBottom: 6,
  },
  postExcerpt: {
    fontSize: 15,
    color: '#333',
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 32,
    fontSize: 16,
  },
  logoutContainer: {
    marginTop: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#d64545',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    width: '60%',
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  error: {
    color: '#d64545',
    marginTop: 12,
    textAlign: 'center',
    fontSize: 15,
  },
});