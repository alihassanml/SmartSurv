import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, MapPin, Clock, Search, ChevronRight } from 'lucide-react-native';
import { API_URL } from '../../constants/Config';
import { THEME, SPACING, FONTS } from '../../constants/Theme';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

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
}

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

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
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000); 
    return () => clearInterval(interval);
  }, []);

  const renderItem = ({ item }: { item: Alert }) => {
    const isCritical = item.detections.some(d => 
        ['gun', 'knife', 'violence', 'smoking'].includes(d.label.toLowerCase())
    ) || item.is_person_search_match;

    return (
      <View style={[styles.card, isCritical && styles.criticalCard]}>
        <View style={styles.imageBox}>
          <Image 
            source={{ uri: item.image.startsWith('data:') ? item.image : `data:image/jpeg;base64,${item.image}` }} 
            style={styles.image} 
          />
          {item.is_person_search_match && (
            <View style={styles.targetBadge}>
              <Text style={styles.targetText}>MATCH FOUND</Text>
            </View>
          )}
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <View style={[styles.typeBadge, { backgroundColor: isCritical ? 'rgba(186,26,26,0.1)' : 'rgba(0,74,198,0.1)' }]}>
              <Text style={[styles.typeText, { color: isCritical ? THEME.error : THEME.primary }]}>
                {isCritical ? 'CRITICAL THREAT' : 'ACTIVITY DETECTED'}
              </Text>
            </View>
            <View style={styles.timeBox}>
              <Clock size={12} color={THEME.textSecondary} />
              <Text style={styles.timeText}>{item.timestamp.split(' ')[1] || item.timestamp}</Text>
            </View>
          </View>

          <View style={styles.detectionRow}>
            {item.detections.map((d, i) => (
              <View key={i} style={styles.labelBadge}>
                <Text style={styles.labelText}>{d.label}</Text>
                <Text style={styles.confText}>{Math.round(d.confidence * 100)}%</Text>
              </View>
            ))}
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.locationBox}>
              <MapPin size={12} color={THEME.textSecondary} />
              <Text style={styles.locationText}>{item.feed_id.toUpperCase()}</Text>
            </View>
            <TouchableOpacity style={styles.detailBtn}>
              <Text style={styles.detailBtnText}>View Details</Text>
              <ChevronRight size={14} color={THEME.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Security Log</Text>
          <Text style={styles.headerSubtitle}>Real-time activity history</Text>
        </View>
        <TouchableOpacity style={styles.searchBtn}>
          <Search size={20} color={THEME.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={THEME.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <AlertTriangle size={48} color={THEME.outline} opacity={0.2} />
              <Text style={styles.emptyText}>No events recorded</Text>
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
    backgroundColor: THEME.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontFamily: FONTS.body,
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    // Ambient Shadow
    shadowColor: THEME.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  criticalCard: {
    backgroundColor: THEME.surface,
  },
  imageBox: {
    width: '100%',
    aspectRatio: 16/9,
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  targetBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: THEME.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  targetText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: FONTS.bodyBold,
  },
  details: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: FONTS.bodyBold,
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textSecondary,
    fontFamily: FONTS.bodyBold,
  },
  detectionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  labelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.text,
    fontFamily: FONTS.bodyBold,
  },
  confText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.primary,
    fontFamily: FONTS.bodyBold,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textSecondary,
    fontFamily: FONTS.bodyBold,
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.primary,
    fontFamily: FONTS.bodyBold,
  },
  empty: {
    paddingVertical: 100,
    alignItems: 'center',
    opacity: 0.5,
  },
  emptyText: {
    color: THEME.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    fontFamily: FONTS.bodyBold,
  },
});
