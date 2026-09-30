/* global jest */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('react-native-worklets', () => require('react-native-worklets/lib/module/mock'));
// Augments Reanimated's own mock, which expo-router's testing library also loads.
jest.mock('react-native-reanimated/mock', () => {
  const Reanimated = jest.requireActual('react-native-reanimated/mock');
  const { useState } = require('react');
  return {
    ...Reanimated,
    __esModule: true,
    // Not in Reanimated's mock: a handle whose activity tests can read.
    useFrameCallback: (callback, autostart = true) => {
      const [handle] = useState(() => {
        const frame = { callback, isActive: autostart, callbackId: 0 };
        frame.setActive = jest.fn((active) => {
          frame.isActive = active;
        });
        return frame;
      });
      handle.callback = callback;
      return handle;
    },
  };
});
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
// Jest runs no animation frames, so the ident reports its build complete as soon as it mounts.
jest.mock('@/components/brand/zape-loader', () => require('./src/testing/zape-loader-stub'));
