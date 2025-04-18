import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Pencil, Trash2, X } from 'lucide-react-native';

interface PostOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function PostOptionsModal({ visible, onClose, onEdit, onDelete }: PostOptionsModalProps) {
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
            <Text style={styles.modalTitle}>Действия</Text>
            <TouchableOpacity 
              onPress={onClose}
              style={styles.closeButton}
            >
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.option}
            onPress={() => {
              onClose();
              onEdit();
            }}
          >
            <Pencil size={24} color="#007AFF" />
            <Text style={styles.optionText}>Редактировать</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.option, styles.deleteOption]}
            onPress={() => {
              onClose();
              onDelete();
            }}
          >
            <Trash2 size={24} color="#FF3B30" />
            <Text style={[styles.optionText, styles.deleteText]}>Удалить</Text>
          </TouchableOpacity>
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
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  deleteOption: {
    borderBottomWidth: 0,
  },
  optionText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#007AFF',
    fontFamily: 'Inter-Regular',
  },
  deleteText: {
    color: '#FF3B30',
  },
});