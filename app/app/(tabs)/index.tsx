import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Activity, Bell, Target, TrendingUp, Cpu, ChevronRight } from 'lucide-react-native';
import { API_URL } from '../../constants/Config';
import { THEME, SPACING, FONTS } from '../../constants/Theme';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export default function DashboardScreen() {
  const [stats, setStats] = useState({
    totalAlerts: 0,
    activeFeeds: 0,
    avgConfidence: 0,
    systemMode: 'IDLE',
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const res = await axios.get(`${API_URL}/api/alerts/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const alerts = res.data || [];
      
      const total = alerts.length;
      const confs = alerts.flatMap((a: any) => (a.detections || []).map((d: any) => d.confidence || 0));
      const avg = confs.length > 0 ? (confs.reduce((a: number, b: number) => a + b, 0) / confs.length) * 100 : 0;

      setStats({
        totalAlerts: total,
        activeFeeds: 1, 
        avgConfidence: Math.round(avg),
        systemMode: 'ACTIVE',
      });
    } catch (err) {
      console.log('Fetch error:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.miniLogo}>
            <Shield size={20} color="white" />
          </View>
          <Text style={styles.headerTitle}>SmartSurv</Text>
        </View>
        <View style={styles.statusChip}>
          <View style={styles.onlineDot} />
          <Text style={styles.statusText}>PROTECTED</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.primary} />}
      >
        <Text style={styles.sectionTitle}>System Analytics</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Security Events</Text>
            <Text style={styles.statValue}>{stats.totalAlerts}</Text>
            <View style={styles.statIconBox}>
              <Bell size={16} color={THEME.primary} />
            </View>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>AI Confidence</Text>
            <Text style={styles.statValue}>{stats.avgConfidence}%</Text>
            <View style={styles.statIconBox}>
              <TrendingUp size={16} color={THEME.success} />
            </View>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Active Feeds</Text>
            <Text style={styles.statValue}>{stats.activeFeeds}</Text>
            <View style={styles.statIconBox}>
              <Cpu size={16} color={THEME.secondary} />
            </View>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Engine Mode</Text>
            <Text style={styles.statValue}>{stats.systemMode}</Text>
            <View style={styles.statIconBox}>
              <Activity size={16} color={THEME.primaryContainer} />
            </View>
          </View>
        </View>

        <View style={styles.mainAction}>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Intelligent Surveillance</Text>
            <Text style={styles.actionDesc}>AI is actively monitoring all sectors for unauthorized activity and specific threat classes.</Text>
          </View>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.buttonText}>Open Monitor</Text>
            <ChevronRight size={18} color="white" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.emptyActivity}>
          <Activity size={32} color={THEME.outline} opacity={0.3} />
          <Text style={styles.emptyText}>Pull to refresh logs</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: THEME.surface,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  miniLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.text,
    fontFamily: FONTS.heading,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: THEME.background,
    borderRadius: 20,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.success,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: 0.5,
    fontFamily: FONTS.bodyBold,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
    fontFamily: FONTS.heading,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: THEME.surface,
    padding: 20,
    borderRadius: 12,
    // Ambient Shadow
    shadowColor: THEME.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statLabel: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginBottom: 4,
    fontFamily: FONTS.body,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.text,
    fontFamily: FONTS.heading,
  },
  statIconBox: {
    position: 'absolute',
    top: 15,
    right: 15,
    opacity: 0.2,
  },
  mainAction: {
    backgroundColor: THEME.surface,
    padding: 24,
    borderRadius: 16,
    marginBottom: SPACING.xl,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 8,
    fontFamily: FONTS.heading,
  },
  actionDesc: {
    fontSize: 14,
    color: THEME.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
    fontFamily: FONTS.body,
  },
  primaryButton: {
    backgroundColor: THEME.primary,
    height: 52,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONTS.bodyBold,
  },
  emptyActivity: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.surface,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 12,
    color: THEME.outline,
    marginTop: 10,
    fontWeight: '600',
    fontFamily: FONTS.body,
  },
});
