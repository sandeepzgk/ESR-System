/**
 * circuitCalculations.ts
 * 
 * Unified calculation utilities for RC circuit analysis, supporting both
 * sine wave and white noise modes. This module provides dimensionally-correct
 * calculations while eliminating code duplication across the application.
 */

import { physicalLimits } from './constants';

/* ------------------- TYPE DEFINITIONS ------------------- */

/**
 * Circuit parameters for calculations
 */
export interface CircuitParameters {
  voltage: number;         // Voltage (RMS for noise, peak-to-peak for sine) in Volts
  resistance: number;      // Resistance in Ohms
  capacitance: number;     // Capacitance in Farads
  frequency?: number;      // Frequency in Hz (for sine wave mode)
  noiseMinFreq?: number;   // Minimum frequency in Hz (for noise mode)
  noiseMaxFreq?: number;   // Maximum frequency in Hz (for noise mode)
  safeCurrentThreshold?: number; // Safety threshold in Amperes
}

/**
 * Current calculation results
 */
export interface CurrentResults {
  voltageRMS: number;      // RMS voltage in Volts
  currentR: number;        // Resistive current in Amperes
  currentC: number;        // Capacitive current in Amperes
  currentTotal: number;    // Total current in Amperes
  resistivePercent: number; // Resistive current as percentage of total
  capacitivePercent: number; // Capacitive current as percentage of total
  isSafe: boolean;         // Whether current is below safe threshold
}

/**
 * Circuit regime types
 */
export type SineRegime = "Resistive" | "Capacitive" | "Transition Point" | "Indeterminate";
export type NoiseRegime = "Predominantly Resistive" | "Predominantly Capacitive" | "Transition Region" | "Indeterminate";

/* ------------------- CORE CALCULATIONS ------------------- */

/**
 * Calculate angular frequency from Hz
 * @param frequency Frequency in Hz
 * @returns Angular frequency in radians per second
 */
export const calculateOmega = (frequency: number): number => {
  return 2 * Math.PI * frequency;
};

/**
 * Calculate dimensionless ωRC parameter
 * @param frequency Frequency in Hz
 * @param resistance Resistance in Ohms
 * @param capacitance Capacitance in Farads
 * @returns Dimensionless ωRC value
 */
export const calculateWRC = (frequency: number, resistance: number, capacitance: number): number => {
  const omega = calculateOmega(frequency);
  return omega * resistance * capacitance;
};

/**
 * Calculate resistive current (same for both sine and noise modes)
 * @param voltageRMS RMS voltage in Volts
 * @param resistance Resistance in Ohms
 * @returns Resistive current in Amperes
 */
export const calculateResistiveCurrent = (voltageRMS: number, resistance: number): number => {
  if (!isFinite(voltageRMS) || !isFinite(resistance) || resistance === 0) {
    return 0;
  }
  return voltageRMS / resistance;
};

/**
 * Calculate the total current from resistive and capacitive components
 * @param currentR Resistive current in Amperes
 * @param currentC Capacitive current in Amperes
 * @returns Total current in Amperes
 */
export const calculateTotalCurrent = (currentR: number, currentC: number): number => {
  if (!isFinite(currentR) || !isFinite(currentC)) {
    return 0;
  }
  return Math.sqrt(Math.pow(currentR, 2) + Math.pow(currentC, 2));
};

/**
 * Calculate component percentage of total current
 * @param component Component current
 * @param total Total current
 * @returns Percentage (0-100)
 */
export const calculateCurrentPercentage = (component: number, total: number): number => {
  if (!isFinite(component) || !isFinite(total) || total === 0) {
    return 0;
  }
  return (component / total) * 100;
};

/**
 * Convert peak-to-peak voltage to RMS for sine wave
 * @param peakToPeakVoltage Peak-to-peak voltage in Volts
 * @returns RMS voltage in Volts
 */
export const convertPkPkToRMS = (peakToPeakVoltage: number): number => {
  return peakToPeakVoltage / (2 * Math.sqrt(2));
};

/* ------------------- SINE WAVE CALCULATIONS ------------------- */

/**
 * Calculate capacitive current for sine wave
 * @param voltageRMS RMS voltage in Volts
 * @param frequency Frequency in Hz
 * @param capacitance Capacitance in Farads
 * @returns Capacitive current in Amperes
 */
