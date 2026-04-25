import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, Lock, User, ArrowRight } from 'lucide-react-native';
import { COLORS, API_URL } from '../constants/Config';
import { THEME, FONTS } from '../constants/Theme';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      console.log('Attempting login for:', username);
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        username: username,
        password: password,
      });
      console.log('Login successful, saving token...');
      await SecureStore.setItemAsync('token', res.data.access_token);
      console.log('Token saved, navigating to tabs...');
      router.replace('/(tabs)');
    } catch (err: any) {
      console.log('Login error:', err.response?.data || err.message);
      const msg = err.response?.data?.detail || 'Login failed: Invalid credentials';
      setError(msg.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Shield size={42} color="white" />
        </View>
        <Text style={styles.appTitle}>SmartSurv</Text>
        <Text style={styles.appTagline}>Autonomous AI Security Node</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username</Text>
          <View style={styles.inputWrapper}>
            <User size={18} color={THEME.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Enter your username"
              placeholderTextColor={THEME.textSecondary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <Lock size={18} color={THEME.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={THEME.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity 
          style={[styles.loginBtn, loading && { opacity: 0.7 }]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={styles.loginBtnText}>Login to Dashboard</Text>
              <ArrowRight size={18} color="white" />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text style={styles.signupLink}>Create Organization Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
    justifyContent: 'center',
    padding: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    // Ambient Shadow
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: THEME.text,
    fontFamily: FONTS.heading,
    letterSpacing: -1,
  },
  appTagline: {
    fontSize: 12,
    fontWeight: '500',
    color: THEME.textSecondary,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: FONTS.bodyBold,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: FONTS.bodyBold,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: THEME.text,
    fontFamily: FONTS.body,
  },
  errorText: {
    color: THEME.error,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: FONTS.bodyBold,
  },
  loginBtn: {
    backgroundColor: THEME.primary,
    height: 56,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 10,
  },
  loginBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONTS.bodyBold,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: THEME.textSecondary,
    fontFamily: FONTS.body,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.primary,
    fontFamily: FONTS.bodyBold,
  },
});
