import { usePathname } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppState } from '@/state/app-state';

export function AppHeader() {
  const pathname = usePathname();
  const { loggedIn, email, menuOpen, setMenuOpen, openLogin, logout } = useAppState();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname, setMenuOpen]);

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        <View style={styles.side} />
        <Text style={styles.title}>Medique</Text>
        <Pressable
          accessibilityLabel={menuOpen ? 'Tutup menu' : 'Buka menu'}
          accessibilityRole="button"
          onPress={() => setMenuOpen(!menuOpen)}
          style={styles.side}>
          <View style={styles.line} />
          <View style={styles.line} />
          <View style={styles.line} />
        </Pressable>
      </View>
      {menuOpen ? (
        <View style={styles.menu}>
          {loggedIn ? (
            <>
              <Text style={styles.email}>{email}</Text>
              <Pressable accessibilityRole="button" onPress={logout} style={styles.menuItem}>
                <Text style={styles.menuText}>Keluar</Text>
              </Pressable>
            </>
          ) : (
            <Pressable accessibilityRole="button" onPress={() => openLogin()} style={styles.menuItem}>
              <Text style={styles.menuText}>Masuk</Text>
            </Pressable>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    zIndex: 2,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E7EE',
  },
  bar: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
  },
  side: {
    width: 56,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#1C2430',
  },
  line: {
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#1C2430',
  },
  menu: {
    position: 'absolute',
    top: 52,
    right: 8,
    minWidth: 200,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3E7EE',
    borderRadius: 8,
    overflow: 'hidden',
  },
  menuItem: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  menuText: {
    fontSize: 16,
    color: '#1C2430',
  },
  email: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    fontSize: 16,
    fontWeight: '600',
    color: '#1C2430',
  },
});
