
import React from 'react';
import { MicrophoneIcon } from './icons';

interface MicrophoneButtonProps {
  isListening: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({ isListening, onClick, disabled }) => {
  const baseClasses = "relative flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const colorClasses = isListening 
    ? "bg-red-600 hover:bg-red-700 focus:ring-red-400" 
    : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-400";

  return (
    <button onClick={onClick} className={`${baseClasses} ${colorClasses}`} disabled={disabled}>
      {isListening && (
        <span className="absolute h-full w-full rounded-full bg-red-500 animate-ping opacity-75"></span>
      )}
      <MicrophoneIcon className="h-10 w-10 text-white z-10" />
    </button>
  );
};

export default MicrophoneButton;
