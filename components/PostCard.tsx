import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { Heart, MessageCircle, Share, MapPin, MoveVertical as MoreVertical } from 'lucide-react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import PostOptionsModal from './PostOptionsModal';
import PostEditModal from './PostEditModal';

interface PostCardProps {
  post: {
    id: string;
    user_id: string;
    content: string;
    image_url: string | null;
    likes: number;
    comments_count: number;
    latitude?: number;
    longitude?: number;
    created_at: string;
    liked_by_user: boolean;
    user: {
      full_name: string;
      avatar_url: string;
    } | null;
  };
  currentUserId: string;
  onUpdate: () => void;
}

const DEFAULT_AVATAR = 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400';

export default function PostCard({ post, currentUserId, onUpdate }: PostCardProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const router = useRouter();

  const isOwnPost = post.user_id === currentUserId;

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diff = now.getTime() - past.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 60) return `${minutes} мин.`;
    if (hours < 24) return `${hours} ч.`;
    if (days < 7) return `${days} дн.`;
    return past.toLocaleDateString();
  };

  async function handleLike() {
    try {
      if (post.liked_by_user) {
        await supabase
          .from('likes')
          .delete()
          .match({ post_id: post.id, user_id: currentUserId });
      } else {
        await supabase
          .from('likes')
          .insert({ post_id: post.id, user_id: currentUserId });
      }

      onUpdate();
    } catch (error) {
      console.error('Error handling like:', error);
    }
  }

  async function handleDelete() {
    Alert.alert(
      'Удаление поста',
      'Вы уверены, что хотите удалить этот пост?',
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', post.id);

              if (error) throw error;
              onUpdate();
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Ошибка', 'Не удалось удалить пост');
            }
          },
        },
      ]
    );
  }

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.header}
          onPress={() => router.push(`/${post.user_id}`)}
        >
          <Image
            source={{ uri: post.user?.avatar_url || DEFAULT_AVATAR }}
            style={styles.avatar}
          />
          <View style={styles.headerText}>
            <Text style={styles.userName}>{post.user?.full_name || 'Unknown User'}</Text>
            <Text style={styles.postTime}>{getTimeAgo(post.created_at)}</Text>
          </View>
          {isOwnPost && (
            <TouchableOpacity 
              style={styles.optionsButton}
              onPress={() => setShowOptions(true)}
            >
              <MoreVertical size={24} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        <Text style={styles.content}>{post.content}</Text>

        {post.image_url && (
          <Image
            source={{ uri: post.image_url }}
            style={styles.image}
          />
        )}

        {(post.latitude && post.longitude) && (
          <View style={styles.locationContainer}>
            <MapPin size={16} color="#666" />
            <Text style={styles.locationText}>
              {post.latitude.toFixed(6)}, {post.longitude.toFixed(6)}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleLike}
          >
            <Heart 
              size={24} 
              color={post.liked_by_user ? "#ff4b4b" : "#666"} 
              fill={post.liked_by_user ? "#ff4b4b" : "none"}
            />
            <Text style={[
              styles.actionText,
              post.liked_by_user && styles.actionTextActive
            ]}>
              {post.likes}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push(`/post/${post.id}`)}
          >
            <MessageCircle size={24} color="#666" />
            <Text style={styles.actionText}>{post.comments_count}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Share size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <PostOptionsModal
        visible={showOptions}
        onClose={() => setShowOptions(false)}
        onEdit={() => setShowEditModal(true)}
        onDelete={handleDelete}
      />

      <PostEditModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        post={post}
        onUpdate={onUpdate}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    color: '#1c1c1e',
    marginBottom: 2,
    fontFamily: 'Inter-SemiBold',
  },
  postTime: {
    fontSize: 13,
    color: '#8e8e93',
    fontFamily: 'Inter-Regular',
  },
  optionsButton: {
    padding: 4,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1c1c1e',
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontFamily: 'Inter-Regular',
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: '#f2f2f7',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  locationText: {
    marginLeft: 6,
    color: '#666',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f2f2f7',
    padding: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    marginLeft: 6,
    color: '#666',
    fontSize: 15,
    fontFamily: 'Inter-Medium',
  },
  actionTextActive: {
    color: '#ff4b4b',
  },
});