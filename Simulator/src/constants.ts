import { PhysicalLimits, UnitSystem } from './types';

// Physical validation limits for parameters
export const physicalLimits: PhysicalLimits = {
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
export const unitSystem: UnitSystem = {
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