import { Text, View } from 'react-native';
import { theme } from '@src/constants/theme';

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
      }}
    >
      <Text
        style={{
          fontSize: theme.typography.fontSize['2xl'],
          fontWeight: '600',
          color: theme.colors.text.primary,
        }}
      >
        Podcast Editor
      </Text>
    </View>
  );
}
