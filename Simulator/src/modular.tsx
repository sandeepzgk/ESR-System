import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import CircuitAnimation from './CircuitAnimation.tsx';

// ===========================
// ERROR BOUNDARY COMPONENT
// ===========================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Circuit analysis error:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border-2 border-red-500 rounded-lg bg-red-50 text-red-700">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="mb-4">
            {this.state.error && this.state.error.message ?
              this.state.error.message :
              "An unknown error occurred in the circuit analysis."}
          </p>
          <button
            onClick={this.resetError}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reset Circuit Analysis
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ===========================
// UTILITY FUNCTIONS - OPTIMIZED
// ===========================

// Physical validation limits for parameters
const physicalLimits = {
  minFrequency: 0.001, // Hz
  maxFrequency: 1e9,   // 1 GHz
  minResistance: 1e-6, // 1 µΩ
  maxResistance: 1e12, // 1 TΩ
  minCapacitance: 1e-15, // 1 fF
  maxCapacitance: 1,     // 1 F
  minVoltage: 1e-9,    // 1 nV
  maxVoltage: 1e6      // 1 MV
};

// Simplified unit system with conversion factors
const unitSystem = {
  voltage: {
    units: ['μV', 'mV', 'V'],
    factors: { 'μV': 1e-6, 'mV': 1e-3, 'V': 1 },
    ranges: { 'μV': [1, 1000], 'mV': [1, 1000], 'V': [1, 1000] }
  },
  resistance: {
    units: ['Ω', 'kΩ'],
    factors: { 'Ω': 1, 'kΩ': 1e3 },
    ranges: { 'Ω': [1, 1000], 'kΩ': [1, 1000] }
  },
  capacitance: {
    units: ['pF', 'nF', 'μF', 'mF'],
    factors: { 'pF': 1e-12, 'nF': 1e-9, 'μF': 1e-6, 'mF': 1e-3 },
    ranges: { 'pF': [1, 1000], 'nF': [1, 1000], 'μF': [1, 1000], 'mF': [1, 1000] }
  },
  frequency: {
    units: ['Hz', 'kHz'],
    factors: { 'Hz': 1, 'kHz': 1e3 },
    ranges: { 'Hz': [1, 2000], 'kHz': [1, 2] }
  },
  safeCurrentThreshold: {
    units: ['μA', 'mA'],
    factors: { 'μA': 1e-6, 'mA': 1e-3 },
    ranges: { 'μA': [1, 1000], 'mA': [1, 1000] }
  }
};

