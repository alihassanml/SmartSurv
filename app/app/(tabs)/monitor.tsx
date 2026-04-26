import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, RefreshControl, Dimensions, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Power, Eye, RefreshCw, LayoutGrid, Radio, Video, VideoOff } from 'lucide-react-native';
import { API_URL } from '../../constants/Config';
import { THEME, SPACING, FONTS } from '../../constants/Theme';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

export default function MonitorScreen() {
  const [activeFeed, setActiveFeed] = useState('local');
  const [cameras, setCameras] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [systemActive, setSystemActive] = useState(false);

  const fetchCameras = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Get Active Feeds
      const feedsRes = await axios.get(`${API_URL}/api/camera/feeds`, { headers });
      const activeFeeds = feedsRes.data?.feeds || [];
      setSystemActive(activeFeeds.length > 0);

      // Get All URL Cameras
      const urlCamsRes = await axios.get(`${API_URL}/api/url-cameras`, { headers });
      const urlCams = urlCamsRes.data?.cameras || [];

      // Combine for UI (Local + URL)
      const allCams = [
        { id: 'local', name: 'Server Local Cam', active: activeFeeds.includes('local'), isLocal: true },
        ...urlCams.map((c: any) => ({ ...c, isLocal: false }))
      ];
      setCameras(allCams);
    } catch (err) {
      console.log('Fetch cameras error:', err);
    }
  };

  useEffect(() => {
    fetchCameras();
    const interval = setInterval(fetchCameras, 5000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCameras();
    setRefreshing(false);
  };

  const toggleCamera = async (id: any, isLocal: boolean, currentActive: boolean) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (isLocal) {
        const endpoint = currentActive ? '/api/camera/stop' : '/api/camera/start';
        await axios.post(`${API_URL}${endpoint}`, {}, { headers });
      } else {
        await axios.post(`${API_URL}/api/url-cameras/${id}/toggle`, {}, { headers });
      }
      fetchCameras();
    } catch (err) {
      console.log('Toggle error:', err);
    }
  };

  const streamUrl = `${API_URL}/api/camera/stream/${activeFeed}`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Monitor Grid</Text>
          <Text style={styles.headerSubtitle}>{systemActive ? 'System Live & Protected' : 'System Standby'}</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <RefreshCw size={18} color={THEME.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.viewportContainer}>
        <View style={styles.viewport}>
          {systemActive ? (
            <WebView 
              source={{ uri: streamUrl }}
              scrollEnabled={false}
              style={styles.webview}
              containerStyle={styles.webviewContainer}
            />
          ) : (
            <View style={styles.offlinePlaceholder}>
              <VideoOff size={48} color={THEME.outline} opacity={0.3} />
              <Text style={styles.offlineText}>SYSTEM OFFLINE</Text>
            </View>
          )}
          
          {systemActive && (
            <View style={styles.liveBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}

          <View style={styles.viewportOverlay}>
            <View style={styles.camLabel}>
              <Radio size={12} color="white" />
              <Text style={styles.camLabelText}>{activeFeed.toUpperCase()} SOURCE</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.controls} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.sectionLabel}>Camera Controls</Text>
        
        {cameras.map((cam) => (
          <View key={cam.id} style={styles.cameraRow}>
            <TouchableOpacity 
              style={styles.camInfo} 
              onPress={() => cam.active && setActiveFeed(cam.isLocal ? 'local' : cam.id)}
            >
              <View style={[styles.camIcon, { backgroundColor: cam.active ? 'rgba(22, 163, 74, 0.1)' : 'rgba(115, 118, 134, 0.1)' }]}>
                <Video size={20} color={cam.active ? THEME.success : THEME.outline} />
              </View>
              <View>
                <Text style={[styles.camName, activeFeed === (cam.isLocal ? 'local' : cam.id) && cam.active && styles.activeCamName]}>
                  {cam.name}
                </Text>
                <Text style={styles.camStatus}>{cam.active ? 'ONLINE' : 'OFFLINE'}</Text>
              </View>
            </TouchableOpacity>
            
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleText, { color: cam.active ? THEME.success : THEME.outline }]}>
                {cam.active ? 'ON' : 'OFF'}
              </Text>
              <Switch 
                value={cam.active}
                onValueChange={() => toggleCamera(cam.id, cam.isLocal, cam.active)}
                trackColor={{ false: THEME.outlineVariant, true: THEME.success }}
                thumbColor="white"
              />
            </View>
          </View>
        ))}
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
    padding: SPACING.lg,
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
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: THEME.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.outlineVariant,
  },
  viewportContainer: {
    padding: SPACING.lg,
    backgroundColor: THEME.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.outlineVariant,
  },
  viewport: {
    aspectRatio: 16/9,
    backgroundColor: '#111',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  webview: {
    flex: 1,
  },
  webviewContainer: {
    backgroundColor: 'black',
  },
  offlinePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  offlineText: {
    color: THEME.outline,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    fontFamily: FONTS.heading,
  },
  liveBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.error,
  },
  liveText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: FONTS.bodyBold,
  },
  viewportOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
  },
  camLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  camLabelText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: FONTS.bodyBold,
  },
  controls: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.textSecondary,
    marginTop: 24,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontFamily: FONTS.heading,
  },
  cameraRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.outlineVariant,
  },
  camInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  camIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  camName: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.text,
    fontFamily: FONTS.bodyBold,
  },
  activeCamName: {
    color: THEME.primary,
  },
  camStatus: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.textSecondary,
    marginTop: 2,
    fontFamily: FONTS.body,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: FONTS.bodyBold,
  },
});
