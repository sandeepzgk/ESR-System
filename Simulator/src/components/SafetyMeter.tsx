import React from 'react';
import { CircuitResults } from '../types'; 

interface SafetyMeterProps {
  results: CircuitResults;
}

const SafetyMeter: React.FC<SafetyMeterProps> = ({ results }) => {
  const { currentTotal, isSafe, values } = results;
  const safeThreshold = values ? values.safeCurrentThreshold : 500e-6; // Default to 500μA if missing

  // Utility function for formatted current
  const formatCurrent = (amps: number): string => {
    if (!isFinite(amps) || isNaN(amps)) return "-- A";
    if (amps >= 1) return `${amps.toFixed(2)} A`;
    if (amps >= 1e-3) return `${(amps * 1e3).toFixed(2)} mA`;
    return `${(amps * 1e6).toFixed(1)} μA`;
  };

  // Check for invalid results
  const hasValidResults = isFinite(currentTotal) && isFinite(safeThreshold);

  if (!hasValidResults) {
    return (
      <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-md">
        <h3 className="text-yellow-800 font-medium mb-2">Current Safety Analysis</h3>
        <p className="text-yellow-700 text-sm">
          Unable to determine safety status due to calculation errors.
          Please adjust parameters to physically reasonable values.
        </p>
      </div>
    );
  }

  // Safety calculation only valid up to 2 kHz
  const currentFrequency = values ? values.frequency : 0;
  const frequencyWarning = currentFrequency > 2000;

  return (
    <div>
      <h3 className="text-md font-semibold mb-2">Current Safety Analysis</h3>

      {frequencyWarning && (
        <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
          <strong>Note:</strong> Human sensitivity to electrical current changes at higher frequencies.
        </div>
      )}

      <div className="mb-4">
        <div className="relative h-8 bg-gradient-to-r from-green-300 via-yellow-300 to-red-500 rounded-lg mb-1">
          <div
            className="absolute top-0 h-full w-1 bg-black transform -translate-x-1/2"
            style={{ left: `${Math.min((currentTotal / safeThreshold) * 100, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs">
          <span>0 (Safe)</span>
          <span>{formatCurrent(safeThreshold * 0.2)}</span>
          <span>{formatCurrent(safeThreshold * 0.6)}</span>
          <span>{formatCurrent(safeThreshold)} (User Specified Safety Threshold)</span>
        </div>
        <div className="text-sm text-center mt-2 font-semibold">
          Current: {formatCurrent(currentTotal)}
          <span className={`ml-2 ${isSafe ? "text-green-600" : "text-red-600"}`}>
            ({isSafe ? "SAFE" : "UNSAFE"} for selected threshold)
          </span>
        </div>
      </div>
    </div>
  );
};

export default SafetyMeter;