import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface RegisterScreenProps {
  onRegisterSuccess: () => void;
  onNavigateToLogin: () => void;
}

export default function RegisterScreen({ onRegisterSuccess, onNavigateToLogin }: RegisterScreenProps) {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Błąd', 'Wypełnij wszystkie pola (imię, e-mail, hasło)!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        Alert.alert('Sukces', 'Konto zostało utworzone! Możesz uzupełnić dane w profilu.');
        onRegisterSuccess();
      } else {
        Alert.alert('Błąd rejestracji', result.message || 'Nie udało się utworzyć konta.');
      }
    } catch (error) {
      console.error('Błąd rejestracji:', error);
      Alert.alert('Błąd', 'Nie można połączyć się z serwerem Node.js.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Utwórz konto</Text>
          <Text style={styles.subtitle}>Wprowadź podstawowe dane, aby zacząć</Text>

          <Text style={styles.label}>IMIĘ</Text>
          <TextInput
            style={styles.input}
            placeholder="Twoje imię"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={setName}
          />

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

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Zarejestruj się</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onNavigateToLogin} style={styles.switchButton}>
            <Text style={styles.switchText}>Masz już konto? <Text style={styles.linkText}>Zaloguj się</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f4' },
  scrollContent: { paddingBottom: 40 },
  formContainer: { padding: 24, marginTop: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1b4d3e', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#4b5563', marginBottom: 24, textAlign: 'center' },
  label: { fontSize: 11, fontWeight: '700', color: '#4b5563', marginBottom: 6, textTransform: 'uppercase' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 14,
  },
  button: {
    backgroundColor: '#1b4d3e',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    elevation: 4,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  switchButton: { marginTop: 20, alignItems: 'center' },
  switchText: { color: '#6b7280', fontSize: 14 },
  linkText: { color: '#f97316', fontWeight: 'bold' },
});