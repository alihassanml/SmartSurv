import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Activity, Bell, Target, TrendingUp, Cpu, ChevronRight, Video, Server } from 'lucide-react-native';
import { API_URL } from '../../constants/Config';
import { THEME, SPACING, FONTS } from '../../constants/Theme';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const [stats, setStats] = useState({
    totalAlerts: 0,
    activeFeeds: 0,
    avgConfidence: 0,
    systemMode: 'HYBRID',
    distribution: {} as Record<string, number>,
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
      
      // Calculate Distribution
      const dist: Record<string, number> = {};
      alerts.forEach((a: any) => {
        (a.detections || []).forEach((d: any) => {
          const label = d.label || 'Unknown';
          dist[label] = (dist[label] || 0) + 1;
        });
        if (a.is_person_search_match) {
          dist['Watchlist'] = (dist['Watchlist'] || 0) + 1;
        }
      });

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
        distribution: dist,
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

  // Class Distribution Graph Component
  const DetectionGraph = () => {
    const data = Object.entries(stats.distribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    const maxVal = Math.max(...data.map(d => d[1]), 1);

    return (
      <View style={styles.graphContainer}>
        <View style={styles.graphHeader}>
          <Text style={styles.graphTitle}>Detection Distribution</Text>
          <Text style={styles.graphSubtitle}>Most frequent object classes</Text>
        </View>
        <View style={styles.distRows}>
          {data.length === 0 ? (
             <Text style={styles.noDataText}>No detection data available</Text>
          ) : (
            data.map(([label, count], i) => (
              <View key={i} style={styles.distRow}>
                <View style={styles.labelCol}>
                  <Text style={styles.distLabel}>{label}</Text>
                  <Text style={styles.distCount}>{count}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${(count / maxVal) * 100}%` }]} />
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    );
  };

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'GOOD MORNING';
    if (hours < 17) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Minimalist Floating Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>{getGreeting()}</Text>
          <Text style={styles.headerTitle}>Overview</Text>
        </View>
        <TouchableOpacity style={styles.headerIconBtn}>
          <Bell size={22} color={THEME.text} />
          <View style={styles.liveDot} />
          {stats.totalAlerts > 0 && <View style={styles.notificationDot} />}
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Bento Section */}
        <View style={styles.bentoGrid}>
          {/* Main Stat: Alerts */}
          <View style={[styles.bentoCard, { flex: 2, backgroundColor: '#fdf2f2' }]}>
            <View style={styles.bentoIconBox}>
              <Shield size={20} color="#dc2626" />
            </View>
            <Text style={styles.bentoValue}>{stats.totalAlerts}</Text>
            <Text style={styles.bentoLabel}>Security Events</Text>
          </View>

          <View style={{ flex: 1.2, gap: 12 }}>
            {/* Active Nodes */}
            <View style={[styles.bentoCard, { backgroundColor: '#f0fdf4' }]}>
              <Text style={[styles.bentoValueSmall, { color: '#16a34a' }]}>{stats.activeFeeds}</Text>
              <Text style={styles.bentoLabel}>Active Nodes</Text>
            </View>
            {/* AI Confidence */}
            <View style={[styles.bentoCard, { backgroundColor: '#eff6ff' }]}>
              <Text style={[styles.bentoValueSmall, { color: '#2563eb' }]}>{stats.avgConfidence}%</Text>
              <Text style={styles.bentoLabel}>Confidence</Text>
            </View>
          </View>
        </View>

        {/* Distribution Card */}
        <View style={styles.glassCard}>
           <DetectionGraph />
        </View>

        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionHeading}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllBtn}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Activity Items */}
        <View style={styles.activityContainer}>
          {recentAlerts.length === 0 ? (
            <View style={styles.emptyState}>
              <Server size={32} color={THEME.outline} opacity={0.2} />
              <Text style={styles.emptyStateText}>Waiting for incidents...</Text>
            </View>
          ) : (
            recentAlerts.map((alert, index) => (
              <TouchableOpacity key={index} style={styles.logItem}>
                <View style={[styles.logIconBox, { backgroundColor: alert.is_person_search_match ? '#fef2f2' : '#f8fafc' }]}>
                  {alert.is_person_search_match ? (
                    <Target size={18} color="#dc2626" />
                  ) : (
                    <Activity size={18} color={THEME.primary} />
                  )}
                </View>
                <View style={styles.logContent}>
                  <Text style={styles.logTitle}>{alert.is_person_search_match ? 'Watchlist Match' : (alert.detections[0]?.label || 'Activity')}</Text>
                  <Text style={styles.logMeta}>{alert.timestamp} • {alert.feed_id.toUpperCase()}</Text>
                </View>
                <ChevronRight size={14} color={THEME.outline} />
              </TouchableOpacity>
            ))
          )}
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: THEME.text,
    letterSpacing: -1,
  },
  headerIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  liveDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.success,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  notificationDot: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dc2626',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  bentoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  bentoCard: {
    borderRadius: 24,
    padding: 20,
    justifyContent: 'center',
  },
  bentoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  bentoValue: {
    fontSize: 32,
    fontWeight: '900',
    color: THEME.text,
    letterSpacing: -1,
  },
  bentoValueSmall: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  bentoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textSecondary,
    marginTop: 4,
  },
  glassCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
  },
  graphContainer: {
    // Overriding internal graph styles if needed
  },
  graphHeader: {
    marginBottom: 16,
  },
  graphTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.text,
  },
  graphSubtitle: {
    fontSize: 11,
    color: THEME.textSecondary,
    marginTop: 2,
  },
  distRows: {
    gap: 12,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  labelCol: {
    width: 80,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  distLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.text,
  },
  distCount: {
    fontSize: 10,
    color: THEME.textSecondary,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: THEME.primary,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.text,
    letterSpacing: -0.5,
  },
  viewAllBtn: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.primary,
  },
  activityContainer: {
    gap: 10,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  logIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  logContent: {
    flex: 1,
  },
  logTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text,
  },
  logMeta: {
    fontSize: 11,
    color: THEME.textSecondary,
    marginTop: 2,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 13,
    color: THEME.outline,
    fontWeight: '500',
  },
  noDataText: {
    fontSize: 12,
    color: THEME.outline,
    textAlign: 'center',
  },
});
