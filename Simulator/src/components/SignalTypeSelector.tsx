import React from 'react';
import { Activity, Waves } from 'lucide-react';

interface SignalTypeSelectorProps {
  signalType: 'sine' | 'noise';
  onToggle: () => void;
}

const SignalTypeSelector: React.FC<SignalTypeSelectorProps> = ({ signalType, onToggle }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Signal Type
      </label>
      <div className="flex space-x-2">
        <button
          onClick={onToggle}
          className={`flex items-center gap-2 px-4 py-2 rounded ${
            signalType === 'sine'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Activity size={18} />
          <span>Sine Wave</span>
        </button>
        <button
          onClick={onToggle}
          className={`flex items-center gap-2 px-4 py-2 rounded ${
            signalType === 'noise'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Waves size={18} />
          <span>White Noise</span>
        </button>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        {signalType === 'sine' 
          ? 'Sine wave mode: Single frequency analysis with peak-to-peak voltage input' 
          : 'White noise mode: Gaussian random signal with equal power across the specified frequency band (RMS voltage input)'}
      </div>
    </div>
  );
};

export default SignalTypeSelector;