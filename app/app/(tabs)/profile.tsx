import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Shield, Bell, Settings, LogOut, ChevronRight, Activity, Building, MapPin } from 'lucide-react-native';
import { API_URL } from '../../constants/Config';
import { THEME, SPACING, FONTS } from '../../constants/Theme';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export default function ProfileScreen() {
  const [profile, setProfile] = useState({
    username: 'SmartSurv_Admin',
    role: 'ADMIN',
    orgName: 'City Security HQ',
    email: 'admin@smartsurv.ai'
  });

  const [settings, setSettings] = useState({
    pushNotifications: true,
    criticalOnly: false,
    autoInference: true,
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agency Profile</Text>
        <Text style={styles.headerSubtitle}>Manage your organization and settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarBox}>
            <User size={36} color={THEME.primary} />
            <View style={styles.verifyBadge}>
              <Shield size={10} color="white" />
            </View>
          </View>
          <Text style={styles.userName}>{profile.username}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{profile.role}</Text>
          </View>
        </View>

        <View style={styles.orgCard}>
          <View style={styles.orgIconBox}>
            <Building size={24} color="white" />
          </View>
          <View style={styles.orgInfo}>
            <Text style={styles.orgName}>{profile.orgName}</Text>
            <Text style={styles.orgType}>Authorized Surveillance Entity</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Settings</Text>
          
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Bell size={20} color={THEME.textSecondary} />
              <Text style={styles.rowLabel}>Push Notifications</Text>
            </View>
            <Switch 
              value={settings.pushNotifications} 
              onValueChange={(v) => setSettings({...settings, pushNotifications: v})}
              trackColor={{ false: THEME.outlineVariant, true: THEME.primary }}
              thumbColor="white"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Activity size={20} color={THEME.textSecondary} />
              <Text style={styles.rowLabel}>Critical Threats Only</Text>
            </View>
            <Switch 
              value={settings.criticalOnly} 
              onValueChange={(v) => setSettings({...settings, criticalOnly: v})}
              trackColor={{ false: THEME.outlineVariant, true: THEME.primary }}
              thumbColor="white"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Settings size={20} color={THEME.textSecondary} />
              <Text style={styles.rowLabel}>AI Auto-Inference</Text>
            </View>
            <Switch 
              value={settings.autoInference} 
              onValueChange={(v) => setSettings({...settings, autoInference: v})}
              trackColor={{ false: THEME.outlineVariant, true: THEME.primary }}
              thumbColor="white"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity style={styles.navRow}>
            <View style={styles.rowInfo}>
              <User size={20} color={THEME.textSecondary} />
              <Text style={styles.rowLabel}>Personal Information</Text>
            </View>
            <ChevronRight size={18} color={THEME.outline} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navRow}>
            <View style={styles.rowInfo}>
              <MapPin size={20} color={THEME.textSecondary} />
              <Text style={styles.rowLabel}>Station Location</Text>
            </View>
            <ChevronRight size={18} color={THEME.outline} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn}>
          <LogOut size={20} color={THEME.error} />
          <Text style={styles.logoutText}>Logout of System</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>SmartSurv Mobile Node v1.0.8</Text>
          <Text style={styles.footerText}>Secure Protocol: TLS 1.3 | Encrypted</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: THEME.surface,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.text,
    fontFamily: FONTS.heading,
  },
  headerSubtitle: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginTop: 2,
    fontFamily: FONTS.body,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  verifyBadge: {
    position: 'absolute',
    bottom: 0,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: THEME.background,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.text,
    fontFamily: FONTS.heading,
  },
  roleBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(0,74,198,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.primary,
    letterSpacing: 1,
    fontFamily: FONTS.bodyBold,
  },
  orgCard: {
    marginHorizontal: SPACING.lg,
    backgroundColor: '#00338a', // Darker variation of primary
    padding: 24,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 32,
  },
  orgIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgInfo: {
    flex: 1,
  },
  orgName: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONTS.heading,
  },
  orgType: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
    fontFamily: FONTS.body,
  },
  section: {
    backgroundColor: THEME.surface,
    paddingVertical: 8,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginHorizontal: SPACING.lg,
    marginVertical: 12,
    fontFamily: FONTS.heading,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
  },
  rowInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.text,
    fontFamily: FONTS.bodyBold,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: SPACING.lg,
  },
  logoutBtn: {
    margin: SPACING.lg,
    backgroundColor: THEME.surface,
    padding: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.error,
    fontFamily: FONTS.bodyBold,
  },
  footer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    color: THEME.outline,
    letterSpacing: 0.5,
    marginBottom: 6,
    fontFamily: FONTS.body,
  },
});