export const calculateSineCapacitiveCurrent = (
  voltageRMS: number,
  frequency: number,
  capacitance: number
): number => {
  if (!isFinite(voltageRMS) || !isFinite(frequency) || !isFinite(capacitance) ||
      voltageRMS <= 0 || frequency <= 0 || capacitance <= 0) {
    return 0;
  }
  
  const omega = calculateOmega(frequency);
  return voltageRMS * omega * capacitance;
};

/**
 * Calculate phase angle for sine wave
 * @param wRC Dimensionless ωRC value
 * @returns Phase angle in degrees
 */
export const calculatePhaseAngle = (wRC: number): number => {
  if (!isFinite(wRC)) return 0;
  return Math.atan(wRC) * (180 / Math.PI);
};

/**
 * Calculate power factor for sine wave
 * @param wRC Dimensionless ωRC value
 * @returns Power factor (dimensionless)
 */
export const calculatePowerFactor = (wRC: number): number => {
  if (!isFinite(wRC)) return 1;
  return Math.cos(Math.atan(wRC));
};

/**
 * Calculate impedance for sine wave
 * @param resistance Resistance in Ohms
 * @param wRC Dimensionless ωRC value
 * @returns Impedance in Ohms
 */
export const calculateImpedance = (resistance: number, wRC: number): number => {
  if (!isFinite(resistance) || !isFinite(wRC) || resistance <= 0) {
    return Infinity;
  }
  return resistance / Math.sqrt(1 + Math.pow(wRC, 2));
};

/**
 * Determine the circuit regime for sine wave
 * @param wRC Dimensionless ωRC value
 * @returns Regime description
 */
export const determineSineRegime = (wRC: number): SineRegime => {
  if (!isFinite(wRC)) return "Indeterminate";
  if (wRC < 1) return "Resistive";
  if (wRC > 1) return "Capacitive";
  return "Transition Point";
};

/**
 * Calculate all sine wave circuit results
 * @param params Circuit parameters
 * @returns Current calculation results with sine-specific properties
 */
export const calculateSineCircuit = (params: CircuitParameters): CurrentResults & {
  wRC: number;
  phaseAngle: number;
  powerFactor: number;
  impedance: number;
} => {
  try {
    const { voltage, resistance, capacitance, frequency, safeCurrentThreshold = Infinity } = params;
    
    if (!frequency) {
      throw new Error("Frequency must be provided for sine wave calculations");
    }
    
    // Calculate RMS voltage from peak-to-peak
    const voltageRMS = convertPkPkToRMS(voltage);
    
    // Calculate ωRC
    const wRC = calculateWRC(frequency, resistance, capacitance);
    
    // Calculate currents
    const currentR = calculateResistiveCurrent(voltageRMS, resistance);
    const currentC = calculateSineCapacitiveCurrent(voltageRMS, frequency, capacitance);
    const currentTotal = calculateTotalCurrent(currentR, currentC);
    
    // Calculate percentages
    const resistivePercent = calculateCurrentPercentage(currentR, currentTotal);
    const capacitivePercent = calculateCurrentPercentage(currentC, currentTotal);
    
    // Calculate additional sine-specific parameters
    const phaseAngle = calculatePhaseAngle(wRC);
    const powerFactor = calculatePowerFactor(wRC);
    const impedance = calculateImpedance(resistance, wRC);
    
    // Determine if current is safe
    const isSafe = currentTotal < safeCurrentThreshold;
    
    return {
      voltageRMS,
      currentR,
      currentC,
      currentTotal,
      resistivePercent,
      capacitivePercent,
      isSafe,
      wRC,
      phaseAngle,
      powerFactor,
      impedance
    };
  } catch (error) {
    console.error("Error in sine circuit calculations:", error);
    return {
      voltageRMS: 0,
      currentR: 0,
      currentC: 0,
      currentTotal: 0,
      resistivePercent: 0,
      capacitivePercent: 0,
      isSafe: true,
      wRC: 0,
      phaseAngle: 0,
      powerFactor: 1,
      impedance: Infinity
    };
  }
};

/* ------------------- NOISE CALCULATIONS ------------------- */

