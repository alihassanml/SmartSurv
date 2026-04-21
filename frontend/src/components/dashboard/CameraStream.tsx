import React, { useEffect, useRef } from 'react';
import { API } from '../../types/dashboard';

interface CameraStreamProps {
  feedId?: string;
  active: boolean;
  showHeatmap?: boolean;
}

const CameraStream: React.FC<CameraStreamProps> = ({ feedId, active, showHeatmap }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const heatmapImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!active) {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      return;
    }

    const startWebRTC = async () => {
      const pc = new RTCPeerConnection();
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

        const response = await fetch(`${API}/offer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sdp: pc.localDescription?.sdp,
            type: pc.localDescription?.type,
            feed_id: feedId,
          }),
        });

        const answer = await response.json();
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error('WebRTC Negotiation Failed:', err);
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

  useEffect(() => {
    if (!active || !showHeatmap) return;
    let isActive = true;
    const fetchHeatmap = async () => {
      try {
        const url = `${API}/api/camera/heatmap/${feedId || 'camera-0'}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (data.heatmap && heatmapImgRef.current) {
          heatmapImgRef.current.src = `data:image/png;base64,${data.heatmap}`;
        }
      } catch (_) {}
      finally {
        if (isActive) setTimeout(fetchHeatmap, 1000);
      }
    };
    fetchHeatmap();
    return () => { isActive = false; };
  }, [active, showHeatmap, feedId]);

  return (
    <div className="relative w-full h-full bg-black">
      {active && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-contain"
        />
      )}
      {showHeatmap && (
        <img
          ref={heatmapImgRef}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-[0.85] transition-opacity duration-1000"
          alt="Heatmap"
        />
      )}
    </div>
  );
};

export default CameraStream;

