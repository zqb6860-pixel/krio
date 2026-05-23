import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, TextInput, Alert } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';
import { api } from '../src/lib/api';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, isLoggedIn, isLoading, login } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [email, setEmail] = useState('demo@lightwords.app');
  const [password, setPassword] = useState('demo123456');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      api.getLearningStats().then(setStats).catch(() => {});
    }
  }, [isLoggedIn]);

  // Login Screen
  if (!isLoggedIn && !isLoading) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View style={styles.logo}><Text style={styles.logoText}>L</Text></View>
          <Text style={styles.loginTitle}>LightWords 简词</Text>
          <Text style={styles.loginSubtitle}>登录开始学习</Text>
        </View>
        <TextInput style={styles.input} placeholder="邮箱" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="密码" value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={styles.loginBtn} disabled={loginLoading} onPress={async () => {
          setLoginLoading(true);
          try { await login(email, password); } catch (e: any) { Alert.alert('登录失败', e.message); }
          setLoginLoading(false);
        }}>
          <Text style={styles.loginBtnText}>{loginLoading ? '登录中...' : '登录'}</Text>
        </TouchableOpacity>
        <Text style={styles.demoHint}>演示: demo@lightwords.app / demo123456</Text>
      </ScrollView>
    );
  }

  if (isLoading) {
    return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><Text>加载中...</Text></View>;
  }

  const goalPct = stats ? Math.min(100, Math.round(((stats.todayStats?.wordsLearned || 0) / (user?.settings?.dailyWordGoal || 30)) * 100)) : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>你好，{user?.username}！👋</Text>
        <Text style={styles.bannerSub}>连续学习第 {user?.streak || 0} 天 · 今日 {goalPct}%</Text>
        <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${goalPct}%` }]} /></View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard icon="📖" value={String(stats?.todayStats?.wordsLearned || 0)} label="今日已学" color="#3b82f6" />
        <StatCard icon="🔄" value={String(stats?.pendingReview || 0)} label="待复习" color="#f59e0b" />
        <StatCard icon="✅" value={String(stats?.mastered || 0)} label="已掌握" color="#10b981" />
        <StatCard icon="🔥" value={String(user?.streak || 0)} label="连续天" color="#ef4444" />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ 快速开始</Text>
        <View style={styles.actionsGrid}>
          <ActionBtn label="开始学习" icon="📖" color="#3b82f6" />
          <ActionBtn label="闯关模式" icon="🎮" color="#8b5cf6" />
          <ActionBtn label="复习单词" icon="🔄" color="#f59e0b" />
          <ActionBtn label="学习数据" icon="📊" color="#10b981" />
        </View>
      </View>

      {/* Today Goal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 今日目标</Text>
        <View style={styles.card}>
          <GoalItem label="新学单词" current={stats?.todayStats?.wordsLearned || 0} total={user?.settings?.dailyWordGoal || 30} color="#3b82f6" />
          <GoalItem label="复习单词" current={stats?.todayStats?.wordsReviewed || 0} total={stats?.pendingReview || 10} color="#f59e0b" />
          <GoalItem label="学习时长" current={stats?.todayStats?.timeSpent || 0} total={user?.settings?.dailyTimeGoal || 30} color="#10b981" />
        </View>
      </View>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

function StatCard({ icon, value, label, color }: any) {
  return (
    <View style={styles.statCard}>
      <Text style={{ fontSize: 18 }}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
function ActionBtn({ label, icon, color }: any) {
  return (
    <TouchableOpacity style={[styles.actionButton, { backgroundColor: color }]}>
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}
function GoalItem({ label, current, total, color }: any) {
  const pct = Math.min(100, Math.round((current / Math.max(total, 1)) * 100));
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: 13, color: '#334155' }}>{label}</Text>
        <Text style={{ fontSize: 12, color: '#64748b' }}>{current}/{total}</Text>
      </View>
      <View style={styles.goalBar}><View style={[styles.goalFill, { width: `${pct}%`, backgroundColor: color }]} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  banner: { margin: 16, padding: 20, borderRadius: 16, backgroundColor: '#3b82f6' },
  bannerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  bannerSub: { fontSize: 13, color: '#bfdbfe', marginTop: 4 },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, marginTop: 12, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 3 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', elevation: 2 },
  statValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  statLabel: { fontSize: 10, color: '#64748b', marginTop: 2 },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionButton: { width: (width - 42 - 10) / 2, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  actionLabel: { fontSize: 13, fontWeight: '600', color: '#fff', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 2 },
  goalBar: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  goalFill: { height: '100%', borderRadius: 3 },
  logo: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  loginTitle: { fontSize: 22, fontWeight: '700', color: '#1e293b' },
  loginSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 12 },
  loginBtn: { backgroundColor: '#3b82f6', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  demoHint: { textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 16 },
});
