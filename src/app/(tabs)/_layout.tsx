import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1F4E5F',
        tabBarInactiveTintColor: '#5C6778',
        tabBarIcon: () => null,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E3E7EE',
          height: 56,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '600',
        },
        tabBarItemStyle: {
          justifyContent: 'center',
        },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Antri' }} />
      <Tabs.Screen name="history" options={{ title: 'History Antrian' }} />
      <Tabs.Screen name="ambil" options={{ href: null }} />
      <Tabs.Screen name="konfirmasi" options={{ href: null }} />
    </Tabs>
  );
}
