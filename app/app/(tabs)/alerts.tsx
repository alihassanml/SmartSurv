import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, RefreshControl, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, MapPin, Clock, Search, ChevronRight, FileText, Download, Share2 } from 'lucide-react-native';
import { API_URL } from '../../constants/Config';
import { THEME, SPACING, FONTS } from '../../constants/Theme';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';

interface Detection {
  label: string;
  confidence: number;
}

interface Alert {
  id: number;
  timestamp: string;
  feed_id: string;
  detections: Detection[];
  image: string;
  is_person_search_match: boolean;
  location_lat?: number;
  location_lon?: number;
}

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlerts = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const res = await axios.get(`${API_URL}/api/alerts/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(res.data || []);
    } catch (err) {
      console.log('Alerts fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000); 
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  const generatePDF = async () => {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica'; padding: 40px; color: #131b2e; }
            h1 { color: #004ac6; border-bottom: 2px solid #004ac6; padding-bottom: 10px; }
            .alert { margin-bottom: 20px; padding: 15px; border: 1px solid #c3c6d7; border-radius: 8px; page-break-inside: avoid; }
            .critical { border-left: 5px solid #ba1a1a; background: #fff5f5; }
            .timestamp { font-size: 12px; color: #737686; }
            .title { font-weight: bold; font-size: 16px; margin: 5px 0; }
            .details { font-size: 14px; }
            .img { width: 100%; max-width: 400px; margin-top: 10px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <h1>SmartSurv Security Log Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Total Incidents: ${alerts.length}</p>
          ${alerts.map(a => {
            const isCritical = a.detections.some(d => ['gun', 'knife', 'violence'].includes(d.label.toLowerCase())) || a.is_person_search_match;
            return `
              <div class="alert ${isCritical ? 'critical' : ''}">
                <div class="timestamp">${a.timestamp} | NODE: ${a.feed_id.toUpperCase()}</div>
                <div class="title">${a.is_person_search_match ? 'WATCHLIST MATCH' : 'ACTIVITY DETECTED'}</div>
                <div class="details">
                  Detections: ${a.detections.map(d => `${d.label} (${Math.round(d.confidence * 100)}%)`).join(', ')}
                </div>
              </div>
            `;
          }).join('')}
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error("PDF Error:", error);
    }
  };

  const renderItem = ({ item }: { item: Alert }) => {
    if (!item) return null;

    const detections = item.detections || [];
    const isCritical = detections.some(d => 
        ['gun', 'knife', 'violence', 'smoking'].includes(d.label?.toLowerCase() || '')
    ) || !!item.is_person_search_match;

    return (
      <View style={[styles.card, isCritical && styles.criticalCard]}>
        <View style={styles.imageBox}>
          {item.image ? (
            <Image 
              source={{ uri: item.image.startsWith('data:') ? item.image : `data:image/jpeg;base64,${item.image}` }} 
              style={styles.image} 
            />
          ) : (
            <View style={[styles.image, { backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' }]}>
              <AlertTriangle color={THEME.outline} size={30} opacity={0.3} />
            </View>
          )}
          {item.is_person_search_match && (
            <View style={styles.targetBadge}>
              <Text style={styles.targetText}>TARGET MATCH</Text>
            </View>
          )}
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <View style={[styles.typeBadge, { backgroundColor: isCritical ? 'rgba(186,26,26,0.08)' : 'rgba(37,99,235,0.08)' }]}>
              <Text style={[styles.typeText, { color: isCritical ? THEME.error : THEME.primary }]}>
                {isCritical ? 'CRITICAL THREAT' : 'ACTIVITY LOG'}
              </Text>
            </View>
            <View style={styles.timeBox}>
              <Clock size={12} color={THEME.textSecondary} />
              <Text style={styles.timeText}>{item.timestamp.split(' ')[1] || item.timestamp}</Text>
            </View>
          </View>

          <View style={styles.detectionRow}>
            {detections.map((d, i) => (
              <View key={i} style={styles.labelBadge}>
                <Text style={styles.labelText}>{(d.label || 'Unknown').toUpperCase()}</Text>
                <Text style={styles.confText}>{Math.round((d.confidence || 0) * 100)}%</Text>
              </View>
            ))}
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.locationBox}>
              <MapPin size={12} color={THEME.textSecondary} />
              <Text style={styles.locationText}>{(item.feed_id || 'UNKNOWN').toUpperCase()}</Text>
            </View>
            <TouchableOpacity style={styles.detailBtn}>
              <Text style={styles.detailBtnText}>Incident Data</Text>
              <ChevronRight size={14} color={THEME.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>DATABASE HISTORY</Text>
          <Text style={styles.headerTitle}>Security Logs</Text>
        </View>
        <TouchableOpacity style={styles.pdfBtn} onPress={generatePDF}>
          <FileText size={20} color={THEME.primary} />
          <Text style={styles.pdfBtnText}>EXPORT</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={THEME.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <AlertTriangle size={48} color={THEME.outline} opacity={0.2} />
              <Text style={styles.emptyText}>No security events recorded</Text>
            </View>
          }
        />
      )}
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
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  pdfBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.primary,
    letterSpacing: 0.5,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 24,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  criticalCard: {
    borderColor: 'rgba(220, 38, 38, 0.1)',
  },
  imageBox: {
    width: '100%',
    aspectRatio: 16/9,
    backgroundColor: '#0f172a',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  targetBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  targetText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  details: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  typeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.textSecondary,
  },
  detectionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  labelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  labelText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.text,
  },
  confText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.primary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.textSecondary,
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.primary,
  },
  empty: {
    paddingVertical: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: THEME.outline,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 20,
  },
});
