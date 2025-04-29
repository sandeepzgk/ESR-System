import React from 'react';
import { ParameterState, TextValues, ParameterWithUnit } from '../types';
import { unitSystem } from '../constants';

// Props interface for ParameterControl
interface ParameterControlProps {
  paramName: string;
  params: ParameterState;
  textValues: TextValues;
  onParamChange: (paramName: string, updates: Partial<ParameterWithUnit>) => void;
  onTextChange: (paramName: string, text: string) => void;
  hasValidationErrors: boolean;
}

// Optimized parameter control component with horizontal layout
const ParameterControl: React.FC<ParameterControlProps> = ({
  paramName,
  params,
  textValues,
  onParamChange,
  onTextChange,
  hasValidationErrors
}) => {
  if (!params || !params[paramName]) {
    console.error(`Parameter '${paramName}' not found`);
    return null;
  }

  const param = params[paramName] as ParameterWithUnit;
  const { value, unit } = param;
  const textValue = textValues[paramName];

  // Handle case where unit system might not be defined yet
  const system = unitSystem[paramName] || { units: [], ranges: {} };
  const range = (system.ranges && system.ranges[unit]) ? system.ranges[unit] : [1, 1000];

  // Generate user-friendly label from paramName
  const getLabel = () => {
    const signalType = params.signalType;
    
    if (paramName === 'safeCurrentThreshold') return <>Current Threshold — <b>I<sub>body</sub></b></>;
    if (paramName === 'voltage') {
      return signalType === 'sine' 
        ? <>Voltage (Pk-Pk) — <b>V<sub>pk-pk</sub></b></>
        : <>Voltage (RMS) — <b>V<sub>RMS</sub></b></>;
    }
    if (paramName === 'resistance') return <>Resistance — <b>R<sub>body</sub></b></>;
    if (paramName === 'capacitance') return <>Capacitance — <b>C<sub>body</sub></b></>;
    if (paramName === 'frequency') return <>Frequency — <b>F<sub>signal</sub></b></>;
    if (paramName === 'noiseMinFrequency') return <>Min Frequency — <b>F<sub>min</sub></b></>;
    if (paramName === 'noiseMaxFrequency') return <>Max Frequency — <b>F<sub>max</sub></b></>;
    
    return paramName.charAt(0).toUpperCase() + paramName.slice(1);
  };

  return (
    <div className={` py-2 flex items-center rounded-md px-3 bg-white border border-gray-200`}>
      {/* Label on the left side */}
      <div className={`w-48 text-sm font-medium ${hasValidationErrors ? 'text-yellow-700' : 'text-gray-700'}`}>
        {getLabel()}
      </div>
      
      {/* Controls on the right side */}
      <div className="flex-grow flex items-center space-x-3">
        {/* Slider with min/max values underneath */}
        <div className="flex-grow flex flex-col">
          <div className="flex-grow flex items-center h-8">
            <input
              type="range"
              min={range[0]}
              max={range[1]}
              step={(range[1] - range[0]) / 100}
              value={value}
              onChange={(e) => onParamChange(paramName, { value: parseFloat(e.target.value) })}
              className={`w-full ${hasValidationErrors ? 'accent-yellow-500' : ''}`}
            />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span>{`${range[0]}`}</span>
            <span>{`${range[1]}`}</span>
          </div>
        </div>
        
        {/* Text input and unit selector */}
        <div className="flex h-8 items-center">
          <input
            type="text"
            value={textValue}
            onChange={(e) => onTextChange(paramName, e.target.value)}
            className={`w-20 px-2 py-1 text-sm border rounded-l-md text-right ${
              hasValidationErrors ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
            }`}
          />
          <select
            value={unit}
            onChange={(e) => onParamChange(paramName, { unit: e.target.value })}
            className={`w-16 border rounded-r-md text-sm py-1 ${
              hasValidationErrors ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300 bg-gray-50'
            }`}
          >
            {system.units.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ParameterControl;