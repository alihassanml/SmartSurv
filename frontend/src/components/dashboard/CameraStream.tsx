import React, { useEffect, useRef, useState } from 'react';
import { API } from '../../types/dashboard';

interface CameraStreamProps {
  feedId?: string;
  active: boolean;
  visible?: boolean; // reserved for future use — overlay is handled by parent
}

const CameraStream: React.FC<CameraStreamProps> = ({ feedId, active }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!active) {
      // Eye is OFF — close WebRTC connection completely (no background stream)
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setLoading(true);
      return;
    }

    setLoading(true);

    const startWebRTC = async () => {
      // No STUN servers — LAN only, so host candidates resolve in <50ms
      const pc = new RTCPeerConnection({ iceServers: [] });
      pcRef.current = pc;

      pc.ontrack = (event) => {
        if (videoRef.current) {
          videoRef.current.srcObject = event.streams[0];
        }
      };

      pc.addTransceiver('video', { direction: 'recvonly' });

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Wait for all host ICE candidates to be gathered before sending
        // (embedded/vanilla ICE — one round-trip instead of trickle)
        await new Promise<void>((resolve) => {
          if (pc.iceGatheringState === 'complete') { resolve(); return; }
          const onStateChange = () => {
            if (pc.iceGatheringState === 'complete') {
              pc.removeEventListener('icegatheringstatechange', onStateChange);
              resolve();
            }
          };
          pc.addEventListener('icegatheringstatechange', onStateChange);
          setTimeout(resolve, 3000); // 3s safety cap
        });

        const response = await fetch(`${API}/offer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sdp: pc.localDescription?.sdp,
            type: pc.localDescription?.type,
            feed_id: feedId,
          }),
        });

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }

        const answer = await response.json();
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error('WebRTC Negotiation Failed:', err);
        setLoading(false);
      }
    };

    startWebRTC();

    return () => {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [active, feedId]);

  return (
    <div className="relative w-full h-full" style={{ background: '#0a0b0d' }}>

      {/* Loading overlay */}
      {loading && active && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          style={{ background: '#0a0b0d', zIndex: 30 }}>
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 rounded-full border-[1.5px] border-transparent animate-spin"
              style={{ borderTopColor: '#b0c6ff' }} />
            <div className="absolute inset-[3px] rounded-full border-[1.5px] border-transparent animate-spin"
              style={{ borderTopColor: 'rgba(176,198,255,0.25)', animationDuration: '1.5s', animationDirection: 'reverse' }} />
          </div>
          <p className="text-[8px] font-bold tracking-[0.3em] uppercase"
            style={{ color: 'rgba(176,198,255,0.3)' }}>
            ESTABLISHING UPLINK
          </p>
          {feedId && (
            <p className="text-[7px] font-mono" style={{ color: 'rgba(176,198,255,0.15)' }}>
              FEED_{feedId.toUpperCase()}
            </p>
          )}
        </div>
      )}

      {active && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onCanPlay={() => {
            console.log(`[CameraStream] onCanPlay for ${feedId}`);
            setLoading(false);
          }}
          onPlaying={() => setLoading(false)}
          onLoadedData={() => setLoading(false)}
          className="w-full h-full object-cover transition-opacity duration-500"
          style={{ 
            opacity: loading ? 0 : 1,
            background: '#000'
          }}
        />
      )}
    </div>
  );
};

export default CameraStream;
