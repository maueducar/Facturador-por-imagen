
import React from 'react';
import { SpinnerIcon } from './icons';
import { AppState } from '../types';

interface StatusIndicatorProps {
  appState: AppState;
  question?: string;
  error?: string | null;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ appState, question, error }) => {
  const renderContent = () => {
    switch (appState) {
      case AppState.LISTENING:
        return (
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-blue-300">Escuchando...</h2>
            <p className="text-gray-400 mt-1">Habla ahora para dictar los datos de la factura.</p>
          </div>
        );
      case AppState.PROCESSING:
        return (
          <div className="text-center flex flex-col items-center">
            <SpinnerIcon className="h-12 w-12 animate-spin text-blue-400" />
            <h2 className="text-2xl font-semibold text-blue-300 mt-4">Procesando tu voz...</h2>
            <p className="text-gray-400 mt-1">La IA está analizando la información.</p>
          </div>
        );
      case AppState.GUIDED:
        return (
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-yellow-300">{question}</h2>
            <p className="text-gray-400 mt-1">Presiona el micrófono para responder.</p>
          </div>
        );
       case AppState.REVIEW:
        return (
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-green-300">Revisa la Factura</h2>
            <p className="text-gray-400 mt-1">Confirma si los datos son correctos o presiona el micrófono para editar.</p>
          </div>
        );
       case AppState.FINALIZED:
        return (
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-green-300">Factura Finalizada</h2>
            <p className="text-gray-400 mt-1">El JSON ha sido generado y está listo para ser enviado.</p>
          </div>
        );
      case AppState.ERROR:
        return (
          <div className="text-center bg-red-900/50 border border-red-500 p-4 rounded-lg">
            <h2 className="text-2xl font-semibold text-red-300">Ocurrió un Error</h2>
            <p className="text-red-400 mt-2">{error || 'Ha ocurrido un problema inesperado.'}</p>
          </div>
        );
      case AppState.IDLE:
      default:
        return (
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-300">Bienvenido a Factura por Voz</h2>
            <p className="text-gray-400 mt-1">Presiona el micrófono para comenzar a crear una factura.</p>
          </div>
        );
    }
  };

  return <div className="w-full max-w-2xl mx-auto my-8 min-h-[100px] flex items-center justify-center">{renderContent()}</div>;
};

export default StatusIndicator;
