import React, { useEffect, useRef, useState } from 'react';
import { Shield, Zap } from 'lucide-react';

const RemoteCamera: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState<'idle' | 'connecting' | 'streaming' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [fps, setFps] = useState(0);
    const wsRef = useRef<WebSocket | null>(null);
    const isSecure = window.isSecureContext;
    const hasMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

    // Dynamic protocol (wss if page is https)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // Get client_id from URL
    const params = new URLSearchParams(window.location.search);
    const clientId = params.get('client_id') || '1';
    
    // Get backend host
    const backendHost = window.location.hostname;
    const wsUrl = `${protocol}//${backendHost}:8000/ws/remote-input?client_id=${clientId}`;


    const startStreaming = async () => {
        setStatus('connecting');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment', width: 640, height: 480 }, 
                audio: false 
            });
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                setStatus('streaming');
                setErrorMsg(null);
                console.log('Connected to SmartSurv');
            };

            ws.onerror = (err) => {
                console.error('WS Error', err);
                setStatus('error');
                setErrorMsg("WebSocket connection failed. Ensure backend is running.");
            };

            ws.onclose = () => {
                setStatus('idle');
                stopStreaming();
            };

        } catch (err: any) {
            console.error('Permission denied', err);
            setStatus('error');
            if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
                setErrorMsg("BROWSER_SEC: Camera requires HTTPS or 'localhost' to work on mobile. Try setting Chrome flags.");
            } else {
                setErrorMsg(err.message || "Failed to access camera.");
            }
        }
    };

    const stopStreaming = () => {
        if (wsRef.current) wsRef.current.close();
        if (videoRef.current?.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
        setStatus('idle');
    };

    useEffect(() => {
        let lastTime = Date.now();
        let frameCount = 0;
        let interval: any;

        if (status === 'streaming') {
            interval = setInterval(() => {
                if (videoRef.current && canvasRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
                    const canvas = canvasRef.current;
                    const video = videoRef.current;
                    const ctx = canvas.getContext('2d');
                    
                    if (ctx) {
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        // Convert to JPEG blob and send
                        canvas.toBlob((blob) => {
                            if (blob && wsRef.current?.readyState === WebSocket.OPEN) {
                                blob.arrayBuffer().then(buffer => {
                                    wsRef.current?.send(buffer);
                                });
                            }
                        }, 'image/jpeg', 0.6); // 60% quality for performance
                        
                        frameCount++;
                        const now = Date.now();
                        if (now - lastTime >= 1000) {
                            setFps(frameCount);
                            frameCount = 0;
                            lastTime = now;
                        }
                    }
                }
            }, 100); // 10 FPS is plenty for detection and keeps it smooth
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [status]);

    return (
        <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-on-surface)] font-sans p-6 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ backgroundImage: 'linear-gradient(rgba(36,128,255,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(36,128,255,0.06) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

            {/* Header */}
            <div className="relative z-10 w-full max-w-md mb-8 flex items-center justify-between border-b border-[rgba(36,128,255,0.15)] pb-4">
                <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 animate-pulse" />
                    <div>
                        <h1 className="text-lg font-bold tracking-widest uppercase">SmartSurv</h1>
                        <p className="text-[10px] opacity-40">// REMOTE_NODE_V1</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                        <div className={`w-2 h-2 rounded-full ${status === 'streaming' ? 'bg-[var(--color-primary)] animate-ping' : 'bg-red-500'}`} />
                        <span className="text-[10px] font-bold uppercase">{status}</span>
                    </div>
                    {status === 'streaming' && <p className="text-[10px] opacity-40">UPLINK: {fps} FPS</p>}
                </div>
            </div>

            {/* Secure Context Info (Debug) */}
            <div className="relative z-10 w-full mb-4 max-w-md p-2 border border-[rgba(0,0,0,0.1)] text-[8px] flex justify-between uppercase opacity-40">
                <span>SECURE_CONTEXT: {isSecure ? 'YES' : 'NO'}</span>
                <span>MEDIA_DEVICES: {hasMedia ? 'READY' : 'MISSING'}</span>
            </div>

            {/* Error Message */}
            {errorMsg && (
                <div className="relative z-20 w-full max-w-md p-3 bg-red-900/30 border border-red-500 text-red-400 text-[10px] mb-4 text-center">
                    <strong>EROR_04:</strong> {errorMsg}
                </div>
            )}

            {/* Viewfinder */}
            <div className="relative z-10 w-full max-w-md aspect-[4/3] bg-[#000] border border-[rgba(36,128,255,0.15)] overflow-hidden shadow-[0_0_30px_rgba(36,128,255,0.05)]">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale brightness-125" />
                <canvas ref={canvasRef} width={640} height={480} className="hidden" />
                
                {/* Visual Overlays */}
                <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-[rgba(36,128,255,0.2)] animate-pulse" />
                <div className="absolute inset-y-8 left-1/2 -translate-x-1/2 w-0.5 bg-[rgba(36,128,255,0.2)] animate-pulse" />
                <div className="absolute top-4 left-4 text-[10px] opacity-30">REC // STREAMING</div>
                <div className="absolute bottom-4 right-4 text-[10px] opacity-30">{new Date().toLocaleTimeString()}</div>
            </div>

            {/* Controls */}
            <div className="relative z-10 w-full max-w-md mt-8 space-y-4">
                {status === 'idle' ? (
                    <button 
                        onClick={startStreaming}
                        className="w-full py-4 border-2 border-[var(--color-primary)] bg-[rgba(36,128,255,0.05)] font-bold tracking-[0.3em] uppercase hover:bg-[var(--color-primary)] hover:text-white transition-all duration-300 flex items-center justify-center gap-3"
                    >
                        <Zap className="w-5 h-5" />
                        Initialize Uplink
                    </button>
                ) : (
                    <button 
                        onClick={stopStreaming}
                        className="w-full py-4 border-2 border-red-500 text-red-500 bg-[rgba(255,68,102,0.05)] font-bold tracking-[0.3em] uppercase hover:bg-red-500 hover:text-white transition-all duration-300"
                    >
                        Terminate Stream
                    </button>
                )}
                
                <div className="p-4 border border-[rgba(0,0,0,0.1)] text-[10px] opacity-50 leading-relaxed text-center">
                    This device is now acting as a remote surveillance node. Ensure a stable network connection for optimal detection performance.
                </div>
            </div>
            
            {/* CRT Scanline */}
            <div className="fixed inset-0 pointer-events-none z-50 opacity-20"
                style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)' }} />
        </div>
    );
};

export default RemoteCamera;



