import { I18nManager, View, useWindowDimensions } from 'react-native';
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

function HomeOrb({ joined, testID }: { joined: boolean; testID: string }) {
  const { palette } = useTone();
  return (
    <View
      testID={testID}
      style={{
        width: ORB,
        height: ORB,
        borderRadius: ORB / 2,
        borderWidth: 1,
        borderStyle: joined ? 'solid' : 'dashed',
        borderColor: joined ? palette.edge : BURGUNDY,
        backgroundColor: joined ? palette.glass : 'transparent',
      }}>
      {joined ? (
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
    </View>
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
export function HomeThread({ relationship }: { relationship: Pick<Relationship, 'members'> }) {
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

  return (
    <View
      testID="home-thread"
      style={{ height: HEIGHT + 4, marginHorizontal: 16, direction: 'ltr' }}
      accessible
      accessibilityLabel={
        joined
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
        <HomeOrb joined testID="orb-you" />
        <OrbLabel name={t('home.you')} />
      </View>
      <View style={{ position: 'absolute', left: partnerX - 48, top: 0, alignItems: 'center' }}>
        <HomeOrb joined={joined} testID="orb-partner" />
        {joined ? (
          <OrbLabel name={partner?.name ?? t('home.partner')} />
        ) : (
          <OrbLabel name={t('home.notJoined')} meta={t('home.invited')} />
        )}
      </View>
    </View>
  );
}
