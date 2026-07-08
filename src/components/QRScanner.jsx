import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRScanner = ({ onScan, onError }) => {
    const scannerRef = useRef(null);
    const scannerInstanceRef = useRef(null);

    useEffect(() => {
        if (!scannerRef.current) return;
        if (scannerInstanceRef.current) return;

        const scanner = new Html5QrcodeScanner(
            "qr-reader",
            { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
            /* verbose= */ false
        );

        scannerInstanceRef.current = scanner;

        scanner.render(
            (decodedText, decodedResult) => {
                if (onScan) {
                    // Match the expected signature of the previous scanner wrapper (returning [{rawValue: text}])
                    onScan([{ rawValue: decodedText }]);
                }
            },
            (errorMessage) => {
                if (onError) {
                    onError(errorMessage);
                }
            }
        );

        return () => {
            scanner.clear().catch(error => {
                console.error("Failed to clear html5QrcodeScanner. ", error);
            });
            scannerInstanceRef.current = null;
        };
    }, [onScan, onError]);

    return (
        <div id="qr-reader" ref={scannerRef} style={{ width: '100%', maxWidth: '400px', margin: '0 auto', background: 'white' }}></div>
    );
};

export default QRScanner;
