import React, { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const QRScanner = ({ onScan, onError }) => {
    const scannerRef = useRef(null);
    const onScanRef = useRef(onScan);
    const onErrorRef = useRef(onError);

    // Keep refs updated
    useEffect(() => {
        onScanRef.current = onScan;
    }, [onScan]);

    useEffect(() => {
        onErrorRef.current = onError;
    }, [onError]);

    useEffect(() => {
        if (!scannerRef.current) return;

        const html5QrCode = new Html5Qrcode("qr-reader");
        let isStarted = false;

        html5QrCode.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: (viewfinderWidth, viewfinderHeight) => {
                    const minEdgePercentage = 0.7; // 70% of the smallest edge
                    const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
                    const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
                    return { width: qrboxSize, height: qrboxSize };
                },
                aspectRatio: 1.0,
                formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
            },
            (decodedText, decodedResult) => {
                if (onScanRef.current) {
                    onScanRef.current([{ rawValue: decodedText.trim() }]);
                }
            },
            (errorMessage) => {
                // We typically ignore frequent error messages during scanning to avoid spamming the console
            }
        ).then(() => {
            isStarted = true;
        }).catch(err => {
            console.error("Camera start error", err);
            if (onErrorRef.current) {
                onErrorRef.current(err);
            }
        });

        return () => {
            if (isStarted) {
                html5QrCode.stop().then(() => {
                    html5QrCode.clear();
                }).catch(console.error);
            }
        };
    }, []);

    return (
        <div id="qr-reader" ref={scannerRef} style={{ width: '100%', maxWidth: '400px', margin: '0 auto', background: 'white' }}></div>
    );
};

export default QRScanner;
