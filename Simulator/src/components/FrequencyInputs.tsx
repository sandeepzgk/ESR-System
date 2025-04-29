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
        <div className="mb-2">
          {hasNoiseValidationError && (
            <div className="mb-1 p-1 bg-red-50 border border-red-300 rounded-md">
              <p className="text-red-700 text-xs">{noiseValidationError}</p>
            </div>
          )}
          
          <div className={`flex items-center rounded-md px-3 py-2 border border-gray-200 mb-1 bg-white`}>
            <div className={`w-48 text-sm font-medium ${hasNoiseValidationError ? 'text-yellow-700' : 'text-gray-700'}`}>
              Noise Frequency Range
            </div>
            
            {/* All controls in a single line */}
            <div className="flex-grow flex items-center space-x-3">
              {/* Min Frequency Input and Label in a group */}
              <div className="flex items-center">
                <input
                  type="text"
                  value={textValues.noiseMinFrequency}
                  onChange={(e) => onTextChange('noiseMinFrequency', e.target.value)}
                  className={`w-16 px-2 py-1 text-sm border rounded ${
                    hasNoiseValidationError ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
                  }`}
                />
                <label className="text-sm ml-1 whitespace-nowrap">Min (Hz)</label>
              </div>
              
              {/* Dual Slider */}
              <div className="flex-grow relative h-10 mx-2">
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
                
                {/* Min handle with increased vertical space */}
                <input
                  type="range"
                  min="1"
                  max="2000"
                  value={minValue}
                  onChange={handleMinChange}
                  className={`absolute w-full appearance-none bg-transparent ${hasNoiseValidationError ? 'accent-yellow-500' : ''}`}
                  style={{ height: '28px', outline: 'none', zIndex: 3 }}
                />
                
                {/* Max handle with increased vertical space */}
                <input
                  type="range"
                  min="1"
                  max="2000"
                  value={maxValue}
                  onChange={handleMaxChange}
                  className={`absolute w-full appearance-none bg-transparent ${hasNoiseValidationError ? 'accent-yellow-500' : ''}`}
                  style={{ height: '28px', outline: 'none', zIndex: 2 }}
                />
                
                {/* Tick marks */}
                <div className="absolute bottom-0 w-full flex justify-between text-xs text-gray-500">
                  <span>1</span>
                  <span>500</span>
                  <span>1000</span>
                  <span>1500</span>
                  <span>2000</span>
                </div>
              </div>
              
              {/* Max Frequency Input and Label in a group */}
              <div className="flex items-center">
                <input
                  type="text"
                  value={textValues.noiseMaxFrequency}
                  onChange={(e) => onTextChange('noiseMaxFrequency', e.target.value)}
                  className={`w-16 px-2 py-1 text-sm border rounded ${
                    hasNoiseValidationError ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
                  }`}
                />
                <label className="text-sm ml-1 whitespace-nowrap">Max (Hz)</label>
              </div>
            </div>
          </div>
          
        
        </div>
      )}
    </div>
  );
};

export default FrequencyInputs;