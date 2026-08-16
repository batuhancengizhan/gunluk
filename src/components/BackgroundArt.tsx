import Svg, {
  Circle,
  Ellipse,
  G,
  Line,
  Path,
  Polygon,
  Rect,
} from 'react-native-svg';
import { StyleProp, ViewStyle } from 'react-native';

const VIEW_BOX = '0 0 400 800';

interface SceneProps {
  style?: StyleProp<ViewStyle>;
}

function SvgBase({ style, children }: SceneProps & { children: React.ReactNode }) {
  return (
    <Svg
      style={style}
      width="100%"
      height="100%"
      viewBox={VIEW_BOX}
      preserveAspectRatio="xMidYMid slice"
    >
      {children}
    </Svg>
  );
}

function ForestScene({ style }: SceneProps) {
  const trees = [
    { x: 30, s: 1.1 },
    { x: 85, s: 0.85 },
    { x: 140, s: 1.3 },
    { x: 195, s: 0.95 },
    { x: 250, s: 1.15 },
    { x: 305, s: 0.9 },
    { x: 360, s: 1.05 },
    { x: 60, s: 0.7 },
    { x: 165, s: 0.65 },
    { x: 320, s: 0.7 },
  ];

  return (
    <SvgBase style={style}>
      <Rect x={0} y={0} width={400} height={800} fill="#F3F6EE" />
      <Circle cx={310} cy={140} r={70} fill="#F7ECC9" opacity={0.6} />
      <Circle cx={310} cy={140} r={40} fill="#F3E2A8" opacity={0.7} />
      <Ellipse cx={200} cy={470} rx={280} ry={160} fill="#DCE8D2" />
      <Ellipse cx={210} cy={560} rx={260} ry={140} fill="#C7DBB9" />
      {trees.map((t, i) => (
        <G key={i} transform={`translate(${t.x} 620) scale(${t.s})`}>
          <Rect x={-4} y={40} width={8} height={26} fill="#8A9B78" />
          <Polygon points="0,-56 -30,10 30,10" fill="#A9C293" />
          <Polygon points="0,-34 -26,26 26,26" fill="#93B57C" />
          <Polygon points="0,-10 -22,40 22,40" fill="#7DA166" />
        </G>
      ))}
      <Rect x={0} y={700} width={400} height={100} fill="#B4CBA0" />
    </SvgBase>
  );
}

function SeaScene({ style }: SceneProps) {
  const waves = [
    { y: 470, opacity: 0.5 },
    { y: 520, opacity: 0.45 },
    { y: 575, opacity: 0.4 },
    { y: 635, opacity: 0.35 },
  ];

  return (
    <SvgBase style={style}>
      <Rect x={0} y={0} width={400} height={430} fill="#E4F0F6" />
      <Circle cx={90} cy={130} r={54} fill="#FBF6E4" opacity={0.85} />
      <Path
        d="M40,220 Q60,214 80,220 T120,220 T160,220"
        stroke="#FFFFFF"
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
        opacity={0.7}
      />
      <Path
        d="M230,170 Q250,164 270,170 T310,170"
        stroke="#FFFFFF"
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
        opacity={0.6}
      />
      <Rect x={0} y={430} width={400} height={370} fill="#BFDCE8" />
      {waves.map((w, i) => (
        <Path
          key={i}
          d={`M0,${w.y} Q50,${w.y - 14} 100,${w.y} T200,${w.y} T300,${w.y} T400,${w.y}`}
          stroke="#E8F4F9"
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
          opacity={w.opacity}
        />
      ))}
      <G transform="translate(300 400)">
        <Polygon points="0,-46 0,4 34,4" fill="#F5F0E0" opacity={0.85} />
        <Rect x={-6} y={4} width={12} height={16} fill="#D8CBAE" />
      </G>
    </SvgBase>
  );
}

function SkyScene({ style }: SceneProps) {
  const clouds = [
    { x: 90, y: 180, s: 1.1, o: 0.9 },
    { x: 260, y: 320, s: 0.85, o: 0.85 },
    { x: 60, y: 420, s: 0.7, o: 0.75 },
    { x: 300, y: 540, s: 1.0, o: 0.8 },
    { x: 150, y: 650, s: 0.6, o: 0.7 },
  ];

  return (
    <SvgBase style={style}>
      <Rect x={0} y={0} width={400} height={800} fill="#EAF5FC" />
      <Circle cx={330} cy={110} r={60} fill="#FFF7DE" opacity={0.7} />
      {clouds.map((c, i) => (
        <G key={i} transform={`translate(${c.x} ${c.y}) scale(${c.s})`} opacity={c.o}>
          <Ellipse cx={0} cy={0} rx={54} ry={26} fill="#FFFFFF" />
          <Ellipse cx={-32} cy={8} rx={30} ry={20} fill="#FFFFFF" />
          <Ellipse cx={32} cy={8} rx={32} ry={20} fill="#FFFFFF" />
          <Ellipse cx={0} cy={-14} rx={30} ry={20} fill="#FFFFFF" />
        </G>
      ))}
    </SvgBase>
  );
}

function RainyScene({ style }: SceneProps) {
  const drops = Array.from({ length: 26 }).map((_, i) => {
    const x = (i * 37 + (i % 3) * 11) % 400;
    const y = (i * 53) % 700;
    return { x, y, o: 0.25 + ((i * 7) % 5) * 0.07 };
  });
  const ripples = [
    { cx: 90, cy: 730 },
    { cx: 230, cy: 760 },
    { cx: 330, cy: 715 },
  ];

  return (
    <SvgBase style={style}>
      <Rect x={0} y={0} width={400} height={800} fill="#E7ECEF" />
      <Ellipse cx={110} cy={140} rx={70} ry={34} fill="#CDD6DC" opacity={0.85} />
      <Ellipse cx={70} cy={155} rx={44} ry={26} fill="#CDD6DC" opacity={0.85} />
      <Ellipse cx={280} cy={100} rx={80} ry={36} fill="#D6DEE3" opacity={0.8} />
      <Ellipse cx={330} cy={118} rx={48} ry={26} fill="#D6DEE3" opacity={0.8} />
      {drops.map((d, i) => (
        <Line
          key={i}
          x1={d.x}
          y1={d.y}
          x2={d.x - 14}
          y2={d.y + 34}
          stroke="#AFC0CB"
          strokeWidth={2.5}
          strokeLinecap="round"
          opacity={d.o}
        />
      ))}
      <Rect x={0} y={700} width={400} height={100} fill="#C7D2D9" opacity={0.6} />
      {ripples.map((r, i) => (
        <G key={i}>
          <Ellipse cx={r.cx} cy={r.cy} rx={22} ry={7} fill="none" stroke="#FFFFFF" strokeWidth={2} opacity={0.5} />
          <Ellipse cx={r.cx} cy={r.cy} rx={11} ry={3.5} fill="none" stroke="#FFFFFF" strokeWidth={2} opacity={0.6} />
        </G>
      ))}
    </SvgBase>
  );
}

const SCENES: Record<string, (props: SceneProps) => React.JSX.Element> = {
  forest: ForestScene,
  ocean: SeaScene,
  sky: SkyScene,
  rainy: RainyScene,
};

export function hasBackgroundArt(themeId: string): boolean {
  return themeId in SCENES;
}

export default function BackgroundArt({
  themeId,
  style,
}: {
  themeId: string;
  style?: StyleProp<ViewStyle>;
}) {
  const Scene = SCENES[themeId];
  if (!Scene) return null;
  return <Scene style={style} />;
}
