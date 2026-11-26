import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import API_URL from './api';

interface PlanScreenProps {
  userId: number;
  planId?: number | null;
  onOpenRecipe: (recipe: any) => void;
  onNavigateToGenerator: () => void;
  onNavigateToSaved: () => void;
  onNavigateToProfile: () => void;
}

export default function PlanScreen({
  userId,
  planId = null,
  onOpenRecipe,
  onNavigateToGenerator,
  onNavigateToSaved,
  onNavigateToProfile,
}: PlanScreenProps) {
  const [activeTab, setActiveTab] = useState<string>('Plan');
  const [loading, setLoading] = useState<boolean>(true);
  const [planData, setPlanData] = useState<any>(null);

  // Pobieranie wygenerowanego jadłospisu z backendu Node.js
  const fetchMealPlan = async () => {
  if (!userId || userId <= 0) {
    setPlanData(null);
    setLoading(false);
    return;
  }

  try {
    setLoading(true);

    const endpoint =
      planId !== null && planId !== undefined
        ? `${API_URL}/api/diet/plans/${userId}/${planId}`
        : `${API_URL}/api/diet/plan/${userId}`;

    const response = await fetch(endpoint);
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || 'Nie udało się pobrać jadłospisu.'
      );
    }

    const data = result.data;
    if (!data) {
  setPlanData(null);
  return;
}

    // Archiwalny jadłospis
    if (planId !== null && planId !== undefined) {
      setPlanData(data);
    } else {
      // Aktualny jadłospis
      setPlanData({
        targets: data.targets || {
          calories: 0,
          protein: 0,
          fat: 0,
          carbs: 0,
        },
        achieved: {
          calories: data.totals?.calories || 0,
          protein: data.totals?.protein || 0,
          fat: data.totals?.fat || 0,
          carbs: data.totals?.carbs || 0,
          score: 0,
        },
        plan: (data.meals || []).map((meal: any) => ({
          ...meal,
          category: meal.mealType || meal.meal_type || 'Posiłek',
          calories: meal.calories || 0,
        })),
      });
    }
  } catch (error: any) {
    console.error('Błąd pobierania jadłospisu:', error);
    Alert.alert(
      'Błąd',
      error.message || 'Nie można połączyć się z serwerem.'
    );
    setPlanData(null);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchMealPlan();
}, [userId, planId]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#1b4d3e" />
        <Text style={{ marginTop: 10, color: '#4b5563' }}>Uruchamiam algorytm optymalizacyjny...</Text>
      </SafeAreaView>
    );
  }

  const targets = planData?.targets || {
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
};

const achieved = planData?.achieved || {
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
  score: 0,
};

