import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import { Radio, Shield, Power, RefreshCw, Smartphone, Wifi, Zap, Repeat } from 'lucide-react-native';
import { WS_URL } from '../../constants/Config';
import { THEME, SPACING, FONTS } from '../../constants/Theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DetectionBox = ({ box, label, confidence }: any) => {
  const left = (box[0] / 640) * SCREEN_WIDTH;
  const top = (box[1] / 480) * (SCREEN_WIDTH * (4/3));
  const width = ((box[2] - box[0]) / 640) * SCREEN_WIDTH;
  const height = ((box[3] - box[1]) / 480) * (SCREEN_WIDTH * (4/3));
  const isDanger = ['gun', 'knife', 'violence', 'smoking'].includes(label.toLowerCase());

  return (
    <View style={[styles.box, { left, top, width, height, borderColor: isDanger ? THEME.error : THEME.success }]}>
      <View style={[styles.boxLabel, { backgroundColor: isDanger ? THEME.error : THEME.success }]}>
        <Text style={styles.boxText}>{label.toUpperCase()} {Math.round(confidence * 100)}%</Text>
      </View>
    </View>
  );
};

export default function BroadcastScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [status, setStatus] = useState('Standby');
  const [fps, setFps] = useState(0);
  const [facing, setFacing] = useState<any>('back');
  const [detections, setDetections] = useState<any[]>([]);
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  const cameraRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const alertWsRef = useRef<WebSocket | null>(null);
  const broadcastInterval = useRef<any>(null);
  const frameCount = useRef(0);

  useEffect(() => {
    return () => {
      stopBroadcast();
    };
  }, []);

  const triggerAlertFeedback = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {}
  };

  const startBroadcast = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }

    if (!isCameraReady) {
        Alert.alert('System Alert', 'Please wait for camera hardware initialization.');
        return;
    }

    try {
      setStatus('Connecting...');
      const ws = new WebSocket(`${WS_URL}/ws/remote-input?client_id=mobile-node`);
      wsRef.current = ws;
      const alertWs = new WebSocket(`${WS_URL}/ws`);
      alertWsRef.current = alertWs;

      ws.onopen = () => {
        console.log('[Broadcast] WS Connected');
        setIsBroadcasting(true);
        setStatus('Live & Streaming');
        startStreamingLoop();
      };

      alertWs.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.feed_id === 'remote-mobile-node') {
          setDetections(data.detections || []);
          if (data.detections?.length > 0) triggerAlertFeedback();
          setTimeout(() => setDetections([]), 1000);
        }
      };

      ws.onerror = () => { setStatus('Connection Error'); stopBroadcast(); };
      ws.onclose = () => stopBroadcast();
    } catch (err) {
      setStatus('Failed to Start');
    }
  };

  const startStreamingLoop = async () => {
    console.log('[Broadcast] Loop starting (Optimized Mode)...');
    
    const captureFrame = async () => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) return;

      try {
        if (!cameraRef.current) return;

        // 1. Capture original (fast, no base64 yet to save JS memory)
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.2,
        });

        if (photo && photo.uri && wsRef.current?.readyState === WebSocket.OPEN) {
          try {
            // 2. Shrink to 400px to drastically reduce memory usage
            const manipulated = await ImageManipulator.manipulateAsync(
                photo.uri,
                [{ resize: { width: 400 } }],
                { base64: true, compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
            );

            if (manipulated.base64) {
                wsRef.current.send(manipulated.base64);
                frameCount.current++;
            }
          } catch (manipErr) {
            console.log('[Broadcast] Resize Error');
          }
        }
      } catch (err) {
        console.log('[Broadcast] Capture failed');
      }

      if (broadcastInterval.current) {
        broadcastInterval.current = setTimeout(captureFrame, 200);
      }
    };

    broadcastInterval.current = setTimeout(captureFrame, 500);

    const fpsTimer = setInterval(() => {
        setFps(frameCount.current);
        frameCount.current = 0;
    }, 1000);

    return () => {
        clearInterval(fpsTimer);
        if (broadcastInterval.current) clearTimeout(broadcastInterval.current);
    }
  };

  const stopBroadcast = () => {
    setIsBroadcasting(false);
    if (broadcastInterval.current) {
      clearTimeout(broadcastInterval.current);
      broadcastInterval.current = null;
    }
    if (wsRef.current) wsRef.current.close();
    if (alertWsRef.current) alertWsRef.current.close();
    wsRef.current = null;
    alertWsRef.current = null;
    setDetections([]);
    setStatus('Standby');
  };

  const toggleCamera = () => {
    setFacing((prev: any) => (prev === 'back' ? 'front' : 'back'));
  };

  if (!permission) return <View style={styles.center}><ActivityIndicator size="large" color={THEME.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>AI Field Node</Text>
          <Text style={styles.headerSubtitle}>NODE: mobile-node</Text>
        </View>
        <View style={styles.headerActions}>
            <TouchableOpacity style={styles.flipBtn} onPress={toggleCamera}>
                <Repeat size={20} color={THEME.text} />
            </TouchableOpacity>
            <View style={styles.statusPill}>
                <View style={[styles.dot, { backgroundColor: isBroadcasting ? THEME.error : THEME.outline }]} />
                <Text style={styles.statusText}>{status.toUpperCase()}</Text>
            </View>
        </View>
      </View>

      <View style={styles.cameraBox}>
        <CameraView 
          style={styles.camera} 
          ref={cameraRef}
          facing={facing}
          mode="picture"
          onCameraReady={() => setIsCameraReady(true)}
        />
        
        {detections.map((det, i) => (
          <DetectionBox key={i} box={det.box} label={det.label} confidence={det.confidence} />
        ))}

        {isBroadcasting && (
          <View style={styles.liveOverlay}>
            <View style={styles.liveBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.liveText}>AI STREAMING</Text>
            </View>
            <View style={styles.metricsBox}>
              <Zap size={14} color="#00ff85" />
              <Text style={styles.metricsText}>{fps} FPS</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.actionBtn, isBroadcasting ? styles.stopBtn : styles.startBtn]}
          onPress={isBroadcasting ? stopBroadcast : startBroadcast}
        >
          <Power size={24} color="white" />
          <Text style={styles.actionBtnText}>
            {isBroadcasting ? 'STOP STREAM' : 'START AI STREAM'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: THEME.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.outlineVariant,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: THEME.text, fontFamily: FONTS.heading },
  headerSubtitle: { fontSize: 11, color: THEME.textSecondary, fontFamily: FONTS.body },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flipBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: THEME.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: THEME.outlineVariant },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: THEME.background, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: THEME.outlineVariant },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 9, fontWeight: '800', color: THEME.text, fontFamily: FONTS.bodyBold },
  cameraBox: { flex: 1, backgroundColor: '#000', overflow: 'hidden' },
  camera: { flex: 1 },
  liveOverlay: { position: 'absolute', top: 20, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(186, 26, 26, 0.8)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'white' },
  liveText: { color: 'white', fontSize: 9, fontWeight: '900', letterSpacing: 1, fontFamily: FONTS.bodyBold },
  metricsBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  metricsText: { color: 'white', fontSize: 9, fontWeight: '700', fontFamily: FONTS.bodyBold },
  controls: { padding: SPACING.lg, backgroundColor: THEME.surface, borderTopWidth: 1, borderTopColor: THEME.outlineVariant },
  actionBtn: { height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  startBtn: { backgroundColor: THEME.primary },
  stopBtn: { backgroundColor: THEME.error },
  actionBtnText: { color: 'white', fontSize: 15, fontWeight: '800', letterSpacing: 1, fontFamily: FONTS.bodyBold },
  box: { position: 'absolute', borderWidth: 2, borderRadius: 2 },
  boxLabel: { position: 'absolute', top: -20, left: -2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2 },
  boxText: { color: 'white', fontSize: 10, fontWeight: '800', fontFamily: FONTS.bodyBold },
});
