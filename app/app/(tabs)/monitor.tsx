import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, RefreshControl, Dimensions, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Power, Eye, RefreshCw, LayoutGrid, Radio, Video, VideoOff } from 'lucide-react-native';
import { API_URL } from '../../constants/Config';
import { THEME, SPACING, FONTS } from '../../constants/Theme';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';

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
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>MONITORING GRID</Text>
          <Text style={styles.headerTitle}>Live Nodes</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <RefreshCw size={20} color={THEME.text} />
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
              <VideoOff size={48} color={THEME.outline} opacity={0.1} />
              <Text style={styles.offlineText}>SYSTEM STANDBY</Text>
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
              <Text style={styles.camLabelText}>{activeFeed.toUpperCase()}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.controls} 
        contentContainerStyle={styles.controlsContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.sectionLabel}>ACTIVE NODES</Text>
        
        {cameras.map((cam) => (
          <View key={cam.id} style={styles.cameraRow}>
            <TouchableOpacity 
              style={styles.camInfo} 
              onPress={() => cam.active && setActiveFeed(cam.isLocal ? 'local' : cam.id)}
            >
              <View style={[styles.camIcon, { backgroundColor: cam.active ? '#f0fdf4' : '#f8fafc' }]}>
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
              <Switch 
                value={cam.active}
                onValueChange={() => toggleCamera(cam.id, cam.isLocal, cam.active)}
                trackColor={{ false: '#f1f5f9', true: THEME.success }}
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
  refreshBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  viewportContainer: {
    padding: 24,
    backgroundColor: '#ffffff',
  },
  viewport: {
    aspectRatio: 16/9,
    backgroundColor: '#0f172a',
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
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
    color: 'rgba(255,255,255,0.2)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  liveBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#dc2626',
  },
  liveText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  camLabelText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  controls: {
    flex: 1,
  },
  controlsContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.textSecondary,
    marginTop: 8,
    marginBottom: 16,
    letterSpacing: 1.5,
  },
  cameraRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
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
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  camName: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.text,
  },
  activeCamName: {
    color: THEME.primary,
  },
  camStatus: {
    fontSize: 11,
    color: THEME.textSecondary,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
