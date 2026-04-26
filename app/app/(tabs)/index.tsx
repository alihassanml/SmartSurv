import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Activity, Bell, Target, TrendingUp, Cpu, ChevronRight, Video, Server } from 'lucide-react-native';
import { API_URL } from '../../constants/Config';
import { THEME, SPACING, FONTS } from '../../constants/Theme';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const [stats, setStats] = useState({
    totalAlerts: 0,
    activeFeeds: 0,
    avgConfidence: 0,
    systemMode: 'HYBRID',
  });
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch Alert History
      const alertsRes = await axios.get(`${API_URL}/api/alerts/history`, { headers });
      const alerts = alertsRes.data || [];
      
      // Fetch Active Feeds
      const feedsRes = await axios.get(`${API_URL}/api/camera/feeds`, { headers });
      const feeds = feedsRes.data?.feeds || [];

      // Fetch System Info (Mode)
      const sysRes = await axios.get(`${API_URL}/api/camera/mode`, { headers });
      const currentMode = sysRes.data?.mode || 'HYBRID';

      const total = alerts.length;
      const confs = alerts.flatMap((a: any) => (a.detections || []).map((d: any) => d.confidence || 0));
      const avg = confs.length > 0 ? (confs.reduce((a: number, b: number) => a + b, 0) / confs.length) * 100 : 0;

      setStats({
        totalAlerts: total,
        activeFeeds: feeds.length,
        avgConfidence: Math.round(avg),
        systemMode: currentMode.toUpperCase(),
      });
      setRecentAlerts(alerts.slice(0, 5));
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

  // Simple Graph Component
  const SecurityGraph = () => {
    return (
      <View style={styles.graphContainer}>
        <View style={styles.graphHeader}>
          <Text style={styles.graphTitle}>Security Traffic</Text>
          <Text style={styles.graphSubtitle}>Detections per hour</Text>
        </View>
        <View style={styles.barsRow}>
          {[40, 70, 45, 90, 65, 80, 50, 60, 85, 40, 55, 75].map((h, i) => (
            <View key={i} style={styles.barWrapper}>
              <View style={[styles.bar, { height: h, opacity: i === 3 || i === 8 ? 1 : 0.4 }]} />
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Clean Modern Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.greeting}>COMMAND CENTER</Text>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.statusPill}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusPillText}>LIVE</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Bell size={22} color={THEME.text} />
            {stats.totalAlerts > 0 && <View style={styles.badge} />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* KPI Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(37, 99, 235, 0.08)' }]}>
              <Shield size={20} color={THEME.primary} />
            </View>
            <Text style={styles.statValue}>{stats.totalAlerts}</Text>
            <Text style={styles.statLabel}>Security Events</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(22, 163, 74, 0.08)' }]}>
              <Video size={20} color={THEME.success} />
            </View>
            <Text style={styles.statValue}>{stats.activeFeeds}</Text>
            <Text style={styles.statLabel}>Active Nodes</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(0, 104, 122, 0.08)' }]}>
              <TrendingUp size={20} color={THEME.secondary} />
            </View>
            <Text style={stats.avgConfidence > 80 ? styles.statValueSuccess : styles.statValue}>{stats.avgConfidence}%</Text>
            <Text style={styles.statLabel}>AI Accuracy</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(186, 26, 26, 0.08)' }]}>
              <Activity size={20} color={THEME.error} />
            </View>
            <Text style={styles.statValueSmall}>{stats.systemMode}</Text>
            <Text style={styles.statLabel}>Current Mode</Text>
          </View>
        </View>

        {/* Security Graph */}
        <SecurityGraph />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Incidents</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentAlerts.length === 0 ? (
          <View style={styles.emptyActivity}>
            <Server size={32} color={THEME.outline} opacity={0.3} />
            <Text style={styles.emptyText}>No recent activity found in database</Text>
          </View>
        ) : (
          recentAlerts.map((alert, index) => (
            <View key={index} style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: alert.is_person_search_match ? THEME.error : THEME.primary }]} />
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>
                  {alert.is_person_search_match ? 'Watchlist Match' : (alert.detections[0]?.label || 'Activity')} Detected
                </Text>
                <Text style={styles.activityTime}>{alert.timestamp} • {alert.feed_id.toUpperCase()}</Text>
              </View>
              <ChevronRight size={16} color={THEME.outline} />
            </View>
          ))
        )}
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
    backgroundColor: THEME.surface,
    paddingHorizontal: SPACING.lg,
    paddingTop: 12,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: THEME.outlineVariant,
  },
  headerInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.textSecondary,
    letterSpacing: 1.5,
    fontFamily: FONTS.bodyBold,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.text,
    fontFamily: FONTS.heading,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.1)',
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.success,
    letterSpacing: 0.5,
    fontFamily: FONTS.bodyBold,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.success,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: THEME.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.outlineVariant,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.error,
    borderWidth: 1.5,
    borderColor: THEME.surface,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: (width - SPACING.lg * 2 - 12) / 2,
    backgroundColor: THEME.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.outlineVariant,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.text,
    fontFamily: FONTS.heading,
  },
  statValueSuccess: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.success,
    fontFamily: FONTS.heading,
  },
  statValueSmall: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.text,
    fontFamily: FONTS.heading,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.textSecondary,
    marginTop: 2,
    fontFamily: FONTS.body,
  },
  graphContainer: {
    backgroundColor: THEME.surface,
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: THEME.outlineVariant,
    marginBottom: 24,
  },
  graphHeader: {
    marginBottom: 20,
  },
  graphTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text,
    fontFamily: FONTS.heading,
  },
  graphSubtitle: {
    fontSize: 11,
    color: THEME.textSecondary,
    fontFamily: FONTS.body,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
  },
  barWrapper: {
    width: 12,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    backgroundColor: THEME.primary,
    borderRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: FONTS.heading,
  },
  viewAll: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.primary,
    fontFamily: FONTS.bodyBold,
  },
  emptyActivity: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: THEME.outlineVariant,
  },
  emptyText: {
    fontSize: 12,
    color: THEME.outline,
    marginTop: 12,
    fontWeight: '600',
    fontFamily: FONTS.body,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.outlineVariant,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 16,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text,
    fontFamily: FONTS.bodyBold,
  },
  activityTime: {
    fontSize: 11,
    color: THEME.textSecondary,
    marginTop: 2,
    fontFamily: FONTS.body,
  },
});
