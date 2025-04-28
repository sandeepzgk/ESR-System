import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ParameterState, 
  TextValues, 
  ParameterWithUnit, 
  NormalizedValues, 
  CircuitResults, 
  FrequencyResponseData,
  FrequencyDataPoint
} from '../types';
import { unitSystem } from '../constants';
import { validateCircuitParameters } from '../utils';

// Core RC Circuit Hook with optimized calculation strategy
const useRCCircuit = (initialParams: Partial<ParameterState> = {}) => {
  // Default parameters with units - wrapped in useMemo to avoid dependency issues
  const defaultParams = useMemo<ParameterState>(() => ({
    voltage: { value: 1, unit: 'V' },
    resistance: { value: 5, unit: 'kΩ' },
    capacitance: { value: 50, unit: 'nF' },
    frequency: { value: 1000, unit: 'Hz' },
    safeCurrentThreshold: { value: 500, unit: 'μA' }
  }), []);

  // Merge provided parameters with defaults
  const initialState = useMemo(() => ({ ...defaultParams, ...initialParams }), [defaultParams, initialParams]);

  // State for circuit parameters
  const [params, setParams] = useState<ParameterState>({
    voltage: initialState.voltage,
    resistance: initialState.resistance,
    capacitance: initialState.capacitance,
    frequency: initialState.frequency,
    safeCurrentThreshold: initialState.safeCurrentThreshold
  });

  // Text input state
  const [textValues, setTextValues] = useState<TextValues>({
    voltage: initialState.voltage.value.toString(),
    resistance: initialState.resistance.value.toString(),
    capacitance: initialState.capacitance.value.toString(),
    frequency: initialState.frequency.value.toString(),
    safeCurrentThreshold: initialState.safeCurrentThreshold.value.toString()
  });

  // Error state for validation feedback
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [hasCalculationError, setHasCalculationError] = useState(false);

  // Get normalized value (convert to base units)
  const getNormalizedValue = useCallback((paramName: string): number => {
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
  }, [params]);

  // All normalized parameter values computed at once
  const normalizedValues = useMemo<NormalizedValues>(() => ({
    voltage: getNormalizedValue('voltage'),
    resistance: getNormalizedValue('resistance'),
    capacitance: getNormalizedValue('capacitance'),
    frequency: getNormalizedValue('frequency'),
    safeCurrentThreshold: getNormalizedValue('safeCurrentThreshold')
  }), [getNormalizedValue]); // Remove params from dependencies since getNormalizedValue already has it

  // Validate parameters
  useEffect(() => {
    const validation = validateCircuitParameters(normalizedValues);
    setValidationErrors(validation.errors);
  }, [normalizedValues]);

  // Calculate all circuit results in one go using memoization
  const results = useMemo<CircuitResults>(() => {
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
        calculationError: error instanceof Error ? error.message : String(error)
      };
    }
  }, [normalizedValues]);

  // Calculate frequency response data with memoization and error handling
  const frequencyResponseData = useMemo<FrequencyResponseData>(() => {
    const points = 100;
    const freqData: FrequencyDataPoint[] = [];
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
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }, [normalizedValues]);

  // Helper function to determine circuit regime
  const determineRegime = useCallback((): string => {
    if (!isFinite(results.wRC) || isNaN(results.wRC)) return "Indeterminate";
    if (results.wRC < 1) return "Resistive";
    if (results.wRC > 1) return "Capacitive";
    return "Transition Point";
  }, [results.wRC]);

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
  }, [defaultParams]);

  // Unified parameter update function with validation
  const updateParameter = useCallback((paramName: string, updates: Partial<ParameterWithUnit>): void => {
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
          [paramName]: updates.value!.toString()
        }));
      }

      // Check range constraints if unit changed
      if ('unit' in updates) {
        // Add defensive checks for system and ranges
        const system = unitSystem[paramName] || { ranges: {} };
        const range = (system.ranges && system.ranges[updates.unit!])
          ? system.ranges[updates.unit!]
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
  }, []);

  // Handle text input change
  const handleTextChange = useCallback((paramName: string, text: string): void => {
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
  }, [updateParameter]);

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

export default useRCCircuit;