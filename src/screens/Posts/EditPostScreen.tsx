import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { fetchPost, updatePost } from "../../api/api";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation";
import { useAuth } from "../../context/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "EditPost">;

export default function EditPostScreen({ route, navigation }: Props) {
  const { user } = useAuth();
  const { postId } = route.params;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showValidationModal, setShowValidationModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchPost(postId);
        setTitle(res.data.title);
        setContent(res.data.content);
      } catch (err) {
        setErrorMessage("Falha ao carregar postagem");
        setShowErrorModal(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [postId, navigation]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setErrorMessage("Por favor, preencha título e conteúdo.");
      setShowValidationModal(true);
      return;
    }
    setSaving(true);
    try {
      await updatePost(postId, {
        title: title.trim(),
        content: content.trim(),
      });
      setSuccessMessage("Postagem atualizada com sucesso.");
      setShowSuccessModal(true);
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message ?? "Falha ao atualizar postagem"
      );
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  if (!user?.roles?.includes("TEACHER")) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
      {saving ? (
        <ActivityIndicator style={{ marginTop: 12 }} />
      ) : (
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Salvar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal de erro */}
      <Modal
        visible={showErrorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Erro</Text>
            <Text style={styles.modalText}>{errorMessage}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setShowErrorModal(false)}
                style={styles.modalButton}
              >
                <Text style={styles.cancelText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de sucesso */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sucesso</Text>
            <Text style={styles.modalText}>{successMessage}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setShowSuccessModal(false);
                  navigation.goBack();
                }}
                style={styles.modalButton}
              >
                <Text style={styles.cancelText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de validação */}
      <Modal
        visible={showValidationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowValidationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Validação</Text>
            <Text style={styles.modalText}>{errorMessage}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setShowValidationModal(false)}
                style={styles.modalButton}
              >
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
    flexGrow: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontWeight: "bold",
    marginTop: 8,
    fontSize: 16,
    color: "#222",
    marginBottom: 4,
  },
  input: {
    borderColor: "#e0e0e0",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: "#fafafa",
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  saveButtonContainer: {
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: "#1976d2",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    elevation: 2,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 24,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    padding: 12,
    alignItems: "center",
  },
  cancelText: {
    color: "#666",
    fontWeight: "bold",
    fontSize: 16,
  },
});
