import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop, Text as SvgText, TSpan } from 'react-native-svg';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Note } from '../types/Note';
import { ThemeColors, useTheme } from '../context/ThemeContext';
import { wrapText } from '../utils/wrapText';
import { haptics } from '../utils/haptics';
import { useToast } from '../context/ToastContext';
import { FONT_DISPLAY_BOLD } from '../constants/fonts';

const CARD_WIDTH = 360;
const CARD_HEIGHT = 450;
const EXPORT_SCALE = 3;
const MAX_CHARS_PER_LINE = 30;
const MAX_LINES = 8;
const LINE_HEIGHT = 24;
const TEXT_START_Y = 190;

interface Props {
  note: Note | null;
  onClose: () => void;
}

export default function ShareCardModal({ note, onClose }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const svgRef = useRef<Svg>(null);
  const [sharing, setSharing] = useState(false);

  if (!note) return null;

  const lines = wrapText(note.text, MAX_CHARS_PER_LINE, MAX_LINES);
  const dateLabel = new Date(note.createdAt).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const handleShare = () => {
    haptics.selection();
    setSharing(true);
    svgRef.current?.toDataURL(
      async (base64: string) => {
        try {
          const file = new File(Paths.cache, `gunluk-${note.id}.png`);
          file.write(base64, { encoding: 'base64' });
          const available = await Sharing.isAvailableAsync();
          if (!available) {
            throw new Error('Bu cihazda paylaşım özelliği kullanılamıyor.');
          }
          await Sharing.shareAsync(file.uri, {
            mimeType: 'image/png',
            dialogTitle: 'Notunu Paylaş',
            UTI: 'public.png',
          });
        } catch (err) {
          showToast(err instanceof Error ? err.message : 'Görsel paylaşılamadı.');
        } finally {
          setSharing(false);
        }
      },
      { width: CARD_WIDTH * EXPORT_SCALE, height: CARD_HEIGHT * EXPORT_SCALE }
    );
  };

  return (
    <Modal visible={!!note} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Görsel Olarak Paylaş</Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Kapat"
          >
            <Ionicons name="close" size={22} color={colors.subtext} />
          </TouchableOpacity>
        </View>

        <View style={styles.previewWrap}>
          <Svg ref={svgRef} width={CARD_WIDTH} height={CARD_HEIGHT} viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`}>
            <Defs>
              <LinearGradient id="shareCardBg" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#C1592E" />
                <Stop offset="1" stopColor="#748034" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width={CARD_WIDTH} height={CARD_HEIGHT} fill="url(#shareCardBg)" />
            <SvgText x="28" y="46" fontSize="15" fontWeight="700" fill="#FFFFFF" opacity={0.9}>
              🌿 Günlük Asistan
            </SvgText>
            {note.mood && (
              <SvgText x={CARD_WIDTH - 28} y="52" fontSize="26" textAnchor="end">
                {note.mood}
              </SvgText>
            )}
            <SvgText x="28" y="92" fontSize="13" fill="#FFFFFF" opacity={0.78}>
              {dateLabel}
            </SvgText>
            <Rect x="20" y="120" width={CARD_WIDTH - 40} height={260} rx="18" fill="#FFFFFF" opacity={0.97} />
            <SvgText
              x="40"
              y={TEXT_START_Y}
              fontSize="16.5"
              fill="#211C15"
              fontWeight="500"
            >
              {lines.map((line, i) => (
                <TSpan key={i} x="40" dy={i === 0 ? 0 : LINE_HEIGHT}>
                  {line}
                </TSpan>
              ))}
            </SvgText>
            <SvgText
              x={CARD_WIDTH / 2}
              y={CARD_HEIGHT - 20}
              fontSize="11"
              fill="#FFFFFF"
              opacity={0.75}
              textAnchor="middle"
            >
              Günlük Asistan ile yazıldı
            </SvgText>
          </Svg>
        </View>

        <TouchableOpacity
          style={[styles.shareButton, sharing && styles.shareButtonDisabled]}
          onPress={handleShare}
          disabled={sharing}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Görseli paylaş"
        >
          {sharing ? (
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <>
              <Ionicons name="share-outline" size={18} color={colors.primaryText} />
              <Text style={styles.shareButtonText}>Görsel Olarak Paylaş</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 18,
    },
    headerTitle: {
      fontSize: 19,
      fontFamily: FONT_DISPLAY_BOLD,
      color: colors.text,
    },
    previewWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    shareButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 15,
      marginTop: 16,
    },
    shareButtonDisabled: {
      opacity: 0.7,
    },
    shareButtonText: {
      color: colors.primaryText,
      fontSize: 15,
      fontWeight: '700',
    },
  });
}
