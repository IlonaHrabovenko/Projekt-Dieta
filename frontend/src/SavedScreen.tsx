
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import API_URL from './api';

interface SavedScreenProps {
  userId: number;
  onNavigateToPlan: (planId: number) => void;
  onNavigateToGenerator: () => void;
  onNavigateToProfile: () => void;
  onNavigateToCurrentPlan: () => void;
}

interface SavedDiet {
  id: number;
  userId: number;
  planDate: string;
  createdAt: string;
  totals: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}

export default function SavedScreen({
  userId,
  onNavigateToPlan,
  onNavigateToGenerator,
  onNavigateToProfile,
  onNavigateToCurrentPlan,
}: SavedScreenProps) {
  const [savedDiets, setSavedDiets] = useState<SavedDiet[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Zapisane');

  const fetchSavedDiets = async () => {
    if (!userId || userId <= 0) {
      setSavedDiets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/diet/plans/${userId}`
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Nie udało się pobrać zapisanych jadłospisów.'
        );
      }

      setSavedDiets(result.data || []);
    } catch (error: any) {
      console.error('Błąd pobierania zapisanych jadłospisów:', error);

      Alert.alert(
        'Błąd',
        error.message || 'Nie udało się połączyć z serwerem.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedDiets();
  }, [userId]);

  const formatDate = (date: string) => {
    if (!date) return 'Brak daty';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString('pl-PL');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Zapisane jadłospisy</Text>
        <Text style={styles.headerSub}>
          Twoje archiwalne jadłospisy z bazy PostgreSQL
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#1b4d3e" />
            <Text style={styles.emptyText}>
              Pobieranie zapisanych jadłospisów...
            </Text>
          </View>
        ) : savedDiets.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={styles.emptyTitle}>
              Brak zapisanych jadłospisów
            </Text>
            <Text style={styles.emptyText}>
              Wygenerowane jadłospisy pojawią się tutaj.
            </Text>
          </View>
        ) : (
          savedDiets.map((diet) => (
            <TouchableOpacity
              key={diet.id}
              style={styles.card}
              onPress={() => onNavigateToPlan(diet.id)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>
                  Jadłospis z dnia {formatDate(diet.planDate)}
                </Text>

                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Zapisany</Text>
                </View>
              </View>

              <View style={styles.cardDetails}>
                <Text style={styles.cardInfo}>
                  Utworzono: {formatDate(diet.createdAt)}
                </Text>

                <Text style={styles.cardKcal}>
                  {Math.round(diet.totals.calories)} kcal
                </Text>
              </View>

              <Text style={styles.macros}>
                Białko: {Math.round(diet.totals.protein)} g
                {'  '}Tłuszcze: {Math.round(diet.totals.fat)} g
                {'  '}Węglowodany: {Math.round(diet.totals.carbs)} g
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <View style={styles.bottomNav}>
  <TouchableOpacity
    style={styles.navItem}
    onPress={onNavigateToCurrentPlan}
  >
          <Text style={styles.navIcon}>📋</Text>
          <Text style={styles.navText}>Plan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={onNavigateToGenerator}
        >
          <Text style={styles.navIcon}>⚙️</Text>
          <Text style={styles.navText}>Generator</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, styles.navItemActive]}
          onPress={() => setActiveTab('Zapisane')}
        >
          <Text style={[styles.navIcon, styles.navIconActive]}>📁</Text>
          <Text style={[styles.navText, styles.navTextActive]}>
            Zapisane
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={onNavigateToProfile}
        >
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navText}>Profil</Text>
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
  header: {
    backgroundColor: '#1b4d3e',
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSub: {
    color: '#a3b8b0',
    fontSize: 13,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 90,
    flexGrow: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#e2f5ec',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  badgeText: {
    color: '#1b4d3e',
    fontSize: 12,
    fontWeight: '600',
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    color: '#6b7280',
    fontSize: 13,
  },
  cardKcal: {
    color: '#f97316',
    fontWeight: 'bold',
    fontSize: 15,
  },
  macros: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 12,
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
  navItemActive: {
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