// Validates if parameters make physical sense together
const validateCircuitParameters = (normalizedValues) => {
  const { voltage, resistance, capacitance, frequency } = normalizedValues;
  const errors = [];

  // Check individual parameters against physical limits
  if (frequency < physicalLimits.minFrequency || frequency > physicalLimits.maxFrequency) {
    errors.push(`Frequency (${formatValueScientific(frequency, 'Hz')}) is outside physical limits`);
  }

  if (resistance < physicalLimits.minResistance || resistance > physicalLimits.maxResistance) {
    errors.push(`Resistance (${formatValueScientific(resistance, 'Ω')}) is outside physical limits`);
  }

  if (capacitance < physicalLimits.minCapacitance || capacitance > physicalLimits.maxCapacitance) {
    errors.push(`Capacitance (${formatValueScientific(capacitance, 'F')}) is outside physical limits`);
  }

  if (voltage < physicalLimits.minVoltage || voltage > physicalLimits.maxVoltage) {
    errors.push(`Voltage (${formatValueScientific(voltage, 'V')}) is outside physical limits`);
  }

  // Check parameter interactions
  // wRC value extremely low or high indicates potential issues
  const omega = 2 * Math.PI * frequency;
  const wRC = omega * resistance * capacitance;

  if (wRC < 1e-10) {
    errors.push("Circuit is extremely resistive (ωRC ≈ 0). Capacitor has negligible effect.");
  }

  if (wRC > 1e10) {
    errors.push("Circuit is extremely capacitive (ωRC ≫ 1). Resistor has negligible effect.");
  }

  // Check for numerical stability issues
  if (!isFinite(wRC) || isNaN(wRC)) {
    errors.push("Invalid parameter combination causing calculation errors.");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Unified format function for all units
const formatValue = (value, unit) => {
  if (value === 0) return `0 ${unit}`;
  if (!isFinite(value) || isNaN(value)) return `-- ${unit}`;

  // Common prefixes for both large and small values
  const prefixes = {
    '-12': 'p', '-9': 'n', '-6': 'μ', '-3': 'm',
    '0': '', '3': 'k', '6': 'M', '9': 'G'
  };

  // Scale value to appropriate prefix
  const scale = Math.floor(Math.log10(Math.abs(value)) / 3) * 3;
  const scaledValue = value / Math.pow(10, scale);
  const prefix = prefixes[scale] || '';

  return `${scaledValue.toFixed(2)} ${prefix}${unit}`;
};

// Format with scientific notation for extreme values
const formatValueScientific = (value, unit) => {
  if (value === 0) return `0 ${unit}`;
  if (!isFinite(value) || isNaN(value)) return `-- ${unit}`;

  if (Math.abs(value) < 0.01 || Math.abs(value) > 10000) {
    return `${value.toExponential(2)} ${unit}`;
  }

  return `${value.toFixed(2)} ${unit}`;
};

// ===========================
// CUSTOM HOOKS - OPTIMIZED
// ===========================

// Core RC Circuit Hook with optimized calculation strategy
const useRCCircuit = (initialParams = {}) => {
  // Default parameters with units
  const defaultParams = {
    voltage: { value: 1, unit: 'V' },
    resistance: { value: 5, unit: 'kΩ' },
    capacitance: { value: 50, unit: 'nF' },
    frequency: { value: 1000, unit: 'Hz' },
    safeCurrentThreshold: { value: 500, unit: 'μA' }
  };

  // Merge provided parameters with defaults
  const initialState = { ...defaultParams, ...initialParams };

  // State for circuit parameters
  const [params, setParams] = useState({
    voltage: initialState.voltage,
    resistance: initialState.resistance,
    capacitance: initialState.capacitance,
    frequency: initialState.frequency,
    safeCurrentThreshold: initialState.safeCurrentThreshold
  });

  // Text input state
  const [textValues, setTextValues] = useState({
    voltage: initialState.voltage.value.toString(),
    resistance: initialState.resistance.value.toString(),
    capacitance: initialState.capacitance.value.toString(),
    frequency: initialState.frequency.value.toString(),
    safeCurrentThreshold: initialState.safeCurrentThreshold.value.toString()
  });

  // Error state for validation feedback
  const [validationErrors, setValidationErrors] = useState([]);
  const [hasCalculationError, setHasCalculationError] = useState(false);

  // Get normalized value (convert to base units)
  const getNormalizedValue = (paramName) => {
    if (!params[paramName]) {
      console.error(`Parameter '${paramName}' not found in params`);
      return 0;
    }

    const { value, unit } = params[paramName];

    if (!unitSystem[paramName]) {
      console.error(`Parameter '${paramName}' not found in unitSystem`);
      return value; // Return the raw value as fallback
    }

    const system = unitSystem[paramName];

    if (!system.factors || !system.factors[unit]) {
      console.warn(`Unit '${unit}' not found in factors for '${paramName}'`);
      return value; // Return the raw value as fallback
    }

    return value * system.factors[unit];
  };

  // All normalized parameter values computed at once
  const normalizedValues = useMemo(() => ({
    voltage: getNormalizedValue('voltage'),
    resistance: getNormalizedValue('resistance'),
    capacitance: getNormalizedValue('capacitance'),
    frequency: getNormalizedValue('frequency'),
    safeCurrentThreshold: getNormalizedValue('safeCurrentThreshold')
  }), [params]);

  // Validate parameters
  useEffect(() => {
    const validation = validateCircuitParameters(normalizedValues);
    setValidationErrors(validation.errors);
  }, [normalizedValues]);

  // Calculate all circuit results in one go using memoization
  const results = useMemo(() => {
    try {
      setHasCalculationError(false);

      // Extract normalized values
      const { voltage, resistance, capacitance, frequency, safeCurrentThreshold } = normalizedValues;

      // Calculate angular frequency
      const omega = 2 * Math.PI * frequency;

      // Calculate normalized parameter ωRC
      const wRC = omega * resistance * capacitance;

      // Calculate RMS voltage (assuming sine wave)
      const voltageRMS = voltage / (2 * Math.sqrt(2));

      // Calculate currents (in A) - assuming AC steady state with pure sine waves
      const currentR = voltageRMS / resistance;
      const currentC = voltageRMS * omega * capacitance;
      const currentTotal = Math.sqrt(Math.pow(currentR, 2) + Math.pow(currentC, 2));

      // Calculate phase angle and power factor
      const phaseAngle = Math.atan(wRC) * (180 / Math.PI);
      const powerFactor = Math.cos(Math.atan(wRC));

      // Calculate impedance
      const impedance = resistance / Math.sqrt(1 + Math.pow(wRC, 2));

      // Calculate percentages for bars with division by zero protection
      const resistivePercent = currentTotal > 0 ? (currentR / currentTotal) * 100 : 0;
      const capacitivePercent = currentTotal > 0 ? (currentC / currentTotal) * 100 : 0;

      // Safety check - note: safety thresholds are frequency-dependent in reality
      // Our model is valid up to 2 kHz; human sensitivity to current is different at higher frequencies
      const isSafe = currentTotal < safeCurrentThreshold;

      // Return all calculated results at once
      return {
        wRC,
        omega,
        voltageRMS,
        currentR,
        currentC,
        currentTotal,
        phaseAngle,
        powerFactor,
        impedance,
        resistivePercent,
        capacitivePercent,
        isSafe,
        // Original normalized values for reference
        values: { voltage, resistance, capacitance, frequency, safeCurrentThreshold }
      };
    } catch (error) {
      console.error("Error in circuit calculations:", error);
      setHasCalculationError(true);
      return {
        wRC: 0, omega: 0, voltageRMS: 0, currentR: 0, currentC: 0, currentTotal: 0,
        phaseAngle: 0, powerFactor: 0, impedance: 0, resistivePercent: 0, capacitivePercent: 0,
        isSafe: true, values: normalizedValues,
        calculationError: error.message
      };
    }
  }, [normalizedValues]);

  // Calculate frequency response data with memoization and error handling
  const frequencyResponseData = useMemo(() => {
    const points = 100;
    const freqData = [];
    try {
      // Defensive check for normalized values
      if (!normalizedValues ||
        typeof normalizedValues.frequency !== 'number' ||
        typeof normalizedValues.resistance !== 'number' ||
        typeof normalizedValues.capacitance !== 'number') {
        console.warn('Missing normalized values for frequency response calculation');
        return { data: [], transitionFrequency: 0, currentFrequency: 0, error: 'Invalid parameters' };
      }

      // Protect against extreme values that could cause numerical issues
      const normalizedFreq = Math.max(0.001, Math.min(1e6, normalizedValues.frequency));
      const normalizedRes = Math.max(0.001, Math.min(1e12, normalizedValues.resistance));
      const normalizedCap = Math.max(1e-15, Math.min(1, normalizedValues.capacitance));

      // Safe logarithmic range calculation
      const minFreq = Math.max(0.001, normalizedFreq * 0.1);
      const maxFreq = Math.min(1e6, normalizedFreq * 10);

      for (let i = 0; i < points; i++) {
        // Logarithmic frequency scale with safety bounds
        const freq = minFreq * Math.pow(maxFreq / minFreq, i / (points - 1));
        const omega = 2 * Math.PI * freq;
        const wRCValue = omega * normalizedRes * normalizedCap;

        // Calculate impedance, current, phase angle with numerical stability protections
        const impedance = normalizedRes / Math.sqrt(1 + Math.pow(wRCValue, 2));
        const current = impedance > 0 ? 1 / impedance : 0;
        const phaseAngle = Math.atan(wRCValue) * (180 / Math.PI);

        freqData.push({
          frequency: freq,
          impedance,
          current,
          phaseAngle,
          wRC: wRCValue
        });
      }

      return {
        data: freqData,
        transitionFrequency: normalizedRes > 0 && normalizedCap > 0 ?
          1 / (2 * Math.PI * normalizedRes * normalizedCap) : 0,
        currentFrequency: normalizedFreq,
        error: null
      };
    } catch (error) {
      console.error("Error calculating frequency response:", error);
      return {
        data: [],
        transitionFrequency: 0,
        currentFrequency: 0,
        error: error.message
      };
    }
  }, [normalizedValues.frequency, normalizedValues.resistance, normalizedValues.capacitance]);

  // Helper function to determine circuit regime
  const determineRegime = () => {
    if (!isFinite(results.wRC) || isNaN(results.wRC)) return "Indeterminate";
    if (results.wRC < 1) return "Resistive";
    if (results.wRC > 1) return "Capacitive";
    return "Transition Point";
  };

  // Reset to default values (error recovery)
  const resetCircuit = useCallback(() => {
    setParams({
      voltage: defaultParams.voltage,
      resistance: defaultParams.resistance,
      capacitance: defaultParams.capacitance,
      frequency: defaultParams.frequency,
      safeCurrentThreshold: defaultParams.safeCurrentThreshold
    });

    setTextValues({
      voltage: defaultParams.voltage.value.toString(),
      resistance: defaultParams.resistance.value.toString(),
      capacitance: defaultParams.capacitance.value.toString(),
      frequency: defaultParams.frequency.value.toString(),
      safeCurrentThreshold: defaultParams.safeCurrentThreshold.value.toString()
    });

    setValidationErrors([]);
    setHasCalculationError(false);
  }, []);

  // Unified parameter update function with validation
  const updateParameter = (paramName, updates) => {
    if (!paramName || !updates) {
      console.error('Invalid parameters for updateParameter');
      return;
    }

    setParams(prev => {
      if (!prev[paramName]) {
        console.error(`Parameter '${paramName}' not found`);
        return prev;
      }

      const updatedParam = { ...prev[paramName], ...updates };

      // Update text value if value changed
      if ('value' in updates) {
        setTextValues(prev => ({
          ...prev,
          [paramName]: updates.value.toString()
        }));
      }

      // Check range constraints if unit changed
      if ('unit' in updates) {
        // Add defensive checks for system and ranges
        const system = unitSystem[paramName] || { ranges: {} };
        const range = (system.ranges && system.ranges[updates.unit])
          ? system.ranges[updates.unit]
          : [0, 1000];

        if (updatedParam.value < range[0]) {
          updatedParam.value = range[0];
          setTextValues(prev => ({
            ...prev,
            [paramName]: range[0].toString()
          }));
        } else if (updatedParam.value > range[1]) {
          updatedParam.value = range[1];
          setTextValues(prev => ({
            ...prev,
            [paramName]: range[1].toString()
          }));
        }
      }

      return { ...prev, [paramName]: updatedParam };
    });
  };

  // Handle text input change
  const handleTextChange = (paramName, text) => {
    setTextValues(prev => ({ ...prev, [paramName]: text }));

    // Handle scientific notation (e.g., "1e3")
    if (/^-?\d*\.?\d*e[+-]?\d+$/i.test(text)) {
      try {
        const value = parseFloat(text);
        if (!isNaN(value) && isFinite(value) && value >= 0) {
          updateParameter(paramName, { value });
        }
        return;
      } catch (e) {
        // Fall through to regular parsing
      }
    }

    const value = parseFloat(text);
    if (!isNaN(value) && isFinite(value) && value >= 0) {
      updateParameter(paramName, { value });
    }
  };

  return {
    params,
    textValues,
    results,
    frequencyResponseData,
    determineRegime,
    updateParameter,
    handleTextChange,
    resetCircuit,
    validationErrors,
    hasCalculationError
  };
};

// ===========================
// UI COMPONENTS - OPTIMIZED
// ===========================

// Validation error display component
const ValidationErrors = ({ errors, onReset }) => {
  if (!errors || errors.length === 0) return null;

  return (
    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-md">
      <h3 className="text-yellow-800 font-medium mb-2">Parameter Warnings:</h3>
      <ul className="list-disc pl-5 text-yellow-700 text-sm">
        {errors.map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
      <button
        onClick={onReset}
        className="mt-2 px-3 py-1 bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300 text-sm"
      >
        Reset to Defaults
      </button>
    </div>
  );
};

// Calculation error display component
const CalculationError = ({ hasError, onReset }) => {
  if (!hasError) return null;

  return (
    <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-md">
      <h3 className="text-red-800 font-medium mb-2">Calculation Error!</h3>
      <p className="text-red-700 text-sm">
        The current parameter combination is causing calculation errors. Please adjust parameters
        or reset to default values.
      </p>
      <button
        onClick={onReset}
        className="mt-2 px-3 py-1 bg-red-200 text-red-800 rounded hover:bg-red-300 text-sm"
      >
        Reset to Defaults
      </button>
    </div>
  );
};

// Optimized parameter control component
const ParameterControl = ({
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

// Optimized frequency response chart component
const FrequencyResponseChart = ({ frequencyResponseData, results }) => {
  const canvasRef = useRef(null);
  const { data, transitionFrequency, currentFrequency, error } = frequencyResponseData;
  const { wRC } = results;

  // Track rendering to avoid unnecessary redraws
  const renderCountRef = useRef(0);

  useEffect(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas || !data || data.length === 0) return;

      // Skip rendering if data hasn't changed meaningfully
      const renderCount = renderCountRef.current;
      renderCountRef.current++;

      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      const margin = { top: 30, right: 70, bottom: 50, left: 70 };
      const plotWidth = width - margin.left - margin.right;
      const plotHeight = height - margin.top - margin.bottom;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // If there's an error, show error message
      if (error) {
        ctx.fillStyle = 'red';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Error generating frequency response data', width / 2, height / 2);
        ctx.font = '12px Arial';
        ctx.fillText('Try adjusting parameters to valid ranges', width / 2, height / 2 + 20);
        return;
      }

      // Bail out if data is invalid
      if (!Array.isArray(data) || data.length === 0) {
        ctx.fillStyle = 'orange';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No frequency response data available', width / 2, height / 2);
        return;
      }

      // Handle edge cases
      if (!isFinite(currentFrequency) || isNaN(currentFrequency) ||
        data.some(d => !isFinite(d.impedance) || !isFinite(d.current) || !isFinite(d.phaseAngle))) {
        ctx.fillStyle = 'orange';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Invalid parameter values causing calculation errors', width / 2, height / 2);
        return;
      }

      // Calculate data ranges safely
      const minFreq = Math.min(...data.map(d => d.frequency));
      const maxFreq = Math.max(...data.map(d => d.frequency));

      // Protect against zero or infinity
      if (minFreq <= 0 || !isFinite(minFreq) || maxFreq <= 0 || !isFinite(maxFreq) || minFreq === maxFreq) {
        ctx.fillStyle = 'orange';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Invalid frequency range', width / 2, height / 2);
        return;
      }

      const logMin = Math.log10(minFreq);
      const logMax = Math.log10(maxFreq);

      // Calculate max values with protection against NaN or infinity
      const validCurrents = data.map(d => d.current).filter(c => isFinite(c) && !isNaN(c));
      const validImpedances = data.map(d => d.impedance).filter(i => isFinite(i) && !isNaN(i));

      const maxCurrent = validCurrents.length > 0 ?
        Math.max(...validCurrents, 0.01) * 1.2 : 0.01;
      const maxImpedance = validImpedances.length > 0 ?
        Math.max(...validImpedances, 100) * 1.2 : 100;

      // Find current operating point safely
      const opX = Math.max(margin.left, Math.min(
        margin.left + (Math.log10(currentFrequency) - logMin) / (logMax - logMin) * plotWidth,
        width - margin.right
      ));

      const currentDataPoint = data.reduce((closest, point) => {
        return Math.abs(point.frequency - currentFrequency) <
          Math.abs(closest.frequency - currentFrequency) ? point : closest;
      }, data[0]);

      // Draw chart with comprehensive error handling
      try {
        drawChartFrame(ctx, width, height, margin, logMin, logMax, minFreq, maxFreq, plotWidth);

        // Only draw curves if we have valid data
        if (validImpedances.length > 0) {
          drawImpedanceCurve(ctx, data, margin, height, logMin, logMax, plotWidth, plotHeight, maxImpedance);
        }

        if (validCurrents.length > 0) {
          drawCurrentCurve(ctx, data, margin, height, logMin, logMax, plotWidth, plotHeight, maxCurrent);
        }

        drawPhaseCurve(ctx, data, margin, height, logMin, logMax, plotWidth, plotHeight);

        // Only draw points if we have a valid current data point
        if (isFinite(currentDataPoint.impedance) && isFinite(currentDataPoint.current)) {
          drawOperatingPoint(ctx, currentDataPoint, opX, margin, height, plotWidth, plotHeight, maxCurrent, maxImpedance);
        }

        // Only draw transition if it's within range and valid
        if (isFinite(transitionFrequency) && transitionFrequency > minFreq && transitionFrequency < maxFreq) {
          drawTransitionPoint(ctx, transitionFrequency, minFreq, maxFreq, logMin, logMax, margin, height, plotWidth);
        }

        drawLegend(ctx, width, margin);

        // Add note about sine wave assumptions
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.font = 'italic 10px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('Note: All calculations assume pure sine waves in AC steady state', width - margin.right, height - 5);
      } catch (chartError) {
        console.error("Chart rendering error:", chartError);
        ctx.fillStyle = 'red';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Error rendering chart', width / 2, height / 2);
      }

    } catch (error) {
      console.error("Error in frequency response chart:", error);
    }

    // Clean up function
    return () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, [data, transitionFrequency, currentFrequency, wRC, error]);

  // Helper functions for chart drawing
  const drawChartFrame = (ctx, width, height, margin, logMin, logMax, minFreq, maxFreq, plotWidth) => {
    // Title
    ctx.fillStyle = 'black';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Frequency Response Curves', width / 2, margin.top / 2);

    // X-axis
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, height - margin.bottom);
    ctx.lineTo(width - margin.right, height - margin.bottom);
    ctx.stroke();

    // X-axis label
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Frequency (Hz)', width / 2, height - 10);

    // X-axis ticks with safety checks
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Determine reasonable tick spacing
    const logSpan = logMax - logMin;
    const maxTicks = 10; // Prevent too many ticks
    let tickStep = 1; // Default to every power of 10

    if (logSpan > maxTicks) {
      tickStep = Math.ceil(logSpan / maxTicks);
    }

    // Generate ticks safely
    for (let i = Math.ceil(logMin); i <= Math.floor(logMax); i += tickStep) {
      try {
        const tickFreq = Math.pow(10, i);
        if (!isFinite(tickFreq)) continue;

        const x = margin.left + (Math.log10(tickFreq) - logMin) / (logMax - logMin) * plotWidth;

        // Skip out-of-bounds ticks
        if (x < margin.left || x > width - margin.right) continue;

        ctx.beginPath();
        ctx.moveTo(x, height - margin.bottom);
        ctx.lineTo(x, height - margin.bottom + 5);
        ctx.stroke();

        // Format tick labels using scientific notation for extreme values
        let tickLabel = tickFreq.toString();
        if (tickFreq >= 1e6 || tickFreq <= 1e-3) {
          tickLabel = tickFreq.toExponential(0);
        } else if (tickFreq >= 1e3) {
          tickLabel = (tickFreq / 1e3).toFixed(0) + 'k';
        }

        ctx.fillText(tickLabel, x, height - margin.bottom + 8);
      } catch (error) {
        console.error("Error drawing tick:", error);
        // Continue with next tick
      }
    }

    // Left y-axis (Current/Phase)
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, height - margin.bottom);
    ctx.stroke();

    ctx.fillStyle = '#0066cc';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('Current / Phase', margin.left - 10, margin.top - 15);

    // Right y-axis (Impedance)
    ctx.beginPath();
    ctx.moveTo(width - margin.right, margin.top);
    ctx.lineTo(width - margin.right, height - margin.bottom);
    ctx.stroke();

    ctx.fillStyle = '#cc6600';
    ctx.textAlign = 'left';
    ctx.fillText('Impedance', width - margin.right + 10, margin.top - 15);
  };

  const drawImpedanceCurve = (ctx, data, margin, height, logMin, logMax, plotWidth, plotHeight, maxImpedance) => {
    if (!maxImpedance || maxImpedance <= 0) return;

    ctx.strokeStyle = '#cc6600';
    ctx.lineWidth = 2;
    ctx.beginPath();

    let isFirstPoint = true;

    for (let i = 0; i < data.length; i++) {
      try {
        const d = data[i];

        // Skip invalid data points
        if (!isFinite(d.frequency) || !isFinite(d.impedance) || d.frequency <= 0) {
          continue;
        }

        const x = margin.left + (Math.log10(d.frequency) - logMin) / (logMax - logMin) * plotWidth;
        // Limit the y value to prevent drawing outside the chart area
        const rawY = height - margin.bottom - (d.impedance / maxImpedance * plotHeight);
        const y = Math.max(margin.top, Math.min(height - margin.bottom, rawY));

        if (isFirstPoint) {
          ctx.moveTo(x, y);
          isFirstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }
      } catch (error) {
        console.error("Error drawing impedance point:", error);
        // Continue with next point
      }
    }

    if (!isFirstPoint) { // Only stroke if we've added points
      ctx.stroke();
    }

    // Label
    ctx.fillStyle = '#cc6600';
    ctx.textAlign = 'left';
    ctx.fillText('Impedance (Ω)', margin.left + plotWidth + 10, margin.top);
  };

  const drawCurrentCurve = (ctx, data, margin, height, logMin, logMax, plotWidth, plotHeight, maxCurrent) => {
    if (!maxCurrent || maxCurrent <= 0) return;

    ctx.strokeStyle = '#0066cc';
    ctx.lineWidth = 2;
    ctx.beginPath();

    let isFirstPoint = true;

    for (let i = 0; i < data.length; i++) {
      try {
        const d = data[i];

        // Skip invalid data points
        if (!isFinite(d.frequency) || !isFinite(d.current) || d.frequency <= 0) {
          continue;
        }

        const x = margin.left + (Math.log10(d.frequency) - logMin) / (logMax - logMin) * plotWidth;
        // Limit the y value to prevent drawing outside the chart area
        const rawY = height - margin.bottom - (d.current / maxCurrent * plotHeight);
        const y = Math.max(margin.top, Math.min(height - margin.bottom, rawY));

        if (isFirstPoint) {
          ctx.moveTo(x, y);
          isFirstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }
      } catch (error) {
        console.error("Error drawing current point:", error);
        // Continue with next point
      }
    }

    if (!isFirstPoint) { // Only stroke if we've added points
      ctx.stroke();
    }

    // Label
    ctx.fillStyle = '#0066cc';
    ctx.textAlign = 'right';
    ctx.fillText('Current (normalized)', margin.left - 10, margin.top);
  };

  const drawPhaseCurve = (ctx, data, margin, height, logMin, logMax, plotWidth, plotHeight) => {
    ctx.strokeStyle = '#9933cc';
    ctx.lineWidth = 2;
    ctx.beginPath();

    let isFirstPoint = true;

    for (let i = 0; i < data.length; i++) {
      try {
        const d = data[i];

        // Skip invalid data points
        if (!isFinite(d.frequency) || !isFinite(d.phaseAngle) || d.frequency <= 0) {
          continue;
        }

        const x = margin.left + (Math.log10(d.frequency) - logMin) / (logMax - logMin) * plotWidth;
        // Limit the y value to prevent drawing outside the chart area
        const rawY = height - margin.bottom - (d.phaseAngle / 90 * plotHeight);
        const y = Math.max(margin.top, Math.min(height - margin.bottom, rawY));

        if (isFirstPoint) {
          ctx.moveTo(x, y);
          isFirstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }
      } catch (error) {
        console.error("Error drawing phase point:", error);
        // Continue with next point
      }
    }

    if (!isFirstPoint) { // Only stroke if we've added points
      ctx.stroke();
    }

    // Label
    ctx.fillStyle = '#9933cc';
    ctx.textAlign = 'right';
    ctx.fillText('Phase Angle (°)', margin.left - 10, margin.top + 20);
  };

  const drawOperatingPoint = (ctx, currentDataPoint, opX, margin, height, plotWidth, plotHeight, maxCurrent, maxImpedance) => {
    try {
      // Check for valid data
      if (!isFinite(currentDataPoint.impedance) || !isFinite(currentDataPoint.current) ||
        !isFinite(currentDataPoint.phaseAngle) || !maxCurrent || !maxImpedance) {
        return;
      }

      // Impedance point
      const rawImpedanceY = height - margin.bottom - (currentDataPoint.impedance / maxImpedance * plotHeight);
      const opImpedanceY = Math.max(margin.top, Math.min(height - margin.bottom, rawImpedanceY));

      ctx.fillStyle = '#cc6600';
      ctx.beginPath();
      ctx.arc(opX, opImpedanceY, 5, 0, 2 * Math.PI);
      ctx.fill();

      // Current point
      const rawCurrentY = height - margin.bottom - (currentDataPoint.current / maxCurrent * plotHeight);
      const opCurrentY = Math.max(margin.top, Math.min(height - margin.bottom, rawCurrentY));

      ctx.fillStyle = '#0066cc';
      ctx.beginPath();
      ctx.arc(opX, opCurrentY, 5, 0, 2 * Math.PI);
      ctx.fill();

      // Phase angle point
      const rawPhaseY = height - margin.bottom - (currentDataPoint.phaseAngle / 90 * plotHeight);
      const opPhaseY = Math.max(margin.top, Math.min(height - margin.bottom, rawPhaseY));

      ctx.fillStyle = '#9933cc';
      ctx.beginPath();
      ctx.arc(opX, opPhaseY, 5, 0, 2 * Math.PI);
      ctx.fill();

      // Operating frequency line
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(opX, margin.top);
      ctx.lineTo(opX, height - margin.bottom);
      ctx.stroke();
      ctx.setLineDash([]);

      // Labels
      ctx.fillStyle = 'black';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      // Format labels for extreme values
      let freqLabel = currentFrequency.toFixed(2) + " Hz";
      if (currentFrequency >= 1e6 || currentFrequency <= 1e-3) {
        freqLabel = currentFrequency.toExponential(2) + " Hz";
      } else if (currentFrequency >= 1e3) {
        freqLabel = (currentFrequency / 1e3).toFixed(2) + " kHz";
      }

      ctx.fillText(`f = ${freqLabel}`, opX, height - margin.bottom + 15);
      ctx.fillText(`ωRC = ${currentDataPoint.wRC.toFixed(2)}`, opX, height - margin.bottom + 30);
    } catch (error) {
      console.error("Error drawing operating point:", error);
    }
  };

  const drawTransitionPoint = (ctx, transitionFreq, minFreq, maxFreq, logMin, logMax, margin, height, plotWidth) => {
    try {
      // Check for valid transition frequency
      if (!isFinite(transitionFreq) || transitionFreq <= 0) return;

      // Check if transition point is within range
      if (transitionFreq >= minFreq && transitionFreq <= maxFreq) {
        const transitionX = margin.left + (Math.log10(transitionFreq) - logMin) / (logMax - logMin) * plotWidth;

        // Ensure x is within chart bounds
        if (transitionX >= margin.left && transitionX <= (margin.left + plotWidth)) {
          ctx.strokeStyle = 'red';
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 3]);
          ctx.beginPath();
          ctx.moveTo(transitionX, margin.top);
          ctx.lineTo(transitionX, height - margin.bottom);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = 'red';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText('ωRC = 1', transitionX, margin.top - 5);
        }
      }
    } catch (error) {
      console.error("Error drawing transition point:", error);
    }
  };

  const drawLegend = (ctx, width, margin) => {
    try {
      const legendX = width - margin.right - 120;
      const legendY = margin.top + 20;

      // Impedance
      ctx.strokeStyle = '#cc6600';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(legendX, legendY);
      ctx.lineTo(legendX + 20, legendY);
      ctx.stroke();

      ctx.fillStyle = '#cc6600';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('Impedance', legendX + 25, legendY);

      // Current
      ctx.strokeStyle = '#0066cc';
      ctx.beginPath();
      ctx.moveTo(legendX, legendY + 20);
      ctx.lineTo(legendX + 20, legendY + 20);
      ctx.stroke();

      ctx.fillStyle = '#0066cc';
      ctx.fillText('Current', legendX + 25, legendY + 20);

      // Phase
      ctx.strokeStyle = '#9933cc';
      ctx.beginPath();
      ctx.moveTo(legendX, legendY + 40);
      ctx.lineTo(legendX + 20, legendY + 40);
      ctx.stroke();

      ctx.fillStyle = '#9933cc';
      ctx.fillText('Phase Angle', legendX + 25, legendY + 40);
    } catch (error) {
      console.error("Error drawing legend:", error);
    }
  };

  // Show error state if calculations failed
  if (error) {
    return (
      <div className="mb-4">
        <div className="border border-red-300 bg-red-50 p-4 rounded-md mb-4">
          <h3 className="text-red-700 font-medium mb-2">Chart Generation Error</h3>
          <p className="text-red-600 text-sm">{error}</p>
          <p className="text-red-600 text-sm mt-2">
            Try adjusting parameters to physically reasonable values.
          </p>
        </div>

        <canvas
          ref={canvasRef}
          width="700"
          height="400"
          className="border border-gray-300 rounded mx-auto"
        />
      </div>
    );
  }

  return (
    <div className="mb-4">
      <canvas
        ref={canvasRef}
        width="700"
        height="400"
        className="border border-gray-300 rounded mx-auto"
      />

      <div className="mt-2 text-sm text-center text-gray-600">
        This graph shows how the circuit responds across a frequency range. The blue line shows current,
        the orange line shows impedance, and the purple line shows phase angle. The vertical red line marks
        the transition point (ωRC = 1) between resistive and capacitive regimes.
        The current operating point is marked with colored dots on each curve.
      </div>

      <div className="mt-1 text-xs text-center text-gray-500 italic">
        Note: All calculations assume pure sine waves in AC steady state.
        Safety thresholds are valid for frequencies up to 2 kHz.
      </div>
    </div>
  );
};

