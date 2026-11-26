import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen({ userEmail, onLogout }: { userEmail: string, onLogout: () => void }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Witaj w aplikacji!</Text>
        <Text style={styles.subtitle}>Twój panel zarządzania dietą</Text>

        <View style={styles.homeCard}>
          <Text style={styles.homeText}>Zalogowano jako:</Text>
          <Text style={styles.homeEmail}>{userEmail || 'Użytkownik'}</Text>
        </View>

        <TouchableOpacity style={[styles.button, { backgroundColor: '#dc2626' }]} onPress={onLogout}>
          <Text style={styles.buttonText}>Wyloguj się</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4', justifyContent: 'center' },
  formContainer: { padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#166534', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#15803d', marginBottom: 24, textAlign: 'center' },
  homeCard: { backgroundColor: '#fff', padding: 20, borderRadius: 8, borderWidth: 1, borderColor: '#bbf7d0', marginBottom: 20, alignItems: 'center' },
  homeText: { fontSize: 14, color: '#666', marginBottom: 4 },
  homeEmail: { fontSize: 18, fontWeight: 'bold', color: '#166534' },
  button: { paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});