module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated 4 ships its babel plugin via react-native-worklets; must be last.
      'react-native-worklets/plugin',
    ],
  };
};
