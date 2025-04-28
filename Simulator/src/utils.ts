import { physicalLimits } from './constants';
import { NormalizedValues, CircuitParametersValidation } from './types';

// Unified format function for all units
export const formatValue = (value: number, unit: string): string => {
  if (value === 0) return `0 ${unit}`;
  if (!isFinite(value) || isNaN(value)) return `-- ${unit}`;

  // Common prefixes for both large and small values
  const prefixes: Record<string, string> = {
    '-12': 'p', '-9': 'n', '-6': 'μ', '-3': 'm',
    '0': '', '3': 'k', '6': 'M', '9': 'G'
  };

  // Scale value to appropriate prefix
  const scale = Math.floor(Math.log10(Math.abs(value)) / 3) * 3;
  const scaledValue = value / Math.pow(10, scale);
  const prefix = prefixes[scale.toString()] || '';

  return `${scaledValue.toFixed(2)} ${prefix}${unit}`;
};

// Format with scientific notation for extreme values
export const formatValueScientific = (value: number, unit: string): string => {
  if (value === 0) return `0 ${unit}`;
  if (!isFinite(value) || isNaN(value)) return `-- ${unit}`;

  if (Math.abs(value) < 0.01 || Math.abs(value) > 10000) {
    return `${value.toExponential(2)} ${unit}`;
  }

  return `${value.toFixed(2)} ${unit}`;
};

// Validates if parameters make physical sense together
export const validateCircuitParameters = (normalizedValues: NormalizedValues): CircuitParametersValidation => {
  const { voltage, resistance, capacitance, frequency } = normalizedValues;
  const errors: string[] = [];

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

// Helper function to check parameter validation state
export const getParamValidationState = (validationErrors: string[], paramName: string): boolean => {
  if (!validationErrors || validationErrors.length === 0) return false;

  // Simple string matching to detect which parameters are mentioned in errors
  return validationErrors.some(error => {
    // Ensure error is a string before calling toLowerCase
    if (typeof error === 'string') {
      return error.toLowerCase().includes(paramName.toLowerCase());
    }
    return false;
  });
};