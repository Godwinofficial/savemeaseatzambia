import React, { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const QRScanner = ({ onScan, onError, isActive = true }) => {
    const scannerRef = useRef(null);
    const onScanRef = useRef(onScan);
    const onErrorRef = useRef(onError);
    const scannerInstanceRef = useRef(null);
    const isStartedRef = useRef(false);

    useEffect(() => {
        onScanRef.current = onScan;
    }, [onScan]);

    useEffect(() => {
        onErrorRef.current = onError;
    }, [onError]);

    const stopScanner = async () => {
        if (!scannerInstanceRef.current || !isStartedRef.current) return;

        try {
            await scannerInstanceRef.current.stop();
            scannerInstanceRef.current.clear();
        } catch (err) {
            // Ignore stop errors while camera is already inactive.
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
                        const minEdgePercentage = 0.7;
                        const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
                        const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
                        return { width: qrboxSize, height: qrboxSize };
                    },
                    aspectRatio: 1.0,
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
                },
                (decodedText) => {
                    if (onScanRef.current) {
                        onScanRef.current([{ rawValue: decodedText.trim() }]);
                    }
                },
                () => {
                    // Ignore frequent frame-level decode errors.
                }
            );
            isStartedRef.current = true;
        } catch (err) {
            console.error("Camera start error", err);
            if (onErrorRef.current) {
                onErrorRef.current(err);
            }
        }
    };

    useEffect(() => {
        startScanner();
        return () => {
            stopScanner();
        };
    }, []);

    useEffect(() => {
        if (isActive) {
            startScanner();
        } else {
            stopScanner();
        }
    }, [isActive]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '300px', background: '#000' }}>
            <div id="qr-reader" ref={scannerRef} style={{ width: '100%', height: '100%', minHeight: '300px', background: '#000' }}></div>
            {!isActive && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(15, 23, 42, 0.48)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 20,
                    backdropFilter: 'blur(2px)'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        background: 'rgba(15, 23, 42, 0.72)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '999px',
                        color: '#f8fafc',
                        padding: '0.6rem 0.9rem',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase'
                    }}>
                        <i className="fas fa-lock"></i>
                        Scanner Paused
                    </div>
                </div>
            )}
        </div>
    );
};

export default QRScanner;
