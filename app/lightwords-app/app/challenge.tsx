import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';
import { api } from '../src/lib/api';

const { width } = Dimensions.get('window');

export default function ChallengeScreen() {
  const { isLoggedIn } = useAuth();
  const [paths, setPaths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLevel, setActiveLevel] = useState<string | null>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  // Exercise state
  const [exIdx, setExIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (isLoggedIn) api.getLearningPaths().then(setPaths).catch(() => {}).finally(() => setLoading(false));
  }, [isLoggedIn]);

  const startLevel = async (levelId: string) => {
    try {
      const level = await api.getLevelDetail(levelId);
      const exs = level.exercises?.length > 0 ? level.exercises : fallbackExercises;
      setExercises(exs);
      setActiveLevel(levelId);
      setExIdx(0); setSelected(null); setAnswered(false); setCorrect(0); setCombo(0); setMaxCombo(0); setComplete(false);
    } catch {}
  };

  const handleSelect = (index: number) => {
    if (answered) return;
    setSelected(index);
    setAnswered(true);
    const ex = exercises[exIdx];
    const opts = typeof ex.options === 'string' ? JSON.parse(ex.options) : ex.options;
    if (opts[index] === ex.correctAnswer) {
      setCorrect(c => c + 1);
      const nc = combo + 1; setCombo(nc);
      if (nc > maxCombo) setMaxCombo(nc);
    } else { setCombo(0); }
  };

  const handleNext = async () => {
    if (exIdx < exercises.length - 1) {
      setExIdx(i => i + 1); setSelected(null); setAnswered(false);
    } else {
      const stars = correct === exercises.length ? 3 : correct >= Math.ceil(exercises.length * 0.8) ? 2 : correct >= Math.ceil(exercises.length * 0.6) ? 1 : 0;
      try { await api.completeLevel(activeLevel!, { stars, score: correct * 20, maxCombo }); } catch {}
      setComplete(true);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#8b5cf6" /></View>;

  // Completed screen
  if (complete) {
    const stars = correct === exercises.length ? 3 : correct >= Math.ceil(exercises.length * 0.8) ? 2 : 1;
    return (
      <View style={[styles.center, { padding: 32 }]}>
        <Text style={{ fontSize: 48 }}>{stars >= 2 ? '🎉' : '👏'}</Text>
        <Text style={styles.completeTitle}>关卡完成！</Text>
        <View style={{ flexDirection: 'row', marginVertical: 12 }}>
          {[1,2,3].map(s => <Text key={s} style={{ fontSize: 28, color: s <= stars ? '#eab308' : '#e2e8f0' }}>⭐</Text>)}
        </View>
        <Text style={{ color: '#64748b' }}>正确 {correct}/{exercises.length} · +{stars * 10} 金币</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => { setActiveLevel(null); api.getLearningPaths().then(setPaths); }}>
          <Text style={styles.primaryBtnText}>返回地图</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Exercise screen
  if (activeLevel && exercises.length > 0) {
    const ex = exercises[exIdx];
    const opts = typeof ex.options === 'string' ? JSON.parse(ex.options) : (ex.options || []);
    return (
      <View style={[styles.container, { padding: 16 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <TouchableOpacity onPress={() => setActiveLevel(null)}><Text style={{ color: '#64748b' }}>← 返回</Text></TouchableOpacity>
          {combo > 0 && <View style={styles.comboBadge}><Text style={styles.comboText}>🔥 {combo}连击</Text></View>}
        </View>
        <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${((exIdx+1)/exercises.length)*100}%`, backgroundColor: '#10b981' }]} /></View>

        <View style={styles.questionCard}><Text style={styles.questionText}>{ex.question}</Text></View>

        <View style={styles.optionsGrid}>
          {opts.map((opt: string, i: number) => {
            let bg = '#fff', border = '#e2e8f0', tc = '#334155';
            if (answered) {
              if (opt === ex.correctAnswer) { bg = '#f0fdf4'; border = '#86efac'; tc = '#16a34a'; }
              else if (i === selected) { bg = '#fef2f2'; border = '#fca5a5'; tc = '#dc2626'; }
            }
            return (
              <TouchableOpacity key={i} style={[styles.optionBtn, { backgroundColor: bg, borderColor: border }]} onPress={() => handleSelect(i)} disabled={answered}>
                <Text style={[styles.optionText, { color: tc }]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {answered && (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
            <Text style={styles.primaryBtnText}>{exIdx < exercises.length - 1 ? '下一题 →' : '查看结果'}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Map screen
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={{ padding: 16 }}>
        <Text style={styles.pageTitle}>🎮 闯关模式</Text>
        {paths.map((path: any) => path.units?.map((unit: any) => (
          <View key={unit.id} style={styles.unitCard}>
            <Text style={styles.unitTitle}>{unit.icon} {unit.title}</Text>
            <View style={styles.levelsGrid}>
              {unit.levels?.map((level: any) => (
                <TouchableOpacity key={level.id} style={[styles.levelBtn, level.isLocked && { opacity: 0.4 }]}
                  onPress={() => !level.isLocked && startLevel(level.id)} disabled={level.isLocked}>
                  <Text style={styles.levelTitle}>{level.title}</Text>
                  <View style={{ flexDirection: 'row' }}>
                    {[1,2,3].map(s => <Text key={s} style={{ fontSize: 10, color: s <= level.stars ? '#eab308' : '#e2e8f0' }}>⭐</Text>)}
                  </View>
                  {level.isLocked && <Text style={{ position: 'absolute', top: 4, right: 6, fontSize: 10 }}>🔒</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )))}
      </View>
    </ScrollView>
  );
}

const fallbackExercises = [
  { question: '"abandon" 的中文意思是？', options: '["放弃","丰富","能力","国外"]', correctAnswer: '放弃' },
  { question: '"ability" 的中文意思是？', options: '["缺席","能力","吸收","加速"]', correctAnswer: '能力' },
  { question: '"abroad" 的中文意思是？', options: '["抽象的","在国外","吸收","学术的"]', correctAnswer: '在国外' },
  { question: '"absorb" 的中文意思是？', options: '["适应","充裕的","吸收","准确的"]', correctAnswer: '吸收' },
  { question: '"accomplish" 的中文意思是？', options: '["陪伴","积累","完成","适应"]', correctAnswer: '完成' },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  pageTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
  unitCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, elevation: 2 },
  unitTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 10 },
  levelsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  levelBtn: { width: (width - 80) / 3, padding: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center', backgroundColor: '#fff' },
  levelTitle: { fontSize: 11, fontWeight: '600', color: '#475569', marginBottom: 4 },
  progressBar: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden', marginBottom: 16 },
  progressFill: { height: '100%', borderRadius: 3 },
  questionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16, elevation: 2 },
  questionText: { fontSize: 18, fontWeight: '700', color: '#1e293b', textAlign: 'center' },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  optionBtn: { width: (width - 42) / 2, padding: 16, borderRadius: 12, borderWidth: 2, alignItems: 'center' },
  optionText: { fontSize: 15, fontWeight: '600' },
  primaryBtn: { marginTop: 20, backgroundColor: '#3b82f6', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  comboBadge: { backgroundColor: '#fff7ed', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  comboText: { fontSize: 12, fontWeight: '700', color: '#ea580c' },
  completeTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginTop: 8 },
});
