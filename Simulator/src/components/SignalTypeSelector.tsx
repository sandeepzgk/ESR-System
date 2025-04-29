import React from 'react';
import { Activity, Waves } from 'lucide-react';

interface SignalTypeSelectorProps {
  signalType: 'sine' | 'noise';
  onToggle: () => void;
}

const SignalTypeSelector: React.FC<SignalTypeSelectorProps> = ({ signalType, onToggle }) => {
  // Modified to set specific modes instead of toggling
  const setSineMode = () => {
    if (signalType !== 'sine') {
      onToggle();
    }
  };

  const setNoiseMode = () => {
    if (signalType !== 'noise') {
      onToggle();
    }
  };

  return (
    <div className="mb-1">
      <label className="block text-xs font-medium text-gray-700 mb-1">
        Signal Type
      </label>
      <div className="flex space-x-2">
        <button
          onClick={setSineMode}
          className={`flex items-center gap-2 px-4 py-2.5 rounded text-sm ${
            signalType === 'sine'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Activity size={18} />
          <span>Sine Wave</span>
        </button>
        <button
          onClick={setNoiseMode}
          className={`flex items-center gap-2 px-4 py-2.5 rounded text-sm ${
            signalType === 'noise'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Waves size={18} />
          <span>White Noise</span>
        </button>
      </div>
      <div className="mt-1 text-xs text-gray-500">
        {signalType === 'sine' 
          ? 'Sine wave: Single frequency' 
          : 'White noise: Frequency band'}
      </div>
    </div>
  );
};

export default SignalTypeSelector;