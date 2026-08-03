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
import NoteEditModal from '../components/NoteEditModal';
import { ThemeColors, useTheme } from '../context/ThemeContext';

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
    return notes.filter((note) => {
      if (favoritesOnly && !note.isFavorite) return false;
      if (query.trim() && !note.text.toLowerCase().includes(query.trim().toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [notes, query, favoritesOnly]);

  const handleDelete = (id: string) => {
    Alert.alert('Notu sil', 'Bu notu silmek istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await deleteNote(id);
          loadNotes();
        },
      },
    ]);
  };

  const handleToggleFavorite = async (id: string) => {
    await toggleFavorite(id);
    loadNotes();
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
                style={[styles.favoriteToggle, favoritesOnly && styles.favoriteToggleActive]}
                onPress={() => setFavoritesOnly((prev) => !prev)}
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
              <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
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
      borderRadius: 10,
      paddingHorizontal: 12,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.text,
    },
    favoriteToggle: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.favoriteBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    favoriteToggleActive: {
      backgroundColor: colors.favorite,
    },
    noResultsText: {
      textAlign: 'center',
      color: colors.subtext,
      fontSize: 13,
      marginTop: 12,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    date: {
      fontSize: 12,
      color: colors.subtext,
    },
    noteText: {
      fontSize: 15,
      color: colors.text,
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
