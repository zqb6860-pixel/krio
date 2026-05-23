import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

const reviewWords = [
  { id: '1', word: 'accomplish', phonetic: '/əˈkɑːmplɪʃ/', meaning: 'v. 完成；实现' },
  { id: '2', word: 'abundant', phonetic: '/əˈbʌndənt/', meaning: 'adj. 充裕的；丰富的' },
  { id: '3', word: 'beneath', phonetic: '/bɪˈniːθ/', meaning: 'prep. 在...之下' },
  { id: '4', word: 'compassion', phonetic: '/kəmˈpæʃn/', meaning: 'n. 同情心；怜悯' },
  { id: '5', word: 'deliberate', phonetic: '/dɪˈlɪbərət/', meaning: 'adj. 故意的' },
  { id: '6', word: 'elaborate', phonetic: '/ɪˈlæbərət/', meaning: 'adj. 精心制作的' },
];

export default function ReviewScreen() {
  const [mode, setMode] = useState<'overview' | 'flashcard'>('overview');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  const handleResult = (status: string) => {
    if (status !== 'unknown') setReviewed((r) => r + 1);
    setShowMeaning(false);
    if (currentIndex < reviewWords.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setMode('overview');
      setCurrentIndex(0);
    }
  };

  if (mode === 'flashcard') {
    const word = reviewWords[currentIndex];
    return (
      <View style={styles.container}>
        <View style={styles.fcProgress}>
          <Text style={styles.fcProgressText}>
            {currentIndex + 1} / {reviewWords.length}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((currentIndex + 1) / reviewWords.length) * 100}%` }]} />
          </View>
        </View>

        <TouchableOpacity
          style={styles.flashcard}
          onPress={() => setShowMeaning(true)}
          activeOpacity={0.9}
        >
          <Text style={styles.fcWord}>{word.word}</Text>
          <Text style={styles.fcPhonetic}>{word.phonetic}</Text>
          {showMeaning ? (
            <Text style={styles.fcMeaning}>{word.meaning}</Text>
          ) : (
            <Text style={styles.fcHint}>点击翻转查看释义</Text>
          )}
        </TouchableOpacity>

        {showMeaning && (
          <View style={styles.fcActions}>
            <TouchableOpacity
              style={[styles.fcBtn, { backgroundColor: '#fef2f2' }]}
              onPress={() => handleResult('unknown')}
            >
              <Text style={[styles.fcBtnText, { color: '#dc2626' }]}>😣 不认识</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.fcBtn, { backgroundColor: '#fefce8' }]}
              onPress={() => handleResult('vague')}
            >
              <Text style={[styles.fcBtnText, { color: '#ca8a04' }]}>🤔 模糊</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.fcBtn, { backgroundColor: '#f0fdf4' }]}
              onPress={() => handleResult('known')}
            >
              <Text style={[styles.fcBtnText, { color: '#16a34a' }]}>😊 认识</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Stats */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>📊 掌握度分布</Text>
        {[
          { label: '已掌握', count: 856, pct: 68, color: '#10b981' },
          { label: '熟悉', count: 215, pct: 17, color: '#3b82f6' },
          { label: '模糊', count: 125, pct: 10, color: '#f59e0b' },
          { label: '陌生', count: 60, pct: 5, color: '#ef4444' },
        ].map((item) => (
          <View key={item.label} style={styles.distRow}>
            <Text style={styles.distLabel}>{item.label}</Text>
            <View style={styles.distBar}>
              <View style={[styles.distFill, { width: `${item.pct}%`, backgroundColor: item.color }]} />
            </View>
            <Text style={styles.distCount}>{item.count}</Text>
          </View>
        ))}
      </View>

      {/* Review Button */}
      <TouchableOpacity
        style={styles.startReviewBtn}
        onPress={() => setMode('flashcard')}
      >
        <Text style={styles.startReviewBtnText}>开始复习 ({reviewWords.length}个待复习)</Text>
      </TouchableOpacity>

      {/* Schedule */}
      <View style={styles.scheduleCard}>
        <Text style={styles.statsTitle}>📅 复习计划</Text>
        {[
          { time: '今天', count: 18, urgent: true },
          { time: '明天', count: 12, urgent: false },
          { time: '后天', count: 8, urgent: false },
          { time: '本周内', count: 35, urgent: false },
        ].map((item) => (
          <View key={item.time} style={styles.scheduleRow}>
            <Text style={styles.scheduleTime}>{item.time}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.scheduleCount, item.urgent && { color: '#dc2626' }]}>
                {item.count} 个
              </Text>
              {item.urgent && (
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentText}>待复习</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  statsCard: { backgroundColor: '#ffffff', borderRadius: 14, padding: 16, marginBottom: 16 },
  statsTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  distRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  distLabel: { fontSize: 12, color: '#475569', width: 44 },
  distBar: { flex: 1, height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  distFill: { height: '100%', borderRadius: 4 },
  distCount: { fontSize: 12, color: '#64748b', width: 30, textAlign: 'right' },
  startReviewBtn: { backgroundColor: '#3b82f6', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  startReviewBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  scheduleCard: { backgroundColor: '#ffffff', borderRadius: 14, padding: 16 },
  scheduleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  scheduleTime: { fontSize: 14, color: '#334155' },
  scheduleCount: { fontSize: 14, fontWeight: '600', color: '#475569' },
  urgentBadge: { backgroundColor: '#fef2f2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  urgentText: { fontSize: 10, color: '#dc2626', fontWeight: '600' },
  fcProgress: { marginBottom: 20 },
  fcProgressText: { fontSize: 13, color: '#64748b', marginBottom: 6 },
  progressBar: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 3 },
  flashcard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 32, alignItems: 'center', minHeight: 280, justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6 },
  fcWord: { fontSize: 36, fontWeight: '800', color: '#1e293b' },
  fcPhonetic: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  fcMeaning: { fontSize: 20, color: '#3b82f6', fontWeight: '600', marginTop: 20 },
  fcHint: { fontSize: 13, color: '#cbd5e1', marginTop: 20 },
  fcActions: { flexDirection: 'row', gap: 8, marginTop: 20 },
  fcBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  fcBtnText: { fontSize: 14, fontWeight: '600' },
});
