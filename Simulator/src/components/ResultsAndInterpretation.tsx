import React from 'react';
import { CircuitResults } from '../types';
import { formatValue } from '../utils';

interface ResultsAndInterpretationProps {
  results: CircuitResults;
  determineRegime: () => string;
}

const ResultsAndInterpretation: React.FC<ResultsAndInterpretationProps> = ({ results, determineRegime }) => {
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
    calculationError
  } = results;

  // Default safeThreshold if values is undefined
  const safeThreshold = values ? values.safeCurrentThreshold : 500e-6; // Default to 500μA

  // Check for invalid results
  const hasValidResults = isFinite(wRC) && isFinite(currentR) && isFinite(currentC) &&
    isFinite(currentTotal) && isFinite(phaseAngle) && isFinite(powerFactor);

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
        <p className="text-red-600 mt-2">
          Please adjust parameters to physically reasonable values.
        </p>
      </div>
    );
  }

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
            <tr className="border-t">
              <td className="p-2">Normalized ωRC</td>
              <td className="p-2">{wRC.toFixed(4)}</td>
              <td className="p-2">{determineRegime()} regime</td>
            </tr>
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
            <tr className="border-t">
              <td className="p-2">Phase Angle</td>
              <td className="p-2">{phaseAngle.toFixed(2)}°</td>
              <td className="p-2">{phaseAngle < 45 ? "Low phase shift" : "High phase shift"}</td>
            </tr>
            <tr className="border-t">
              <td className="p-2">Power Factor</td>
              <td className="p-2">{powerFactor.toFixed(4)}</td>
              <td className="p-2">{powerFactor > 0.7 ? "Efficient power transfer" : "Poor power transfer"}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-2 text-xs text-gray-500 italic">
          Note: All calculations assume pure sine waves in AC steady state.
        </div>
      </div>


      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Circuit Analysis Interpretation</h2>

        <div className="flex flex-col space-y-4">
          {/* First row - side by side boxes */}
          <div className="flex space-x-4">
            <div className="bg-white p-4 rounded shadow flex-1 border-l-4 border-blue-200">
              <h3 className="font-medium mb-2">Mathematical Model:</h3>
              <p>I<sub>total</sub> = I<sub>R</sub> + I<sub>C</sub> = V<sub>rms</sub>/R + V<sub>rms</sub>·2πfC</p>
              <p>V<sub>rms</sub> = V<sub>pk-pk</sub>/(2√2) for sine waves</p>
              <p>The dimensionless parameter <span className="font-semibold">ωRC = {wRC.toFixed(2)}</span> determines circuit regime</p>
            </div>

            <div className="bg-white p-4 rounded shadow flex-1 border-l-4 border-green-200">
              <h3 className="font-medium mb-2">Regime Analysis:</h3>
              <ul className="list-disc pl-5">
                <p className="mb-2">The ωRC value determines circuit behavior:</p>
                <div className="grid grid-cols-3 gap-2 mb-2 text-sm">
                  <div className={`p-1 rounded text-center ${determineRegime() === "Resistive" ? "bg-blue-200 font-bold" : "bg-blue-50"}`}>
                    ωRC &lt; 1: Resistive
                  </div>
                  <div className={`p-1 rounded text-center ${determineRegime() === "Transition Point" ? "bg-purple-200 font-bold" : "bg-purple-50"}`}>
                    ωRC = 1: Transition
                  </div>
                  <div className={`p-1 rounded text-center ${determineRegime() === "Capacitive" ? "bg-green-200 font-bold" : "bg-green-50"}`}>
                    ωRC &gt; 1: Capacitive
                  </div>
                </div>
                <p className="font-medium">Current: {determineRegime()} mode with ωRC = {wRC.toFixed(2)}</p>
              </ul>
            </div>
          </div>

          {/* Second row - single box */}
          <div className="bg-white p-4 rounded shadow border-l-4 border-purple-200">
            <h3 className="font-medium mb-2">Human Body Application:</h3>
            <ul className="list-disc pl-5">
              <li><strong>Typical human body circuit:</strong> ωRC range of 0.001-0.2 (resistive dominated)</li>
              <li><strong>Safety threshold:</strong> {formatValue(safeThreshold, 'A')}</li>
              <li><strong>Current level:</strong> {formatValue(currentTotal, 'A')} ({isSafe ? "safe" : "UNSAFE"})</li>
              <li><strong>Recommendation:</strong> {
                isSafe
                  ? "Parameters are within safe operating range"
                  : "Reduce voltage or increase resistance to ensure safety"
              }</li>
            </ul>

            <p className="mt-3 text-sm text-gray-600 italic">
              Note: Safety thresholds are frequency-dependent in reality. The model used here
              is applicable for frequencies up to 2 kHz. At higher frequencies, human sensitivity
              to electrical current changes significantly.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResultsAndInterpretation;