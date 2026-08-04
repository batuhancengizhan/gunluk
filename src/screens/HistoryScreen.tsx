import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Note } from '../types/Note';
import { deleteNote, getNotes, toggleFavorite, updateNoteText } from '../storage/notesStorage';
import WeeklySummaryCard from '../components/WeeklySummaryCard';
import MoodCalendar from '../components/MoodCalendar';
import NoteEditModal from '../components/NoteEditModal';
import { ThemeColors, useTheme } from '../context/ThemeContext';
import { cardShadow, softShadow } from '../utils/shadow';
import { haptics } from '../utils/haptics';

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
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortAscending, setSortAscending] = useState(false);
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

  const filteredNotes = useMemo(() => {
    const filtered = notes.filter((note) => {
      if (favoritesOnly && !note.isFavorite) return false;
      if (query.trim() && !note.text.toLowerCase().includes(query.trim().toLowerCase())) {
        return false;
      }
      return true;
    });
    // notes zaten en yeniden en eskiye sıralı geliyor (bkz. notesStorage.getNotes)
    return sortAscending ? [...filtered].reverse() : filtered;
  }, [notes, query, favoritesOnly, sortAscending]);

  const handleDelete = (id: string) => {
    Alert.alert('Notu sil', 'Bu notu silmek istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await deleteNote(id);
          haptics.warning();
          loadNotes();
        },
      },
    ]);
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

  const handleSaveEdit = async (id: string, text: string) => {
    await updateNoteText(id, text);
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
        onRefresh={loadNotes}
        refreshing={loading}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <WeeklySummaryCard notes={notes} />
            <MoodCalendar notes={notes} />

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
              >
                <Ionicons
                  name={favoritesOnly ? 'star' : 'star-outline'}
                  size={18}
                  color={favoritesOnly ? colors.primaryText : colors.favorite}
                />
              </TouchableOpacity>
            </View>

            {filteredNotes.length === 0 && (
              <Text style={styles.noResultsText}>Eşleşen not bulunamadı.</Text>
            )}
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => setEditingNote(item)}
            onLongPress={() => handleDelete(item.id)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.dateRow}>
                {item.mood && <Text style={styles.moodBadge}>{item.mood}</Text>}
                <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
              </View>
              <TouchableOpacity
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => handleToggleFavorite(item.id)}
              >
                <Ionicons
                  name={item.isFavorite ? 'star' : 'star-outline'}
                  size={18}
                  color={colors.favorite}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.noteText}>{item.text}</Text>
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
      borderRadius: 12,
      paddingHorizontal: 14,
      gap: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...softShadow(colors),
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
      borderRadius: 12,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...softShadow(colors),
    },
    favoriteToggleActive: {
      backgroundColor: colors.favorite,
      borderColor: colors.favorite,
    },
    noResultsText: {
      textAlign: 'center',
      color: colors.subtext,
      fontSize: 13,
      marginTop: 12,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: StyleSheet.hairlineWidth,
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
    noteText: {
      fontSize: 15.5,
      color: colors.text,
      lineHeight: 22,
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
