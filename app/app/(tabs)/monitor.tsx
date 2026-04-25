import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Power, Eye, RefreshCw, LayoutGrid, Radio } from 'lucide-react-native';
import { API_URL } from '../../constants/Config';
import { THEME, SPACING, FONTS } from '../../constants/Theme';

export default function MonitorScreen() {
  const [activeFeed, setActiveFeed] = useState('local');

  const streamUrl = `${API_URL}/api/camera/stream/${activeFeed}`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Live Monitor</Text>
          <Text style={styles.headerSubtitle}>Real-time surveillance feeds</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <RefreshCw size={18} color={THEME.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.viewportContainer}>
        <View style={styles.viewport}>
          <WebView 
            source={{ uri: streamUrl }}
            scrollEnabled={false}
            style={styles.webview}
            containerStyle={styles.webviewContainer}
          />
          
          <View style={styles.liveBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>

          <View style={styles.viewportOverlay}>
            <View style={styles.camLabel}>
              <Radio size={12} color="white" />
              <Text style={styles.camLabelText}>{activeFeed.toUpperCase()} SOURCE</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.controls}>
        <Text style={styles.sectionLabel}>Switch Feed</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.feedList}>
          {['local', 'remote-1', 'remote-2'].map((id) => (
            <TouchableOpacity 
              key={id} 
              onPress={() => setActiveFeed(id)}
              style={[styles.feedCard, activeFeed === id && styles.activeFeedCard]}
            >
              <View style={[styles.feedIcon, { backgroundColor: activeFeed === id ? THEME.primary : THEME.surfaceContainer }]} />
              <Text style={[styles.feedName, activeFeed === id && styles.activeFeedName]}>
                {id === 'local' ? 'Server Cam' : `Node ${id.split('-')[1]}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.controlBtn}>
            <View style={[styles.btnIcon, { backgroundColor: 'rgba(186,26,26,0.1)' }]}>
              <Power size={22} color={THEME.error} />
            </View>
            <Text style={styles.btnText}>Stop System</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlBtn}>
            <View style={[styles.btnIcon, { backgroundColor: 'rgba(0,74,198,0.1)' }]}>
              <Eye size={22} color={THEME.primary} />
            </View>
            <Text style={styles.btnText}>View AI Logic</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: THEME.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewportContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: 24,
  },
  viewport: {
    aspectRatio: 16/9,
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
  webviewContainer: {
    backgroundColor: 'black',
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
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
    fontWeight: '800',
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  camLabelText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: FONTS.bodyBold,
  },
  controls: {
    flex: 1,
    padding: SPACING.lg,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: FONTS.heading,
  },
  feedList: {
    maxHeight: 110,
    marginBottom: 32,
  },
  feedCard: {
    width: 110,
    marginRight: 16,
    backgroundColor: THEME.surface,
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  activeFeedCard: {
    backgroundColor: THEME.surface,
  },
  feedIcon: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    marginBottom: 10,
    opacity: 0.8,
  },
  feedName: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.textSecondary,
    fontFamily: FONTS.bodyBold,
  },
  activeFeedName: {
    color: THEME.primary,
    fontWeight: '700',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  controlBtn: {
    flex: 1,
    backgroundColor: THEME.surface,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
  },
  btnIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.text,
    fontFamily: FONTS.bodyBold,
  },
});