// Combined current distribution and phase visualization component
const CircuitVisualizations = ({ results, determineRegime }) => {
  const { wRC, phaseAngle, powerFactor, resistivePercent, capacitivePercent } = results;

  // Create a simple visualization of where we are on the ωRC scale with safety checks
  const getRCPositionStyle = () => {
    // Handle invalid wRC
    if (!isFinite(wRC) || isNaN(wRC)) {
      return { left: '0%' };
    }

    // Convert ωRC to a position on a logarithmic scale from 0.001 to 1000
    let position = 0;
    if (wRC > 0) {
      // Calculate normalized position (0-100) on logarithmic scale
      position = (Math.log10(Math.min(Math.max(wRC, 0.001), 1000)) + 3) * (100 / 6);
      // Clamp to 0-100 range
      position = Math.max(0, Math.min(100, position));
    }
    return { left: `${position}%` };
  };

  // Check for invalid results
  const hasValidResults = isFinite(wRC) && isFinite(phaseAngle) && isFinite(powerFactor) &&
    isFinite(resistivePercent) && isFinite(capacitivePercent);

  if (!hasValidResults) {
    return (
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-md">
        <h2 className="text-lg font-semibold mb-2 text-yellow-800">Circuit Characteristics</h2>
        <p className="text-yellow-700">
          Unable to display visualizations due to calculation errors.
          Please adjust parameters to physically reasonable values.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold mb-2">Circuit Characteristics</h2>

      {/* Current Distribution */}
      <div className="mb-4">
        <div className="flex items-center mb-1">
          <div className="w-24 text-sm">Resistive:</div>
          <div className="flex-grow h-6 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${Math.min(Math.max(resistivePercent, 0), 100)}%` }}
            ></div>
          </div>
          <div className="w-24 text-sm text-right">{resistivePercent.toFixed(1)}%</div>
        </div>

        <div className="flex items-center">
          <div className="w-24 text-sm">Capacitive:</div>
          <div className="flex-grow h-6 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${Math.min(Math.max(capacitivePercent, 0), 100)}%` }}
            ></div>
          </div>
          <div className="w-24 text-sm text-right">{capacitivePercent.toFixed(1)}%</div>
        </div>
      </div>

      {/* ωRC Parameter Space */}
      <div className="mb-4">
        <h3 className="text-md font-medium mb-2">ωRC Parameter Space</h3>
        <div className="relative h-10 bg-gray-200 rounded-lg mb-1">
          <div className="absolute top-0 h-full w-1/2 border-r-2 border-red-500"></div>
          <div
            className="absolute top-0 h-full w-4 bg-blue-500 rounded-full transform -translate-x-1/2"
            style={getRCPositionStyle()}
          ></div>
          <div className="absolute top-full mt-1 left-0 text-xs">0.001 (Resistive)</div>
          <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 text-xs">1 (Transition)</div>
          <div className="absolute top-full mt-1 right-0 text-xs">1000 (Capacitive)</div>
        </div>
        <div className="text-sm text-center mt-6">
          Current ωRC = {wRC.toFixed(4)} ({determineRegime()} regime)
        </div>
      </div>

      {/* Phase Angle */}
      <h3 className="text-md font-medium mb-2">Phase Angle</h3>
      <div className="relative h-6 bg-gray-200 rounded-lg mb-1">
        <div
          className="h-full bg-purple-500 rounded-lg"
          style={{ width: `${Math.min(Math.max((phaseAngle / 90) * 100, 0), 100)}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-xs">
        <span>0° (Pure Resistive)</span>
        <span>45° (ωRC = 1)</span>
        <span>90° (Pure Capacitive)</span>
      </div>
      <div className="text-sm text-center mt-2">
        Current phase angle: {phaseAngle.toFixed(2)}°
      </div>

      {/* Power Factor */}
      <h3 className="text-md font-medium mt-4 mb-2">Power Factor</h3>
      <div className="relative h-6 bg-gray-200 rounded-lg mb-1">
        <div
          className="h-full bg-yellow-500 rounded-lg"
          style={{ width: `${Math.min(Math.max(powerFactor * 100, 0), 100)}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-xs">
        <span>0 (Pure Capacitive)</span>
        <span>0.707 (ωRC = 1)</span>
        <span>1 (Pure Resistive)</span>
      </div>
      <div className="text-sm text-center mt-2">
        Current power factor: {powerFactor.toFixed(4)}
      </div>
    </div>
  );
};

// Safety meter component
const SafetyMeter = ({ results }) => {
  const { currentTotal, isSafe, values } = results;
  const safeThreshold = values ? values.safeCurrentThreshold : 500e-6; // Default to 500μA if missing

  // Utility function for formatted current
  const formatCurrent = (amps) => {
    if (!isFinite(amps) || isNaN(amps)) return "-- A";
    if (amps >= 1) return `${amps.toFixed(2)} A`;
    if (amps >= 1e-3) return `${(amps * 1e3).toFixed(2)} mA`;
    return `${(amps * 1e6).toFixed(1)} μA`;
  };

  // Check for invalid results
  const hasValidResults = isFinite(currentTotal) && isFinite(safeThreshold);

  if (!hasValidResults) {
    return (
      <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-md">
        <h3 className="text-yellow-800 font-medium mb-2">Current Safety Analysis</h3>
        <p className="text-yellow-700 text-sm">
          Unable to determine safety status due to calculation errors.
          Please adjust parameters to physically reasonable values.
        </p>
      </div>
    );
  }

  // Safety calculation only valid up to 2 kHz
  const currentFrequency = values ? values.frequency : 0;
  const frequencyWarning = currentFrequency > 2000;

  return (
    <div>
      <h3 className="text-md font-semibold mb-2">Current Safety Analysis</h3>

      {frequencyWarning && (
        <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
          <strong>Note:</strong> Safety thresholds are only valid up to 2 kHz. Human sensitivity
          to electrical current changes at higher frequencies.
        </div>
      )}

      <div className="mb-4">
        <div className="relative h-8 bg-gradient-to-r from-green-300 via-yellow-300 to-red-500 rounded-lg mb-1">
          <div
            className="absolute top-0 h-full w-1 bg-black transform -translate-x-1/2"
            style={{ left: `${Math.min((currentTotal / safeThreshold) * 100, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs">
          <span>0 (Safe)</span>
          <span>{formatCurrent(safeThreshold * 0.2)}</span>
          <span>{formatCurrent(safeThreshold * 0.6)}</span>
          <span>{formatCurrent(safeThreshold)} (Threshold)</span>
        </div>
        <div className="text-sm text-center mt-2 font-semibold">
          Current: {formatCurrent(currentTotal)}
          <span className={`ml-2 ${isSafe ? "text-green-600" : "text-red-600"}`}>
            ({isSafe ? "SAFE" : "UNSAFE"} for selected threshold)
          </span>
        </div>
      </div>
    </div>
  );
};

// Combined results and interpretation component
const ResultsAndInterpretation = ({ results, determineRegime }) => {
  const {
    wRC,
    currentR,
    currentC,
    currentTotal,
    phaseAngle,
    powerFactor,
    resistivePercent,
    capacitivePercent,
    isSafe,
    values,
    calculationError
  } = results;

  // Default safeThreshold if values is undefined
  const safeThreshold = values ? values.safeCurrentThreshold : 500e-6; // Default to 500μA

  // Check for invalid results
  const hasValidResults = isFinite(wRC) && isFinite(currentR) && isFinite(currentC) &&
    isFinite(currentTotal) && isFinite(phaseAngle) && isFinite(powerFactor);

  if (!hasValidResults || calculationError) {
    return (
      <div className="bg-red-50 p-4 rounded-lg border border-red-300">
        <h2 className="text-lg font-semibold text-red-700 mb-4">Circuit Analysis Results</h2>
        <p className="text-red-700 mb-2">
          Unable to calculate circuit results due to parameter issues.
        </p>
        {calculationError && (
          <p className="text-red-700 text-sm font-mono p-2 bg-red-100 rounded">
            Error: {calculationError}
          </p>
        )}
        <p className="text-red-600 mt-2">
          Please adjust parameters to physically reasonable values.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Circuit Analysis Results</h2>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Parameter</th>
              <th className="p-2 text-left">Value</th>
              <th className="p-2 text-left">Interpretation</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="p-2">Normalized ωRC</td>
              <td className="p-2">{wRC.toFixed(4)}</td>
              <td className="p-2">{determineRegime()} regime</td>
            </tr>
            <tr className="border-t">
              <td className="p-2">Resistive Current</td>
              <td className="p-2">{formatValue(currentR, 'A')}</td>
              <td className="p-2">{resistivePercent.toFixed(1)}% of total</td>
            </tr>
            <tr className="border-t">
              <td className="p-2">Capacitive Current</td>
              <td className="p-2">{formatValue(currentC, 'A')}</td>
              <td className="p-2">{capacitivePercent.toFixed(1)}% of total</td>
            </tr>
            <tr className="border-t">
              <td className="p-2">Total Current</td>
              <td className="p-2">{formatValue(currentTotal, 'A')}</td>
              <td className="p-2">
                <span className={isSafe ? "text-green-600" : "text-red-600 font-bold"}>
                  {isSafe ? "Safe" : "UNSAFE"} for threshold of {formatValue(safeThreshold, 'A')}
                </span>
              </td>
            </tr>
            <tr className="border-t">
              <td className="p-2">Phase Angle</td>
              <td className="p-2">{phaseAngle.toFixed(2)}°</td>
              <td className="p-2">{phaseAngle < 45 ? "Low phase shift" : "High phase shift"}</td>
            </tr>
            <tr className="border-t">
              <td className="p-2">Power Factor</td>
              <td className="p-2">{powerFactor.toFixed(4)}</td>
              <td className="p-2">{powerFactor > 0.7 ? "Efficient power transfer" : "Poor power transfer"}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-2 text-xs text-gray-500 italic">
          Note: All calculations assume pure sine waves in AC steady state.
        </div>
      </div>


      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Circuit Analysis Interpretation</h2>

        {/* Replace these three divs with the following code */}
        <div className="flex flex-col space-y-4">
          {/* First row - side by side boxes */}
          <div className="flex space-x-4">
            <div className="bg-white p-4 rounded shadow flex-1 border-l-4 border-blue-200">
              <h3 className="font-medium mb-2">Mathematical Model:</h3>
              <p>I<sub>total</sub> = I<sub>R</sub> + I<sub>C</sub> = V<sub>rms</sub>/R + V<sub>rms</sub>·2πfC</p>
              <p>V<sub>rms</sub> = V<sub>pk-pk</sub>/(2√2) for sine waves</p>
              <p>The dimensionless parameter <span className="font-semibold">ωRC = {wRC.toFixed(2)}</span> determines circuit regime</p>
            </div>

            <div className="bg-white p-4 rounded shadow flex-1 border-l-4 border-green-200">
              <h3 className="font-medium mb-2">Regime Analysis:</h3>
              <ul className="list-disc pl-5">
                <p className="mb-2">The ωRC value determines circuit behavior:</p>
                <div className="grid grid-cols-3 gap-2 mb-2 text-sm">
                  <div className={`p-1 rounded text-center ${determineRegime() === "Resistive" ? "bg-blue-200 font-bold" : "bg-blue-50"}`}>
                    ωRC &lt; 1: Resistive
                  </div>
                  <div className={`p-1 rounded text-center ${determineRegime() === "Transition Point" ? "bg-purple-200 font-bold" : "bg-purple-50"}`}>
                    ωRC = 1: Transition
                  </div>
                  <div className={`p-1 rounded text-center ${determineRegime() === "Capacitive" ? "bg-green-200 font-bold" : "bg-green-50"}`}>
                    ωRC &gt; 1: Capacitive
                  </div>
                </div>
                <p className="font-medium">Current: {determineRegime()} mode with ωRC = {wRC.toFixed(2)}</p>
              </ul>
            </div>
          </div>

          {/* Second row - single box */}
          <div className="bg-white p-4 rounded shadow border-l-4 border-purple-200">
            <h3 className="font-medium mb-2">Human Body Application:</h3>
            <ul className="list-disc pl-5">
              <li><strong>Typical human body circuit:</strong> ωRC range of 0.001-0.2 (resistive dominated)</li>
              <li><strong>Safety threshold:</strong> {formatValue(safeThreshold, 'A')}</li>
              <li><strong>Current level:</strong> {formatValue(currentTotal, 'A')} ({isSafe ? "safe" : "UNSAFE"})</li>
              <li><strong>Recommendation:</strong> {
                isSafe
                  ? "Parameters are within safe operating range"
                  : "Reduce voltage or increase resistance to ensure safety"
              }</li>
            </ul>

            <p className="mt-3 text-sm text-gray-600 italic">
              Note: Safety thresholds are frequency-dependent in reality. The model used here
              is applicable for frequencies up to 2 kHz. At higher frequencies, human sensitivity
              to electrical current changes significantly.
            </p>
          </div>

          {/* You can add a 4th box here in the future */}
        </div>
      </div>

    </>
  );
};

// ===========================
// MAIN COMPONENT
// ===========================

const RCCircuitAnalysis = ({ initialParams = {} }) => {
  const {
    params,
    textValues,
    results,
    frequencyResponseData,
    determineRegime,
    updateParameter,
    handleTextChange,
    resetCircuit,
    validationErrors,
    hasCalculationError
  } = useRCCircuit(initialParams);

  // Check which parameters have validation errors
  const getParamValidationState = (paramName) => {
    if (!validationErrors || validationErrors.length === 0) return false;

    // Simple string matching to detect which parameters are mentioned in errors
    return validationErrors.some(error =>
      error.toLowerCase().includes(paramName.toLowerCase())
    );
  };

  return (
    <ErrorBoundary>
      <div className="p-4 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">AC Parallel RC Circuit Analysis</h1>

        {/* Error Displays */}
        <ValidationErrors
          errors={validationErrors}
          onReset={resetCircuit}
        />

        <CalculationError
          hasError={hasCalculationError}
          onReset={resetCircuit}
        />

        
<div className="bg-gray-100 p-4 rounded-lg mb-6">
  <div className="flex justify-between items-center mb-2">
    <h2 className="text-lg font-semibold">Circuit Parameters</h2>
    <button
      onClick={resetCircuit}
      className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 text-sm"
    >
      Reset Parameters
    </button>
  </div>
  
  <div className="flex flex-col md:flex-row">
    <div className="flex-grow">
      {['voltage', 'resistance', 'capacitance', 'frequency'].map(paramName => (
        <ParameterControl
          key={paramName}
          paramName={paramName}
          params={params}
          textValues={textValues}
          onParamChange={updateParameter}
          onTextChange={handleTextChange}
          hasValidationErrors={getParamValidationState(paramName)}
        />
      ))}
    </div>
    
    {/* Add Circuit Animation here */}
    <CircuitAnimation />
  </div>

  <div className="mt-2 text-xs text-gray-500 italic">
    Note: All calculations assume pure sine waves in AC steady state.
  </div>
</div>

        {/* Frequency Response Analysis */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Frequency Response Analysis</h2>
          <FrequencyResponseChart
            frequencyResponseData={frequencyResponseData}
            results={results}
          />
        </div>

        {/* Circuit Visualizations */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <CircuitVisualizations
            results={results}
            determineRegime={determineRegime}
          />
        </div>

        {/* Human Body Safety Threshold */}
        <div className="bg-blue-50 p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-2">Human Body Safety Threshold</h2>

          <ParameterControl
            paramName="safeCurrentThreshold"
            params={params}
            textValues={textValues}
            onParamChange={updateParameter}
            onTextChange={handleTextChange}
            hasValidationErrors={getParamValidationState('safeCurrentThreshold')}
          />

          <div className="text-sm mt-2 mb-4">
            <span className="text-gray-600">Standard safety threshold is 500 μA (0.5 mA) for most human body applications.</span>
          </div>

          <SafetyMeter results={results} />

          <div className="mt-2 text-xs text-gray-500 italic">
            Note: Safety thresholds are frequency-dependent in reality. The model used here is applicable
            for frequencies up to 2 kHz. At higher frequencies, human sensitivity to electrical current
            changes significantly.
          </div>
        </div>

        {/* Results and Interpretation */}
        <ResultsAndInterpretation
          results={results}
          determineRegime={determineRegime}
        />
      </div>
    </ErrorBoundary>
  );
};

export default RCCircuitAnalysis;