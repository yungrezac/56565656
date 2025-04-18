import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Check, Search } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface City {
  id: number;
  name: string;
  country: string;
}

const SKATING_STYLES = [
  'Фрискейт',
  'Слалом',
  'Агрессив',
  'Фитнес',
  'Спидскейтинг',
  'Даунхилл',
  'Фигурное катание',
];

export default function ProfileSetupScreen() {
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<City[]>([]);
  const [showCitySearch, setShowCitySearch] = useState(false);
  const [skates, setSkates] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkProfile();
  }, []);

  async function checkProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profile?.full_name) {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Error checking profile:', error);
    }
  }

  async function searchCities(query: string) {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      // This is a mock implementation. In a real app, you would use a geocoding API
      const mockCities: City[] = [
        { id: 1, name: 'Москва', country: 'Россия' },
        { id: 2, name: 'Санкт-Петербург', country: 'Россия' },
        { id: 3, name: 'Новосибирск', country: 'Россия' },
        { id: 4, name: 'Екатеринбург', country: 'Россия' },
        { id: 5, name: 'Казань', country: 'Россия' },
      ].filter(city => 
        city.name.toLowerCase().includes(query.toLowerCase()) ||
        city.country.toLowerCase().includes(query.toLowerCase())
      );

      setSearchResults(mockCities);
    } catch (error) {
      console.error('Error searching cities:', error);
    }
  }

  function toggleStyle(style: string) {
    setSelectedStyles(current =>
      current.includes(style)
        ? current.filter(s => s !== style)
        : [...current, style]
    );
  }

  async function handleSubmit() {
    if (!fullName.trim()) {
      setError('Пожалуйста, укажите ваше имя');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          city: city.trim(),
          skates: skates.split(',').map(s => s.trim()).filter(Boolean),
          experience_years: parseInt(experienceYears) || 0,
          skating_style: selectedStyles,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Ошибка при сохранении профиля');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Настройка профиля',
          headerShown: true,
        }}
      />

      <ScrollView style={styles.container}>
        <Animated.View 
          entering={FadeIn}
          style={styles.content}
        >
          <Text style={styles.title}>Добро пожаловать!</Text>
          <Text style={styles.subtitle}>
            Заполните информацию о себе, чтобы другие роллеры могли вас найти
          </Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Имя или никнейм</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Как вас называть?"
              placeholderTextColor="#8E8E93"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Город</Text>
            <TouchableOpacity
              style={styles.cityInput}
              onPress={() => setShowCitySearch(true)}
            >
              {city ? (
                <Text style={styles.cityText}>{city}</Text>
              ) : (
                <Text style={styles.placeholderText}>Выберите город</Text>
              )}
              <Search size={20} color="#8E8E93" />
            </TouchableOpacity>

            {showCitySearch && (
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    searchCities(text);
                  }}
                  placeholder="Поиск города..."
                  placeholderTextColor="#8E8E93"
                  autoFocus
                />
                {searchResults.length > 0 && (
                  <View style={styles.searchResults}>
                    {searchResults.map((result) => (
                      <TouchableOpacity
                        key={result.id}
                        style={styles.searchResult}
                        onPress={() => {
                          setCity(`${result.name}, ${result.country}`);
                          setShowCitySearch(false);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                      >
                        <Text style={styles.cityName}>{result.name}</Text>
                        <Text style={styles.countryName}>{result.country}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Ролики</Text>
            <TextInput
              style={styles.input}
              value={skates}
              onChangeText={setSkates}
              placeholder="Перечислите ваши ролики через запятую"
              placeholderTextColor="#8E8E93"
              multiline
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Стаж катания (лет)</Text>
            <TextInput
              style={styles.input}
              value={experienceYears}
              onChangeText={setExperienceYears}
              placeholder="Сколько лет вы катаетесь"
              placeholderTextColor="#8E8E93"
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Стиль катания</Text>
            <View style={styles.stylesContainer}>
              {SKATING_STYLES.map((style) => (
                <TouchableOpacity
                  key={style}
                  style={[
                    styles.styleTag,
                    selectedStyles.includes(style) && styles.styleTagSelected
                  ]}
                  onPress={() => toggleStyle(style)}
                >
                  <Text style={[
                    styles.styleText,
                    selectedStyles.includes(style) && styles.styleTextSelected
                  ]}>
                    {style}
                  </Text>
                  {selectedStyles.includes(style) && (
                    <Check size={16} color="white" style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Продолжить</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    color: '#1c1c1e',
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#8e8e93',
    marginBottom: 24,
    fontFamily: 'Inter-Regular',
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
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#1c1c1e',
    marginBottom: 8,
    fontFamily: 'Inter-Medium',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1c1c1e',
    fontFamily: 'Inter-Regular',
  },
  cityInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cityText: {
    fontSize: 16,
    color: '#1c1c1e',
    fontFamily: 'Inter-Regular',
  },
  placeholderText: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Inter-Regular',
  },
  searchContainer: {
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
  },
  searchInput: {
    fontSize: 16,
    color: '#1c1c1e',
    padding: 8,
    fontFamily: 'Inter-Regular',
  },
  searchResults: {
    marginTop: 8,
  },
  searchResult: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  cityName: {
    fontSize: 16,
    color: '#1c1c1e',
    marginBottom: 2,
    fontFamily: 'Inter-Regular',
  },
  countryName: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Inter-Regular',
  },
  stylesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  styleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  styleTagSelected: {
    backgroundColor: '#007AFF',
  },
  styleText: {
    fontSize: 14,
    color: '#1c1c1e',
    fontFamily: 'Inter-Regular',
  },
  styleTextSelected: {
    color: 'white',
  },
  checkIcon: {
    marginLeft: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
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