/**
 * Calculate capacitive current for white noise
 * 
 * This function implements the dimensionally-correct formula:
 * I_C,RMS = √[V_RMS² × (2πC)² × (f_max³ - f_min³)/(3 × (f_max - f_min))]
 * 
 * The derivation accounts for:
 * 1. White noise voltage spectral density: S_v(f) = V_RMS²/(f_max - f_min)
 * 2. Capacitor admittance: Y(f) = j2πfC
 * 3. Current spectral density: S_i(f) = S_v(f) × |Y(f)|² = S_v(f) × (2πfC)²
 * 4. Integration of S_i(f) across the frequency band
 * 
 * @param voltageRMS RMS voltage in Volts
 * @param capacitance Capacitance in Farads
 * @param fMin Minimum frequency in Hz
 * @param fMax Maximum frequency in Hz
 * @returns RMS capacitive current in Amperes
 */
export const calculateNoiseCapacitiveCurrent = (
  voltageRMS: number,
  capacitance: number,
  fMin: number,
  fMax: number
): number => {
  try {
    // Input validation
    if (fMin >= fMax || fMin <= 0 || !isFinite(fMin) || !isFinite(fMax)) {
      console.error("Invalid frequency range for noise calculation:", { fMin, fMax });
      return 0;
    }
    
    // Protect against extreme values
    if (!isFinite(voltageRMS) || !isFinite(capacitance) || 
        voltageRMS <= 0 || capacitance <= 0) {
      console.error("Invalid parameters for noise calculation:", { voltageRMS, capacitance });
      return 0;
    }
    
    // Step 1: Calculate voltage power spectral density (PSD)
    // Units: V²/Hz
    const voltagePSD = Math.pow(voltageRMS, 2) / (fMax - fMin);
    
    // Step 2: Calculate the squared capacitor admittance factor
    // Units: (S·s)² = (1/Ω·s)² 
    const twoPiSquared = Math.pow(2 * Math.PI, 2);
    const capSquared = Math.pow(capacitance, 2);
    const admittanceFactorSquared = twoPiSquared * capSquared;
    
    // Step 3: Calculate the frequency integration result
    // ∫f² df from fMin to fMax = [f³/3] from fMin to fMax = (fMax³ - fMin³)/3
    // Units: Hz³
    const fMaxCubed = Math.pow(fMax, 3);
    const fMinCubed = Math.pow(fMin, 3);
    const frequencyIntegral = (fMaxCubed - fMinCubed) / 3;
    
    // Step 4: Calculate the mean square current
    // Units: (V²/Hz) × (1/Ω·s)² × Hz³ = A²
    const currentRMSSquared = voltagePSD * admittanceFactorSquared * frequencyIntegral;
    
    // Step 5: Take square root to get RMS current
    // Units: A
    return Math.sqrt(Math.max(0, currentRMSSquared));
  } catch (error) {
    console.error("Error in capacitive noise calculation:", error);
    return 0;
  }
};

/**
 * Calculate effective ωRC for a noise band
 * This is an approximation based on the center frequency
 * 
 * @param resistance Resistance in Ohms
 * @param capacitance Capacitance in Farads
 * @param fMin Minimum frequency in Hz
 * @param fMax Maximum frequency in Hz
 * @returns Effective ωRC value (dimensionless)
 */
export const calculateEffectiveWRC = (
  resistance: number,
  capacitance: number,
  fMin: number,
  fMax: number
): number => {
  if (!isFinite(fMin) || !isFinite(fMax) || !isFinite(resistance) || !isFinite(capacitance) ||
      fMin <= 0 || fMax <= 0 || resistance <= 0 || capacitance <= 0) {
    return 0;
  }
  
  const centerFreq = (fMin + fMax) / 2;
  return calculateWRC(centerFreq, resistance, capacitance);
};

/**
 * Determine the dominant regime for noise mode
 * @param resistance Resistance in Ohms
 * @param capacitance Capacitance in Farads
 * @param fMin Minimum frequency in Hz
 * @param fMax Maximum frequency in Hz
 * @returns Noise regime description
 */
export const determineNoiseRegime = (
  resistance: number,
  capacitance: number,
  fMin: number,
  fMax: number
): NoiseRegime => {
  const effectiveWRC = calculateEffectiveWRC(resistance, capacitance, fMin, fMax);
  
  if (!isFinite(effectiveWRC)) return "Indeterminate";
  if (effectiveWRC < 0.5) return "Predominantly Resistive";
  if (effectiveWRC > 1.5) return "Predominantly Capacitive";
  return "Transition Region";
};

