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

// Optimized parameter control component
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

  const { value, unit } = params[paramName];
  const textValue = textValues[paramName];

  // Handle case where unit system might not be defined yet
  const system = unitSystem[paramName] || { units: [], ranges: {} };
  const range = (system.ranges && system.ranges[unit]) ? system.ranges[unit] : [1, 1000];

  // Generate user-friendly label from paramName
  const getLabel = () => {
    if (paramName === 'safeCurrentThreshold') return  <>Safe Current Threshold — <b>I<sub>body</sub></b></>;
    if (paramName === 'voltage') return <>Voltage — <b>V<sub>pk-pk</sub></b></>;
    if (paramName === 'resistance') return <>Resistance — <b>R<sub>body</sub></b></>;
    if (paramName === 'capacitance') return <>Capacitance — <b>C<sub>body</sub></b></>;
    if (paramName === 'frequency') return <>Frequency — <b>F<sub>signal</sub></b></>;
    return paramName.charAt(0).toUpperCase() + paramName.slice(1);
  };

  return (
    <div className="mb-4">
      <label className={`block text-sm font-medium ${hasValidationErrors ? 'text-yellow-700' : 'text-gray-700'}`}>
        {getLabel()}
      </label>
      <div className="flex space-x-2">
        <div className="flex-grow">
          <input
            type="range"
            min={range[0]}
            max={range[1]}
            step={(range[1] - range[0]) / 100}
            value={value}
            onChange={(e) => onParamChange(paramName, { value: parseFloat(e.target.value) })}
            className={`w-full ${hasValidationErrors ? 'accent-yellow-500' : ''}`}
          />
          <div className="flex justify-between text-xs mt-1">
            <span>{`${range[0]} ${unit}`}</span>
            <span>{`${range[1]} ${unit}`}</span>
          </div>        
        </div>
        <div className="flex w-48">
          <input
            type="text"
            value={textValue}
            onChange={(e) => onTextChange(paramName, e.target.value)}
            className={`w-24 px-2 py-1 border rounded-l-md text-right ${hasValidationErrors ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
              }`}
          />
          <select
            value={unit}
            onChange={(e) => onParamChange(paramName, { unit: e.target.value })}
            className={`w-24 border rounded-r-md text-sm ${hasValidationErrors ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300 bg-gray-50'
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