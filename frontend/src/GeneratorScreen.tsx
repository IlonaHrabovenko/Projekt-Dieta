import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import API_URL from './api';
import BottomNavigation from './components/BottomNavigation';

interface GeneratorScreenProps {
  userEmail?: string;
  targetCalories?: number; 
  onPlanGenerated?: (planData: any) => void;
  onNavigateToPlan: () => void;
  onNavigateToSaved: () => void;
  onNavigateToProfile: () => void;
}

export default function GeneratorScreen({
  userEmail,
  targetCalories,
  onPlanGenerated,
  onNavigateToPlan,
  onNavigateToSaved,
  onNavigateToProfile,
}: GeneratorScreenProps) {
  // Ustawiamy kalorie bezpośrednio z zapotrzebowania obliczonego w profilu
  const [calories, setCalories] = useState<number>(targetCalories ?? 0);
  const [mealsCount, setMealsCount] = useState<number>(4);
  const [maxRepeats, setMaxRepeats] = useState<number>(2);
  const [exclusions, setExclusions] = useState<string[]>(['Orzechy']);
  const [loading, setLoading] = useState<boolean>(false);


  useEffect(() => {
  setCalories(targetCalories ?? 0);
}, [targetCalories]);

  const handleGeneratePlan = async () => {
  if (!userEmail) {
    Alert.alert(
      'Brak użytkownika',
      'Zaloguj się ponownie, aby wygenerować jadłospis.'
    );
    return;
  }

  if (!calories || calories <= 0) {
    Alert.alert(
      'Brak zapotrzebowania',
      'Najpierw uzupełnij i zapisz swój profil.'
    );
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(
      `${API_URL}/api/meal-plan/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail.trim(),
          mealsCount,
          exclusions,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      Alert.alert(
        'Błąd',
        result.message || 'Nie udało się wygenerować jadłospisu.'
      );
      return;
    }

    Alert.alert(
      'Sukces',
      'Jadłospis został wygenerowany i zapisany!'
    );

    if (onPlanGenerated) {
      onPlanGenerated(result);
    }

    onNavigateToPlan();

  } catch (error) {
    console.error('Błąd generatora:', error);

    Alert.alert(
      'Błąd',
      'Nie można połączyć się z serwerem.'
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Nowy jadłospis</Text>
          
          {/* Wyświetlanie celów kalorycznych bez przycisków +/- */}
          <View style={styles.calorieDisplayContainer}>
            <Text style={styles.calorieNumber}>{calories}</Text>
            <Text style={styles.calorieSubtext}>kcal · Pobrano z Twojego profilu</Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.section}>
            <Text style={styles.label}>LICZBA POSIŁKÓW</Text>
            <View style={styles.optionsRow}>
              {[3, 4, 5].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[styles.optionBox, mealsCount === num && styles.optionBoxActive]}
                  onPress={() => setMealsCount(num)}
                >
                  <Text style={[styles.optionText, mealsCount === num && styles.optionTextActive]}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>MAKS. POWTÓRZEŃ PRODUKTU / TYDZIEŃ</Text>
            <View style={styles.optionsRow}>
              {[1, 2, 3].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[styles.optionBox, maxRepeats === num && styles.optionBoxActive]}
                  onPress={() => setMaxRepeats(num)}
                >
                  <Text style={[styles.optionText, maxRepeats === num && styles.optionTextActive]}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>WYKLUCZENIA</Text>
            <View style={styles.tagsRow}>
              {exclusions.map((item) => (
                <View key={item} style={styles.tagActive}>
                  <Text style={styles.tagActiveText}>{item} ×</Text>
                </View>
              ))}
              <TouchableOpacity style={styles.tagAdd}>
                <Text style={styles.tagAddText}>+ Dodaj</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.generateButton} onPress={handleGeneratePlan} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.generateButtonText}>Generuj jadłospis</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomNavigation
  activeTab="Generator"
  onNavigateToPlan={onNavigateToPlan}
  onNavigateToGenerator={() => {}}
  onNavigateToSaved={onNavigateToSaved}
  onNavigateToProfile={onNavigateToProfile}
/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f4' },
  scrollContent: { paddingBottom: 90 },
  headerCard: {
    backgroundColor: '#1b4d3e',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
  },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 20, alignSelf: 'flex-start' },
  calorieDisplayContainer: { alignItems: 'center', marginVertical: 5 },
  calorieNumber: { fontSize: 46, fontWeight: 'bold', color: '#fb923c' },
  calorieSubtext: { color: '#a7f3d0', fontSize: 13, marginTop: 4 },
  formSection: { padding: 20 },
  section: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '700', color: '#4b5563', marginBottom: 8, textTransform: 'uppercase' },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  optionBox: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  optionBoxActive: { backgroundColor: '#1b4d3e' },
  optionText: { fontSize: 18, fontWeight: 'bold', color: '#4b5563' },
  optionTextActive: { color: '#fff' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagActive: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  tagActiveText: { color: '#065f46', fontWeight: '600', fontSize: 13 },
  tagAdd: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
  },
  tagAddText: { color: '#64748b', fontWeight: '600', fontSize: 13 },
  generateButton: {
    backgroundColor: '#fb923c',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    elevation: 4,
  },
  generateButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
});