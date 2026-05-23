import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

interface Exercise {
  question: string;
  options: string[];
  correctIndex: number;
}

const exercises: Exercise[] = [
  { question: '"transport" 的中文意思是？', options: ['运输', '转换', '传播', '透明'], correctIndex: 0 },
  { question: '"aboard" 的中文意思是？', options: ['国外的', '在船上', '关于', '到处'], correctIndex: 1 },
  { question: '"accomplish" 的中文意思是？', options: ['陪伴', '积累', '完成', '适应'], correctIndex: 2 },
  { question: '"abundant" 的中文意思是？', options: ['丰富的', '抽象的', '荒谬的', '缺乏的'], correctIndex: 0 },
  { question: '"beneath" 的中文意思是？', options: ['在旁边', '在上面', '在之下', '在之间'], correctIndex: 2 },
];

export default function ChallengeScreen() {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [complete, setComplete] = useState(false);

  const handleSelect = (index: number) => {
    if (answered) return;
    setSelected(index);
    setAnswered(true);
    if (index === exercises[currentIndex].correctIndex) {
      setCorrect((c) => c + 1);
      setCombo((c) => c + 1);
    } else {
      setCombo(0);
      setHearts((h) => Math.max(0, h - 1));
    }
  };

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setComplete(true);
    }
  };

  if (!started) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🎮</Text>
        <Text style={styles.title}>闯关模式</Text>
        <Text style={styles.subtitle}>完成关卡，收获成就！</Text>
        <View style={styles.levelCards}>
          {['日常问候 ⭐⭐⭐', '数字与颜色 ⭐⭐', '家庭成员 ⭐', '食物饮料', '天气与季节 🔒'].map((level, i) => (
            <TouchableOpacity
              key={level}
              style={[styles.levelCard, i === 3 && { borderColor: '#3b82f6', borderWidth: 2 }]}
              onPress={() => i <= 3 && setStarted(true)}
              disabled={i === 4}
            >
              <Text style={[styles.levelText, i === 4 && { color: '#94a3b8' }]}>{level}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }

  if (complete) {
    const stars = correct === exercises.length ? 3 : correct >= 4 ? 2 : correct >= 3 ? 1 : 0;
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <Text style={{ fontSize: 48, marginBottom: 8 }}>{stars >= 2 ? '🎉' : '👏'}</Text>
        <Text style={styles.title}>关卡完成！</Text>
        <View style={{ flexDirection: 'row', marginVertical: 12 }}>
          {[1, 2, 3].map((s) => (
            <Text key={s} style={{ fontSize: 28, color: s <= stars ? '#eab308' : '#e2e8f0' }}>⭐</Text>
          ))}
        </View>
        <Text style={styles.subtitle}>正确 {correct}/{exercises.length} · 金币 +{stars * 10}</Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => { setStarted(false); setCurrentIndex(0); setCorrect(0); setCombo(0); setHearts(5); setComplete(false); setAnswered(false); setSelected(null); }}
        >
          <Text style={styles.primaryBtnText}>返回地图</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const exercise = exercises[currentIndex];

  return (
    <View style={[styles.container, { padding: 16 }]}>  
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Text key={i} style={{ fontSize: 16, opacity: i < hearts ? 1 : 0.3 }}>❤️</Text>
          ))}
        </View>
        {combo > 0 && (
          <View style={styles.comboBadge}>
            <Text style={styles.comboText}>🔥 {combo}连击</Text>
          </View>
        )}
      </View>

      {/* Progress */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentIndex + 1) / exercises.length) * 100}%` }]} />
      </View>

      {/* Question */}
      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{exercise.question}</Text>
      </View>

      {/* Options */}
      <View style={styles.optionsGrid}>
        {exercise.options.map((option, index) => {
          let bgColor = '#ffffff';
          let borderColor = '#e2e8f0';
          let textColor = '#334155';
          if (answered) {
            if (index === exercise.correctIndex) {
              bgColor = '#f0fdf4';
              borderColor = '#86efac';
              textColor = '#16a34a';
            } else if (index === selected) {
              bgColor = '#fef2f2';
              borderColor = '#fca5a5';
              textColor = '#dc2626';
            }
          }
          return (
            <TouchableOpacity
              key={index}
              style={[styles.optionBtn, { backgroundColor: bgColor, borderColor }]}
              onPress={() => handleSelect(index)}
              disabled={answered}
            >
              <Text style={[styles.optionText, { color: textColor }]}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Next */}
      {answered && (
        <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
          <Text style={styles.primaryBtnText}>
            {currentIndex < exercises.length - 1 ? '下一题 →' : '查看结果'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  title: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b' },
  levelCards: { marginTop: 24, gap: 10, width: '100%', paddingHorizontal: 24 },
  levelCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  levelText: { fontSize: 15, fontWeight: '600', color: '#334155', textAlign: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  comboBadge: { backgroundColor: '#fff7ed', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  comboText: { fontSize: 12, fontWeight: '700', color: '#ea580c' },
  progressBar: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden', marginBottom: 20 },
  progressFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 3 },
  questionCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  questionText: { fontSize: 18, fontWeight: '700', color: '#1e293b', textAlign: 'center' },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  optionBtn: { width: (width - 42) / 2, padding: 16, borderRadius: 12, borderWidth: 2, alignItems: 'center' },
  optionText: { fontSize: 15, fontWeight: '600' },
  primaryBtn: { marginTop: 20, backgroundColor: '#3b82f6', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
