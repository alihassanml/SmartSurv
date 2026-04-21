import React, { useEffect, useRef } from 'react';
import { API } from '../../types/dashboard';

interface CameraStreamProps {
  feedId?: string;
  active: boolean;
}

const CameraStream: React.FC<CameraStreamProps> = ({ feedId, active }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);


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

    </div>
  );
};

export default CameraStream;

