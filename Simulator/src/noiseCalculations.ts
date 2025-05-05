/**
 * Utility functions for RC circuit noise calculations
 * 
 * Contains dimensionally-correct calculations for white noise responses
 * in RC circuits, properly accounting for frequency-dependent behavior
 */

/**
 * Calculates the RMS capacitive current in response to white noise
 * across a specified frequency band
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
 * All quantities properly maintain their units throughout the calculation:
 * - V_RMS: Volts
 * - capacitance: Farads
 * - frequencies: Hertz
 * - Returns: Amperes
 * 
 * @param voltageRMS RMS voltage of the white noise (V)
 * @param capacitance Capacitance (F)
 * @param fMin Minimum frequency of the noise band (Hz)
 * @param fMax Maximum frequency of the noise band (Hz)
 * @returns RMS capacitive current (A)
 */
export const calculateCapacitiveNoiseResponse = (
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
        console.error("Invalid parameters for noise calculation:", 
          { voltageRMS, capacitance });
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
   * Calculates the combined RMS current through a parallel RC circuit
   * when excited by white noise
   * 
   * @param voltageRMS RMS voltage of the white noise (V)
   * @param resistance Resistance (Ω)
   * @param capacitance Capacitance (F)
   * @param fMin Minimum frequency of the noise band (Hz)
   * @param fMax Maximum frequency of the noise band (Hz)
   * @returns Object containing resistive, capacitive, and total RMS currents (A)
   */
  export const calculateRCNoiseResponse = (
    voltageRMS: number,
    resistance: number,
    capacitance: number,
    fMin: number,
    fMax: number
  ): { currentR: number; currentC: number; currentTotal: number; } => {
    try {
      // Calculate resistive current (same as for sine wave)
      const currentR = voltageRMS / resistance;
      
      // Calculate capacitive current using the corrected formula
      const currentC = calculateCapacitiveNoiseResponse(
        voltageRMS,
        capacitance,
        fMin,
        fMax
      );
      
      // Calculate total RMS current using Pythagorean sum
      // (resistive and capacitive currents are orthogonal)
      const currentTotal = Math.sqrt(Math.pow(currentR, 2) + Math.pow(currentC, 2));
      
      return { currentR, currentC, currentTotal };
    } catch (error) {
      console.error("Error in RC noise calculation:", error);
      return { currentR: 0, currentC: 0, currentTotal: 0 };
    }
  };
  
  /**
   * Calculates the "effective" ωRC value for a noise band
   * This is an approximation based on the center frequency
   * 
   * @param resistance Resistance (Ω)
   * @param capacitance Capacitance (F)
   * @param fMin Minimum frequency of the noise band (Hz)
   * @param fMax Maximum frequency of the noise band (Hz)
   * @returns Effective ωRC value (dimensionless)
   */
  export const calculateEffectiveWRC = (
    resistance: number,
    capacitance: number,
    fMin: number,
    fMax: number
  ): number => {
    const centerFreq = (fMin + fMax) / 2;
    const omega = 2 * Math.PI * centerFreq;
    return omega * resistance * capacitance;
  };
  
  /**
   * Determines the dominant regime of an RC circuit under white noise
   * 
   * @param resistance Resistance (Ω)
   * @param capacitance Capacitance (F)
   * @param fMin Minimum frequency of the noise band (Hz)
   * @param fMax Maximum frequency of the noise band (Hz)
   * @returns String identifying the dominant regime
   */
  export const determineNoiseRegime = (
    resistance: number,
    capacitance: number,
    fMin: number,
    fMax: number
  ): string => {
    const effectiveWRC = calculateEffectiveWRC(resistance, capacitance, fMin, fMax);
    
    if (effectiveWRC < 0.5) return "Predominantly Resistive";
    if (effectiveWRC > 1.5) return "Predominantly Capacitive";
    return "Transition Region";
  };