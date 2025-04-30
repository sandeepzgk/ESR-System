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
  const hasError = (name: string) => getParamValidationState(validationErrors, name);
  const hasNoiseError = !!noiseValidationError;

  const [minValue, setMinValue] = useState(params.noiseMinFrequency.value);
  const [maxValue, setMaxValue] = useState(params.noiseMaxFrequency.value);
  const [activeThumb, setActiveThumb] = useState<'min' | 'max' | null>(null);

  useEffect(() => {
    setMinValue(params.noiseMinFrequency.value);
    setMaxValue(params.noiseMaxFrequency.value);
  }, [params.noiseMinFrequency.value, params.noiseMaxFrequency.value]);

  useEffect(() => {
    const onUp = () => setActiveThumb(null);
    document.addEventListener('mouseup', onUp);
    return () => document.removeEventListener('mouseup', onUp);
  }, []);

  const handleMin = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = +e.target.value;
    if (v < maxValue) {
      setMinValue(v);
      onParamChange('noiseMinFrequency', { value: v });
    }
  };
  const handleMax = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = +e.target.value;
    if (v > minValue) {
      setMaxValue(v);
      onParamChange('noiseMaxFrequency', { value: v });
    }
  };
  
  // Helper functions for direct mouse manipulation
  const handleMinMouseMove = (e: MouseEvent) => {
    const sliderContainer = document.querySelector('.relative[style*="height: 32px"]');
    if (!sliderContainer) return;
    
    const rect = sliderContainer.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percentage = Math.min(Math.max(0, offsetX / rect.width), 1);
    const newValue = Math.round(1 + percentage * 1999);
    
    if (newValue < maxValue) {
      setMinValue(newValue);
      onParamChange('noiseMinFrequency', { value: newValue });
    }
  };
  
  const handleMaxMouseMove = (e: MouseEvent) => {
    const sliderContainer = document.querySelector('.relative[style*="height: 32px"]');
    if (!sliderContainer) return;
    
    const rect = sliderContainer.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percentage = Math.min(Math.max(0, offsetX / rect.width), 1);
    const newValue = Math.round(1 + percentage * 1999);
    
    if (newValue > minValue) {
      setMaxValue(newValue);
      onParamChange('noiseMaxFrequency', { value: newValue });
    }
  };

  return (
    <div>
      {signalType === 'sine' ? (
        <ParameterControl
          paramName="frequency"
          params={params}
          textValues={textValues}
          onParamChange={onParamChange}
          onTextChange={onTextChange}
          hasValidationErrors={hasError('frequency')}
        />
      ) : (
        <div className="mb-2">
          {hasNoiseError && (
            <div className="mb-1 p-1 bg-red-50 border border-red-300 rounded-md">
              <p className="text-red-700 text-xs">{noiseValidationError}</p>
            </div>
          )}
          <div className="flex items-center rounded-md px-3 py-2 border border-gray-200 mb-1 bg-white">
            <div className={`w-48 text-sm font-medium ${hasNoiseError ? 'text-yellow-700' : 'text-gray-700'}`}>
              Noise Frequency Range
            </div>
            <div className="flex-grow flex items-center space-x-3">
              {/* Min input */}
              <div className="flex items-center">
                <input
                  type="text"
                  value={textValues.noiseMinFrequency}
                  onChange={e => onTextChange('noiseMinFrequency', e.target.value)}
                  className={`w-16 px-2 py-1 text-sm border rounded ${
                    hasNoiseError ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
                  }`}
                />
                <label className="text-sm ml-1 whitespace-nowrap">Min (Hz)</label>
              </div>
              {/* Slider */}
              <div className="flex-grow mx-2">
                <div className="relative" style={{ height: 32 }}>
                  {/* Track */}
                  <div className="absolute top-1/2 left-0 w-full h-2 bg-gray-200  border-0 border-gray-600 rounded transform -translate-y-1/2" />
                  {/* Highlight */}
                  <div
                    className="absolute top-1/2 h-2 bg-gray-500 rounded transform -translate-y-1/2"
                    style={{
                      left: `${((minValue - 1) * 100) / 1999}%`,
                      width: `${((maxValue - minValue) * 100) / 1999}%`
                    }}
                  />
                  
                  {/* This is the container for both thumbs */}
                  <div className="absolute top-0 left-0 w-full" style={{ height: '32px' }}>
                    {/* Min thumb handle */}
                    <div
                      className="absolute w-4 h-4  bg-gray-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                      style={{
                        top: '50%',
                        left: `${((minValue - 1) * 100) / 1999}%`,
                        zIndex: activeThumb === 'min' ? 30 : 20,
                        pointerEvents: 'auto'
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setActiveThumb('min');
                        document.addEventListener('mousemove', handleMinMouseMove);
                        document.addEventListener('mouseup', () => {
                          setActiveThumb(null);
                          document.removeEventListener('mousemove', handleMinMouseMove);
                        }, { once: true });
                      }}
                    />
                    
                    {/* Max thumb handle */}
                    <div
                      className="absolute w-4 h-4 bg-gray-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                      style={{
                        top: '50%',
                        left: `${((maxValue - 1) * 100) / 1999}%`,
                        zIndex: activeThumb === 'max' ? 30 : 20,
                        pointerEvents: 'auto'
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setActiveThumb('max');
                        document.addEventListener('mousemove', handleMaxMouseMove);
                        document.addEventListener('mouseup', () => {
                          setActiveThumb(null);
                          document.removeEventListener('mousemove', handleMaxMouseMove);
                        }, { once: true });
                      }}
                    />
                  </div>
                </div>
                {/* Ticks */}
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1</span>
                  <span>500</span>
                  <span>1000</span>
                  <span>1500</span>
                  <span>2000</span>
                </div>
              </div>
              {/* Max input */}
              <div className="flex items-center">
                <input
                  type="text"
                  value={textValues.noiseMaxFrequency}
                  onChange={e => onTextChange('noiseMaxFrequency', e.target.value)}
                  className={`w-16 px-2 py-1 text-sm border rounded ${
                    hasNoiseError ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
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