/**
 * Calculate all white noise circuit results
 * @param params Circuit parameters
 * @returns Current calculation results with noise-specific properties
 */
export const calculateNoiseCircuit = (params: CircuitParameters): CurrentResults & {
  effectiveWRC: number;
  noiseRegime: NoiseRegime;
  noiseBandwidth: { min: number, max: number };
} => {
  try {
    const { 
      voltage, 
      resistance, 
      capacitance, 
      noiseMinFreq, 
      noiseMaxFreq,
      safeCurrentThreshold = Infinity
    } = params;
    
    if (noiseMinFreq === undefined || noiseMaxFreq === undefined) {
      throw new Error("Noise frequency range must be provided for noise calculations");
    }
    
    // Validate noise frequencies
    if (noiseMinFreq >= noiseMaxFreq || 
        noiseMinFreq < physicalLimits.minNoiseFrequencyLimit ||
        noiseMaxFreq > physicalLimits.maxNoiseFrequencyLimit) {
      
      let errorMessage = "";
      if (noiseMinFreq >= noiseMaxFreq) {
        errorMessage = "Min frequency must be less than max frequency";
      } else if (noiseMinFreq < physicalLimits.minNoiseFrequencyLimit) {
        errorMessage = `Min frequency must be at least ${physicalLimits.minNoiseFrequencyLimit} Hz`;
      } else {
        errorMessage = `Max frequency must be at most ${physicalLimits.maxNoiseFrequencyLimit} Hz`;
      }
      
      console.error("Noise frequency validation error:", errorMessage);
      
      // Return default values with frequency range for display
      return {
        voltageRMS: voltage,
        currentR: 0,
        currentC: 0,
        currentTotal: 0,
        resistivePercent: 0,
        capacitivePercent: 0,
        isSafe: true,
        effectiveWRC: 0,
        noiseRegime: "Indeterminate",
        noiseBandwidth: { min: noiseMinFreq, max: noiseMaxFreq }
      };
    }
    
    // For noise mode, voltage is already RMS
    const voltageRMS = voltage;
    
    // Calculate currents
    const currentR = calculateResistiveCurrent(voltageRMS, resistance);
    const currentC = calculateNoiseCapacitiveCurrent(voltageRMS, capacitance, noiseMinFreq, noiseMaxFreq);
    const currentTotal = calculateTotalCurrent(currentR, currentC);
    
    // Calculate percentages
    const resistivePercent = calculateCurrentPercentage(currentR, currentTotal);
    const capacitivePercent = calculateCurrentPercentage(currentC, currentTotal);
    
    // Calculate noise-specific parameters
    const effectiveWRC = calculateEffectiveWRC(resistance, capacitance, noiseMinFreq, noiseMaxFreq);
    const noiseRegime = determineNoiseRegime(resistance, capacitance, noiseMinFreq, noiseMaxFreq);
    
    // Determine if current is safe
    const isSafe = currentTotal < safeCurrentThreshold;
    
    return {
      voltageRMS,
      currentR,
      currentC,
      currentTotal,
      resistivePercent,
      capacitivePercent,
      isSafe,
      effectiveWRC,
      noiseRegime,
      noiseBandwidth: { min: noiseMinFreq, max: noiseMaxFreq }
    };
  } catch (error) {
    console.error("Error in noise circuit calculations:", error);
    
    // Return default values
    return {
      voltageRMS: 0,
      currentR: 0,
      currentC: 0,
      currentTotal: 0,
      resistivePercent: 0,
      capacitivePercent: 0,
      isSafe: true,
      effectiveWRC: 0,
      noiseRegime: "Indeterminate",
      noiseBandwidth: { min: 0, max: 0 }
    };
  }
};

/* ------------------- UNIFIED CALCULATION API ------------------- */

/**
 * Calculate circuit results for either sine or noise mode
 * @param params Circuit parameters
 * @param signalType 'sine' or 'noise'
 * @returns Current calculation results with mode-specific properties
 */
