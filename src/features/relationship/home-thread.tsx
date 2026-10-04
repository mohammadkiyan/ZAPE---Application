import type { ReactNode } from 'react';
import { I18nManager, Pressable, View, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import type { Relationship } from '@/api/contracts/relationship';
import { Text } from '@/components/ui/text';
import { Thread } from '@/features/shell/thread';
import { BURGUNDY } from '@/theme/clock-themes';
import { useTone } from '@/theme/theme';

const ORB = 56;
const HEIGHT = 112;

/** Path from an orb's inner side down to the clock at the bottom centre. */
function halfPath(orbX: number, centre: number): { d: string; length: number } {
  const inward = orbX < centre ? 1 : -1;
  const x0 = orbX + inward * (ORB / 2 + 4);
  const y0 = ORB / 2;
  const d = `M${x0} ${y0}C${centre - inward * 36} ${y0} ${centre} ${HEIGHT * 0.5} ${centre} ${HEIGHT}`;
  return { d, length: Math.round(Math.abs(centre - x0) + HEIGHT - y0) };
}

/**
 * What an orb shows once a feature has something to put in it (the status feature fills both).
 * Without it an orb shows the relationship's own state: the person, or "not joined yet".
 */
export interface HomeOrbContent {
  /** Drawn inside the orb, e.g. a mood glyph. */
  glyph?: ReactNode;
  /** A dashed, hollow orb: nothing has been set yet. */
  empty?: boolean;
  label: string;
  meta?: string;
  accessibilityLabel: string;
}

function HomeOrb({
  joined,
  empty = false,
  testID,
  children,
}: {
  joined: boolean;
  empty?: boolean;
  testID: string;
  children?: ReactNode;
}) {
  const { palette } = useTone();
  const solid = joined && !empty;
  return (
    <View
      testID={testID}
      style={{
        width: ORB,
        height: ORB,
        borderRadius: ORB / 2,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderStyle: solid ? 'solid' : 'dashed',
        borderColor: solid ? palette.edge : joined ? palette.control : BURGUNDY,
        backgroundColor: solid ? palette.glass : 'transparent',
      }}>
      {solid ? (
        <View
          style={{
            position: 'absolute',
            top: 5,
            left: 5,
            right: 5,
            bottom: 5,
            borderRadius: ORB / 2 - 5,
            borderWidth: 1,
            borderColor: palette.inner,
          }}
        />
      ) : null}
      {children}
    </View>
  );
}

/** An orb with its label: a button when it has content to open, plain otherwise. */
function OrbColumn({
  testID,
  content,
  onPress,
  children,
}: {
  testID: string;
  content: HomeOrbContent | undefined;
  onPress: (() => void) | undefined;
  children: ReactNode;
}) {
  if (!content || !onPress) return <View style={{ alignItems: 'center' }}>{children}</View>;
  return (
    <Pressable
      testID={`${testID}-button`}
      accessibilityRole="button"
      accessibilityLabel={content.accessibilityLabel}
      onPress={onPress}
      style={{ alignItems: 'center' }}>
      {children}
    </Pressable>
  );
}

function OrbLabel({ name, meta }: { name: string; meta?: string }) {
  return (
    <View className="items-center" style={{ width: 96 }}>
      <Text className="text-sm font-medium" numberOfLines={1}>
        {name}
      </Text>
      {meta ? (
        <Text className="text-xs text-muted-foreground" numberOfLines={1}>
          {meta}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * The red thread on Home: the "you" and "partner" orbs, each with a half that meets at the
 * clock below. "You" comes from the reading start (right in Persian). The partner's half and
 * orb are dashed until they join.
 */
export function HomeThread({
  relationship,
  you: youContent,
  partner: partnerContent,
  onPressOrb,
}: {
  relationship: Pick<Relationship, 'members'>;
  you?: HomeOrbContent;
  /** Ignored until the partner has joined. */
  partner?: HomeOrbContent;
  /** Makes both orbs buttons, e.g. to open the Status tab. */
  onPressOrb?: () => void;
}) {
  const { t } = useTranslation('relationship');
  const { width } = useWindowDimensions();
  const w = width - 32;
  const centre = w / 2;
  const partner = relationship.members.find((member) => !member.isYou);
  const joined = Boolean(partner);
  // Positions are drawn left-to-right; the reading start is on the right in RTL.
  const youX = I18nManager.isRTL ? w - ORB / 2 - 20 : ORB / 2 + 20;
  const partnerX = w - youX;
  const you = halfPath(youX, centre);
  const other = halfPath(partnerX, centre);

  // With orb content each orb is its own control; otherwise the thread reads as one element.
  const filled = Boolean(youContent || (joined && partnerContent));

  return (
    <View
      testID="home-thread"
      style={{ height: HEIGHT + 4, marginHorizontal: 16, direction: 'ltr' }}
      accessible={!filled}
      accessibilityLabel={
        filled
          ? undefined
          : joined
            ? `${t('home.you')}، ${partner?.name ?? t('home.partner')}`
            : `${t('home.you')}، ${t('home.partner')}: ${t('home.notJoined')}`
      }>
      <Svg
        width={w}
        height={HEIGHT + 4}
        style={{ position: 'absolute', left: 0, top: 0 }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants">
        <Thread testID="thread-you" d={you.d} length={you.length} />
        {joined ? (
          <Thread testID="thread-partner" d={other.d} length={other.length} />
        ) : (
          <Path
            testID="thread-partner"
            d={other.d}
            fill="none"
            stroke={BURGUNDY}
            strokeOpacity={0.55}
            strokeWidth={1.5}
            strokeDasharray={[4, 5]}
            strokeLinecap="round"
          />
        )}
      </Svg>
      <View style={{ position: 'absolute', left: youX - 48, top: 0, alignItems: 'center' }}>
        <OrbColumn testID="orb-you" content={youContent} onPress={onPressOrb}>
          <HomeOrb joined empty={youContent?.empty} testID="orb-you">
            {youContent?.glyph}
          </HomeOrb>
          <OrbLabel name={youContent?.label ?? t('home.you')} meta={youContent?.meta} />
        </OrbColumn>
      </View>
      <View style={{ position: 'absolute', left: partnerX - 48, top: 0, alignItems: 'center' }}>
        {joined ? (
          <OrbColumn testID="orb-partner" content={partnerContent} onPress={onPressOrb}>
            <HomeOrb joined empty={partnerContent?.empty} testID="orb-partner">
              {partnerContent?.glyph}
            </HomeOrb>
            <OrbLabel
              name={partnerContent?.label ?? partner?.name ?? t('home.partner')}
              meta={partnerContent?.meta}
            />
          </OrbColumn>
        ) : (
          <>
            <HomeOrb joined={false} testID="orb-partner" />
            <OrbLabel name={t('home.notJoined')} meta={t('home.invited')} />
          </>
        )}
      </View>
    </View>
  );
}
