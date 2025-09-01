import React from 'react';
import { CircuitResults } from '../types';
import { formatValue } from '../utils';
import { calculateEffectiveWRC, determineNoiseRegime } from '../circuitCalculations';

interface ResultsAndInterpretationProps {
  results: CircuitResults;
  determineRegime: () => string;
  signalType: 'sine' | 'noise';
}

const ResultsAndInterpretation: React.FC<ResultsAndInterpretationProps> = ({ 
  results, 
  determineRegime,
  signalType
}) => {
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
    calculationError,
    noiseValidationError,
    noiseBandwidth,
    effectiveWRC  // Use the pre-calculated effectiveWRC if available
  } = results;

  // Default safeThreshold if values is undefined
  const safeThreshold = values ? values.safeCurrentThreshold : 500e-6; // Default to 500μA

  // Check for invalid results based on signal type
  const hasValidResults = signalType === 'sine'
    ? isFinite(wRC as number) && isFinite(phaseAngle as number) && 
      isFinite(powerFactor as number) && isFinite(currentR) && 
      isFinite(currentC) && isFinite(currentTotal) && !noiseValidationError
    : isFinite(currentR) && isFinite(currentC) && isFinite(currentTotal) && 
      noiseBandwidth && !noiseValidationError;

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
        {noiseValidationError && (
          <p className="text-orange-700 text-sm font-mono p-2 bg-orange-100 rounded">
            Noise Error: {noiseValidationError}
          </p>
        )}
        <p className="text-red-600 mt-2">
          Please adjust parameters to physically reasonable values.
        </p>
      </div>
    );
  }

  // Get effective ωRC for noise mode using the dedicated function
  const getNoiseEffectiveWRC = () => {
    if (!noiseBandwidth || !values) return null;
    
    // Use the pre-calculated value if available
    if (typeof effectiveWRC === 'number' && isFinite(effectiveWRC)) {
      return effectiveWRC;
    }
    
    // Otherwise calculate it using the imported function
    return calculateEffectiveWRC(
      values.resistance,
      values.capacitance,
      noiseBandwidth.min,
      noiseBandwidth.max
    );
  };
  
  // Get noise regime using the dedicated function
  const getNoiseRegime = () => {
    if (!noiseBandwidth || !values) return "Indeterminate";
    
    return determineNoiseRegime(
      values.resistance,
      values.capacitance,
      noiseBandwidth.min,
      noiseBandwidth.max
    );
  };

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
            {/* Sine-mode specific rows */}
            {signalType === 'sine' && (
              <>
                <tr className="border-t">
                  <td className="p-2">Normalized ωRC</td>
                  <td className="p-2">{(wRC as number).toFixed(4)}</td>
                  <td className="p-2">{determineRegime()} regime</td>
                </tr>
                <tr className="border-t">
                  <td className="p-2">Phase Angle</td>
                  <td className="p-2">{(phaseAngle as number).toFixed(2)}°</td>
                  <td className="p-2">{(phaseAngle as number) < 45 ? "Low phase shift" : "High phase shift"}</td>
                </tr>
                <tr className="border-t">
                  <td className="p-2">Power Factor</td>
                  <td className="p-2">{(powerFactor as number).toFixed(4)}</td>
                  <td className="p-2">{(powerFactor as number) > 0.7 ? "Efficient power transfer" : "Poor power transfer"}</td>
                </tr>
              </>
            )}

            {/* Noise-mode specific rows */}
            {signalType === 'noise' && noiseBandwidth && (
              <>
                <tr className="border-t">
                  <td className="p-2">Noise Bandwidth</td>
                  <td className="p-2">{noiseBandwidth.min.toFixed(1)} Hz - {noiseBandwidth.max.toFixed(1)} Hz</td>
                  <td className="p-2">Range: {(noiseBandwidth.max - noiseBandwidth.min).toFixed(1)} Hz</td>
                </tr>
                <tr className="border-t">
                  <td className="p-2">Effective ωRC (at center freq)</td>
                  <td className="p-2">{getNoiseEffectiveWRC()?.toFixed(4) || "--"}</td>
                  <td className="p-2">{getNoiseRegime()}</td>
                </tr>
              </>
            )}

            {/* Common rows for both modes */}
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
          </tbody>
        </table>

        <div className="mt-2 text-xs text-gray-500 italic">
          {signalType === 'sine'
            ? "Note: All calculations assume pure sine waves in AC steady state."
            : "Note: White noise calculations assume flat power spectral density across the specified band."}
        </div>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Circuit Analysis Interpretation</h2>

        <div className="flex flex-col space-y-4">
          {/* Mathematical Models Row - Side by side comparison of both models - FIXED STYLING */}
          <div className="bg-white p-4 rounded shadow border-l-4 border-blue-200">
            <h3 className="font-medium mb-4">Mathematical Models Comparison:</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sine Wave Model - Always bordered, highlighted when active */}
              <div className={`p-3 rounded border ${
                signalType === 'sine' 
                  ? 'bg-blue-50 border-blue-300' 
                  : 'border-gray-300 hover:border-blue-200'
              }`}>
                <h4 className="font-medium mb-2 text-blue-800">Sine Wave Model:</h4>
                <p>I<sub>total</sub> = √(I<sub>R</sub><sup>2</sup> + I<sub>C</sub><sup>2</sup>)</p>
                <p>I<sub>R</sub> = V<sub>RMS</sub>/R</p>
                <p>I<sub>C</sub> = V<sub>RMS</sub>·2πfC</p>
                <p>V<sub>RMS</sub> = V<sub>pk-pk</sub>/(2√2) for sine waves</p>
                <p className="mt-2">The dimensionless parameter <span className="font-semibold">ωRC = 2πfRC</span> determines circuit behavior</p>
                <p className="text-sm text-gray-600 italic mt-2">Current parameters: {signalType === 'sine' ? `ωRC = ${(wRC as number).toFixed(4)}` : 'Not in sine mode'}</p>
              </div>
              
              {/* White Noise Model - Always bordered, highlighted when active */}
              <div className={`p-3 rounded border ${
                signalType === 'noise' 
                  ? 'bg-blue-50 border-blue-300' 
                  : 'border-gray-300 hover:border-blue-200'
              }`}>
                <h4 className="font-medium mb-2 text-blue-800">White Noise Model:</h4>
                <p>I<sub>total,RMS</sub> = √(I<sub>R,RMS</sub><sup>2</sup> + I<sub>C,RMS</sub><sup>2</sup>)</p>
                <p>I<sub>R,RMS</sub> = V<sub>RMS</sub>/R</p>
                <p>I<sub>C,RMS</sub> = V<sub>RMS</sub>·2πC·√[(f<sub>max</sub><sup>3</sup> - f<sub>min</sub><sup>3</sup>)/(3·(f<sub>max</sub> - f<sub>min</sub>))]</p>
                <p className="mt-2">White noise has equal power across all frequencies (uniform power spectral density)</p>
                <p className="text-sm text-gray-600 italic mt-2">Current bandwidth: {signalType === 'noise' && noiseBandwidth ? `${noiseBandwidth.min} Hz - ${noiseBandwidth.max} Hz` : 'Not in noise mode'}</p>
              </div>
            </div>
          </div>

          {/* Regime Analysis Row */}
          <div className="flex space-x-4">
            <div className="bg-white p-4 rounded shadow flex-1 border-l-4 border-green-200">
              <h3 className="font-medium mb-2">Regime Analysis:</h3>
              <ul className="list-disc pl-5">
                <p className="mb-2">The ωRC value determines circuit behavior:</p>
                <div className="grid grid-cols-3 gap-2 mb-2 text-sm">
                  <div className={`p-1 rounded text-center ${
                    (signalType === 'sine' && determineRegime() === "Resistive") || 
                    (signalType === 'noise' && getNoiseRegime() === "Predominantly Resistive")
                    ? "bg-blue-200 font-bold" : "bg-blue-50"
                  }`}>
                    ωRC &lt; 1: Resistive
                  </div>
                  <div className={`p-1 rounded text-center ${
                    (signalType === 'sine' && determineRegime() === "Transition Point") || 
                    (signalType === 'noise' && getNoiseRegime() === "Transition Region")
                    ? "bg-purple-200 font-bold" : "bg-purple-50"
                  }`}>
                    ωRC = 1: Transition
                  </div>
                  <div className={`p-1 rounded text-center ${
                    (signalType === 'sine' && determineRegime() === "Capacitive") || 
                    (signalType === 'noise' && getNoiseRegime() === "Predominantly Capacitive")
                    ? "bg-green-200 font-bold" : "bg-green-50"
                  }`}>
                    ωRC &gt; 1: Capacitive
                  </div>
                </div>
                <p className="font-medium">
                  {signalType === 'sine' 
                    ? `Current: ${determineRegime()} mode with ωRC = ${(wRC as number).toFixed(2)}`
                    : `Current: ${getNoiseRegime()} with effective ωRC ≈ ${getNoiseEffectiveWRC()?.toFixed(2) || "--"} at center frequency`
                  }
                </p>
              </ul>
            </div>
            
            {/* Alternative analysis box - styled with border for inactive state */}
            <div className="bg-white p-4 rounded shadow flex-1 border-l-4 border-purple-200">
              {signalType === 'noise' ? (
                <>
                  <h3 className="font-medium mb-2">White Noise Analysis:</h3>
                  <div>
                    <p className="mb-2">White noise properties in RC circuits:</p>
                    <ul className="list-disc pl-5 mb-2 text-sm">
                      <li>Gaussian amplitude distribution with zero mean</li>
                      <li>Constant power spectral density across all frequencies</li>
                      <li>Higher frequencies contribute more to capacitive current due to decreasing impedance (X<sub>C</sub> = 1/(2πfC))</li>
                      <li>Bandwidth and center frequency significantly affect current distribution</li>
                    </ul>
                    <p className="font-medium mt-2">Current noise bandwidth: {noiseBandwidth?.min.toFixed(1)} Hz to {noiseBandwidth?.max.toFixed(1)} Hz</p>
                    <p className="text-sm text-gray-600 mt-1">Center frequency: {((noiseBandwidth?.min || 0) + (noiseBandwidth?.max || 0))/2} Hz</p>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="font-medium mb-2">Sine Wave Analysis:</h3>
                  <div>
                    <p className="mb-2">Sine wave characteristics in RC circuits:</p>
                    <ul className="list-disc pl-5 mb-2 text-sm">
                      <li>Predictable phase relationship between voltage and current</li>
                      <li>Phase angle (φ): {(phaseAngle as number).toFixed(2)}° ({(phaseAngle as number) < 45 ? "Resistance dominated" : "Capacitance dominated"})</li>
                      <li>Power factor: {(powerFactor as number).toFixed(4)} ({(powerFactor as number) > 0.7 ? "Efficient power transfer" : "Poor power transfer"})</li>
                      <li>Single frequency response at f = {values?.frequency.toFixed(1)} Hz</li>
                    </ul>
                    <p className="font-medium mt-2">Operating point: ωRC = {(wRC as number).toFixed(4)} ({determineRegime()} regime)</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Human Body Application Row */}
          <div className="bg-white p-4 rounded shadow border-l-4 border-purple-200">
            <h3 className="font-medium mb-2">Human Body Application:</h3>
            <ul className="list-disc pl-5">
              <li><strong>Typical human body circuit:</strong> ωRC range of 0.001-0.2 (resistive dominated)</li>
              <li><strong>User Specified Safety Threshold:</strong> {formatValue(safeThreshold, 'A')}</li>
              <li><strong>Current level:</strong> {formatValue(currentTotal, 'A')} ({isSafe ? "safe" : "UNSAFE"})</li>
              <li><strong>Recommendation:</strong> {
                isSafe
                  ? "Parameters are within safe operating range"
                  : "Reduce voltage or increase resistance to ensure safety"
              }</li>
              {signalType === 'noise' && (
                <li><strong>Note:</strong> With white noise signals, the human body response varies across the frequency band, with higher sensitivity to certain frequencies</li>
              )}
            </ul>

            <p className="mt-3 text-sm text-gray-600 italic">
              Note: User Specified Safety Thresholds are frequency-dependent in reality. The model used here
              is applicable for frequencies up to 2 kHz. At higher frequencies, human sensitivity
              to electrical current changes significantly.
            </p>

            <div className="mt-2 text-sm text-gray-700">
              The tissue is modeled as a parallel RC circuit (simplified electrical model)
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResultsAndInterpretation;