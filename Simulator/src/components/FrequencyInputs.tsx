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
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setMinValue(params.noiseMinFrequency.value);
    setMaxValue(params.noiseMaxFrequency.value);
  }, [params.noiseMinFrequency.value, params.noiseMaxFrequency.value]);

  useEffect(() => {
    const onUp = () => setActiveThumb(null);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchend', onUp);
    return () => {
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchend', onUp);
    };
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
  
  // Helper functions for direct mouse/touch manipulation
  const handleMinMouseMove = (e: MouseEvent | TouchEvent) => {
    const sliderContainer = document.querySelector('.frequency-slider-container');
    if (!sliderContainer) return;
    
    const rect = sliderContainer.getBoundingClientRect();
    
    // Handle both mouse and touch events
    let clientX: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }
    
    const offsetX = clientX - rect.left;
    const percentage = Math.min(Math.max(0, offsetX / rect.width), 1);
    const newValue = Math.round(1 + percentage * 1999);
    
    if (newValue < maxValue) {
      setMinValue(newValue);
      onParamChange('noiseMinFrequency', { value: newValue });
    }
  };
  
  const handleMaxMouseMove = (e: MouseEvent | TouchEvent) => {
    const sliderContainer = document.querySelector('.frequency-slider-container');
    if (!sliderContainer) return;
    
    const rect = sliderContainer.getBoundingClientRect();
    
    // Handle both mouse and touch events
    let clientX: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }
    
    const offsetX = clientX - rect.left;
    const percentage = Math.min(Math.max(0, offsetX / rect.width), 1);
    const newValue = Math.round(1 + percentage * 1999);
    
    if (newValue > minValue) {
      setMaxValue(newValue);
      onParamChange('noiseMaxFrequency', { value: newValue });
    }
  };

  const setupTouchHandlers = (thumb: 'min' | 'max') => {
    const handler = thumb === 'min' ? handleMinMouseMove : handleMaxMouseMove;
    return {
      onTouchStart: (e: React.TouchEvent) => {
        e.stopPropagation();
        setActiveThumb(thumb);
        document.addEventListener('touchmove', handler as any);
        document.addEventListener('touchend', () => {
          setActiveThumb(null);
          document.removeEventListener('touchmove', handler as any);
        }, { once: true });
      },
      onMouseDown: (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveThumb(thumb);
        document.addEventListener('mousemove', handler);
        document.addEventListener('mouseup', () => {
          setActiveThumb(null);
          document.removeEventListener('mousemove', handler);
        }, { once: true });
      }
    };
  };

  // For sine wave mode, just use regular ParameterControl
  if (signalType === 'sine') {
    return (
      <ParameterControl
        paramName="frequency"
        params={params}
        textValues={textValues}
        onParamChange={onParamChange}
        onTextChange={onTextChange}
        hasValidationErrors={hasError('frequency')}
      />
    );
  }

  // For noise mode on mobile, show a more touch-friendly interface
  if (isMobile) {
    return (
      <div className="mb-4">
        {hasNoiseError && (
          <div className="mb-2 p-2 bg-red-50 border border-red-300 rounded-md">
            <p className="text-red-700 text-xs">{noiseValidationError}</p>
          </div>
        )}
        
        <div className={`rounded-md p-3 ${hasNoiseError ? 'bg-yellow-50 border border-yellow-300' : 'bg-white border border-gray-200'}`}>
          <div className={`text-sm font-medium mb-3 ${hasNoiseError ? 'text-yellow-700' : 'text-gray-700'}`}>
            Noise Frequency Range
          </div>
          
          {/* Min/Max inputs side by side */}
          <div className="flex justify-between mb-4">
            <div className="w-1/2 pr-1">
              <label className="block text-xs text-gray-600 mb-1">Minimum (Hz)</label>
              <input
                type="text"
                value={textValues.noiseMinFrequency}
                onChange={e => onTextChange('noiseMinFrequency', e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded ${
                  hasNoiseError ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
                }`}
              />
            </div>
            <div className="w-1/2 pl-1">
              <label className="block text-xs text-gray-600 mb-1">Maximum (Hz)</label>
              <input
                type="text"
                value={textValues.noiseMaxFrequency}
                onChange={e => onTextChange('noiseMaxFrequency', e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded ${
                  hasNoiseError ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
                }`}
              />
            </div>
          </div>
          
          {/* Range slider - more touch-friendly */}
          <div className="mb-1">
            <div className="frequency-slider-container relative" style={{ height: 40 }}>
              {/* Track */}
              <div className="absolute top-1/2 left-0 w-full h-3 bg-gray-200 rounded transform -translate-y-1/2" />
              
              {/* Highlight */}
              <div
                className="absolute top-1/2 h-3 bg-gray-500 rounded transform -translate-y-1/2"
                style={{
                  left: `${((minValue - 1) * 100) / 1999}%`,
                  width: `${((maxValue - minValue) * 100) / 1999}%`
                }}
              />
              
              {/* Min thumb handle - larger for touch */}
              <div
                className={`absolute w-6 h-6 bg-gray-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
                  activeThumb === 'min' ? 'ring-4 ring-gray-300' : ''
                }`}
                style={{
                  top: '50%',
                  left: `${((minValue - 1) * 100) / 1999}%`,
                  zIndex: activeThumb === 'min' ? 30 : 20,
                  touchAction: 'none'
                }}
                {...setupTouchHandlers('min')}
              />
              
              {/* Max thumb handle - larger for touch */}
              <div
                className={`absolute w-6 h-6 bg-gray-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
                  activeThumb === 'max' ? 'ring-4 ring-gray-300' : ''
                }`}
                style={{
                  top: '50%',
                  left: `${((maxValue - 1) * 100) / 1999}%`,
                  zIndex: activeThumb === 'max' ? 30 : 20,
                  touchAction: 'none'
                }}
                {...setupTouchHandlers('max')}
              />
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
          
          {/* Current range display */}
          <div className="text-sm text-center mt-3">
            Current range: <span className="font-medium">{minValue} Hz - {maxValue} Hz</span>
          </div>
          
          {hasNoiseError && (
            <div className="mt-2 text-xs text-yellow-700">
              Please ensure minimum frequency is less than maximum frequency, and values are within valid ranges.
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop version
  return (
    <div>
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
            <div className="frequency-slider-container relative" style={{ height: 32 }}>
              {/* Track */}
              <div className="absolute top-1/2 left-0 w-full h-2 bg-gray-200 border-0 border-gray-600 rounded transform -translate-y-1/2" />
              
              {/* Highlight */}
              <div
                className="absolute top-1/2 h-2 bg-gray-500 rounded transform -translate-y-1/2"
                style={{
                  left: `${((minValue - 1) * 100) / 1999}%`,
                  width: `${((maxValue - minValue) * 100) / 1999}%`
                }}
              />
              
              {/* Min thumb handle */}
              <div
                className="absolute w-4 h-4 bg-gray-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                style={{
                  top: '50%',
                  left: `${((minValue - 1) * 100) / 1999}%`,
                  zIndex: activeThumb === 'min' ? 30 : 20,
                  pointerEvents: 'auto'
                }}
                {...setupTouchHandlers('min')}
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
                {...setupTouchHandlers('max')}
              />
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
  );
};

export default FrequencyInputs;