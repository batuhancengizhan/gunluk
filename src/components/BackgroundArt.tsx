import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { getBackgroundTheme } from '../constants/backgroundThemes';

const VIEW_BOX = '0 0 400 800';

interface Props {
  themeId: string;
  style?: StyleProp<ViewStyle>;
}

// Higgsfield'in koyu zemin + yumuşak renkli ışıma diline dayanan arka plan:
// eski çizgi film illüstrasyonları yerine, tema rengine sahip iki yumuşak
// radial-gradient "glow" bulutu, uygulamanın kendi zemin rengi üzerinde.
export default function BackgroundArt({ themeId, style }: Props) {
  const { colors } = useTheme();
  const theme = getBackgroundTheme(themeId);

  if (!theme.glow) {
    return (
      <Svg style={style} width="100%" height="100%" viewBox={VIEW_BOX}>
        <Rect x={0} y={0} width={400} height={800} fill={colors.background} />
      </Svg>
    );
  }

  const hex = theme.glow;

  return (
    <Svg
      style={style}
      width="100%"
      height="100%"
      viewBox={VIEW_BOX}
      preserveAspectRatio="xMidYMid slice"
    >
      <Defs>
        <RadialGradient id="glowA" cx="82%" cy="12%" r="52%">
          <Stop offset="0" stopColor={hex} stopOpacity={0.32} />
          <Stop offset="1" stopColor={hex} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="glowB" cx="8%" cy="88%" r="46%">
          <Stop offset="0" stopColor={hex} stopOpacity={0.2} />
          <Stop offset="1" stopColor={hex} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={400} height={800} fill={colors.background} />
      <Rect x={0} y={0} width={400} height={800} fill="url(#glowA)" />
      <Rect x={0} y={0} width={400} height={800} fill="url(#glowB)" />
    </Svg>
  );
}
