import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Dimensions, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Shield, Power, Zap, Repeat } from 'lucide-react-native';
import { API_URL, WS_URL } from '../../constants/Config';
import { THEME, SPACING, FONTS } from '../../constants/Theme';
import axios from 'axios';
import { StatusBar } from 'expo-status-bar';

// Conditional Import for WebRTC (Native Only)
let WebRTC: any = {
  RTCPeerConnection: class {},
  RTCSessionDescription: class {},
  mediaDevices: { getUserMedia: async () => { throw new Error('WebRTC not supported'); } },
  RTCView: () => null
};

if (Platform.OS !== 'web') {
  try {
    const NativeWebRTC = require('react-native-webrtc');
    if (NativeWebRTC) WebRTC = NativeWebRTC;
  } catch (e) {
    console.warn('WebRTC Native Module not found. Use a Development Build instead of Expo Go.');
  }
}
const { RTCPeerConnection, RTCSessionDescription, mediaDevices, RTCView } = WebRTC;

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

function BroadcastScreen() {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [status, setStatus] = useState('Standby');
  const [localStream, setLocalStream] = useState<any>(null);
  const [facing, setFacing] = useState<any>('back');
  const [detections, setDetections] = useState<any[]>([]);
  
  const pcRef = useRef<any>(null);
  const alertWsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    startLocalStream();
    return () => {
      stopBroadcast();
      if (localStream) {
        localStream.getTracks().forEach((t: any) => t.stop());
      }
    };
  }, [facing]);

  const startLocalStream = async () => {
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: facing === 'back' ? 'environment' : 'user',
          frameRate: 30,
          width: 640,
          height: 480
        }
      });
      setLocalStream(stream);
    } catch (err) {
      Alert.alert('Camera Error', 'Could not access camera. Ensure you are using a Development Build.');
    }
  };

  const triggerAlertFeedback = async () => {
    try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch (e) {}
  };

  const startBroadcast = async () => {
    if (!localStream) return;

    try {
      setStatus('Connecting WebRTC...');
      
      const pc = new RTCPeerConnection({ iceServers: [] });
      pcRef.current = pc;

      localStream.getTracks().forEach((track: any) => {
        pc.addTrack(track, localStream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait for ICE gathering
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === 'complete') resolve();
        else {
          const check = () => {
            if (pc.iceGatheringState === 'complete') {
              pc.removeEventListener('icegatheringstatechange', check);
              resolve();
            }
          };
          pc.addEventListener('icegatheringstatechange', check);
          setTimeout(resolve, 2000);
        }
      });

      const response = await axios.post(`${API_URL}/ingest`, {
        sdp: pc.localDescription.sdp,
        type: pc.localDescription.type,
        feed_id: 'mobile-node'
      });

      await pc.setRemoteDescription(new RTCSessionDescription(response.data));
      
      // Setup Alert WebSocket
      const alertWs = new WebSocket(`${WS_URL}/ws`);
      alertWsRef.current = alertWs;
      alertWs.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.feed_id === 'remote-mobile-node') {
          setDetections(data.detections || []);
          if (data.detections?.length > 0) triggerAlertFeedback();
          setTimeout(() => setDetections([]), 1000);
        }
      };

      setIsBroadcasting(true);
      setStatus('Live & Streaming (WebRTC)');
    } catch (err) {
      console.log('WebRTC Error:', err);
      setStatus('Failed to Start');
      stopBroadcast();
    }
  };

  const stopBroadcast = () => {
    setIsBroadcasting(false);
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (alertWsRef.current) {
      alertWsRef.current.close();
      alertWsRef.current = null;
    }
    setDetections([]);
    setStatus('Standby');
  };

  const toggleCamera = () => {
    if (localStream) localStream.getTracks().forEach((t: any) => t.stop());
    setFacing((prev: any) => (prev === 'back' ? 'front' : 'back'));
  };

  if (!localStream) return <View style={styles.center}><ActivityIndicator size="large" color={THEME.primary} /></View>;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>AI FIELD NODE</Text>
          <Text style={styles.headerTitle}>Broadcast</Text>
        </View>
        <View style={styles.headerActions}>
            <TouchableOpacity style={styles.flipBtn} onPress={toggleCamera}>
                <Repeat size={20} color={THEME.text} />
            </TouchableOpacity>
            <View style={styles.statusPill}>
                <View style={[styles.dot, { backgroundColor: isBroadcasting ? '#dc2626' : THEME.outline }]} />
                <Text style={styles.statusText}>{status.toUpperCase()}</Text>
            </View>
        </View>
      </View>

      <View style={styles.cameraBox}>
        <RTCView 
          streamURL={localStream.toURL()} 
          style={styles.camera} 
          objectFit="cover"
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
              <Text style={styles.metricsText}>WEBRTC ACTIVE</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.actionBtn, isBroadcasting ? styles.stopBtn : styles.startBtn]}
          onPress={isBroadcasting ? stopBroadcast : startBroadcast}
        >
          <Power size={22} color="white" />
          <Text style={styles.actionBtnText}>
            {isBroadcasting ? 'STOP STREAM' : 'START AI STREAM'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 30,
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flipBtn: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: '#f8fafc', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1, 
    borderColor: '#f1f5f9' 
  },
  statusPill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    backgroundColor: '#f8fafc', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: '#f1f5f9' 
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 9, fontWeight: '800', color: THEME.text },
  cameraBox: { 
    flex: 1, 
    backgroundColor: '#0f172a', 
    borderRadius: 32, 
    marginHorizontal: 12, 
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  camera: { flex: 1 },
  liveOverlay: { position: 'absolute', top: 20, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(220, 38, 38, 0.8)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'white' },
  liveText: { color: 'white', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  metricsBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  metricsText: { color: 'white', fontSize: 9, fontWeight: '700' },
  controls: { padding: 24, backgroundColor: '#ffffff' },
  actionBtn: { height: 64, borderRadius: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  startBtn: { backgroundColor: THEME.primary },
  stopBtn: { backgroundColor: '#dc2626' },
  actionBtnText: { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  box: { position: 'absolute', borderWidth: 2, borderRadius: 4 },
  boxLabel: { position: 'absolute', top: -20, left: -2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  boxText: { color: 'white', fontSize: 10, fontWeight: '800' },
});
export default BroadcastScreen;
