import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Platform, RefreshControl, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Share, Image as ImageIcon, MapPin, X, Plus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import PostCard from '@/components/PostCard';

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  likes: number;
  comments_count: number;
  latitude?: number;
  longitude?: number;
  created_at: string;
  user: {
    full_name: string;
    avatar_url: string;
  } | null;
  liked_by_user: boolean;
}

export default function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth');
        return;
      }
      setCurrentUserId(user.id);
      fetchPosts();
    } catch (error) {
      console.error('Error checking user:', error);
      router.replace('/auth');
    }
  }

  async function fetchPosts() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles(full_name, avatar_url),
          likes(user_id),
          comments:comments(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const postsWithCounts = data.map(post => ({
        ...post,
        likes: post.likes?.length || 0,
        comments_count: post.comments?.[0]?.count || 0,
        liked_by_user: post.likes?.some(like => like.user_id === user.id) || false,
      }));

      setPosts(postsWithCounts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  }

  async function pickImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  }

  async function attachLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    setLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
  }

  async function handleCreatePost() {
    if (!content.trim() && !selectedImage) return;

    setIsLoading(true);

    try {
      let imageUrl = null;

      if (selectedImage) {
        const formData = new FormData();
        formData.append('file', {
          uri: selectedImage,
          name: 'upload.jpg',
          type: 'image/jpeg',
        } as any);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('post-images')
          .upload('post-' + Date.now() + '.jpg', formData);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(uploadData.path);

        imageUrl = publicUrl;
      }

      const { error: postError } = await supabase
        .from('posts')
        .insert([{
          content,
          image_url: imageUrl,
          latitude: location?.latitude,
          longitude: location?.longitude,
        }]);

      if (postError) throw postError;

      setContent('');
      setSelectedImage(null);
      setLocation(null);
      setIsCreating(false);
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      currentUserId={currentUserId!}
      onUpdate={fetchPosts}
    />
  );

  return (
    <View style={styles.container}>
      {isCreating ? (
        <View style={styles.createPostContainer}>
          <View style={styles.createPostHeader}>
            <Text style={styles.createPostTitle}>Новый пост</Text>
            <TouchableOpacity 
              onPress={() => setIsCreating(false)}
              style={styles.closeButton}
            >
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={styles.input}
            placeholder="Что у вас нового?"
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={4}
            maxLength={2000}
            placeholderTextColor="#8E8E93"
          />

          <View style={styles.attachments}>
            {selectedImage && (
              <View style={styles.selectedImageContainer}>
                <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => setSelectedImage(null)}
                >
                  <X size={20} color="white" />
                </TouchableOpacity>
              </View>
            )}

            {location && (
              <View style={styles.locationTag}>
                <MapPin size={16} color="#007AFF" />
                <Text style={styles.locationTagText}>Геолокация прикреплена</Text>
                <TouchableOpacity onPress={() => setLocation(null)}>
                  <X size={16} color="#666" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.createPostActions}>
            <View style={styles.attachButtons}>
              <TouchableOpacity 
                style={styles.attachButton} 
                onPress={pickImage}
              >
                <ImageIcon size={24} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.attachButton} 
                onPress={attachLocation}
              >
                <MapPin size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={[
                styles.postButton,
                (!content.trim() && !selectedImage) && styles.postButtonDisabled
              ]}
              onPress={handleCreatePost}
              disabled={(!content.trim() && !selectedImage) || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.postButtonText}>Опубликовать</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setIsCreating(true)}
        >
          <Plus size={24} color="white" />
          <Text style={styles.createButtonText}>Создать пост</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Пока нет постов</Text>
            <Text style={styles.emptySubtext}>Будьте первым, кто поделится новостями!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'Inter-SemiBold',
  },
  createPostContainer: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  createPostHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  createPostTitle: {
    fontSize: 20,
    color: '#1c1c1e',
    fontFamily: 'Inter-SemiBold',
  },
  closeButton: {
    padding: 4,
  },
  input: {
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
    color: '#1c1c1e',
    fontFamily: 'Inter-Regular',
  },
  attachments: {
    marginBottom: 16,
  },
  selectedImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f2f2f7',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    padding: 4,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  locationTagText: {
    marginLeft: 6,
    marginRight: 8,
    color: '#007AFF',
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
  },
  createPostActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f2f2f7',
    paddingTop: 16,
  },
  attachButtons: {
    flexDirection: 'row',
  },
  attachButton: {
    marginRight: 16,
  },
  postButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#1c1c1e',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  emptySubtext: {
    fontSize: 15,
    color: '#8e8e93',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
});