const meals = planData?.plan || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerSub}>Zoptymalizowany jadłospis dzienny</Text>
          <Text style={styles.headerTitle}>Wynik algorytmu</Text>

          <View style={styles.macroCard}>
            <View style={styles.circleBox}>
              <Text style={styles.circleKcalNum}>{achieved.calories}</Text>
              <Text style={styles.circleKcalSub}>z {targets.calories} kcal</Text>
              <Text style={styles.scoreText}>Score: {achieved.score} pkt</Text>
            </View>
            <View style={styles.macroBars}>
              <View style={styles.macroRow}>
                <Text style={styles.macroText}>Białko</Text>
                <Text style={styles.macroValue}>{achieved.protein}g / {targets.protein}g</Text>
              </View>
              <View style={styles.track}><View style={[styles.fill, { width: '70%', backgroundColor: '#f97316' }]} /></View>

              <View style={styles.macroRow}>
                <Text style={styles.macroText}>Węgle</Text>
                <Text style={styles.macroValue}>{achieved.carbs}g / {targets.carbs}g</Text>
              </View>
              <View style={styles.track}><View style={[styles.fill, { width: '85%', backgroundColor: '#4ade80' }]} /></View>

              <View style={styles.macroRow}>
                <Text style={styles.macroText}>Tłuszcze</Text>
                <Text style={styles.macroValue}>{achieved.fat}g / {targets.fat}g</Text>
              </View>
              <View style={styles.track}><View style={[styles.fill, { width: '60%', backgroundColor: '#facc15' }]} /></View>
            </View>
          </View>
        </View>

        <View style={styles.listContainer}>
          {meals.map((m: any, index: number) => (
            <TouchableOpacity
  key={index}
  style={styles.mealCard}
  onPress={() => onOpenRecipe(m)}
>
              <View style={[styles.timeBadge, { backgroundColor: '#e2f5ec' }]}>
                <Text style={styles.timeText}>#{index + 1}</Text>
              </View>
              <View style={styles.mealInfo}>
                <Text style={styles.mealType}>{m.category || 'Posiłek'}</Text>
                <Text style={styles.mealName}>{m.name}</Text>
              </View>
              <View style={styles.mealKcalBox}>
                <Text style={styles.mealKcalNum}>{m.calories}</Text>
                <Text style={styles.mealKcalUnit}>kcal</Text>
              </View>
            </TouchableOpacity>
          ))}

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={onNavigateToGenerator}>
              <Text style={styles.secondaryButtonText}>Przeloguj / Generuj ponownie</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Dolny pasek nawigacji */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]} onPress={() => setActiveTab('Plan')}>
          <Text style={[styles.navIcon, styles.navIconActive]}>🏠</Text>
          <Text style={[styles.navText, styles.navTextActive]}>Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={onNavigateToGenerator}>
          <Text style={styles.navIcon}>✨</Text>
          <Text style={styles.navText}>Generator</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={onNavigateToSaved}>
          <Text style={styles.navIcon}>🔖</Text>
          <Text style={styles.navText}>Zapisane</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={onNavigateToProfile}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navText}>Profil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f4' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 90 },
  header: { backgroundColor: '#1b4d3e', paddingTop: 20, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerSub: { color: '#a3b8b0', fontSize: 14, fontWeight: '500' },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  macroCard: { backgroundColor: '#14382d', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center' },
  circleBox: { width: 100, height: 100, borderRadius: 50, borderWidth: 6, borderColor: '#f97316', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  circleKcalNum: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  circleKcalSub: { color: '#a3b8b0', fontSize: 9 },
  scoreText: { color: '#4ade80', fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  macroBars: { flex: 1 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  macroText: { color: '#fff', fontSize: 11 },
  macroValue: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  track: { height: 5, backgroundColor: '#215243', borderRadius: 3, marginBottom: 6 },
  fill: { height: '100%', borderRadius: 3 },
  listContainer: { padding: 16 },
  mealCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 12, elevation: 2 },
  timeBadge: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  timeText: { fontWeight: 'bold', color: '#1b4d3e', fontSize: 13 },
  mealInfo: { flex: 1 },
  mealType: { fontSize: 11, color: '#6b7280', textTransform: 'uppercase', marginBottom: 2 },
  mealName: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' },
  mealKcalBox: { alignItems: 'flex-end' },
  mealKcalNum: { fontSize: 15, fontWeight: 'bold', color: '#1f2937' },
  mealKcalUnit: { fontSize: 11, color: '#6b7280' },
  actionsRow: { marginTop: 10 },
  secondaryButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  secondaryButtonText: { color: '#1f2937', fontWeight: 'bold', fontSize: 14 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, backgroundColor: '#f4f6f4', borderTopWidth: 1, borderTopColor: '#e5e7eb', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 8 },
  navItem: { alignItems: 'center', justifyContent: 'center', flex: 1, paddingVertical: 6 },
  navItemActive: { backgroundColor: '#d8e8e1', borderRadius: 20, marginHorizontal: 8 },
  navIcon: { fontSize: 20, marginBottom: 2, color: '#6b7280' },
  navIconActive: { color: '#1b4d3e' },
  navText: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  navTextActive: { color: '#1b4d3e', fontWeight: 'bold' },
});