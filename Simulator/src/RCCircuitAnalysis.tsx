import React, { useState } from 'react';
import { ParameterState } from './types';
import { getParamValidationState } from './utils';
import useRCCircuit from './hooks/useRCCircuit';
import ErrorBoundary from './components/ErrorBoundary';
import ValidationErrors from './components/ValidationErrors';
import CalculationError from './components/CalculationError';
import NoiseValidationError from './components/NoiseValidationError';
import ParameterControl from './components/ParameterControl';
import FrequencyInputs from './components/FrequencyInputs';
import SignalTypeSelector from './components/SignalTypeSelector';
import FrequencyResponseChart from './components/FrequencyResponseChart';
import CircuitVisualizations from './components/CircuitVisualizations';
import SafetyMeter from './components/SafetyMeter';
import ResultsAndInterpretation from './components/ResultsAndInterpretation';
import MathematicalModelModal from './components/MathematicalModelModal';
import { RefreshCw, BookOpen } from 'lucide-react';

interface RCCircuitAnalysisProps {
  initialParams?: Partial<ParameterState>;
}

const RCCircuitAnalysis: React.FC<RCCircuitAnalysisProps> = ({ initialParams = {} }) => {
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const {
    params,
    textValues,
    results,
    frequencyResponseData,
    determineRegime,
    updateParameter,
    handleTextChange,
    resetCircuit,
    toggleSignalType,
    validationErrors,
    hasCalculationError
  } = useRCCircuit(initialParams);

  // Check which parameters have validation errors
  const checkParamValidationState = (paramName: string): boolean => {
    return getParamValidationState(validationErrors, paramName);
  };

  return (
    <ErrorBoundary>
      {/* Removed max-w-screen-2xl to use full screen width */}
      <div className="p-4 w-full mx-auto bg-gray-50 relative">
        <h1 className="text-2xl font-bold mb-4">AC Parallel RC Circuit Analysis</h1>
        
        {/* Floating Mathematical Model Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700"
        >
          <BookOpen size={18} />
          <span>Mathematical Model</span>
        </button>

        {/* Mathematical Model Modal */}
        <MathematicalModelModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />

        {/* Error Displays */}
        <div className="mb-4">
          <ValidationErrors
            errors={validationErrors}
            onReset={resetCircuit}
          />

          <CalculationError
            hasError={hasCalculationError}
            onReset={resetCircuit}
          />

          <NoiseValidationError
            error={results.noiseValidationError}
            onReset={resetCircuit}
          />
        </div>
        
        {/* Dashboard Layout */}
        <div className="grid grid-cols-12 gap-4">
          {/* Top Row: Parameters and Safety Threshold */}
          <div className="col-span-8 bg-white rounded-lg shadow p-4 relative">
            <h2 className="text-lg font-semibold mb-2">Circuit Parameters</h2>
            
            {/* Modified layout: Left side for signal type, notes and right side for parameter controls */}
            <div className="grid grid-cols-12 gap-2">
              {/* Left side: Signal Type, Notes */}
              <div className="col-span-4">
                <SignalTypeSelector 
                  signalType={params.signalType} 
                  onToggle={toggleSignalType} 
                />
                
                <div className="text-xs text-gray-500 italic">
                  {params.signalType === 'sine'
                    ? "Note: Sine mode calculations assume pure sine waves in AC steady state."
                    : "Note: Noise mode calculations assume white noise across the specified frequency band."}
                </div>
              </div>
              
              {/* Right side: All parameter controls */}
              <div className="col-span-8">
                <div className="space-y-0">
                  <ParameterControl
                    paramName="resistance"
                    params={params}
                    textValues={textValues}
                    onParamChange={updateParameter}
                    onTextChange={handleTextChange}
                    hasValidationErrors={checkParamValidationState('resistance')}
                  />
                  
                  <ParameterControl
                    paramName="capacitance"
                    params={params}
                    textValues={textValues}
                    onParamChange={updateParameter}
                    onTextChange={handleTextChange}
                    hasValidationErrors={checkParamValidationState('capacitance')}
                  />
                  
                  <ParameterControl
                    paramName="voltage"
                    params={params}
                    textValues={textValues}
                    onParamChange={updateParameter}
                    onTextChange={handleTextChange}
                    hasValidationErrors={checkParamValidationState('voltage')}
                  />
                  
                  <FrequencyInputs
                    signalType={params.signalType}
                    params={params}
                    textValues={textValues}
                    onParamChange={updateParameter}
                    onTextChange={handleTextChange}
                    validationErrors={validationErrors}
                    noiseValidationError={results.noiseValidationError}
                  />
                </div>
              </div>
            </div>

            {/* Floating Reset Button at bottom left corner */}
            <button
              onClick={resetCircuit}
              className="flex items-center gap-1 absolute bottom-4 left-4 px-3 py-1.5 bg-gray-300 rounded hover:bg-gray-400 text-sm shadow-md flex items-center gap-2 px-4 py-2.5 rounded text-sm"
            >
              <RefreshCw size={18} />
              <span>Reset Parameters</span>
            </button>
          </div>
          
          {/* Human Body Safety Threshold */}
          <div className="col-span-4 bg-blue-50 rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-2">Human Body Safety Threshold</h2>

            <ParameterControl
              paramName="safeCurrentThreshold"
              params={params}
              textValues={textValues}
              onParamChange={updateParameter}
              onTextChange={handleTextChange}
              hasValidationErrors={checkParamValidationState('safeCurrentThreshold')}
            />

            <div className="text-sm mt-2 mb-4">
              <span className="text-gray-600">Standard safety threshold is 500 μA (0.5 mA) for most human body applications.</span>
            </div>

            <SafetyMeter results={results} />

            <div className="mt-2 text-xs text-gray-500 italic">
              Note: Safety thresholds are frequency-dependent in reality. The model used here is applicable
              for frequencies up to 2 kHz. At higher frequencies, human sensitivity to electrical current
              changes significantly.
            </div>
          </div>
          
          {/* Middle Row: Frequency Response and Circuit Characteristics with integrated results */}
          {/* Frequency Response Analysis - 6 columns */}
          <div className="col-span-6 bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">
              {params.signalType === 'sine' 
                ? "Frequency Response Analysis" 
                : "Frequency Response (Noise Mode)"}
            </h2>
            <FrequencyResponseChart
              frequencyResponseData={frequencyResponseData}
              results={results}
              signalType={params.signalType}
            />
          </div>

          {/* Circuit Characteristics with integrated Circuit Analysis Results - 6 columns */}
          <div className="col-span-6 bg-white rounded-lg shadow p-4">
            
            {/* Visualizations Component */}
            <CircuitVisualizations
              results={results}
              determineRegime={determineRegime}
              signalType={params.signalType}
            />
            
            {/* Integrated Circuit Analysis Results */}
            <div className="mt-6 border-t pt-4">
              <h3 className="text-md font-semibold mb-3">Analysis Results</h3>
              <div className="grid grid-cols-2 gap-4">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left">Parameter</th>
                      <th className="p-2 text-left">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Sine-mode specific rows */}
                    {params.signalType === 'sine' && (
                      <>
                        <tr className="border-t">
                          <td className="p-2">Normalized ωRC</td>
                          <td className="p-2">{(results.wRC as number).toFixed(4)}</td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-2">Phase Angle</td>
                          <td className="p-2">{(results.phaseAngle as number).toFixed(2)}°</td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-2">Power Factor</td>
                          <td className="p-2">{(results.powerFactor as number).toFixed(4)}</td>
                        </tr>
                      </>
                    )}

                    {/* Noise-mode specific rows */}
                    {params.signalType === 'noise' && results.noiseBandwidth && (
                      <>
                        <tr className="border-t">
                          <td className="p-2">Noise Bandwidth</td>
                          <td className="p-2">{results.noiseBandwidth.min.toFixed(1)} Hz - {results.noiseBandwidth.max.toFixed(1)} Hz</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>

                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left">Parameter</th>
                      <th className="p-2 text-left">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Common rows for both modes */}
                    <tr className="border-t">
                      <td className="p-2">Resistive Current</td>
                      <td className="p-2 text-green-600">{results.resistivePercent.toFixed(1)}% of total</td>
                    </tr>
                    <tr className="border-t">
                      <td className="p-2">Capacitive Current</td>
                      <td className="p-2 text-blue-600">{results.capacitivePercent.toFixed(1)}% of total</td>
                    </tr>
                    <tr className="border-t">
                      <td className="p-2">Total Current</td>
                      <td className="p-2">
                        <span className={results.isSafe ? "text-green-600" : "text-red-600 font-bold"}>
                          {results.isSafe ? "Safe" : "UNSAFE"}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Regime Analysis - Moved from bottom section to here */}
              <div className="mt-4 pt-3 border-t">
                <h3 className="text-md font-semibold mb-2">Regime Analysis</h3>
                <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                  <div className={`p-1 rounded text-center ${
                    (params.signalType === 'sine' && determineRegime() === "Resistive") || 
                    (params.signalType === 'noise' && results.resistivePercent > results.capacitivePercent)
                    ? "bg-blue-200 font-bold" : "bg-blue-50"
                  }`}>
                    ωRC &lt; 1: Resistive
                  </div>
                  <div className={`p-1 rounded text-center ${
                    (params.signalType === 'sine' && determineRegime() === "Transition Point") || 
                    (params.signalType === 'noise' && Math.abs(results.resistivePercent - results.capacitivePercent) < 5)
                    ? "bg-purple-200 font-bold" : "bg-purple-50"
                  }`}>
                    ωRC = 1: Transition
                  </div>
                  <div className={`p-1 rounded text-center ${
                    (params.signalType === 'sine' && determineRegime() === "Capacitive") || 
                    (params.signalType === 'noise' && results.capacitivePercent > results.resistivePercent)
                    ? "bg-green-200 font-bold" : "bg-green-50"
                  }`}>
                    ωRC &gt; 1: Capacitive
                  </div>
                </div>
                
                <div className="text-sm">
                  {params.signalType === 'sine' ? (
                    <p>Current mode: <span className="font-medium">{determineRegime()}</span> with ωRC = {(results.wRC as number).toFixed(4)}</p>
                  ) : (
                    <p>Current distribution: <span className="font-medium">Resistive {results.resistivePercent.toFixed(1)}%</span>, <span className="font-medium">Capacitive {results.capacitivePercent.toFixed(1)}%</span></p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Row: Analysis Interpretation - Keep insights in place */}
          <div className="col-span-12 bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Circuit Analysis Interpretation</h2>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Additional insights section */}
              <div className={`p-3 rounded border ${params.signalType === 'sine' ? 'bg-blue-50' : 'bg-gray-50'}`}>
                {params.signalType === 'sine' ? (
                  <>
                    <h4 className="font-medium mb-2">Sine Wave Insights</h4>
                    <p>Sine waves show predictable phase relationships, with current and voltage 
                    shifting based on the balance between resistance and capacitance.</p>
                    <p className="mt-2">
                      ωRC value determines if the circuit is predominantly resistive (ωRC &lt; 1) or 
                      capacitive (ωRC &gt; 1). At exactly ωRC = 1, the circuit reaches a transition point
                      where resistive and capacitive effects are balanced.
                    </p>
                  </>
                ) : (
                  <>
                    <h4 className="font-medium mb-2">White Noise Insights</h4>
                    <p>Unlike sine waves at a single frequency, white noise contains energy across
                    the entire frequency spectrum with a flat power spectral density.</p>
                    <p className="mt-2">
                      Higher frequencies in the noise band contribute more to capacitive current due to
                      the frequency-dependent nature of capacitive reactance (X<sub>C</sub> = 1/(2πfC)).
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default RCCircuitAnalysis;