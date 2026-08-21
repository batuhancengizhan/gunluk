import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Note } from '../types/Note';
import { deleteNote, getNotes, restoreNote, toggleFavorite, updateNote } from '../storage/notesStorage';
import WeeklySummaryCard from '../components/WeeklySummaryCard';
import PatternInsightsCard from '../components/PatternInsightsCard';
import MoodCalendar from '../components/MoodCalendar';
import MoodTrendChart from '../components/MoodTrendChart';
import OnThisDayCard from '../components/OnThisDayCard';
import NoteEditModal from '../components/NoteEditModal';
import AudioPlaybackButton from '../components/AudioPlaybackButton';
import { ThemeColors, useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { cardShadow } from '../utils/shadow';
import { haptics } from '../utils/haptics';
import { moodLabel } from '../constants/moods';
import {
  cancelTimeCapsuleNotification,
  formatRevealDate,
  isRevealPending,
  scheduleTimeCapsuleNotification,
} from '../utils/timeCapsule';

function formatDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HistoryScreen() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortAscending, setSortAscending] = useState(false);
  const [moodFilter, setMoodFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotes();
      setNotes(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [loadNotes])
  );

  const availableMoods = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const note of notes) {
      if (note.mood && !seen.has(note.mood)) {
        seen.add(note.mood);
        ordered.push(note.mood);
      }
    }
    return ordered;
  }, [notes]);

  const availableTags = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const note of notes) {
      for (const tag of note.tags ?? []) {
        if (!seen.has(tag)) {
          seen.add(tag);
          ordered.push(tag);
        }
      }
    }
    return ordered;
  }, [notes]);

  const filteredNotes = useMemo(() => {
    const filtered = notes.filter((note) => {
      if (favoritesOnly && !note.isFavorite) return false;
      if (moodFilter && note.mood !== moodFilter) return false;
      if (tagFilter && !note.tags?.includes(tagFilter)) return false;
      if (query.trim() && !note.text.toLowerCase().includes(query.trim().toLowerCase())) {
        return false;
      }
      return true;
    });
    // notes zaten en yeniden en eskiye sıralı geliyor (bkz. notesStorage.getNotes)
    return sortAscending ? [...filtered].reverse() : filtered;
  }, [notes, query, favoritesOnly, moodFilter, tagFilter, sortAscending]);

  const handleDelete = async (note: Note) => {
    haptics.medium();
    setNotes((prev) => prev.filter((n) => n.id !== note.id));
    await deleteNote(note.id);
    if (isRevealPending(note.revealAt)) {
      await cancelTimeCapsuleNotification(note.id);
    }
    haptics.warning();

    showToast('Not silindi.', {
      duration: 4000,
      action: {
        label: 'Geri Al',
        onPress: async () => {
          await restoreNote(note);
          if (isRevealPending(note.revealAt)) {
            await scheduleTimeCapsuleNotification(note);
          }
          haptics.selection();
          loadNotes();
        },
      },
    });
  };

  const handleToggleFavorite = async (id: string) => {
    haptics.selection();
    await toggleFavorite(id);
    loadNotes();
  };

  const handleToggleSort = () => {
    haptics.selection();
    setSortAscending((prev) => !prev);
  };

  const handleToggleFavoritesOnly = () => {
    haptics.selection();
    setFavoritesOnly((prev) => !prev);
  };

  const handleMoodFilterPress = (emoji: string) => {
    haptics.selection();
    setMoodFilter((prev) => (prev === emoji ? null : emoji));
  };

  const handleTagFilterPress = (tag: string) => {
    haptics.selection();
    setTagFilter((prev) => (prev === tag ? null : tag));
  };

  const handleSaveEdit = async (
    id: string,
    text: string,
    photoUri: string | null,
    audioUri: string | null
  ) => {
    await updateNote(id, text, photoUri, audioUri);
    setEditingNote(null);
    loadNotes();
  };

  if (!loading && notes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Henüz hiç günlük notun yok.</Text>
        <Text style={styles.emptySubtext}>Not Yaz sekmesinden ilk notunu ekleyebilirsin.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadNotes}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <OnThisDayCard notes={notes} onPress={setEditingNote} />
            <WeeklySummaryCard notes={notes} />
            <PatternInsightsCard notes={notes} />
            <MoodCalendar notes={notes} onDayPress={setEditingNote} />
            <MoodTrendChart notes={notes} />

            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={16} color={colors.subtext} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Notlarda ara..."
                  placeholderTextColor={colors.subtext}
                  value={query}
                  onChangeText={setQuery}
                />
              </View>
              <TouchableOpacity
                style={styles.iconToggle}
                onPress={handleToggleSort}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Sıralama yönü"
                accessibilityHint={
                  sortAscending
                    ? 'En eski notlar üstte gösteriliyor, en yeniye çevirmek için dokun'
                    : 'En yeni notlar üstte gösteriliyor, en eskiye çevirmek için dokun'
                }
              >
                <Ionicons
                  name={sortAscending ? 'arrow-up-outline' : 'arrow-down-outline'}
                  size={18}
                  color={colors.text}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconToggle, favoritesOnly && styles.favoriteToggleActive]}
                onPress={handleToggleFavoritesOnly}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Sadece favorileri göster"
                accessibilityState={{ selected: favoritesOnly }}
              >
                <Ionicons
                  name={favoritesOnly ? 'star' : 'star-outline'}
                  size={18}
                  color={favoritesOnly ? colors.primaryText : colors.favorite}
                />
              </TouchableOpacity>
            </View>

            {availableMoods.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.moodFilterScroll}
                contentContainerStyle={styles.moodFilterRow}
              >
                {availableMoods.map((emoji) => {
                  const active = moodFilter === emoji;
                  return (
                    <TouchableOpacity
                      key={emoji}
                      style={[styles.moodChip, active && styles.moodChipActive]}
                      onPress={() => handleMoodFilterPress(emoji)}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel={`${moodLabel(emoji)} ruh haline göre filtrele`}
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={styles.moodChipEmoji}>{emoji}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {availableTags.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tagFilterScroll}
                contentContainerStyle={styles.tagFilterRow}
              >
                {availableTags.map((tag) => {
                  const active = tagFilter === tag;
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[styles.tagFilterChip, active && styles.tagFilterChipActive]}
                      onPress={() => handleTagFilterPress(tag)}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel={`#${tag} etiketine göre filtrele`}
                      accessibilityState={{ selected: active }}
                    >
                      <Text
                        style={[
                          styles.tagFilterChipText,
                          active && styles.tagFilterChipTextActive,
                        ]}
                      >
                        #{tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {filteredNotes.length === 0 && (
              <Text style={styles.noResultsText}>Eşleşen not bulunamadı.</Text>
            )}
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => setEditingNote(item)}
            onLongPress={() => handleDelete(item)}
            accessibilityRole="button"
            accessibilityLabel={`${formatDate(item.createdAt)} tarihli not${item.updatedAt ? ' (düzenlendi)' : ''}: ${item.text}`}
            accessibilityHint="Düzenlemek için dokun, silmek için uzun bas"
          >
            <View style={styles.cardHeader}>
              <View style={styles.dateRow}>
                {item.mood && <Text style={styles.moodBadge}>{item.mood}</Text>}
                <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                {item.updatedAt && <Text style={styles.editedTag}>· düzenlendi</Text>}
              </View>
              <TouchableOpacity
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => handleToggleFavorite(item.id)}
                accessibilityRole="button"
                accessibilityLabel={item.isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                accessibilityState={{ selected: item.isFavorite }}
              >
                <Ionicons
                  name={item.isFavorite ? 'star' : 'star-outline'}
                  size={18}
                  color={colors.favorite}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.noteText}>{item.text}</Text>
            {item.tags && item.tags.length > 0 && (
              <View style={styles.cardTagRow}>
                {item.tags.map((tag) => (
                  <View key={tag} style={styles.cardTagChip}>
                    <Text style={styles.cardTagChipText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}
            {item.photoUri && (
              <Image source={{ uri: item.photoUri }} style={styles.cardPhoto} />
            )}
            {item.audioUri && (
              <AudioPlaybackButton uri={item.audioUri} style={styles.cardAudioButton} />
            )}
            {isRevealPending(item.revealAt) && (
              <View style={styles.capsuleBadge}>
                <Ionicons name="mail-outline" size={12} color={colors.primary} />
                <Text style={styles.capsuleBadgeText}>
                  {formatRevealDate(item.revealAt!)} tarihinde hatırlatılacak
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      <NoteEditModal
        note={editingNote}
        onClose={() => setEditingNote(null)}
        onSave={handleSaveEdit}
      />
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listContent: {
      padding: 16,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    searchBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 11,
      paddingHorizontal: 14,
      gap: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 11,
      fontSize: 14.5,
      color: colors.text,
    },
    iconToggle: {
      width: 42,
      height: 42,
      borderRadius: 11,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    favoriteToggleActive: {
      backgroundColor: colors.favorite,
      borderColor: colors.favorite,
    },
    moodFilterScroll: {
      marginBottom: 12,
    },
    moodFilterRow: {
      gap: 8,
      paddingRight: 8,
    },
    moodChip: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    moodChipActive: {
      backgroundColor: colors.favoriteBg,
      borderColor: colors.primary,
    },
    moodChipEmoji: {
      fontSize: 16,
    },
    tagFilterScroll: {
      marginBottom: 12,
    },
    tagFilterRow: {
      gap: 8,
      paddingRight: 8,
    },
    tagFilterChip: {
      backgroundColor: colors.card,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tagFilterChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    tagFilterChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.subtext,
    },
    tagFilterChipTextActive: {
      color: colors.primaryText,
    },
    noResultsText: {
      textAlign: 'center',
      color: colors.subtext,
      fontSize: 13,
      marginTop: 12,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      ...cardShadow(colors),
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    moodBadge: {
      fontSize: 15,
    },
    date: {
      fontSize: 11.5,
      fontWeight: '600',
      color: colors.subtext,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    editedTag: {
      fontSize: 11.5,
      fontWeight: '500',
      color: colors.subtext,
      fontStyle: 'italic',
    },
    noteText: {
      fontSize: 15.5,
      color: colors.text,
      lineHeight: 22,
    },
    cardTagRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 8,
    },
    cardTagChip: {
      backgroundColor: colors.favoriteBg,
      borderRadius: 10,
      paddingHorizontal: 9,
      paddingVertical: 3,
    },
    cardTagChipText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.favorite,
    },
    cardAudioButton: {
      marginTop: 10,
    },
    cardPhoto: {
      width: '100%',
      height: 140,
      borderRadius: 12,
      marginTop: 10,
      backgroundColor: colors.background,
    },
    capsuleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 10,
    },
    capsuleBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.primary,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: colors.background,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 6,
      color: colors.text,
    },
    emptySubtext: {
      fontSize: 13,
      color: colors.subtext,
      textAlign: 'center',
    },
  });
}
