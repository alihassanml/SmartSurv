import React, { useEffect, useRef, useState } from 'react';
import { API } from '../../types/dashboard';

interface CameraStreamProps {
  feedId?: string;
  active: boolean;
  visible?: boolean;
  onLoaded?: () => void;
}

// Global queue to ensure cameras load sequentially (one by one)
let connectionQueue = Promise.resolve();

const CameraStream: React.FC<CameraStreamProps> = ({ feedId, active, onLoaded }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true; // Track if this component is still active

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

    // Queue the WebRTC connection
    connectionQueue = connectionQueue.then(async () => {
      // If the component was unmounted or toggled off while waiting in queue, skip it
      if (!isActive) return;

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

        // Check if still active before making network request
        if (!isActive) {
          pc.close();
          return;
        }

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
        
        // Final check before applying remote description
        if (!isActive) {
          pc.close();
          return;
        }
        
        await pc.setRemoteDescription(new RTCSessionDescription(answer));

        // Wait a short moment (e.g. 500ms) after successful connection
        // to give the backend time to stabilize before hitting it with the next camera stream
        await new Promise((resolve) => setTimeout(resolve, 500));
        
      } catch (err) {
        console.error('WebRTC Negotiation Failed:', err);
        if (isActive) setLoading(false);
      }
    });

    return () => {
      isActive = false; // Mark component as inactive so queued promises abort early
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [active, feedId]);

  return (
    <div className="relative w-full h-full" style={{ background: '#1a1a1a' }}>

      {/* Loading overlay */}
      {loading && active && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          style={{ background: 'rgba(25,25,25,0.9)', zIndex: 30 }}>
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 rounded-full border-[1.5px] border-transparent animate-spin"
              style={{ borderTopColor: 'var(--color-primary)' }} />
            <div className="absolute inset-[3px] rounded-full border-[1.5px] border-transparent animate-spin"
              style={{ borderTopColor: 'rgba(36,128,255,0.2)', animationDuration: '1.5s', animationDirection: 'reverse' }} />
          </div>
          <p className="text-[8px] font-bold tracking-[0.3em] uppercase"
            style={{ color: 'rgba(74,119,125,0.4)' }}>
            ESTABLISHING UPLINK
          </p>
          {feedId && (
            <p className="text-[7px] font-mono" style={{ color: 'var(--color-outline-variant)' }}>
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
            setLoading(false);
            onLoaded?.();
          }}
          onPlaying={() => { setLoading(false); onLoaded?.(); }}
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

