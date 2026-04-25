import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, User, Mail, Lock, MapPin, Building, ArrowLeft } from 'lucide-react-native';
import { COLORS, API_URL } from '../constants/Config';
import { THEME, FONTS } from '../constants/Theme';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignupScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'organization',
    organization_type: '',
    organization_address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSignup = async () => {
    if (!form.username || !form.email || !form.password) {
      setError('Please fill in all required fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_URL}/api/auth/signup`, form);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.centerContainer}>
        <Shield size={60} color={THEME.primary} />
        <Text style={styles.successTitle}>Request Sent</Text>
        <Text style={styles.successDesc}>Your registration is pending admin approval. Please check your email for verification.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/login')}>
          <Text style={styles.primaryButtonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color={THEME.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Join SmartSurv</Text>
            <Text style={styles.subtitle}>Register your organization for AI-powered monitoring</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputWrapper}>
                <User size={18} color={THEME.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Choose a username"
                  value={form.username}
                  onChangeText={(v) => setForm({ ...form, username: v })}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Mail size={18} color={THEME.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={form.email}
                  onChangeText={(v) => setForm({ ...form, email: v })}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color={THEME.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  value={form.password}
                  onChangeText={(v) => setForm({ ...form, password: v })}
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Organization Type</Text>
              <View style={styles.inputWrapper}>
                <Building size={18} color={THEME.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Police Station, Hospital"
                  value={form.organization_type}
                  onChangeText={(v) => setForm({ ...form, organization_type: v })}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <View style={styles.inputWrapper}>
                <MapPin size={18} color={THEME.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Physical location"
                  value={form.organization_address}
                  onChangeText={(v) => setForm({ ...form, organization_address: v })}
                />
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.primaryButton} onPress={handleSignup} disabled={loading}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonText}>Create Account</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  container: {
    flex: 1,
  },
  scroll: {
    padding: 24,
  },
  backBtn: {
    marginBottom: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: THEME.text,
    fontFamily: FONTS.heading,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: THEME.textSecondary,
    lineHeight: 20,
    fontFamily: FONTS.body,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
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
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: THEME.text,
    fontFamily: FONTS.body,
  },
  errorText: {
    color: THEME.error,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONTS.bodyBold,
  },
  primaryButton: {
    backgroundColor: THEME.primary,
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONTS.bodyBold,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: THEME.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.text,
    marginTop: 24,
    marginBottom: 12,
    fontFamily: FONTS.heading,
  },
  successDesc: {
    fontSize: 14,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    fontFamily: FONTS.body,
  },
});
