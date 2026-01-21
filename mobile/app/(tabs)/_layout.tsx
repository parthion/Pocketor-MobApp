import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: 'none', // Hide the default tab bar since we have custom bottom nav
        },
      }}
    >
      <Tabs.Screen
        name="collection"
        options={{
          title: 'Pocketor',
        }}
      />
      <Tabs.Screen
        name="customer"
        options={{
          title: 'Pocketor',
        }}
      />
      <Tabs.Screen
        name="loans"
        options={{
          title: 'Pocketor',
        }}
      />
    </Tabs>
  );
}
