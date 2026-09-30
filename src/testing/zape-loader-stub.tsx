import { useEffect } from 'react';
import { View } from 'react-native';
import type { ZapeLoader as RealZapeLoader } from '@/components/brand/zape-loader';

/** Jest's `ZapeLoader`: no frames run, so it reports the ident built as soon as it mounts. */
export const ZapeLoader: typeof RealZapeLoader = ({ label, testID, onBuilt }) => {
  useEffect(() => onBuilt?.(), [onBuilt]);
  return <View testID={testID} accessibilityLabel={label} />;
};
