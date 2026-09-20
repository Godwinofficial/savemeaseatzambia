import React, { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const QRScanner = ({ onScan, onError, isActive = true }) => {
    const scannerRef = useRef(null);
    const onScanRef = useRef(onScan);
    const onErrorRef = useRef(onError);
    const scannerInstanceRef = useRef(null);
    const isStartedRef = useRef(false);

    useEffect(() => { onScanRef.current = onScan; }, [onScan]);
    useEffect(() => { onErrorRef.current = onError; }, [onError]);

    const stopScanner = async () => {
        if (!scannerInstanceRef.current || !isStartedRef.current) return;
        try {
            await scannerInstanceRef.current.stop();
            scannerInstanceRef.current.clear();
        } catch (err) {
            // Ignore stop errors
        } finally {
            isStartedRef.current = false;
        }
    };

    const startScanner = async () => {
        if (!scannerRef.current || isStartedRef.current) return;
        const html5QrCode = new Html5Qrcode("qr-reader");
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
                    if (onScanRef.current) {
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
        startScanner();
        return () => { stopScanner(); };
    }, []);

    useEffect(() => {
        if (isActive) startScanner();
        else stopScanner();
    }, [isActive]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '360px', background: '#000' }}>
            <div id="qr-reader" ref={scannerRef} style={{ width: '100%', height: '100%', minHeight: '360px', background: '#000' }} />
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
