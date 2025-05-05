import React, { useState, useEffect } from 'react';
import { Activity, Waves } from 'lucide-react';

interface SignalTypeSelectorProps {
  signalType: 'sine' | 'noise';
  onToggle: () => void;
}

const SignalTypeSelector: React.FC<SignalTypeSelectorProps> = ({ signalType, onToggle }) => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Set specific modes instead of toggling
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

  // Mobile version - full width toggles
  if (isMobile) {
    return (
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Signal Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={setSineMode}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded text-center ${
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
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded text-center ${
              signalType === 'noise'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Waves size={18} />
            <span>White Noise</span>
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          {signalType === 'sine' 
            ? 'Sine wave: Single frequency' 
            : 'White noise: Frequency band'}
        </div>
      </div>
    );
  }

  // Desktop version - same as original with some improvements
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