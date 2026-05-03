import { useRef, useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X } from 'lucide-react';

interface ScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: any) => void;
}

export default function Scanner({ onScanSuccess, onScanFailure }: ScannerProps) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const startCamera = async () => {
    setIsCameraOpen(true);
    // Add a slight delay to allow the DOM element to render
    setTimeout(async () => {
      try {
        scannerRef.current = new Html5Qrcode("qr-reader");
        await scannerRef.current.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              // Minimal width/height bounds
              return { 
                width: Math.floor(viewfinderWidth * 0.8), 
                height: Math.floor(viewfinderHeight * 0.5) 
              };
            }
          },
          (decodedText) => {
            onScanSuccess(decodedText);
            stopCamera();
          },
          (errorMessage) => {
            if (onScanFailure) onScanFailure(errorMessage);
          }
        );
      } catch (err) {
        console.error("Camera start failed:", err);
        setIsCameraOpen(false);
        alert("Could not start camera. Please ensure camera permissions are granted.");
      }
    }, 100);
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
    setIsCameraOpen(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => scannerRef.current?.clear()).catch(console.error);
      }
    };
  }, []);

  return (
    <div className="w-full max-w-sm mx-auto mt-4 text-center">
      {!isCameraOpen ? (
        <button
          onClick={startCamera}
          className="flex items-center justify-center gap-2 w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-colors"
        >
          <Camera size={28} />
          <span className="text-xl font-medium">Open Camera to Scan Barcode</span>
        </button>
      ) : (
        <div className="relative">
          <div id="qr-reader" className="w-full overflow-hidden rounded-xl border border-gray-300 bg-black min-h-[250px]"></div>
          <button 
            onClick={stopCamera}
            className="absolute top-2 right-2 bg-red-600/80 text-white p-2 rounded-full hover:bg-red-700 flex items-center justify-center shadow-lg backdrop-blur-md"
          >
            <X size={20} />
          </button>
          <div className="absolute bottom-4 left-0 right-0 text-white text-sm font-medium drop-shadow-md">
            Scanning for barcode...
          </div>
        </div>
      )}
    </div>
  );
}
