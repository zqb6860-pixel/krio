import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* User Header */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>U</Text>
        </View>
        <Text style={styles.username}>学习者</Text>
        <Text style={styles.userLevel}>Lv.5 · 学习达人 · 已加入 45 天</Text>
        <View style={styles.userStats}>
          <View style={styles.userStatItem}>
            <Text style={styles.userStatValue}>🔥 7</Text>
            <Text style={styles.userStatLabel}>连续天数</Text>
          </View>
          <View style={styles.userStatItem}>
            <Text style={styles.userStatValue}>💰 1250</Text>
            <Text style={styles.userStatLabel}>金币</Text>
          </View>
          <View style={styles.userStatItem}>
            <Text style={styles.userStatValue}>📚 1256</Text>
            <Text style={styles.userStatLabel}>词汇量</Text>
          </View>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {[
          { icon: '📖', value: '1,256', label: '累计学习' },
          { icon: '⏱️', value: '42.5h', label: '学习时长' },
          { icon: '🎮', value: '8', label: '完成关卡' },
          { icon: '🔥', value: '23', label: '最高连击' },
        ].map((stat) => (
          <View key={stat.label} style={styles.statBox}>
            <Text style={{ fontSize: 20 }}>{stat.icon}</Text>
            <Text style={styles.statBoxValue}>{stat.value}</Text>
            <Text style={styles.statBoxLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Ability */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 能力分析</Text>
        {[
          { name: '词汇', score: 82, icon: '📚' },
          { name: '听力', score: 65, icon: '🎧' },
          { name: '口语', score: 45, icon: '🗣️' },
          { name: '阅读', score: 78, icon: '📖' },
          { name: '写作', score: 52, icon: '✍️' },
        ].map((a) => (
          <View key={a.name} style={styles.abilityRow}>
            <Text style={{ fontSize: 16 }}>{a.icon}</Text>
            <Text style={styles.abilityName}>{a.name}</Text>
            <View style={styles.abilityBar}>
              <View
                style={[
                  styles.abilityFill,
                  {
                    width: `${a.score}%`,
                    backgroundColor: a.score >= 75 ? '#10b981' : a.score >= 50 ? '#3b82f6' : '#f59e0b',
                  },
                ]}
              />
            </View>
            <Text style={styles.abilityScore}>{a.score}</Text>
          </View>
        ))}
      </View>

      {/* Achievements */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🏆 成就墙</Text>
        <View style={styles.achievementGrid}>
          {[
            { icon: '🌱', name: '初学者', unlocked: true },
            { icon: '🔥', name: '持之以恒', unlocked: true },
            { icon: '📚', name: '词汇达人', unlocked: true },
            { icon: '⭐', name: '完美通关', unlocked: true },
            { icon: '⚡', name: '速度之星', unlocked: true },
            { icon: '🏆', name: '月度之星', unlocked: false },
            { icon: '🗡️', name: '千词斩', unlocked: true },
            { icon: '🤝', name: '社交达人', unlocked: false },
            { icon: '💎', name: '百日坚持', unlocked: false },
          ].map((ach) => (
            <View key={ach.name} style={[styles.achievementItem, !ach.unlocked && { opacity: 0.4 }]}>
              <Text style={{ fontSize: 24 }}>{ach.icon}</Text>
              <Text style={styles.achievementName}>{ach.name}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Word Books */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📖 词库管理</Text>
        {[
          { name: 'CET-4 四级', words: 4500, progress: 28, active: true },
          { name: '日常口语', words: 2000, progress: 45, active: false },
          { name: '商务英语', words: 2800, progress: 12, active: false },
        ].map((book) => (
          <View key={book.name} style={[styles.bookItem, book.active && { borderColor: '#3b82f6', borderWidth: 1.5 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bookName}>{book.name}</Text>
              <Text style={styles.bookWords}>{book.words} 词</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.bookProgress}>{book.progress}%</Text>
              {book.active && <Text style={styles.bookActive}>学习中</Text>}
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  userCard: { backgroundColor: '#ffffff', padding: 24, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  avatar: { width: 72, height: 72, borderRadius: 18, backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#ffffff' },
  username: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginTop: 12 },
  userLevel: { fontSize: 13, color: '#64748b', marginTop: 4 },
  userStats: { flexDirection: 'row', gap: 20, marginTop: 16 },
  userStatItem: { alignItems: 'center' },
  userStatValue: { fontSize: 14, fontWeight: '700', color: '#334155' },
  userStatLabel: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  statBox: { width: '48%', backgroundColor: '#ffffff', borderRadius: 12, padding: 14, alignItems: 'center' },
  statBoxValue: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginTop: 6 },
  statBoxLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  card: { backgroundColor: '#ffffff', borderRadius: 14, padding: 16, margin: 16, marginTop: 0 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  abilityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  abilityName: { fontSize: 13, color: '#475569', width: 32 },
  abilityBar: { flex: 1, height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  abilityFill: { height: '100%', borderRadius: 4 },
  abilityScore: { fontSize: 13, fontWeight: '700', color: '#334155', width: 24, textAlign: 'right' },
  achievementGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  achievementItem: { width: '30%', alignItems: 'center', padding: 8 },
  achievementName: { fontSize: 11, color: '#475569', marginTop: 4, textAlign: 'center' },
  bookItem: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f8fafc', borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  bookName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  bookWords: { fontSize: 11, color: '#64748b', marginTop: 2 },
  bookProgress: { fontSize: 14, fontWeight: '700', color: '#3b82f6' },
  bookActive: { fontSize: 10, color: '#3b82f6', marginTop: 2 },
});
