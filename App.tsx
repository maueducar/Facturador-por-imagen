
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AppState, ReceiptData } from './types';
import { extractReceiptData } from './services/geminiService';
import { CameraIcon, ZapIcon, RotateCwIcon, SendIcon, CopyIcon, AlertTriangleIcon } from './components/icons';

const CameraView: React.FC<{
  onCapture: (imageData: string) => void;
  onCancel: () => void;
  onError: (message: string) => void;
}> = ({ onCapture, onCancel, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const enableCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error al acceder a la cámara:", err);
        onError(
          "No se pudo acceder a la cámara. Asegúrate de haber concedido los permisos."
        );
      }
    };

    enableCamera();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onError]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(imageData);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />
      <div className="absolute inset-0 border-8 border-white/50 rounded-3xl m-4 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-4 flex justify-around items-center">
        <button onClick={onCancel} className="text-white font-semibold py-2 px-4">
          Cancelar
        </button>
        <button
          onClick={handleCapture}
          className="w-20 h-20 bg-white rounded-full border-4 border-gray-500 flex items-center justify-center"
          aria-label="Capturar foto"
        >
          <div className="w-16 h-16 bg-white rounded-full border-2 border-black"></div>
        </button>
        <div className="w-16"></div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [imageData, setImageData] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const handleStartScan = () => {
    setError(null);
    setAppState(AppState.CAMERA_REQUEST);
  };
  
  useEffect(() => {
    if(appState === AppState.CAMERA_REQUEST) {
        setAppState(AppState.SCANNING);
    }
  }, [appState]);

  const handleCapture = (data: string) => {
    setImageData(data);
    setAppState(AppState.PREVIEW);
  };
  
  const handleCancelScan = () => {
    setAppState(AppState.IDLE);
    setImageData(null);
  };

  const handleRetry = () => {
    setAppState(AppState.SCANNING);
    setImageData(null);
  };

  const handleExtractData = useCallback(async () => {
    if (!imageData) return;
    setAppState(AppState.ANALYZING);
    setError(null);
    try {
      const data = await extractReceiptData(imageData);
      setReceiptData(data);
      setAppState(AppState.RESULT);
    } catch (err) {
      console.error(err);
      setError((err as Error).message || 'Un error desconocido ocurrió.');
      setAppState(AppState.ERROR);
    }
  }, [imageData]);
  
  const handleReset = () => {
      setAppState(AppState.IDLE);
      setImageData(null);
      setReceiptData(null);
      setError(null);
      setApiStatus('idle');
  };

  const handleSendToApi = () => {
    setApiStatus('sending');
    setTimeout(() => {
        // Simulación de llamada a API
        console.log("Enviando JSON a la API:", JSON.stringify(receiptData, null, 2));
        setApiStatus('sent');
    }, 1500);
  };
  
  const handleCopyJson = () => {
      if(receiptData) {
          navigator.clipboard.writeText(JSON.stringify(receiptData, null, 2));
          alert("JSON copiado al portapapeles!");
      }
  };
  
  const renderContent = () => {
    switch (appState) {
      case AppState.SCANNING:
        return <CameraView onCapture={handleCapture} onCancel={handleCancelScan} onError={(msg) => {setError(msg); setAppState(AppState.ERROR);}} />;
      
      case AppState.PREVIEW:
        return (
          imageData && (
            <div className="flex flex-col h-full p-4 space-y-4">
              <h2 className="text-2xl font-bold text-white text-center">Revisar Foto</h2>
              <div className="flex-grow flex items-center justify-center">
                  <img src={imageData} alt="Factura capturada" className="max-w-full max-h-[60vh] rounded-lg shadow-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={handleRetry} className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                  <RotateCwIcon className="w-5 h-5" />
                  Reintentar
                </button>
                <button onClick={handleExtractData} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                  <ZapIcon className="w-5 h-5" />
                  Extraer Datos
                </button>
              </div>
            </div>
          )
        );
        
      case AppState.ANALYZING:
        return (
            <div className="flex flex-col items-center justify-center h-full text-white">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400"></div>
                <p className="mt-4 text-xl">Analizando factura...</p>
                <p className="text-gray-400">La IA está leyendo los datos.</p>
            </div>
        );
        
       case AppState.RESULT:
         return (
             receiptData && (
                 <div className="flex flex-col h-full p-4 space-y-4 text-white">
                     <h2 className="text-2xl font-bold text-center">Datos Extraídos</h2>
                     <div className="flex-grow bg-gray-800 p-3 rounded-lg overflow-y-auto text-sm">
                         <pre><code>{JSON.stringify(receiptData, null, 2)}</code></pre>
                     </div>
                     <div className="space-y-3">
                         <div className="grid grid-cols-2 gap-3">
                             <button onClick={handleCopyJson} className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                                 <CopyIcon className="w-5 h-5"/>
                                 Copiar
                             </button>
                              <button onClick={handleSendToApi} disabled={apiStatus !== 'idle'} className={`flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-lg transition-colors ${
                                  apiStatus === 'idle' ? 'bg-green-600 hover:bg-green-700' :
                                  apiStatus === 'sending' ? 'bg-yellow-500 cursor-wait' : 'bg-green-800'
                              } text-white`}>
                                 <SendIcon className="w-5 h-5"/>
                                 {apiStatus === 'idle' && 'Enviar a API'}
                                 {apiStatus === 'sending' && 'Enviando...'}
                                 {apiStatus === 'sent' && 'Enviado'}
                             </button>
                         </div>
                         <button onClick={handleReset} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                             Escanear Otra
                         </button>
                     </div>
                 </div>
             )
         );

      case AppState.ERROR:
        return (
            <div className="flex flex-col items-center justify-center h-full text-white text-center p-6">
                <AlertTriangleIcon className="w-16 h-16 text-red-500 mb-4"/>
                <h2 className="text-2xl font-bold text-red-400 mb-2">Ocurrió un Error</h2>
                <p className="bg-red-900/50 p-3 rounded-md text-red-300">{error}</p>
                <button onClick={handleReset} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                    Volver a Intentar
                </button>
            </div>
        );

      case AppState.IDLE:
      case AppState.CAMERA_REQUEST:
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-white text-center p-6">
            <h1 className="text-4xl font-bold mb-2">FacturaScan AI</h1>
            <p className="text-gray-300 mb-8">
              Toma una foto de tu factura para extraer los datos automáticamente.
            </p>
            <button
              onClick={handleStartScan}
              className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-transform hover:scale-105"
            >
              <CameraIcon className="w-7 h-7" />
              Escanear Factura
            </button>
          </div>
        );
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-900 font-sans flex flex-col">
      <div className="flex-grow overflow-hidden relative">
          {renderContent()}
      </div>
    </div>
  );
};

export default App;
