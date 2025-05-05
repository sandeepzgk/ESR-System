// Physical validation limits for parameters
export interface PhysicalLimits {
  minFrequency: number;
  maxFrequency: number;
  minNoiseFrequencyLimit: number;  // Added for noise mode
  maxNoiseFrequencyLimit: number;  // Added for noise mode
  minResistance: number;
  maxResistance: number;
  minCapacitance: number;
  maxCapacitance: number;
  minVoltage: number;
  maxVoltage: number;
}

// Define interfaces for unit system
export interface UnitRange {
  [key: string]: [number, number];
}

export interface UnitFactors {
  [key: string]: number;
}

export interface UnitDefinition {
  units: string[];
  factors: UnitFactors;
  ranges: UnitRange;
}

export interface UnitSystem {
  voltage: UnitDefinition;
  resistance: UnitDefinition;
  capacitance: UnitDefinition;
  frequency: UnitDefinition;
  noiseMinFrequency: UnitDefinition;  // Added for noise mode
  noiseMaxFrequency: UnitDefinition;  // Added for noise mode
  safeCurrentThreshold: UnitDefinition;
  [key: string]: UnitDefinition;
}

// Define a type for parameter values with units
export interface ParameterWithUnit {
  value: number;
  unit: string;
}

// Parameter state interface for the RC circuit hook
export interface ParameterState {
  voltage: ParameterWithUnit;
  resistance: ParameterWithUnit;
  capacitance: ParameterWithUnit;
  frequency: ParameterWithUnit;
  noiseMinFrequency: ParameterWithUnit;  // Added for noise mode
  noiseMaxFrequency: ParameterWithUnit;  // Added for noise mode
  safeCurrentThreshold: ParameterWithUnit;
  signalType: 'sine' | 'noise';  // Added to select mode
  [key: string]: ParameterWithUnit | 'sine' | 'noise';
}

// Text state interface
export interface TextValues {
  voltage: string;
  resistance: string;
  capacitance: string;
  frequency: string;
  noiseMinFrequency: string;  // Added for noise mode
  noiseMaxFrequency: string;  // Added for noise mode
  safeCurrentThreshold: string;
  [key: string]: string;
}

// Define interface for circuit parameters validation
export interface CircuitParametersValidation {
  isValid: boolean;
  errors: string[];
}

export interface NormalizedValues {
  voltage: number;
  resistance: number;
  capacitance: number;
  frequency: number;
  noiseMinFrequency: number;  // Added for noise mode
  noiseMaxFrequency: number;  // Added for noise mode
  safeCurrentThreshold: number;
  [key: string]: number;
}

// Define types for calculation results
export interface CircuitResults {
  wRC?: number;  // Made optional for noise mode
  omega?: number;  // Made optional for noise mode
  voltageRMS: number;
  currentR: number;  // Used in both modes
  currentC: number;  // Used in both modes
  currentTotal: number;  // Used in both modes
  phaseAngle?: number;  // Made optional for noise mode
  powerFactor?: number;  // Made optional for noise mode
  impedance?: number;  // Made optional for noise mode
  resistivePercent: number;  // Used in both modes
  capacitivePercent: number;  // Used in both modes
  isSafe: boolean;  // Used in both modes
  values: NormalizedValues;
  calculationError?: string;
  noiseValidationError?: string;  // Added for noise mode validation
  noiseBandwidth?: { min: number, max: number };  // Added for noise mode
  effectiveWRC?: number;  // Add this line to fix the error
}

// Define types for frequency response data
export interface FrequencyDataPoint {
  frequency: number;
  impedance: number;
  current: number;
  phaseAngle: number;
  wRC: number;
}

export interface FrequencyResponseData {
  data: FrequencyDataPoint[];
  transitionFrequency: number;
  currentFrequency: number;
  error: string | null;
}