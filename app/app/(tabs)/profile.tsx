import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Shield, Bell, Settings, LogOut, ChevronRight, Activity, Building, MapPin, Info, Globe, Mail, Phone } from 'lucide-react-native';
import { API_URL } from '../../constants/Config';
import { THEME, SPACING, FONTS } from '../../constants/Theme';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState({
    username: 'Admin_User',
    role: 'SYSTEM ADMINISTRATOR',
    orgName: 'Security Ops Center',
    email: 'admin@smartsurv.ai',
    location: 'Main Control Unit'
  });

  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailAlerts: true,
    locationTracking: true,
  });

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to exit the secure session?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: async () => {
            await SecureStore.deleteItemAsync('token');
            router.replace('/login');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>ACCOUNT SETTINGS</Text>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <TouchableOpacity style={styles.headerIconBtn} onPress={handleLogout}>
          <LogOut size={22} color="#dc2626" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarBox}>
              <User size={32} color={THEME.primary} />
            </View>
            <View style={styles.verifyBadge}>
              <Shield size={10} color="white" />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{profile.username}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{profile.role}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <View style={[styles.iconContainer, { backgroundColor: '#eff6ff' }]}>
                <Bell size={18} color={THEME.primary} />
              </View>
              <Text style={styles.rowLabel}>Push Notifications</Text>
            </View>
            <Switch 
              value={settings.pushNotifications} 
              onValueChange={(v) => setSettings({...settings, pushNotifications: v})}
              trackColor={{ false: '#f1f5f9', true: THEME.primary }}
              thumbColor="white"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <View style={[styles.iconContainer, { backgroundColor: '#f0fdf4' }]}>
                <Mail size={18} color={THEME.success} />
              </View>
              <Text style={styles.rowLabel}>Email Reports</Text>
            </View>
            <Switch 
              value={settings.emailAlerts} 
              onValueChange={(v) => setSettings({...settings, emailAlerts: v})}
              trackColor={{ false: '#f1f5f9', true: THEME.primary }}
              thumbColor="white"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SYSTEM INFO</Text>
          
          <TouchableOpacity style={styles.navRow}>
            <View style={styles.rowInfo}>
              <View style={styles.iconContainer}>
                <Building size={18} color={THEME.textSecondary} />
              </View>
              <View>
                <Text style={styles.navLabel}>Organization</Text>
                <Text style={styles.navValue}>{profile.orgName}</Text>
              </View>
            </View>
            <ChevronRight size={16} color={THEME.outline} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navRow}>
            <View style={styles.rowInfo}>
              <View style={styles.iconContainer}>
                <Globe size={18} color={THEME.textSecondary} />
              </View>
              <View>
                <Text style={styles.navLabel}>Primary Location</Text>
                <Text style={styles.navValue}>{profile.location}</Text>
              </View>
            </View>
            <ChevronRight size={16} color={THEME.outline} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navRow}>
            <View style={styles.rowInfo}>
              <View style={styles.iconContainer}>
                <Info size={18} color={THEME.textSecondary} />
              </View>
              <View>
                <Text style={styles.navLabel}>About SmartSurv</Text>
                <Text style={styles.navValue}>v1.0.8 Stable</Text>
              </View>
            </View>
            <ChevronRight size={16} color={THEME.outline} />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>SECURE PROTOCOL ACTIVE</Text>
          <Text style={styles.footerText}>© 2026 SmartSurv Intelligence</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: THEME.text,
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
  },
  avatarBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  verifyBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '900',
    color: THEME.text,
  },
  roleBadge: {
    marginTop: 6,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 9,
    fontWeight: '900',
    color: THEME.primary,
    letterSpacing: 0.5,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  rowInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.text,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  navLabel: {
    fontSize: 11,
    color: THEME.textSecondary,
  },
  navValue: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text,
    marginTop: 1,
  },
  footer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 9,
    color: THEME.outline,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
