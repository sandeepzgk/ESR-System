import React from 'react';
import { CircuitResults } from '../types';

// Combined current distribution and phase visualization component
interface CircuitVisualizationsProps {
  results: CircuitResults;
  determineRegime: () => string;
}

const CircuitVisualizations: React.FC<CircuitVisualizationsProps> = ({ results, determineRegime }) => {
  const { wRC, phaseAngle, powerFactor, resistivePercent, capacitivePercent } = results;

  // Create a simple visualization of where we are on the ωRC scale with safety checks
  const getRCPositionStyle = (): React.CSSProperties => {
    // Handle invalid wRC
    if (!isFinite(wRC) || isNaN(wRC)) {
      return { left: '0%' };
    }

    // Convert ωRC to a position on a logarithmic scale from 0.001 to 1000
    let position = 0;
    if (wRC > 0) {
      // Calculate normalized position (0-100) on logarithmic scale
      position = (Math.log10(Math.min(Math.max(wRC, 0.001), 1000)) + 3) * (100 / 6);
      // Clamp to 0-100 range
      position = Math.max(0, Math.min(100, position));
    }
    return { left: `${position}%` };
  };

  // Check for invalid results
  const hasValidResults = isFinite(wRC) && isFinite(phaseAngle) && isFinite(powerFactor) &&
    isFinite(resistivePercent) && isFinite(capacitivePercent);

  if (!hasValidResults) {
    return (
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-md">
        <h2 className="text-lg font-semibold mb-2 text-yellow-800">Circuit Characteristics</h2>
        <p className="text-yellow-700">
          Unable to display visualizations due to calculation errors.
          Please adjust parameters to physically reasonable values.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold mb-2">Circuit Characteristics</h2>

      {/* Current Distribution */}
      <div className="mb-4">
        <div className="flex items-center mb-1">
          <div className="w-24 text-sm">Resistive:</div>
          <div className="flex-grow h-6 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${Math.min(Math.max(resistivePercent, 0), 100)}%` }}
            ></div>
          </div>
          <div className="w-24 text-sm text-right">{resistivePercent.toFixed(1)}%</div>
        </div>

        <div className="flex items-center">
          <div className="w-24 text-sm">Capacitive:</div>
          <div className="flex-grow h-6 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${Math.min(Math.max(capacitivePercent, 0), 100)}%` }}
            ></div>
          </div>
          <div className="w-24 text-sm text-right">{capacitivePercent.toFixed(1)}%</div>
        </div>
      </div>

      {/* ωRC Parameter Space */}
      <div className="mb-4">
        <h3 className="text-md font-medium mb-2">ωRC Parameter Space</h3>
        <div className="relative h-10 bg-gray-200 rounded-lg mb-1">
          <div className="absolute top-0 h-full w-1/2 border-r-2 border-red-500"></div>
          <div
            className="absolute top-0 h-full w-4 bg-blue-500 rounded-full transform -translate-x-1/2"
            style={getRCPositionStyle()}
          ></div>
          <div className="absolute top-full mt-1 left-0 text-xs">0.001 (Resistive)</div>
          <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 text-xs">1 (Transition)</div>
          <div className="absolute top-full mt-1 right-0 text-xs">1000 (Capacitive)</div>
        </div>
        <div className="text-sm text-center mt-6">
          Current ωRC = {wRC.toFixed(4)} ({determineRegime()} regime)
        </div>
      </div>

      {/* Phase Angle */}
      <h3 className="text-md font-medium mb-2">Phase Angle</h3>
      <div className="relative h-6 bg-gray-200 rounded-lg mb-1">
        <div
          className="h-full bg-purple-500 rounded-lg"
          style={{ width: `${Math.min(Math.max((phaseAngle / 90) * 100, 0), 100)}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-xs">
        <span>0° (Pure Resistive)</span>
        <span>45° (ωRC = 1)</span>
        <span>90° (Pure Capacitive)</span>
      </div>
      <div className="text-sm text-center mt-2">
        Current phase angle: {phaseAngle.toFixed(2)}°
      </div>

      {/* Power Factor */}
      <h3 className="text-md font-medium mt-4 mb-2">Power Factor</h3>
      <div className="relative h-6 bg-gray-200 rounded-lg mb-1">
        <div
          className="h-full bg-yellow-500 rounded-lg"
          style={{ width: `${Math.min(Math.max(powerFactor * 100, 0), 100)}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-xs">
        <span>0 (Pure Capacitive)</span>
        <span>0.707 (ωRC = 1)</span>
        <span>1 (Pure Resistive)</span>
      </div>
      <div className="text-sm text-center mt-2">
        Current power factor: {powerFactor.toFixed(4)}
      </div>
    </div>
  );
};

export default CircuitVisualizations;