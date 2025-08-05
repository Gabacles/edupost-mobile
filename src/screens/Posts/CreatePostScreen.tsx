import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { createPost } from '../../api/api';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import * as RN from 'react-native';

export default function CreatePostScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Validation', 'Por favor, preencha todos os campos.');
      return;
    }
    setLoading(true);
    try {
      await createPost({ title: title.trim(), content: content.trim() });
      RN.Alert.alert('Success', 'Postagem criada com sucesso!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err: any) {
      RN.Alert.alert('Error', err?.response?.data?.message ?? 'Falha ao criar a postagem');
    } finally {
      setLoading(false);
    }
  };

  // If the user is not a teacher we simply return null.  In practice this screen
  // should never be rendered for non‑teachers because the navigation
  // configuration is guarded by the teacher role; this check is an extra
  // safeguard.
  if (!user?.roles?.includes('TEACHER')) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Título</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Digite o título"
      />
      <Text style={styles.label}>Conteúdo</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={content}
        onChangeText={setContent}
        placeholder="Digite o conteúdo"
        multiline
        numberOfLines={5}
      />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 12 }} />
      ) : (
        <RN.TouchableOpacity style={styles.publishButton} onPress={handleSubmit}>
          <Text style={styles.publishButtonText}>Publicar</Text>
        </RN.TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  label: {
    fontWeight: 'bold',
    marginTop: 8,
    fontSize: 16,
    color: '#222',
    marginBottom: 4,
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
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  publishButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    marginTop: 8,
  },
  publishButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 0.5,
  },
});