import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';
import { api } from '../src/lib/api';

export default function ReviewScreen() {
  const { isLoggedIn } = useAuth();
  const [reviewData, setReviewData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'overview' | 'flashcard'>('overview');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const startTime = useRef(Date.now());

  const loadData = () => {
    if (!isLoggedIn) return;
    setLoading(true);
    api.getReviewWords(20).then(setReviewData).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [isLoggedIn]);

  const words = reviewData?.words || [];
  const totalPending = reviewData?.totalPending || 0;

  const handleReveal = () => { startTime.current = Date.now(); setShowMeaning(true); };

  const handleResult = async (status: 'known' | 'vague' | 'unknown') => {
    if (submitting) return;
    setSubmitting(true);
    const word = words[currentIndex];
    try {
      await api.recordAnswer(word.id, status === 'known', Date.now() - startTime.current);
      if (status !== 'unknown') setReviewed(r => r + 1);
    } catch {}
    setSubmitting(false);
    setShowMeaning(false);
    if (currentIndex < words.length - 1) { setCurrentIndex(i => i + 1); }
    else { setMode('overview'); setCurrentIndex(0); loadData(); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  // Flashcard mode
  if (mode === 'flashcard') {
    if (words.length === 0) return (
      <View style={styles.center}>
        <Text style={{ fontSize: 48 }}>✅</Text>
        <Text style={styles.emptyTitle}>没有待复习单词</Text>
        <TouchableOpacity onPress={() => setMode('overview')}><Text style={{ color: '#3b82f6', marginTop: 12 }}>返回</Text></TouchableOpacity>
      </View>
    );
    const word = words[currentIndex];
    const meanings = word?.meanings || [];
    return (
      <View style={[styles.container, { padding: 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={styles.progressText}>{currentIndex + 1} / {words.length}</Text>
          <TouchableOpacity onPress={() => setMode('overview')}><Text style={{ color: '#64748b', fontSize: 13 }}>退出</Text></TouchableOpacity>
        </View>
        <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${((currentIndex+1)/words.length)*100}%`, backgroundColor: '#10b981' }]} /></View>

        <TouchableOpacity style={styles.flashcard} onPress={!showMeaning ? handleReveal : undefined} activeOpacity={0.9}>
          <Text style={styles.fcWord}>{word?.word}</Text>
          <Text style={styles.fcPhonetic}>{word?.phonetic || word?.phoneticUs}</Text>
          {showMeaning ? (
            <View style={{ marginTop: 20 }}>
              {meanings.map((m: any, i: number) => (
                <Text key={i} style={styles.fcMeaning}>{m.partOfSpeech} {m.translation}</Text>
              ))}
            </View>
          ) : (
            <Text style={styles.fcHint}>点击翻转查看释义</Text>
          )}
        </TouchableOpacity>

        {showMeaning && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#fef2f2' }]} onPress={() => handleResult('unknown')} disabled={submitting}>
              <Text style={{ color: '#dc2626', fontWeight: '600' }}>😣 不认识</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#fefce8' }]} onPress={() => handleResult('vague')} disabled={submitting}>
              <Text style={{ color: '#ca8a04', fontWeight: '600' }}>🤔 模糊</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#f0fdf4' }]} onPress={() => handleResult('known')} disabled={submitting}>
              <Text style={{ color: '#16a34a', fontWeight: '600' }}>😊 认识</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // Overview
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={{ padding: 16 }}>
        <TouchableOpacity style={styles.startBtn} onPress={() => { setMode('flashcard'); setCurrentIndex(0); setShowMeaning(false); }} disabled={totalPending === 0}>
          <Text style={styles.startBtnText}>{totalPending > 0 ? `开始复习 (${totalPending}个待复习)` : '暂无待复习单词 ✓'}</Text>
        </TouchableOpacity>

        {reviewed > 0 && (
          <View style={styles.successBanner}>
            <Text style={{ color: '#16a34a', fontSize: 14 }}>✅ 刚才复习了 {reviewed} 个单词！</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 复习概况</Text>
          <View style={{ gap: 8 }}>
            <InfoRow label="待复习" value={`${totalPending} 个`} urgent={totalPending > 0} />
            <InfoRow label="总学习量" value={`${reviewData?.totalPending || 0}+ 个`} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value, urgent }: { label: string; value: string; urgent?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
      <Text style={{ fontSize: 14, color: '#475569' }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '600', color: urgent ? '#dc2626' : '#475569' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginTop: 12 },
  progressText: { fontSize: 13, color: '#64748b' },
  progressBar: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden', marginBottom: 20 },
  progressFill: { height: '100%', borderRadius: 3 },
  flashcard: { backgroundColor: '#fff', borderRadius: 20, padding: 32, alignItems: 'center', minHeight: 260, justifyContent: 'center', elevation: 6, marginTop: 20 },
  fcWord: { fontSize: 36, fontWeight: '800', color: '#1e293b' },
  fcPhonetic: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  fcMeaning: { fontSize: 18, color: '#3b82f6', fontWeight: '600', textAlign: 'center', marginTop: 4 },
  fcHint: { fontSize: 13, color: '#cbd5e1', marginTop: 24 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 20 },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  startBtn: { backgroundColor: '#3b82f6', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  successBanner: { backgroundColor: '#f0fdf4', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#bbf7d0' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
});
