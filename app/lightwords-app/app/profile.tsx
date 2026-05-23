import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';
import { api } from '../src/lib/api';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [distribution, setDistribution] = useState<any>(null);

  useEffect(() => {
    api.getLearningStats().then(setStats).catch(() => {});
    api.getAchievements().then(setAchievements).catch(() => {});
    api.getDistribution().then(setDistribution).catch(() => {});
  }, []);

  const totalWords = stats?.total || 0;
  const dist = distribution || { mastered: 0, familiar: 0, vague: 0, unknown: 0 };
  const totalDist = dist.mastered + dist.familiar + dist.vague + dist.unknown;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* User Header */}
      <View style={styles.userCard}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{user?.username?.charAt(0)?.toUpperCase() || 'U'}</Text></View>
        <Text style={styles.username}>{user?.username}</Text>
        <Text style={styles.userLevel}>Lv.{user?.level} · {user?.email}</Text>
        <View style={styles.userStats}>
          <View style={styles.userStatItem}><Text style={styles.userStatValue}>🔥 {user?.streak || 0}</Text><Text style={styles.userStatLabel}>连续天数</Text></View>
          <View style={styles.userStatItem}><Text style={styles.userStatValue}>💰 {user?.coins || 0}</Text><Text style={styles.userStatLabel}>金币</Text></View>
          <View style={styles.userStatItem}><Text style={styles.userStatValue}>❤️ {user?.hearts || 5}</Text><Text style={styles.userStatLabel}>生命值</Text></View>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {[
          { icon: '📖', value: totalWords, label: '累计学习' },
          { icon: '✅', value: stats?.mastered || 0, label: '已掌握' },
          { icon: '📝', value: stats?.learning || 0, label: '学习中' },
          { icon: '🔄', value: stats?.pendingReview || 0, label: '待复习' },
        ].map(s => (
          <View key={s.label} style={styles.statBox}>
            <Text style={{ fontSize: 18 }}>{s.icon}</Text>
            <Text style={styles.statBoxValue}>{s.value}</Text>
            <Text style={styles.statBoxLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Distribution */}
      {totalDist > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 掌握度分布</Text>
          {[
            { label: '已掌握', count: dist.mastered, color: '#10b981' },
            { label: '熟悉', count: dist.familiar, color: '#3b82f6' },
            { label: '模糊', count: dist.vague, color: '#f59e0b' },
            { label: '陌生', count: dist.unknown, color: '#ef4444' },
          ].map(item => {
            const pct = totalDist > 0 ? Math.round((item.count / totalDist) * 100) : 0;
            return (
              <View key={item.label} style={styles.distRow}>
                <Text style={styles.distLabel}>{item.label}</Text>
                <View style={styles.distBar}>
                  <View style={[styles.distFill, { width: `${Math.max(pct, 3)}%`, backgroundColor: item.color }]} />
                </View>
                <Text style={styles.distCount}>{item.count}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏆 成就 ({achievements.filter(a => a.isUnlocked).length}/{achievements.length})</Text>
          <View style={styles.achievementGrid}>
            {achievements.map((ach: any) => (
              <View key={ach.id} style={[styles.achievementItem, !ach.isUnlocked && { opacity: 0.35 }]}>
                <Text style={{ fontSize: 22 }}>{ach.icon}</Text>
                <Text style={styles.achievementName}>{ach.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>退出登录</Text>
      </TouchableOpacity>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  userCard: { backgroundColor: '#fff', padding: 24, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  avatar: { width: 72, height: 72, borderRadius: 18, backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  username: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginTop: 12 },
  userLevel: { fontSize: 13, color: '#64748b', marginTop: 4 },
  userStats: { flexDirection: 'row', gap: 20, marginTop: 16 },
  userStatItem: { alignItems: 'center' },
  userStatValue: { fontSize: 14, fontWeight: '700', color: '#334155' },
  userStatLabel: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  statBox: { width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', elevation: 1 },
  statBoxValue: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginTop: 6 },
  statBoxLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, margin: 12, elevation: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  distRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  distLabel: { fontSize: 12, color: '#475569', width: 44 },
  distBar: { flex: 1, height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  distFill: { height: '100%', borderRadius: 4 },
  distCount: { fontSize: 12, color: '#64748b', width: 28, textAlign: 'right' },
  achievementGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  achievementItem: { width: '28%', alignItems: 'center', padding: 8 },
  achievementName: { fontSize: 10, color: '#475569', marginTop: 4, textAlign: 'center' },
  logoutBtn: { margin: 16, paddingVertical: 14, backgroundColor: '#fef2f2', borderRadius: 12, alignItems: 'center' },
  logoutText: { color: '#dc2626', fontSize: 15, fontWeight: '600' },
});
