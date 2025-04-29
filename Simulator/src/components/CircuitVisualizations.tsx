import React from 'react';
import { CircuitResults } from '../types';

// Combined current distribution and phase visualization component
interface CircuitVisualizationsProps {
  results: CircuitResults;
  determineRegime: () => string;
  signalType: 'sine' | 'noise';
}

const CircuitVisualizations: React.FC<CircuitVisualizationsProps> = ({ 
  results, 
  determineRegime,
  signalType 
}) => {
  const { 
    wRC, 
    phaseAngle, 
    powerFactor, 
    resistivePercent, 
    capacitivePercent,
    noiseBandwidth
  } = results;

  // Create a simple visualization of where we are on the ωRC scale with safety checks
  const getRCPositionStyle = (): React.CSSProperties => {
    // Handle invalid wRC
    if (!isFinite(wRC as number) || isNaN(wRC as number)) {
      return { left: '0%' };
    }

    // Convert ωRC to a position on a logarithmic scale from 0.001 to 1000
    let position = 0;
    if ((wRC as number) > 0) {
      // Calculate normalized position (0-100) on logarithmic scale
      position = (Math.log10(Math.min(Math.max(wRC as number, 0.001), 1000)) + 3) * (100 / 6);
      // Clamp to 0-100 range
      position = Math.max(0, Math.min(100, position));
    }
    return { left: `${position}%` };
  };

  // Check for invalid results for sine wave mode
  const hasValidSineResults = signalType === 'sine' && 
    isFinite(wRC as number) && 
    isFinite(phaseAngle as number) && 
    isFinite(powerFactor as number) &&
    isFinite(resistivePercent) && 
    isFinite(capacitivePercent);

  // Check for valid noise mode results
  const hasValidNoiseResults = signalType === 'noise' && 
    noiseBandwidth && 
    isFinite(resistivePercent) && 
    isFinite(capacitivePercent);

  // If neither mode has valid results, show error
  if (!hasValidSineResults && !hasValidNoiseResults) {
    return (
      <div className="mb-2 p-3 bg-yellow-50 border border-yellow-300 rounded-md">
        <h2 className="text-lg font-semibold mb-1 text-yellow-800">Circuit Characteristics</h2>
        <p className="text-yellow-700">
          Unable to display visualizations due to calculation errors.
          Please adjust parameters to physically reasonable values.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-2">
      <h2 className="text-lg font-semibold mb-2">Circuit Characteristics</h2>

      {/* Current Distribution - shown for both modes */}
      <div className="mb-2">
        <div className="flex items-center mb-1">
          <div className="w-24 text-sm">Resistive:</div>
          <div className="flex-grow h-5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${Math.min(Math.max(resistivePercent, 0), 100)}%` }}
            ></div>
          </div>
          <div className="w-24 text-sm text-right">{resistivePercent.toFixed(1)}%</div>
        </div>

        <div className="flex items-center">
          <div className="w-24 text-sm">Capacitive:</div>
          <div className="flex-grow h-5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${Math.min(Math.max(capacitivePercent, 0), 100)}%` }}
            ></div>
          </div>
          <div className="w-24 text-sm text-right">{capacitivePercent.toFixed(1)}%</div>
        </div>
      </div>

      {/* Show sine-wave specific visualizations only in sine mode */}
      {signalType === 'sine' && hasValidSineResults && (
        <div className="space-y-1">
          {/* ωRC Parameter Space */}
          <div>
            <h3 className="text-sm font-medium mb-1">ωRC Parameter Space</h3>
            <div className="relative h-6 bg-gray-200 rounded-lg">
              <div className="absolute top-0 h-full w-1/2 border-r-2 border-red-500"></div>
              <div
                className="absolute top-0 h-full w-4 bg-blue-500 rounded-full transform -translate-x-1/2"
                style={getRCPositionStyle()}
              ></div>
              <div className="absolute top-full mt-0.5 left-0 text-xs">0.001 (Resistive)</div>
              <div className="absolute top-full mt-0.5 left-1/2 transform -translate-x-1/2 text-xs">1 (Transition)</div>
              <div className="absolute top-full mt-0.5 right-0 text-xs">1000 (Capacitive)</div>
            </div>
            <div className="text-xs text-center mt-4 mb-1">
              Current ωRC = {(wRC as number).toFixed(4)} ({determineRegime()} regime)
            </div>
          </div>

          {/* Phase Angle */}
          <div>
            <h3 className="text-sm font-medium mb-1">Phase Angle (φ)</h3>
            <div className="relative h-5 bg-gray-200 rounded-lg">
              <div
                className="h-full bg-purple-500 rounded-lg"
                style={{ width: `${Math.min(Math.max(((phaseAngle as number) / 90) * 100, 0), 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs mt-0.5">
              <span>0° (Pure Resistive)</span>
              <span>45° (ωRC = 1)</span>
              <span>90° (Pure Capacitive)</span>
            </div>
            <div className="text-xs text-center mt-1 mb-1">
              Current phase angle (φ): {(phaseAngle as number).toFixed(2)}°
            </div>
          </div>

          {/* Power Factor */}
          <div>
            <h3 className="text-sm font-medium mb-1">Power Factor</h3>
            <div className="relative h-5 bg-gray-200 rounded-lg">
              <div
                className="h-full bg-yellow-500 rounded-lg"
                style={{ width: `${Math.min(Math.max((powerFactor as number) * 100, 0), 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs mt-0.5">
              <span>0 (Pure Capacitive)</span>
              <span>0.707 (ωRC = 1)</span>
              <span>1 (Pure Resistive)</span>
            </div>
            <div className="text-xs text-center mt-1">
              Current power factor: {(powerFactor as number).toFixed(4)}
            </div>
          </div>
        </div>
      )}

      {/* Show noise-mode specific visualizations */}
      {signalType === 'noise' && noiseBandwidth && (
        <div className="mt-2 p-3 bg-blue-50 rounded-lg">
          <h3 className="text-md font-medium mb-1">Noise Bandwidth Analysis</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white p-2 rounded shadow">
              <div className="text-xs text-gray-600">Minimum Frequency:</div>
              <div className="text-sm font-semibold">{noiseBandwidth.min.toFixed(2)} Hz</div>
            </div>
            <div className="bg-white p-2 rounded shadow">
              <div className="text-xs text-gray-600">Maximum Frequency:</div>
              <div className="text-sm font-semibold">{noiseBandwidth.max.toFixed(2)} Hz</div>
            </div>
            <div className="bg-white p-2 rounded shadow">
              <div className="text-xs text-gray-600">Bandwidth:</div>
              <div className="text-sm font-semibold">{(noiseBandwidth.max - noiseBandwidth.min).toFixed(2)} Hz</div>
            </div>
            <div className="bg-white p-2 rounded shadow">
              <div className="text-xs text-gray-600">Center Frequency:</div>
              <div className="text-sm font-semibold">{((noiseBandwidth.max + noiseBandwidth.min) / 2).toFixed(2)} Hz</div>
            </div>
          </div>
          
          <div className="mt-2 text-xs text-center text-gray-600">
            In noise mode, the capacitive current increases with broader bandwidth and higher frequencies due to the
            frequency-dependent impedance of capacitors.
          </div>
        </div>
      )}
    </div>
  );
};

export default CircuitVisualizations;