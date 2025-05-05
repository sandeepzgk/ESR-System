/**
 * useRCCircuit.ts
 * 
 * React hook for RC circuit analysis, using the centralized calculation module
 * for all circuit-related calculations.
 */

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
import { unitSystem, physicalLimits } from '../constants';
import { formatValue } from '../utils';
import * as CircuitCalc from '../circuitCalculations';

// Core RC Circuit Hook with optimized calculation strategy
const useRCCircuit = (initialParams: Partial<ParameterState> = {}) => {
  // Default parameters with units - wrapped in useMemo to avoid dependency issues
  const defaultParams = useMemo<ParameterState>(() => ({
    voltage: { value: 1, unit: 'V' },
    resistance: { value: 50, unit: 'kΩ' },
    capacitance: { value: 50, unit: 'nF' },
    frequency: { value: 50, unit: 'Hz' },
    noiseMinFrequency: { value: 20, unit: 'Hz' },
    noiseMaxFrequency: { value: 1990, unit: 'Hz' },
    safeCurrentThreshold: { value: 500, unit: 'μA' },
    signalType: 'sine'
  }), []);

  // Merge provided parameters with defaults
  const initialState = useMemo(() => ({ ...defaultParams, ...initialParams }), [defaultParams, initialParams]);

  // State for circuit parameters
  const [params, setParams] = useState<ParameterState>({
    voltage: initialState.voltage,
    resistance: initialState.resistance,
    capacitance: initialState.capacitance,
    frequency: initialState.frequency,
    noiseMinFrequency: initialState.noiseMinFrequency,
    noiseMaxFrequency: initialState.noiseMaxFrequency,
    safeCurrentThreshold: initialState.safeCurrentThreshold,
    signalType: initialState.signalType
  });

  // Text input state
  const [textValues, setTextValues] = useState<TextValues>({
    voltage: initialState.voltage.value.toString(),
    resistance: initialState.resistance.value.toString(),
    capacitance: initialState.capacitance.value.toString(),
    frequency: initialState.frequency.value.toString(),
    noiseMinFrequency: initialState.noiseMinFrequency.value.toString(),
    noiseMaxFrequency: initialState.noiseMaxFrequency.value.toString(),
    safeCurrentThreshold: initialState.safeCurrentThreshold.value.toString()
  });

  // Error state for validation feedback
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [hasCalculationError, setHasCalculationError] = useState(false);

  // Get normalized value (convert to base units)
  const getNormalizedValue = useCallback((paramName: string): number => {
    // Skip signalType as it's not a parameter with units
    if (paramName === 'signalType') {
      return 0;
    }

    if (!params[paramName]) {
      console.error(`Parameter '${paramName}' not found in params`);
      return 0;
    }

    const paramWithUnit = params[paramName] as ParameterWithUnit;
    const { value, unit } = paramWithUnit;

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
    noiseMinFrequency: getNormalizedValue('noiseMinFrequency'),
    noiseMaxFrequency: getNormalizedValue('noiseMaxFrequency'),
    safeCurrentThreshold: getNormalizedValue('safeCurrentThreshold')
  }), [getNormalizedValue]);

  // Validate parameters using the centralized validation function
  useEffect(() => {
    const signalType = params.signalType;
    
    // Create circuit parameters for validation
    const circuitParams: CircuitCalc.CircuitParameters = {
      voltage: normalizedValues.voltage,
      resistance: normalizedValues.resistance,
      capacitance: normalizedValues.capacitance,
      frequency: normalizedValues.frequency,
      noiseMinFreq: normalizedValues.noiseMinFrequency,
      noiseMaxFreq: normalizedValues.noiseMaxFrequency,
      safeCurrentThreshold: normalizedValues.safeCurrentThreshold
    };
    
    // Use the centralized validation function
    const errors = CircuitCalc.validateCircuitParameters(circuitParams, signalType);
    setValidationErrors(errors);
  }, [normalizedValues, params.signalType]);

  // Calculate all circuit results using the centralized calculation functions
  const results = useMemo<CircuitResults>(() => {
    try {
      setHasCalculationError(false);
      
      // Create circuit parameters for calculation
      const circuitParams: CircuitCalc.CircuitParameters = {
        voltage: normalizedValues.voltage,
        resistance: normalizedValues.resistance,
        capacitance: normalizedValues.capacitance,
        frequency: normalizedValues.frequency,
        noiseMinFreq: normalizedValues.noiseMinFrequency,
        noiseMaxFreq: normalizedValues.noiseMaxFrequency,
        safeCurrentThreshold: normalizedValues.safeCurrentThreshold
      };
      
      // Get signal type
      const signalType = params.signalType;
      
      // Use the centralized calculation function
      const calculationResults = CircuitCalc.calculateCircuit(circuitParams, signalType);
      
      // Map the calculation results to the CircuitResults type expected by the UI
      if (signalType === 'sine') {
        return {
          wRC: calculationResults.wRC,
          omega: CircuitCalc.calculateOmega(normalizedValues.frequency),
          voltageRMS: calculationResults.voltageRMS,
          currentR: calculationResults.currentR,
          currentC: calculationResults.currentC,
          currentTotal: calculationResults.currentTotal,
          phaseAngle: calculationResults.phaseAngle,
          powerFactor: calculationResults.powerFactor,
          impedance: calculationResults.impedance,
          resistivePercent: calculationResults.resistivePercent,
          capacitivePercent: calculationResults.capacitivePercent,
          isSafe: calculationResults.isSafe,
          values: normalizedValues,
          noiseValidationError: undefined,
          noiseBandwidth: undefined
        };
      } else {
        return {
          voltageRMS: calculationResults.voltageRMS,
          currentR: calculationResults.currentR,
          currentC: calculationResults.currentC,
          currentTotal: calculationResults.currentTotal,
          effectiveWRC: calculationResults.effectiveWRC,
          resistivePercent: calculationResults.resistivePercent,
          capacitivePercent: calculationResults.capacitivePercent,
          isSafe: calculationResults.isSafe,
          values: normalizedValues,
          noiseBandwidth: calculationResults.noiseBandwidth,
          noiseValidationError: undefined,
          calculationError: undefined
        };
      }
    } catch (error) {
      console.error("Error in circuit calculations:", error);
      setHasCalculationError(true);
      return {
        wRC: undefined,
        omega: undefined,
        voltageRMS: 0,
        currentR: 0,
        currentC: 0,
        currentTotal: 0,
        phaseAngle: undefined,
        powerFactor: undefined,
        impedance: undefined,
        resistivePercent: 0,
        capacitivePercent: 0,
        isSafe: true,
        values: normalizedValues,
        calculationError: error instanceof Error ? error.message : String(error),
        noiseValidationError: undefined
      };
    }
  }, [normalizedValues, params.signalType]);

  // Calculate frequency response data for sine mode
  const frequencyResponseData = useMemo<FrequencyResponseData>(() => {
    // Only calculate frequency response for sine mode
    if (params.signalType === 'noise') {
      return {
        data: [],
        transitionFrequency: 0,
        currentFrequency: 0,
        error: 'Frequency response not applicable for noise mode'
      };
    }

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

      // Flag to track if we've added the exact current frequency
      let exactFreqAdded = false;

      for (let i = 0; i < points; i++) {
        // Logarithmic frequency scale with safety bounds
        const freq = minFreq * Math.pow(maxFreq / minFreq, i / (points - 1));

        // Check if this frequency is very close to the normalized frequency
        // If so, use the exact normalized frequency instead
        const useFreq = Math.abs(freq - normalizedFreq) < normalizedFreq * 0.01
          ? normalizedFreq
          : freq;

        // Mark if we've added the exact frequency
        if (useFreq === normalizedFreq) {
          exactFreqAdded = true;
        }

        // Use centralized calculation functions
        const wRCValue = CircuitCalc.calculateWRC(useFreq, normalizedRes, normalizedCap);
        const impedance = CircuitCalc.calculateImpedance(normalizedRes, wRCValue);
        const current = impedance > 0 ? 1 / impedance : 0;
        const phaseAngle = CircuitCalc.calculatePhaseAngle(wRCValue);

        freqData.push({
          frequency: useFreq,
          impedance,
          current,
          phaseAngle,
          wRC: wRCValue
        });
      }

      // If we haven't added the exact frequency, add it now
      const EPSILON = 1e-12;
      if (!exactFreqAdded) {
        const wRCValue = CircuitCalc.calculateWRC(normalizedFreq, normalizedRes, normalizedCap);
        const impedance = CircuitCalc.calculateImpedance(normalizedRes, wRCValue);
        const current = impedance > 0 ? 1 / impedance : 0;
        const phaseAngle = CircuitCalc.calculatePhaseAngle(wRCValue);

        freqData.push({
          frequency: normalizedFreq,
          impedance,
          current,
          phaseAngle,
          wRC: wRCValue
        });

        // Sort the data points by frequency to maintain order
        freqData.sort((a, b) => a.frequency - b.frequency);
      }

      return {
        data: freqData,
        // Calculate transition frequency (where ωRC = 1)
        transitionFrequency: (normalizedRes > EPSILON && normalizedCap > EPSILON) 
          ? 1 / (2 * Math.PI * normalizedRes * normalizedCap) 
          : 0,
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
  }, [normalizedValues, params.signalType]);

  // Helper function to determine circuit regime using the centralized functions
  const determineRegime = useCallback((): string => {
    if (params.signalType === 'sine') {
      // For sine mode, use the wRC from results
      if (!isFinite(results.wRC as number) || isNaN(results.wRC as number)) {
        return "Indeterminate";
      }
      return CircuitCalc.determineSineRegime(results.wRC as number);
    } else {
      // For noise mode, use the effective wRC with noise-specific thresholds
      if (!results.noiseBandwidth) {
        return "Indeterminate";
      }
      return CircuitCalc.determineNoiseRegime(
        normalizedValues.resistance,
        normalizedValues.capacitance,
        results.noiseBandwidth.min,
        results.noiseBandwidth.max
      );
    }
  }, [results, params.signalType, normalizedValues]);

  // Toggle signal type between sine and noise
  const toggleSignalType = useCallback(() => {
    setParams(prev => ({
      ...prev,
      signalType: prev.signalType === 'sine' ? 'noise' : 'sine'
    }));
  }, []);

  // Reset to default values (error recovery)
  const resetCircuit = useCallback(() => {
    setParams({
      voltage: defaultParams.voltage,
      resistance: defaultParams.resistance,
      capacitance: defaultParams.capacitance,
      frequency: defaultParams.frequency,
      noiseMinFrequency: defaultParams.noiseMinFrequency,
      noiseMaxFrequency: defaultParams.noiseMaxFrequency,
      safeCurrentThreshold: defaultParams.safeCurrentThreshold,
      signalType: defaultParams.signalType
    });

    setTextValues({
      voltage: defaultParams.voltage.value.toString(),
      resistance: defaultParams.resistance.value.toString(),
      capacitance: defaultParams.capacitance.value.toString(),
      frequency: defaultParams.frequency.value.toString(),
      noiseMinFrequency: defaultParams.noiseMinFrequency.value.toString(),
      noiseMaxFrequency: defaultParams.noiseMaxFrequency.value.toString(),
      safeCurrentThreshold: defaultParams.safeCurrentThreshold.value.toString()
    });

    setValidationErrors([]);
    setHasCalculationError(false);
  }, [defaultParams]);

  // Split the updateParameter function into two separate functions to fix type issues
  const updateSignalType = useCallback((newSignalType: 'sine' | 'noise') => {
    setParams(prev => ({
      ...prev,
      signalType: newSignalType
    }));
  }, []);

  // Update a parameter with a unit
  const updateParameterWithUnit = useCallback((paramName: string, updates: Partial<ParameterWithUnit>): void => {
    if (!paramName) {
      console.error('Invalid parameter name for updateParameter');
      return;
    }

    setParams(prev => {
      if (!prev[paramName]) {
        console.error(`Parameter '${paramName}' not found`);
        return prev;
      }

      const paramWithUnit = prev[paramName] as ParameterWithUnit;
      const updatedParam = { ...paramWithUnit, ...updates };

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

  // Combined updateParameter function that routes to the appropriate function based on parameter
  const updateParameter = useCallback((paramName: string, updates: Partial<ParameterWithUnit> | 'sine' | 'noise'): void => {
    if (paramName === 'signalType') {
      updateSignalType(updates as 'sine' | 'noise');
    } else {
      updateParameterWithUnit(paramName, updates as Partial<ParameterWithUnit>);
    }
  }, [updateSignalType, updateParameterWithUnit]);

  // Handle text input change
  const handleTextChange = useCallback((paramName: string, text: string): void => {
    setTextValues(prev => ({ ...prev, [paramName]: text }));

    // Handle scientific notation (e.g., "1e3")
    if (/^-?\d*\.?\d*e[+-]?\d+$/i.test(text)) {
      try {
        const value = parseFloat(text);
        if (!isNaN(value) && isFinite(value) && value >= 0) {
          updateParameterWithUnit(paramName, { value });
        }
        return;
      } catch (e) {
        // Fall through to regular parsing
      }
    }

    const value = parseFloat(text);
    if (!isNaN(value) && isFinite(value) && value >= 0) {
      updateParameterWithUnit(paramName, { value });
    }
  }, [updateParameterWithUnit]);

  return {
    params,
    textValues,
    results,
    frequencyResponseData,
    determineRegime,
    updateParameter,
    handleTextChange,
    resetCircuit,
    toggleSignalType,
    validationErrors,
    hasCalculationError
  };
};

export default useRCCircuit;