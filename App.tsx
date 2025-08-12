import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, Invoice, GeminiResponse, SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from './types';
import { INITIAL_INVOICE_STATE, GUIDED_QUESTIONS } from './constants';
import { processInvoiceTranscript } from './services/geminiService';
import MicrophoneButton from './components/MicrophoneButton';
import InvoiceDisplay from './components/InvoiceDisplay';
import StatusIndicator from './components/StatusIndicator';
import { CheckIcon, FileJsonIcon } from './components/icons';

// Polyfill for SpeechRecognition
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition: SpeechRecognition | null = SpeechRecognitionAPI ? new SpeechRecognitionAPI() : null;

if (recognition) {
  recognition.continuous = true;
  recognition.lang = 'es-ES';
  recognition.interimResults = true;
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [invoice, setInvoice] = useState<Invoice>(INITIAL_INVOICE_STATE);
  const [transcript, setTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  
  const finalTranscriptRef = useRef<string>('');

  const resetState = useCallback(() => {
    setInvoice(INITIAL_INVOICE_STATE);
    setTranscript('');
    finalTranscriptRef.current = '';
    setCurrentQuestionIndex(0);
    setError(null);
    setAppState(AppState.IDLE);
  }, []);

  const handleApiError = (errorMessage: string) => {
    setError(errorMessage);
    setAppState(AppState.ERROR);
  };

  const processTranscript = useCallback(async (text: string) => {
    if (!text.trim()) {
      setAppState(currentQuestionIndex === 0 ? AppState.IDLE : AppState.GUIDED);
      return;
    }

    setAppState(AppState.PROCESSING);
    setError(null);

    try {
      const currentQuestion = GUIDED_QUESTIONS[currentQuestionIndex];
      const result: GeminiResponse = await processInvoiceTranscript(text, invoice, currentQuestion);

      const updatedInvoice: Invoice = { ...invoice };
      if (result.client) {
        updatedInvoice.client = { ...invoice.client, ...result.client };
      }
      if (result.items && result.items.length > 0) {
        // Simple merge for now, could be more sophisticated (e.g., merging items)
        updatedInvoice.items = [...invoice.items, ...result.items];
      }
      if (result.concepts) {
        updatedInvoice.concepts = result.concepts;
      }
      
      setInvoice(updatedInvoice);

      const allDataPresent = updatedInvoice.client.name && updatedInvoice.client.id && updatedInvoice.items.length > 0;

      if (result.isComplete || allDataPresent || currentQuestionIndex >= GUIDED_QUESTIONS.length - 2) {
         setAppState(AppState.REVIEW);
      } else {
         setCurrentQuestionIndex(prev => prev + 1);
         setAppState(AppState.GUIDED);
      }

    } catch (e) {
        if (e instanceof Error) {
            handleApiError(e.message);
        } else {
            handleApiError("Ocurrió un error desconocido.");
        }
    } finally {
        setTranscript('');
        finalTranscriptRef.current = '';
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice, currentQuestionIndex]);

  useEffect(() => {
    if (!recognition) {
        handleApiError("El reconocimiento de voz no es compatible con este navegador.");
        setAppState(AppState.ERROR);
        return;
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      finalTranscriptRef.current = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscriptRef.current + interimTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      handleApiError(`Error de reconocimiento de voz: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Only process if we were actually listening and have a final transcript
      if (finalTranscriptRef.current.trim()) {
          processTranscript(finalTranscriptRef.current);
      } else if (appState === AppState.LISTENING) {
          // If listening stopped without any final result, go back to previous state
          setAppState(currentQuestionIndex === 0 ? AppState.IDLE : AppState.GUIDED);
      }
    };
  }, [appState, processTranscript, currentQuestionIndex]);

  const handleListen = () => {
    if (!recognition) return;
    
    if (isListening) {
      recognition.stop();
    } else {
      finalTranscriptRef.current = '';
      setTranscript('');
      setIsListening(true);
      setAppState(AppState.LISTENING);
      recognition.start();
    }
  };

  const handleConfirmInvoice = () => {
      setAppState(AppState.FINALIZED);
      // Here you would typically send the JSON to an API
      console.log("JSON de la factura final:", JSON.stringify(invoice, null, 2));
  };

  const renderButtons = () => {
    switch (appState) {
        case AppState.REVIEW:
            return (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                    <button
                        onClick={handleConfirmInvoice}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors duration-300"
                    >
                        <CheckIcon className="w-5 h-5" />
                        Confirmar y Finalizar
                    </button>
                    <MicrophoneButton onClick={handleListen} isListening={isListening} />
                     <p className="text-gray-400 text-sm sm:hidden mt-2">Presiona el micrófono para corregir.</p>
                </div>
            );
        case AppState.FINALIZED:
            return (
                <button
                    onClick={resetState}
                    className="mt-8 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300"
                >
                    Crear Nueva Factura
                </button>
            );
        case AppState.ERROR:
            return (
                 <button
                    onClick={resetState}
                    className="mt-8 px-6 py-3 bg-yellow-600 text-gray-900 font-semibold rounded-lg shadow-md hover:bg-yellow-700 transition-colors duration-300"
                >
                    Intentar de Nuevo
                </button>
            )
        case AppState.IDLE:
        case AppState.GUIDED:
        case AppState.LISTENING:
        case AppState.PROCESSING:
             return <MicrophoneButton onClick={handleListen} isListening={isListening} disabled={appState === AppState.PROCESSING} />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 selection:bg-blue-500/30">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-gray-700/[0.2] [mask-image:linear-gradient(to_bottom,white_5%,transparent_90%)]"></div>
        <main className="w-full max-w-5xl z-10 flex flex-col items-center">
            <h1 className="text-4xl md:text-5xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400 mb-4">
                Factura por Voz AI
            </h1>
            
            <StatusIndicator appState={appState} question={GUIDED_QUESTIONS[currentQuestionIndex]} error={error}/>

            {transcript && (
                <div className="w-full max-w-2xl p-4 my-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                    <p className="text-gray-300 italic">{transcript}</p>
                </div>
            )}
            
            {(appState !== AppState.IDLE && appState !== AppState.LISTENING && appState !== AppState.PROCESSING) && <div className="my-8 w-full"><InvoiceDisplay invoice={invoice} /></div>}

            {appState === AppState.FINALIZED && (
                 <div className="w-full max-w-4xl p-6 my-8 bg-gray-800 border border-gray-700 rounded-xl">
                    <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2"><FileJsonIcon className="w-6 h-6 text-green-400" />JSON para API</h3>
                    <pre className="mt-4 bg-gray-900/70 p-4 rounded-lg text-sm text-green-300 overflow-x-auto">
                        {JSON.stringify(invoice, null, 2)}
                    </pre>
                 </div>
            )}

            <div className="mt-8 flex flex-col items-center">
                {renderButtons()}
            </div>
      </main>
      <footer className="z-10 text-center text-gray-500 text-sm mt-12">
        <p>Potenciado por Google Gemini. Diseñado para una carga de datos eficiente.</p>
      </footer>
    </div>
  );
};

export default App;