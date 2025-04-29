import React, { useState, useEffect } from 'react';
import { ParameterState, TextValues, ParameterWithUnit } from '../types';
import ParameterControl from './ParameterControl';
import { getParamValidationState } from '../utils';

interface FrequencyInputsProps {
  signalType: 'sine' | 'noise';
  params: ParameterState;
  textValues: TextValues;
  onParamChange: (paramName: string, updates: Partial<ParameterWithUnit>) => void;
  onTextChange: (paramName: string, text: string) => void;
  validationErrors: string[];
  noiseValidationError?: string;
}

const FrequencyInputs: React.FC<FrequencyInputsProps> = ({
  signalType,
  params,
  textValues,
  onParamChange,
  onTextChange,
  validationErrors,
  noiseValidationError
}) => {
  // Check which parameters have validation errors
  const checkParamValidationState = (paramName: string): boolean => {
    return getParamValidationState(validationErrors, paramName);
  };

  // Check if noise frequency inputs have validation errors
  const hasNoiseValidationError = !!noiseValidationError;
  
  // Local state for the dual slider
  const [minValue, setMinValue] = useState<number>(params.noiseMinFrequency.value);
  const [maxValue, setMaxValue] = useState<number>(params.noiseMaxFrequency.value);
  
  // Update local state when params change
  useEffect(() => {
    setMinValue(params.noiseMinFrequency.value);
    setMaxValue(params.noiseMaxFrequency.value);
  }, [params.noiseMinFrequency.value, params.noiseMaxFrequency.value]);
  
  // Handle min slider change
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (newValue < maxValue) {
      setMinValue(newValue);
      onParamChange('noiseMinFrequency', { value: newValue });
    }
  };
  
  // Handle max slider change
  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (newValue > minValue) {
      setMaxValue(newValue);
      onParamChange('noiseMaxFrequency', { value: newValue });
    }
  };

  return (
    <div>
      {signalType === 'sine' ? (
        // Sine wave mode - single frequency input
        <ParameterControl
          paramName="frequency"
          params={params}
          textValues={textValues}
          onParamChange={onParamChange}
          onTextChange={onTextChange}
          hasValidationErrors={checkParamValidationState('frequency')}
        />
      ) : (
        // Noise mode - dual slider for min and max frequency
        <div>
          {hasNoiseValidationError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-md">
              <p className="text-red-700 text-sm">{noiseValidationError}</p>
            </div>
          )}
          
          <div className="mb-4">
            <label className={`block text-sm font-medium ${hasNoiseValidationError ? 'text-yellow-700' : 'text-gray-700'}`}>
              Noise Frequency Range
            </label>
            
            <div className="mt-6 mb-2 relative">
              {/* Track */}
              <div className="w-full h-2 bg-gray-200 rounded-md absolute top-1/2 transform -translate-y-1/2"></div>
              
              {/* Selected area */}
              <div 
                className="h-2 bg-blue-500 rounded-md absolute top-1/2 transform -translate-y-1/2"
                style={{
                  left: `${(minValue / 2000) * 100}%`,
                  width: `${((maxValue - minValue) / 2000) * 100}%`
                }}
              ></div>
              
              {/* Min handle - FIXED: increased z-index to be higher than max handle */}
              <input
                type="range"
                min="1"
                max="2000"
                value={minValue}
                onChange={handleMinChange}
                className={`absolute w-full appearance-none bg-transparent ${hasNoiseValidationError ? 'accent-yellow-500' : ''}`}
                style={{ height: '20px', outline: 'none', zIndex: 3 }}
              />
              
              {/* Max handle - kept original z-index */}
              <input
                type="range"
                min="1"
                max="2000"
                value={maxValue}
                onChange={handleMaxChange}
                className={`absolute w-full appearance-none bg-transparent ${hasNoiseValidationError ? 'accent-yellow-500' : ''}`}
                style={{ height: '20px', outline: 'none', zIndex: 2 }}
              />
            </div>
            
            <div className="flex justify-between text-xs mt-8">
              <span>1 Hz</span>
              <span>500 Hz</span>
              <span>1000 Hz</span>
              <span>1500 Hz</span>
              <span>2000 Hz</span>
            </div>
            
            {/* Input boxes for precise control */}
            <div className="flex justify-between gap-4 mt-6">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Min Frequency (Hz)
                </label>
                <input
                  type="text"
                  value={textValues.noiseMinFrequency}
                  onChange={(e) => onTextChange('noiseMinFrequency', e.target.value)}
                  className={`w-full px-2 py-1 border rounded-md ${
                    hasNoiseValidationError ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
                  }`}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Max Frequency (Hz)
                </label>
                <input
                  type="text"
                  value={textValues.noiseMaxFrequency}
                  onChange={(e) => onTextChange('noiseMaxFrequency', e.target.value)}
                  className={`w-full px-2 py-1 border rounded-md ${
                    hasNoiseValidationError ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
                  }`}
                />
              </div>
            </div>
          </div>
          
          <div className="mt-2 text-xs text-gray-600 italic">
            Frequencies must be within the range of 1 Hz to 2000 Hz, and min frequency must be less than max frequency.
          </div>
        </div>
      )}
    </div>
  );
};

export default FrequencyInputs;