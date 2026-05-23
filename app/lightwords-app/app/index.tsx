import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Welcome Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>早上好，学习者！👋</Text>
          <Text style={styles.bannerSubtitle}>
            连续学习第 7 天，继续加油！
          </Text>
        </View>
        <View style={styles.bannerRight}>
          <Text style={styles.progressText}>65%</Text>
          <Text style={styles.progressLabel}>今日完成度</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard icon="📖" value="32" label="今日已学" color="#3b82f6" />
        <StatCard icon="🔄" value="18" label="待复习" color="#f59e0b" />
        <StatCard icon="✅" value="1256" label="已掌握" color="#10b981" />
        <StatCard icon="🔥" value="7" label="连续天数" color="#ef4444" />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ 快速开始</Text>
        <View style={styles.actionsGrid}>
          <ActionButton label="开始学习" icon="📖" color="#3b82f6" />
          <ActionButton label="闯关模式" icon="🎮" color="#8b5cf6" />
          <ActionButton label="复习单词" icon="🔄" color="#f59e0b" />
          <ActionButton label="听力训练" icon="🎧" color="#10b981" />
        </View>
      </View>

      {/* Today Goal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 今日目标</Text>
        <View style={styles.card}>
          <GoalItem label="新学单词" current={32} total={50} color="#3b82f6" />
          <GoalItem label="复习单词" current={12} total={18} color="#f59e0b" />
          <GoalItem label="闯关关卡" current={2} total={3} color="#8b5cf6" />
          <GoalItem label="学习时长" current={25} total={30} color="#10b981" unit="分钟" />
        </View>
      </View>

      {/* Streak Calendar */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔥 打卡记录</Text>
        <View style={styles.card}>
          <View style={styles.streakRow}>
            {['一', '二', '三', '四', '五', '六', '日'].map((day, i) => (
              <View key={day} style={styles.streakDay}>
                <Text style={styles.streakDayLabel}>{day}</Text>
                <View
                  style={[
                    styles.streakDot,
                    i < 5
                      ? styles.streakDotActive
                      : i === 5
                      ? styles.streakDotToday
                      : styles.streakDotInactive,
                  ]}
                >
                  <Text style={styles.streakDotText}>
                    {i < 5 ? '✓' : i === 5 ? '⭐' : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

function StatCard({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionButton({ label, icon, color }: { label: string; icon: string; color: string }) {
  return (
    <TouchableOpacity style={[styles.actionButton, { backgroundColor: color }]}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function GoalItem({ label, current, total, color, unit = '个' }: { label: string; current: number; total: number; color: string; unit?: string }) {
  const percent = Math.min(100, Math.round((current / total) * 100));
  return (
    <View style={styles.goalItem}>
      <View style={styles.goalHeader}>
        <Text style={styles.goalLabel}>{label}</Text>
        <Text style={styles.goalValue}>{current}/{total}{unit !== '个' ? unit : ''}</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  banner: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerContent: { flex: 1 },
  bannerTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  bannerSubtitle: { fontSize: 13, color: '#bfdbfe', marginTop: 4 },
  bannerRight: { alignItems: 'center' },
  progressText: { fontSize: 28, fontWeight: '800', color: '#ffffff' },
  progressLabel: { fontSize: 11, color: '#bfdbfe' },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  statLabel: { fontSize: 10, color: '#64748b', marginTop: 2 },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    width: (width - 42 - 10) / 2,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  actionIcon: { fontSize: 24 },
  actionLabel: { fontSize: 13, fontWeight: '600', color: '#ffffff', marginTop: 4 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  goalItem: { marginBottom: 12 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  goalLabel: { fontSize: 13, color: '#334155', fontWeight: '500' },
  goalValue: { fontSize: 12, color: '#64748b' },
  progressBar: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  streakRow: { flexDirection: 'row', justifyContent: 'space-around' },
  streakDay: { alignItems: 'center', gap: 6 },
  streakDayLabel: { fontSize: 12, color: '#64748b' },
  streakDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  streakDotActive: { backgroundColor: '#dcfce7' },
  streakDotToday: { backgroundColor: '#dbeafe', borderWidth: 2, borderColor: '#3b82f6' },
  streakDotInactive: { backgroundColor: '#f1f5f9' },
  streakDotText: { fontSize: 14 },
});
