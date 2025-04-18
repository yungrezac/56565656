import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X } from 'lucide-react-native';

interface PostEditModalProps {
  visible: boolean;
  onClose: () => void;
  post: {
    id: string;
    content: string;
  };
  onUpdate: () => void;
}

export default function PostEditModal({ visible, onClose, post, onUpdate }: PostEditModalProps) {
  const [content, setContent] = useState(post.content);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpdate() {
    if (!content.trim()) {
      setError('Текст поста не может быть пустым');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('posts')
        .update({
          content: content.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.id);

      if (updateError) throw updateError;

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating post:', error);
      setError('Ошибка при обновлении поста');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Редактировать пост</Text>
            <TouchableOpacity 
              onPress={onClose}
              style={styles.closeButton}
            >
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TextInput
            style={styles.input}
            value={content}
            onChangeText={setContent}
            placeholder="Что у вас нового?"
            placeholderTextColor="#8E8E93"
            multiline
            maxLength={2000}
          />

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleUpdate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Сохранить</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 4,
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  input: {
    fontSize: 16,
    color: '#1C1C1E',
    minHeight: 100,
    textAlignVertical: 'top',
    fontFamily: 'Inter-Regular',
  },
  actions: {
    marginTop: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});