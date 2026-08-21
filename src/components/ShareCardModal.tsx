import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop, Text as SvgText, TSpan } from 'react-native-svg';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Note } from '../types/Note';
import { ThemeColors, useTheme } from '../context/ThemeContext';
import { wrapText } from '../utils/wrapText';
import { haptics } from '../utils/haptics';
import { useToast } from '../context/ToastContext';
import { FONT_DISPLAY_BOLD, FONT_DISPLAY_SEMIBOLD } from '../constants/fonts';

// Paylaşılan görsel her zaman markanın koyu/lime kimliğinde render edilir —
// kullanıcının uygulama içi açık/koyu tema tercihinden bağımsız, tıpkı
// Spotify Wrapped gibi tutarlı bir "marka kartı".
const CARD_BG = '#0F1113';
const CARD_SURFACE = '#1C1E21';
const CARD_BORDER = 'rgba(255, 255, 255, 0.1)';
const CARD_ACCENT = '#D1FE17';
const CARD_TEXT = '#F7F7F8';
const CARD_MUTED = 'rgba(247, 247, 248, 0.55)';

const CARD_WIDTH = 360;
const CARD_HEIGHT = 450;
const EXPORT_SCALE = 3;
const MAX_CHARS_PER_LINE = 30;
const MAX_LINES = 8;
const LINE_HEIGHT = 24;
const TEXT_START_Y = 192;

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
              <RadialGradient id="shareCardGlow" cx="88%" cy="6%" r="55%">
                <Stop offset="0" stopColor={CARD_ACCENT} stopOpacity={0.22} />
                <Stop offset="1" stopColor={CARD_ACCENT} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width={CARD_WIDTH} height={CARD_HEIGHT} fill={CARD_BG} />
            <Rect x="0" y="0" width={CARD_WIDTH} height={CARD_HEIGHT} fill="url(#shareCardGlow)" />
            <SvgText
              x="28"
              y="44"
              fontSize="12"
              fontFamily={FONT_DISPLAY_BOLD}
              fill={CARD_ACCENT}
              letterSpacing="1.5"
            >
              GÜNLÜK ASİSTAN
            </SvgText>
            {note.mood && (
              <SvgText x={CARD_WIDTH - 28} y="52" fontSize="26" textAnchor="end">
                {note.mood}
              </SvgText>
            )}
            <SvgText x="28" y="92" fontSize="13" fill={CARD_MUTED}>
              {dateLabel}
            </SvgText>
            <Rect
              x="20"
              y="120"
              width={CARD_WIDTH - 40}
              height={260}
              rx="16"
              fill={CARD_SURFACE}
              stroke={CARD_BORDER}
              strokeWidth="1"
            />
            <SvgText
              x="40"
              y={TEXT_START_Y}
              fontSize="16.5"
              fill={CARD_TEXT}
              fontFamily={FONT_DISPLAY_SEMIBOLD}
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
              fontSize="10.5"
              fill={CARD_MUTED}
              textAnchor="middle"
              letterSpacing="0.5"
            >
              GUNLUKASISTAN.APP
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
      borderRadius: 12,
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
