import React, { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const QRScanner = ({ onScan, onError, isActive = true }) => {
    const scannerRef = useRef(null);
    const onScanRef = useRef(onScan);
    const onErrorRef = useRef(onError);
    const scannerInstanceRef = useRef(null);
    const isStartedRef = useRef(false);
    const scannerIdRef = useRef(`qr-reader-${Math.random().toString(36).substring(2, 9)}`);
    const cooldownUntilRef = useRef(Date.now() + 900);

    useEffect(() => { onScanRef.current = onScan; }, [onScan]);
    useEffect(() => { onErrorRef.current = onError; }, [onError]);

    const stopScanner = async () => {
        if (!scannerInstanceRef.current || !isStartedRef.current) return;
        try {
            isStartedRef.current = false;
            await scannerInstanceRef.current.stop();
            scannerInstanceRef.current.clear();
        } catch (err) {
            // Ignore stop errors
        }
    };

    const startScanner = async () => {
        if (!scannerRef.current || isStartedRef.current) return;
        cooldownUntilRef.current = Date.now() + 900; // Ignore first 900ms to allow video feed to refresh
        const html5QrCode = new Html5Qrcode(scannerIdRef.current);
        scannerInstanceRef.current = html5QrCode;
        try {
            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: (viewfinderWidth, viewfinderHeight) => {
                        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                        return { width: Math.floor(minEdge * 0.85), height: Math.floor(minEdge * 0.85) };
                    },
                    aspectRatio: 1.0,
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
                },
                (decodedText) => {
                    // Ignore stale/buffered frames while camera is initializing
                    if (Date.now() < cooldownUntilRef.current) return;
                    if (onScanRef.current && decodedText && decodedText.trim()) {
                        onScanRef.current([{ rawValue: decodedText.trim() }]);
                    }
                },
                () => { /* ignore frame-level errors */ }
            );
            isStartedRef.current = true;
        } catch (err) {
            console.error("Camera start error", err);
            if (onErrorRef.current) onErrorRef.current(err);
        }
    };

    useEffect(() => {
        if (isActive) {
            startScanner();
        } else {
            stopScanner();
        }
        return () => {
            stopScanner();
        };
    }, [isActive]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '360px', background: '#000' }}>
            <div id={scannerIdRef.current} ref={scannerRef} style={{ width: '100%', height: '100%', minHeight: '360px', background: '#000' }} />
            {!isActive && (
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.65)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 20, backdropFilter: 'blur(3px)'
                }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.18)',
                        borderRadius: '6px',
                        color: '#f1f5f9',
                        padding: '0.55rem 1.1rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase'
                    }}>
                        Scanner Paused
                    </div>
                </div>
            )}
        </div>
    );
};

export default QRScanner;
