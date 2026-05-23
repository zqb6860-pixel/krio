import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

const mockWords = [
  {
    id: '1',
    word: 'transport',
    phonetic: '/trænsˈpɔːrt/',
    pos: 'v. / n.',
    meaning: '运输；交通工具',
    root: 'trans-（穿过）+ port（携带）',
    tip: '想象把东西trans(转移)到另一个port(港口)',
    example: 'The goods were transported by rail.',
    exampleCn: '货物通过铁路运输。',
  },
  {
    id: '2',
    word: 'accomplish',
    phonetic: '/əˈkɑːmplɪʃ/',
    pos: 'v.',
    meaning: '完成；实现；达到',
    root: 'ac-（加强）+ com-（一起）+ plish（填满）',
    tip: '一个company(公司)要accomplish(完成)目标',
    example: 'She accomplished her goal of running a marathon.',
    exampleCn: '她实现了跑马拉松的目标。',
  },
  {
    id: '3',
    word: 'abundant',
    phonetic: '/əˈbʌndənt/',
    pos: 'adj.',
    meaning: '充裕的；丰富的；大量的',
    root: 'ab-（离开）+ und（波浪）+ ant → 像波浪般涌来',
    tip: 'a bun dance(一个面包在跳舞)，面包很abundant',
    example: 'The region has abundant natural resources.',
    exampleCn: '该地区拥有丰富的自然资源。',
  },
  {
    id: '4',
    word: 'beneath',
    phonetic: '/bɪˈniːθ/',
    pos: 'prep.',
    meaning: '在...之下；在...的下方',
    root: 'be-（在）+ neath（下方）',
    tip: 'be + neat + h → 在整洁表面下面隐藏着什么',
    example: 'The boat sank beneath the waves.',
    exampleCn: '小船沉入了波浪之下。',
  },
  {
    id: '5',
    word: 'compassion',
    phonetic: '/kəmˈpæʃn/',
    pos: 'n.',
    meaning: '同情心；怜悯',
    root: 'com-（一起）+ pass（感受）+ ion → 一起感受',
    tip: 'come + passion → 带着激情来同情别人',
    example: 'He showed great compassion for the victims.',
    exampleCn: '他对受害者表现出极大的同情。',
  },
];

export default function LearnScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [learned, setLearned] = useState(0);

  const word = mockWords[currentIndex];

  const handleAction = (status: string) => {
    if (status !== 'unknown') setLearned((l) => l + 1);
    setShowAnswer(false);
    if (currentIndex < mockWords.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {mockWords.length}
          </Text>
          <Text style={styles.learnedText}>已学 {learned} 个</Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentIndex + 1) / mockWords.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* Word Card */}
      <View style={styles.wordCard}>
        {/* Word Header */}
        <View style={styles.wordHeader}>
          <Text style={styles.wordText}>{word.word}</Text>
          <Text style={styles.phoneticText}>{word.phonetic}</Text>
          <TouchableOpacity style={styles.audioBtn}>
            <Text style={styles.audioBtnText}>🔊</Text>
          </TouchableOpacity>
        </View>

        {!showAnswer ? (
          <View style={styles.revealSection}>
            <Text style={styles.revealHint}>你认识这个单词吗？</Text>
            <TouchableOpacity
              style={styles.revealBtn}
              onPress={() => setShowAnswer(true)}
            >
              <Text style={styles.revealBtnText}>显示释义</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.answerSection}>
            {/* Meaning */}
            <View style={styles.meaningBox}>
              <Text style={styles.posText}>{word.pos}</Text>
              <Text style={styles.meaningText}>{word.meaning}</Text>
            </View>

            {/* Root */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>🌱 词根分析</Text>
              <Text style={styles.infoContent}>{word.root}</Text>
            </View>

            {/* Memory Tip */}
            <View style={[styles.infoBox, { backgroundColor: '#fef3c7' }]}>
              <Text style={styles.infoTitle}>💡 记忆技巧</Text>
              <Text style={styles.infoContent}>{word.tip}</Text>
            </View>

            {/* Example */}
            <View style={[styles.infoBox, { backgroundColor: '#f1f5f9' }]}>
              <Text style={styles.infoTitle}>📝 例句</Text>
              <Text style={styles.infoContent}>{word.example}</Text>
              <Text style={styles.exampleCn}>{word.exampleCn}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      {showAnswer && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#fef2f2' }]}
            onPress={() => handleAction('unknown')}
          >
            <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>不认识</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#fefce8' }]}
            onPress={() => handleAction('vague')}
          >
            <Text style={[styles.actionBtnText, { color: '#ca8a04' }]}>模糊</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#f0fdf4' }]}
            onPress={() => handleAction('known')}
          >
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
  progressSection: { padding: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressText: { fontSize: 13, color: '#64748b' },
  learnedText: { fontSize: 13, color: '#16a34a', fontWeight: '600' },
  progressBar: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 3 },
  wordCard: {
    marginHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  wordHeader: {
    backgroundColor: '#3b82f6',
    padding: 24,
    alignItems: 'center',
  },
  wordText: { fontSize: 32, fontWeight: '800', color: '#ffffff' },
  phoneticText: { fontSize: 14, color: '#bfdbfe', marginTop: 4 },
  audioBtn: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioBtnText: { fontSize: 20 },
  revealSection: { padding: 32, alignItems: 'center' },
  revealHint: { fontSize: 14, color: '#94a3b8', marginBottom: 16 },
  revealBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  revealBtnText: { fontSize: 15, color: '#475569', fontWeight: '600' },
  answerSection: { padding: 16, gap: 12 },
  meaningBox: {
    backgroundColor: '#eff6ff',
    padding: 14,
    borderRadius: 12,
  },
  posText: { fontSize: 12, color: '#3b82f6', fontWeight: '600' },
  meaningText: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginTop: 4 },
  infoBox: {
    backgroundColor: '#ecfdf5',
    padding: 14,
    borderRadius: 12,
  },
  infoTitle: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4 },
  infoContent: { fontSize: 14, color: '#475569', lineHeight: 20 },
  exampleCn: { fontSize: 13, color: '#64748b', marginTop: 4 },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnText: { fontSize: 15, fontWeight: '600' },
});
