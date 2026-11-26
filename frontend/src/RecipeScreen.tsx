import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


interface RecipeScreenProps {
  onBack: () => void;
  recipeData?: {
    name: string;
    category: string;
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    prepTime?: string;
    ingredients?: {
      name: string;
      quantityG: number;
    }[];
    instructions?: string;
  };
}


export default function RecipeScreen({ onBack, recipeData }: RecipeScreenProps) {
  
 const currentRecipe = recipeData || {
  name: 'Nie wybrano przepisu',
  category: 'Posiłek',
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  prepTime: 'Brak danych',
};

const ingredients = currentRecipe.ingredients || [];

  const handleExchange = () => {
    Alert.alert(
      'Wymiana posiłku',
      'Czy chcesz wygenerować inny posiłek o podobnej kaloryczności?',
      [
        { text: 'Anuluj', style: 'cancel' },
        { text: 'Tak, wymień', onPress: () => Alert.alert('Sukces', 'Posiłek został wymieniony!') }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>‹ Wróć do planu</Text>
          </TouchableOpacity>
          <Text style={styles.headerSub}>{currentRecipe.category} · {currentRecipe.prepTime || '30 min'}</Text>
          <Text style={styles.headerTitle}>{currentRecipe.name}</Text>
          <Text style={styles.headerKcal}>
            {currentRecipe.calories} <Text style={styles.kcalUnit}>kcal</Text>
          </Text>
        </View>

        <View style={styles.macrosContainer}>
          <View style={styles.macroBox}>
            <Text style={styles.macroLabel}>Białko</Text>
            <Text style={styles.macroVal}>{currentRecipe.protein ?? 0} g</Text>
            <View style={styles.track}><View style={[styles.fill, { width: '80%', backgroundColor: '#f97316' }]} /></View>
          </View>
          <View style={styles.macroBox}>
            <Text style={styles.macroLabel}>Węgle</Text>
            <Text style={styles.macroVal}>{currentRecipe.carbs ?? 0} g</Text>
            <View style={styles.track}><View style={[styles.fill, { width: '70%', backgroundColor: '#1b4d3e' }]} /></View>
          </View>
          <View style={styles.macroBox}>
            <Text style={styles.macroLabel}>Tłuszcze</Text>
            <Text style={styles.macroVal}>{currentRecipe.fat ?? 0} g</Text>
            <View style={styles.track}><View style={[styles.fill, { width: '50%', backgroundColor: '#facc15' }]} /></View>
          </View>
        </View>

        <View style={styles.bodyContainer}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Składniki</Text>
            {ingredients.map((ing, idx) => (
              <View key={idx} style={[styles.ingredientRow, idx < ingredients.length - 1 && styles.borderBottom]}>
                <Text style={styles.ingredientName}>{ing.name}</Text>
                <Text style={styles.ingredientAmount}>{ing.quantityG} g</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Przygotowanie</Text>
            <Text style={styles.prepText}>
  {currentRecipe.instructions?.trim()
    ? currentRecipe.instructions
    : 'Brak instrukcji przygotowania dla tego przepisu.'}
</Text>
          </View>

          <TouchableOpacity style={styles.exchangeButton} onPress={handleExchange}>
            <Text style={styles.exchangeButtonText}>Wymień posiłek</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f4' },
  scrollContent: { paddingBottom: 40 },
  header: { backgroundColor: '#1b4d3e', paddingTop: 16, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  backButton: { marginBottom: 8 },
  backText: { color: '#a3b8b0', fontSize: 15, fontWeight: '600' },
  headerSub: { color: '#a3b8b0', fontSize: 13, marginBottom: 4 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  headerKcal: { fontSize: 32, fontWeight: 'bold', color: '#f97316' },
  kcalUnit: { fontSize: 16, color: '#f97316', fontWeight: 'normal' },
  macrosContainer: { flexDirection: 'row', paddingHorizontal: 16, marginTop: -16, marginBottom: 16 },
  macroBox: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 12, marginHorizontal: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  macroLabel: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  macroVal: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 6 },
  track: { height: 4, backgroundColor: '#e5e7eb', borderRadius: 2 },
  fill: { height: '100%', borderRadius: 2 },
  bodyContainer: { paddingHorizontal: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
  ingredientRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  ingredientName: { fontSize: 14, color: '#374151' },
  ingredientAmount: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  prepText: { fontSize: 14, color: '#4b5563', lineHeight: 20 },
  exchangeButton: { borderWidth: 1, borderColor: '#1b4d3e', borderRadius: 16, paddingVertical: 16, alignItems: 'center', backgroundColor: '#fff' },
  exchangeButtonText: { color: '#1b4d3e', fontSize: 16, fontWeight: 'bold' },
});