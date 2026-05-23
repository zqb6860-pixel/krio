import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#3b82f6',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#f1f5f9',
            height: 60,
            paddingBottom: 8,
            paddingTop: 4,
          },
          headerStyle: {
            backgroundColor: '#ffffff',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#f1f5f9',
          },
          headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        }}
      >
        <Tabs.Screen name="index" options={{ title: '首页', tabBarLabel: '🏠 首页', headerTitle: 'LightWords 简词' }} />
        <Tabs.Screen name="learn" options={{ title: '学习', tabBarLabel: '📚 学习' }} />
        <Tabs.Screen name="challenge" options={{ title: '闯关', tabBarLabel: '🎮 闯关' }} />
        <Tabs.Screen name="review" options={{ title: '复习', tabBarLabel: '🔄 复习' }} />
        <Tabs.Screen name="profile" options={{ title: '我的', tabBarLabel: '👤 我的' }} />
      </Tabs>
    </AuthProvider>
  );
}
