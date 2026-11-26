import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import API_URL from './api';

interface LoginScreenProps {
  onLoginSuccess: (userId: number, token: string, email?: string) => void;
  onNavigateToRegister: () => void;
}

export default function LoginScreen({ onLoginSuccess, onNavigateToRegister }: LoginScreenProps) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Błąd', 'Wypełnij wszystkie pola!');
      return;
    }

    setLoading(true);
    try {
      // Zapytanie POST do Twojego backendu Node.js
      const response = await fetch(`${API_URL}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

      const result = await response.json();

      if (response.ok && result.success) {
        // Zwrócony token JWT oraz dane użytkownika (w tym ID z bazy PostgreSQL)
        const { token, user } = result.data;

if (!user || !user.id || !user.email || !token) {
  Alert.alert(
    'Błąd logowania',
    'Serwer nie zwrócił kompletnych danych użytkownika.'
  );
  return;
}

Alert.alert('Sukces', `Zalogowano pomyślnie! Witaj ${user.email}`);

onLoginSuccess(
  Number(user.id),
  token,
  String(user.email).trim().toLowerCase()
);
      } else {
        Alert.alert('Błąd logowania', result.message || 'Błędny email lub hasło');
      }
    } catch (error) {
      console.error('Błąd logowania:', error);
      Alert.alert('Błąd', 'Nie można połączyć się z serwerem Node.js.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>System Dietetyczny</Text>
        <Text style={styles.subtitle}>Zaloguj się na swoje konto</Text>

        <Text style={styles.label}>E-MAIL</Text>
        <TextInput
          style={styles.input}
          placeholder="twoj@email.com"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>HASŁO</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Zaloguj się</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={onNavigateToRegister} style={styles.switchButton}>
          <Text style={styles.switchText}>Nie masz konta? <Text style={styles.linkText}>Zarejestruj się</Text></Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f4', justifyContent: 'center' },
  formContainer: { padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1b4d3e', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#4b5563', marginBottom: 32, textAlign: 'center' },
  label: { fontSize: 11, fontWeight: '700', color: '#4b5563', marginBottom: 6, textTransform: 'uppercase' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#f97316',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    elevation: 4,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  switchButton: { marginTop: 20, alignItems: 'center' },
  switchText: { color: '#6b7280', fontSize: 14 },
  linkText: { color: '#1b4d3e', fontWeight: 'bold' },
});