export const calculateCircuit = (
  params: CircuitParameters,
  signalType: 'sine' | 'noise'
): CurrentResults & {
  // Sine-specific properties (optional)
  wRC?: number;
  phaseAngle?: number;
  powerFactor?: number;
  impedance?: number;
  
  // Noise-specific properties (optional)
  effectiveWRC?: number;
  noiseRegime?: NoiseRegime;
  noiseBandwidth?: { min: number, max: number };
} => {
  try {
    if (signalType === 'sine') {
      return calculateSineCircuit(params);
    } else {
      return calculateNoiseCircuit(params);
    }
  } catch (error) {
    console.error("Error in unified circuit calculation:", error);
    
    // Return safe default values
    return {
      voltageRMS: 0,
      currentR: 0,
      currentC: 0,
      currentTotal: 0,
      resistivePercent: 0,
      capacitivePercent: 0,
      isSafe: true
    };
  }
};

/* ------------------- VALIDATION UTILITIES ------------------- */

/**
 * Validate noise frequency parameters
 * @param minFreq Minimum frequency in Hz
 * @param maxFreq Maximum frequency in Hz
 * @returns Error message or undefined if valid
 */
export const validateNoiseFrequencies = (
  minFreq: number,
  maxFreq: number
): string | undefined => {
  if (minFreq >= maxFreq) {
    return "Min frequency must be less than max frequency";
  }
  
  if (minFreq < physicalLimits.minNoiseFrequencyLimit) {
    return `Min frequency must be at least ${physicalLimits.minNoiseFrequencyLimit} Hz`;
  }
  
  if (maxFreq > physicalLimits.maxNoiseFrequencyLimit) {
    return `Max frequency must be at most ${physicalLimits.maxNoiseFrequencyLimit} Hz`;
  }
  
  return undefined;
};

/**
 * Validate circuit parameters for physical limits
 * @param params Circuit parameters
 * @param signalType 'sine' or 'noise'
 * @returns Array of validation error messages
 */
export const validateCircuitParameters = (
  params: CircuitParameters,
  signalType: 'sine' | 'noise'
): string[] => {
  const { 
    voltage, 
    resistance, 
    capacitance, 
    frequency, 
    noiseMinFreq, 
    noiseMaxFreq 
  } = params;
  
  const errors: string[] = [];
  
  // Validate voltage
  if (voltage < physicalLimits.minVoltage || voltage > physicalLimits.maxVoltage || !isFinite(voltage)) {
    errors.push(`Voltage is outside physical limits (${physicalLimits.minVoltage} V to ${physicalLimits.maxVoltage} V)`);
  }
  
  // Validate resistance
  if (resistance < physicalLimits.minResistance || resistance > physicalLimits.maxResistance || !isFinite(resistance)) {
    errors.push(`Resistance is outside physical limits (${physicalLimits.minResistance} Ω to ${physicalLimits.maxResistance} Ω)`);
  }
  
  // Validate capacitance
  if (capacitance < physicalLimits.minCapacitance || capacitance > physicalLimits.maxCapacitance || !isFinite(capacitance)) {
    errors.push(`Capacitance is outside physical limits (${physicalLimits.minCapacitance} F to ${physicalLimits.maxCapacitance} F)`);
  }
  
  // Mode-specific validations
  if (signalType === 'sine') {
    if (!frequency) {
      errors.push("Frequency must be provided for sine wave mode");
    } else if (frequency < physicalLimits.minFrequency || frequency > physicalLimits.maxFrequency || !isFinite(frequency)) {
      errors.push(`Frequency is outside physical limits (${physicalLimits.minFrequency} Hz to ${physicalLimits.maxFrequency} Hz)`);
    }
    
    // Check parameter interactions for sine wave mode
    if (frequency && resistance && capacitance) {
      const wRC = calculateWRC(frequency, resistance, capacitance);
      
      if (wRC < 1e-10) {
        errors.push("Circuit is extremely resistive (ωRC ≈ 0). Capacitor has negligible effect.");
      }
      
      if (wRC > 1e10) {
        errors.push("Circuit is extremely capacitive (ωRC ≫ 1). Resistor has negligible effect.");
      }
      
      if (!isFinite(wRC)) {
        errors.push("Invalid parameter combination causing calculation errors.");
      }
    }
  } else {
    // Noise mode validations
    if (noiseMinFreq === undefined || noiseMaxFreq === undefined) {
      errors.push("Noise frequency range must be provided for noise mode");
    } else {
      const noiseFreqError = validateNoiseFrequencies(noiseMinFreq, noiseMaxFreq);
      if (noiseFreqError) {
        errors.push(noiseFreqError);
      }
    }
  }
  
  return errors;
};