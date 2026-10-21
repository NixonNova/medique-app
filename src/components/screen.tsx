import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
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
