import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import API_URL from './api';

interface ProfileScreenProps {
  userEmail?: string;
  onNavigateToPlan: () => void;
  onNavigateToGenerator: () => void;
  onNavigateToSaved: () => void;
  onLogout?: () => void;
}


const ACTIVITY_LEVELS = [
  {
    label: 'Siedzący (brak ruchu / praca biurowa)',
    value: 1.2,
  },
  {
    label: 'Lekka aktywność (lekki trening 1-3x w tygodniu)',
    value: 1.375,
  },
  {
    label: 'Umiarkowana aktywność (trening 3-5x w tygodniu)',
    value: 1.55,
  },
  {
    label: 'Wysoka aktywność (ciężki trening 6-7x w tygodniu)',
    value: 1.725,
  },
  {
    label: 'Bardzo wysoka (ciężka praca fizyczna i codzienne treningi)',
    value: 1.9,
  },
];

type Gender = 'female' | 'male';
type Goal = 'Redukcja' | 'Utrzymanie' | 'Masa';

export default function ProfileScreen({
  userEmail,
  onNavigateToPlan,
  onNavigateToGenerator,
  onNavigateToSaved,
}: ProfileScreenProps) {
  const [age, setAge] = useState('24');
  const [height, setHeight] = useState('172');
  const [weight, setWeight] = useState('64');

  const [gender, setGender] = useState<Gender>('female');
  const [activity, setActivity] = useState(1.375);
  const [goal, setGoal] = useState<Goal>('Utrzymanie');

  const [bmr, setBmr] = useState(0);
  const [tdee, setTdee] = useState(0);
  const [targetCalories, setTargetCalories] = useState(0);

  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);

  // Obliczanie zapotrzebowania według wzoru Mifflina-St Jeora
  const calculateCurrentMetrics = () => {
    const w = parseFloat(weight.replace(',', '.'));
    const h = parseFloat(height.replace(',', '.'));
    const a = parseInt(age, 10);

    if (
      !Number.isFinite(w) ||
      !Number.isFinite(h) ||
      !Number.isFinite(a) ||
      w <= 0 ||
      h <= 0 ||
      a <= 0
    ) {
      throw new Error('Wprowadź prawidłowy wiek, wzrost i wagę.');
    }

    let calculatedBmr =
      10 * w + 6.25 * h - 5 * a;

    calculatedBmr += gender === 'female' ? -161 : 5;

    calculatedBmr = Math.round(calculatedBmr);

    const calculatedTdee = Math.round(
      calculatedBmr * activity
    );

    let calculatedTarget = calculatedTdee;

    if (goal === 'Redukcja') {
      calculatedTarget = Math.round(calculatedTdee * 0.85);
    } else if (goal === 'Masa') {
      calculatedTarget = Math.round(calculatedTdee * 1.15);
    }

    return {
      bmr: calculatedBmr,
      tdee: calculatedTdee,
      targetCalories: calculatedTarget,
    };
  };

  // Obliczanie zapotrzebowania
  const handleCalculate = () => {
    try {
      const metrics = calculateCurrentMetrics();

      setBmr(metrics.bmr);
      setTdee(metrics.tdee);
      setTargetCalories(metrics.targetCalories);
      setShowResults(true);
    } catch (error) {
      Alert.alert(
        'Błąd danych',
        error instanceof Error
          ? error.message
          : 'Sprawdź wprowadzone dane.'
      );
    }
  };

  // Zapisywanie profilu w bazie danych
  const handleSaveAndNavigate = async () => {
    if (loading) {
      return;
    }

    if (!userEmail || !userEmail.trim()) {
      Alert.alert(
        'Brak użytkownika',
        'Nie otrzymano adresu e-mail zalogowanego użytkownika. Sprawdź przekazywanie userEmail w App.tsx.'
      );
      return;
    }

    let metrics;

    try {
      metrics = calculateCurrentMetrics();
    } catch (error) {
      Alert.alert(
        'Błąd danych',
        error instanceof Error
          ? error.message
          : 'Sprawdź wprowadzone dane.'
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/user/profile`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userEmail.trim(),
            age: Number(age),
            height: Number(height),
            weight: Number(weight),
            gender,
            activityMultiplier: activity,
            goal,
            bmr: metrics.bmr,
            tdee: metrics.tdee,
            targetCalories: metrics.targetCalories,
          }),
        }
      );

      const responseText = await response.text();

      let result: any = {};

      try {
        result = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        result = { message: responseText };
      }

      if (!response.ok) {
        throw new Error(
          result.message ||
          result.error ||
          `Błąd serwera: ${response.status}`
        );
      }

      console.log('Profil zapisany:', result);

      setBmr(metrics.bmr);
      setTdee(metrics.tdee);
      setTargetCalories(metrics.targetCalories);

      Alert.alert(
        'Zapisano profil',
        'Twoje dane zostały zapisane w bazie danych.',
        [
          {
            text: 'Przejdź do planu',
            onPress: onNavigateToPlan,
          },
        ]
      );
    } catch (error) {
      console.error('Błąd zapisywania profilu:', error);

      Alert.alert(
        'Nie udało się zapisać profilu',
        error instanceof Error
          ? error.message
          : 'Nieznany błąd połączenia z serwerem.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Twoje dane i zapotrzebowanie
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>WIEK (lat)</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                placeholder="Wiek"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>WZROST (cm)</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                placeholder="Wzrost"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>WAGA (kg)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                placeholder="Waga"
              />
            </View>
          </View>

          <Text style={styles.label}>PŁEĆ</Text>

          <View style={styles.segmentedControl}>
            {([
  { label: 'Kobieta', value: 'female' },
  { label: 'Mężczyzna', value: 'male' },
] as const).map((item) => (
  <TouchableOpacity
    key={item.value}
    style={[
      styles.segmentButton,
      gender === item.value && styles.segmentActive,
    ]}
    onPress={() => setGender(item.value)}
  >
    <Text
      style={[
        styles.segmentText,
        gender === item.value && styles.segmentTextActive,
      ]}
    >
      {item.label}
    </Text>
  </TouchableOpacity>
))}
          </View>

          <Text style={styles.label}>
            POZIOM AKTYWNOŚCI (PAL)
          </Text>

          <View style={styles.activityContainer}>
            {ACTIVITY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.activityButton,
                  activity === level.value && styles.activityActive,
                ]}
                onPress={() => setActivity(level.value)}
              >
                <Text
                  style={[
                    styles.activityText,
                    activity === level.value &&
                      styles.activityTextActive,
                  ]}
                >
                  {level.label} ({level.value})
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>CEL</Text>

          <View style={styles.segmentedControl}>
            {(['Redukcja', 'Utrzymanie', 'Masa'] as const).map(
              (item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.segmentButtonThird,
                    goal === item && styles.segmentActive,
                  ]}
                  onPress={() => setGoal(item)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      goal === item && styles.segmentTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>

          <TouchableOpacity
            style={styles.calculateButton}
            onPress={handleCalculate}
          >
            <Text style={styles.calculateButtonText}>
              Oblicz zapotrzebowanie
            </Text>
          </TouchableOpacity>

          {showResults && (
            <View style={styles.resultCard}>
              <Text style={styles.resultCardTitle}>
                Model Mifflin-St Jeor (wynik)
              </Text>

              <View style={styles.resultRow}>
                <View>
                  <Text style={styles.resultLabel}>BMR</Text>
                  <Text style={styles.resultValue}>
                    {bmr}
                  </Text>
                </View>

                <View>
                  <Text style={styles.resultLabel}>TDEE</Text>
                  <Text style={styles.resultValue}>
                    {tdee}
                  </Text>
                </View>

                <View>
                  <Text style={styles.resultLabelOrange}>
                    Cel dzienny
                  </Text>
                  <Text style={styles.resultValueOrange}>
                    {targetCalories}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  loading && styles.disabledButton,
                ]}
                onPress={handleSaveAndNavigate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    Zapisz i przejdź do planu
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Dolna nawigacja */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={onNavigateToPlan}
        >
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navText}>Plan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={onNavigateToGenerator}
        >
          <Text style={styles.navIcon}>✨</Text>
          <Text style={styles.navText}>Generator</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={onNavigateToSaved}
        >
          <Text style={styles.navIcon}>🔖</Text>
          <Text style={styles.navText}>Zapisane</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navItem,
            styles.navItemActiveProfile,
          ]}
        >
          <Text
            style={[
              styles.navIcon,
              styles.navIconActive,
            ]}
          >
            👤
          </Text>
          <Text
            style={[
              styles.navText,
              styles.navTextActive,
            ]}
          >
            Profil
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f4',
  },

  scrollContent: {
    paddingBottom: 90,
  },

  header: {
    backgroundColor: '#1b4d3e',
    paddingTop: 28,
    paddingBottom: 36,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },

  formContainer: {
    padding: 20,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  inputGroup: {
    flex: 1,
    marginHorizontal: 4,
  },

  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4b5563',
    marginBottom: 6,
    textTransform: 'uppercase',
  },

  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },

  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },

  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },

  segmentButtonThird: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },

  segmentActive: {
    backgroundColor: '#1b4d3e',
  },

  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },

  segmentTextActive: {
    color: '#fff',
  },

  activityContainer: {
    marginBottom: 16,
  },

  activityButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },

  activityActive: {
    backgroundColor: '#1b4d3e',
    borderColor: '#1b4d3e',
  },

  activityText: {
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '600',
  },

  activityTextActive: {
    color: '#fff',
  },

  calculateButton: {
    backgroundColor: '#1b4d3e',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
  },

  calculateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  resultCard: {
    backgroundColor: '#1b4d3e',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
  },

  resultCardTitle: {
    color: '#a3b8b0',
    fontSize: 13,
    marginBottom: 12,
  },

  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  resultLabel: {
    color: '#a3b8b0',
    fontSize: 12,
    marginBottom: 4,
  },

  resultValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },

  resultLabelOrange: {
    color: '#f97316',
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '600',
  },

  resultValueOrange: {
    color: '#f97316',
    fontSize: 22,
    fontWeight: 'bold',
  },

  saveButton: {
    backgroundColor: '#f97316',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },

  disabledButton: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#f4f6f4',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 8,
  },

  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 6,
  },

  navItemActiveProfile: {
    backgroundColor: '#d8e8e1',
    borderRadius: 20,
    marginHorizontal: 8,
  },

  navIcon: {
    fontSize: 20,
    marginBottom: 2,
    color: '#6b7280',
  },

  navIconActive: {
    color: '#1b4d3e',
  },

  navText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },

  navTextActive: {
    color: '#1b4d3e',
    fontWeight: 'bold',
  },
});
