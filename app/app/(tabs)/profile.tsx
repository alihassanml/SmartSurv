import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Shield, Bell, Settings, LogOut, ChevronRight, Activity, Building, MapPin, Info, Globe, Mail, Phone } from 'lucide-react-native';
import { API_URL } from '../../constants/Config';
import { THEME, SPACING, FONTS } from '../../constants/Theme';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState({
    username: 'SmartSurv_Admin',
    role: 'ADMINISTRATOR',
    orgName: 'Intelligence Surveillance Agency',
    email: 'admin@smartsurv.ai',
    location: 'Sector 7G, Command Unit'
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account Settings</Text>
        <Text style={styles.headerSubtitle}>Manage security preferences & node info</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(37,99,235,0.08)' }]}>
                <Bell size={18} color={THEME.primary} />
              </View>
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
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(22, 163, 74, 0.08)' }]}>
                <Mail size={18} color={THEME.success} />
              </View>
              <Text style={styles.rowLabel}>Email Alert Reports</Text>
            </View>
            <Switch 
              value={settings.emailAlerts} 
              onValueChange={(v) => setSettings({...settings, emailAlerts: v})}
              trackColor={{ false: THEME.outlineVariant, true: THEME.primary }}
              thumbColor="white"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(0, 104, 122, 0.08)' }]}>
                <MapPin size={18} color={THEME.secondary} />
              </View>
              <Text style={styles.rowLabel}>Location Services</Text>
            </View>
            <Switch 
              value={settings.locationTracking} 
              onValueChange={(v) => setSettings({...settings, locationTracking: v})}
              trackColor={{ false: THEME.outlineVariant, true: THEME.primary }}
              thumbColor="white"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information</Text>
          
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
                <Text style={styles.navLabel}>About SmartSurv AI</Text>
                <Text style={styles.navValue}>Version 1.0.8 Production</Text>
              </View>
            </View>
            <ChevronRight size={16} color={THEME.outline} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={18} color={THEME.error} />
          <Text style={styles.logoutText}>Terminate Session</Text>
        </TouchableOpacity>

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
    backgroundColor: THEME.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: THEME.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.outlineVariant,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.text,
    fontFamily: FONTS.heading,
  },
  headerSubtitle: {
    fontSize: 13,
    color: THEME.textSecondary,
    marginTop: 2,
    fontFamily: FONTS.body,
  },
  content: {
    flex: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    backgroundColor: THEME.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.outlineVariant,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
  },
  avatarBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.outlineVariant,
  },
  verifyBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: THEME.surface,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.text,
    fontFamily: FONTS.heading,
  },
  roleBadge: {
    marginTop: 6,
    backgroundColor: 'rgba(37,99,235,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.primary,
    letterSpacing: 0.5,
    fontFamily: FONTS.bodyBold,
  },
  section: {
    marginTop: 24,
    backgroundColor: THEME.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: THEME.outlineVariant,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
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
    paddingVertical: 12,
    paddingHorizontal: SPACING.lg,
  },
  rowInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: THEME.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.text,
    fontFamily: FONTS.bodyBold,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.textSecondary,
    fontFamily: FONTS.body,
  },
  navValue: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text,
    marginTop: 1,
    fontFamily: FONTS.bodyBold,
  },
  logoutBtn: {
    margin: 24,
    backgroundColor: THEME.surface,
    padding: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(186,26,26,0.1)',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.error,
    fontFamily: FONTS.bodyBold,
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
    fontFamily: FONTS.bodyBold,
  },
});
