import { View, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image as ImageIcon, X } from 'lucide-react-native';
import { uploadImage, getImagePath } from '@/lib/storage';

interface ImageUploadProps {
  bucket: string;
  prefix: string;
  imageUrl: string | null;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  size?: number;
  circular?: boolean;
}

export default function ImageUpload({ 
  bucket, 
  prefix,
  imageUrl, 
  onUpload,
  onRemove,
  size = 200,
  circular = false,
}: ImageUploadProps) {
  const [loading, setLoading] = useState(false);

  async function pickImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setLoading(true);
        try {
          const path = getImagePath(prefix);
          const url = await uploadImage(result.assets[0].uri, bucket, path);
          onUpload(url);
        } catch (error) {
          console.error('Error uploading image:', error);
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  }

  return (
    <View style={styles.container}>
      {imageUrl ? (
        <View style={[
          styles.imageContainer,
          { width: size, height: size },
          circular && { borderRadius: size / 2 }
        ]}>
          <Image
            source={{ uri: imageUrl }}
            style={[
              styles.image,
              circular && { borderRadius: size / 2 }
            ]}
          />
          {onRemove && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={onRemove}
            >
              <X size={20} color="white" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.editButton}
            onPress={pickImage}
          >
            <ImageIcon size={20} color="white" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.placeholder,
            { width: size, height: size },
            circular && { borderRadius: size / 2 }
          ]}
          onPress={pickImage}
        >
          {loading ? (
            <ActivityIndicator color="#007AFF" />
          ) : (
            <ImageIcon size={32} color="#8E8E93" />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    padding: 4,
  },
  editButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    padding: 4,
  },
  placeholder: {
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
});