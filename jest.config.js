module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/src/**/*.test.{ts,tsx}'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|@rn-primitives|react-navigation|@react-navigation|nativewind|react-native-css-interop))',
    '/node_modules/react-native-reanimated/plugin/',
    '/node_modules/@react-native/babel-preset/',
  ],
};
