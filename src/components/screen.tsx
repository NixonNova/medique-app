import { type ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';

const webTopInset: ViewStyle | null =
  Platform.OS === 'web'
    ? { paddingTop: 'env(safe-area-inset-top, 0px)' as unknown as number }
    : null;

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={[styles.screen, webTopInset]} edges={['top']}>
      <AppHeader />
      <View style={styles.body}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  body: {
    flex: 1,
  },
});
