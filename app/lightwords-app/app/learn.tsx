import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';
import { api } from '../src/lib/api';

export default function LearnScreen() {
  const { isLoggedIn } = useAuth();
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [learned, setLearned] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (isLoggedIn) {
      api.getTodayWords().then(setWords).catch(() => {}).finally(() => setLoading(false));
    }
  }, [isLoggedIn]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  if (words.length === 0) return (
    <View style={styles.center}>
      <Text style={{ fontSize: 48 }}>🎉</Text>
      <Text style={styles.emptyTitle}>今日单词学完了！</Text>
      <Text style={styles.emptyText}>去复习或闯关吧</Text>
    </View>
  );

  const word = words[currentIndex];
  const meanings = word?.meanings || [];

  const handleReveal = () => { startTime.current = Date.now(); setShowAnswer(true); };

  const handleAction = async (status: 'known' | 'vague' | 'unknown') => {
    if (submitting) return;
    setSubmitting(true);
    const responseTimeMs = Date.now() - startTime.current;
    try {
      await api.recordAnswer(word.id, status === 'known', responseTimeMs);
      if (status !== 'unknown') setLearned(l => l + 1);
    } catch {}
    setSubmitting(false);
    setShowAnswer(false);
    if (currentIndex < words.length - 1) setCurrentIndex(i => i + 1);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Progress */}
      <View style={styles.progressSection}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={styles.progressText}>{currentIndex + 1} / {words.length}</Text>
          <Text style={{ fontSize: 13, color: '#16a34a', fontWeight: '600' }}>已学 {learned} 个</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((currentIndex + 1) / words.length) * 100}%` }]} />
        </View>
      </View>

      {/* Word Card */}
      <View style={styles.wordCard}>
        <View style={styles.wordHeader}>
          <Text style={styles.wordText}>{word.word}</Text>
          <Text style={styles.phoneticText}>{word.phonetic || word.phoneticUs || ''}</Text>
        </View>

        {!showAnswer ? (
          <View style={styles.revealSection}>
            <Text style={styles.revealHint}>你认识这个单词吗？</Text>
            <TouchableOpacity style={styles.revealBtn} onPress={handleReveal}>
              <Text style={styles.revealBtnText}>显示释义</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.answerSection}>
            <View style={styles.meaningBox}>
              {meanings.map((m: any, i: number) => (
                <View key={i} style={i > 0 ? { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e0e7ff' } : undefined}>
                  <Text style={styles.posText}>{m.partOfSpeech}</Text>
                  <Text style={styles.meaningText}>{m.translation}</Text>
                  {m.definition && <Text style={styles.defText}>{m.definition}</Text>}
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      {showAnswer && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#fef2f2' }]} onPress={() => handleAction('unknown')} disabled={submitting}>
            <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>不认识</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#fefce8' }]} onPress={() => handleAction('vague')} disabled={submitting}>
            <Text style={[styles.actionBtnText, { color: '#ca8a04' }]}>模糊</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#f0fdf4' }]} onPress={() => handleAction('known')} disabled={submitting}>
            <Text style={[styles.actionBtnText, { color: '#16a34a' }]}>认识</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginTop: 12 },
  emptyText: { fontSize: 14, color: '#64748b', marginTop: 4 },
  progressSection: { padding: 16 },
  progressText: { fontSize: 13, color: '#64748b' },
  progressBar: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 3 },
  wordCard: { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', elevation: 4 },
  wordHeader: { backgroundColor: '#3b82f6', padding: 24, alignItems: 'center' },
  wordText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  phoneticText: { fontSize: 14, color: '#bfdbfe', marginTop: 4 },
  revealSection: { padding: 32, alignItems: 'center' },
  revealHint: { fontSize: 14, color: '#94a3b8', marginBottom: 16 },
  revealBtn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#f1f5f9', borderRadius: 12 },
  revealBtnText: { fontSize: 15, color: '#475569', fontWeight: '600' },
  answerSection: { padding: 16 },
  meaningBox: { backgroundColor: '#eff6ff', padding: 14, borderRadius: 12 },
  posText: { fontSize: 12, color: '#3b82f6', fontWeight: '600' },
  meaningText: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginTop: 4 },
  defText: { fontSize: 13, color: '#64748b', marginTop: 4 },
  actionRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: 16 },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { fontSize: 15, fontWeight: '600' },
});
