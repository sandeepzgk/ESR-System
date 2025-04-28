// Physical validation limits for parameters
export interface PhysicalLimits {
    minFrequency: number;
    maxFrequency: number;
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
    safeCurrentThreshold: ParameterWithUnit;
    [key: string]: ParameterWithUnit;
  }
  
  // Text state interface
  export interface TextValues {
    voltage: string;
    resistance: string;
    capacitance: string;
    frequency: string;
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
    safeCurrentThreshold: number;
    [key: string]: number;
  }
  
  // Define types for calculation results
  export interface CircuitResults {
    wRC: number;
    omega: number;
    voltageRMS: number;
    currentR: number;
    currentC: number;
    currentTotal: number;
    phaseAngle: number;
    powerFactor: number;
    impedance: number;
    resistivePercent: number;
    capacitivePercent: number;
    isSafe: boolean;
    values: NormalizedValues;
    calculationError?: string;
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