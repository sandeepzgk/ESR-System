import React from 'react';
import { ParameterState } from './types';
import { getParamValidationState } from './utils';
import useRCCircuit from './hooks/useRCCircuit';
import ErrorBoundary from './components/ErrorBoundary';
import ValidationErrors from './components/ValidationErrors';
import CalculationError from './components/CalculationError';
import ParameterControl from './components/ParameterControl';
import FrequencyResponseChart from './components/FrequencyResponseChart';
import CircuitVisualizations from './components/CircuitVisualizations';
import SafetyMeter from './components/SafetyMeter';
import ResultsAndInterpretation from './components/ResultsAndInterpretation';

interface RCCircuitAnalysisProps {
  initialParams?: Partial<ParameterState>;
}

const RCCircuitAnalysis: React.FC<RCCircuitAnalysisProps> = ({ initialParams = {} }) => {
  const {
    params,
    textValues,
    results,
    frequencyResponseData,
    determineRegime,
    updateParameter,
    handleTextChange,
    resetCircuit,
    validationErrors,
    hasCalculationError
  } = useRCCircuit(initialParams);

  // Check which parameters have validation errors
  const checkParamValidationState = (paramName: string): boolean => {
    return getParamValidationState(validationErrors, paramName);
  };

  return (
    <ErrorBoundary>
      <div className="p-4 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">AC Parallel RC Circuit Analysis</h1>

        {/* Error Displays */}
        <ValidationErrors
          errors={validationErrors}
          onReset={resetCircuit}
        />

        <CalculationError
          hasError={hasCalculationError}
          onReset={resetCircuit}
        />

        
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Circuit Parameters</h2>
            <button
              onClick={resetCircuit}
              className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 text-sm"
            >
              Reset Parameters
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row">
            <div className="flex-grow">
              {['voltage', 'resistance', 'capacitance', 'frequency'].map(paramName => (
                <ParameterControl
                  key={paramName}
                  paramName={paramName}
                  params={params}
                  textValues={textValues}
                  onParamChange={updateParameter}
                  onTextChange={handleTextChange}
                  hasValidationErrors={checkParamValidationState(paramName)}
                />
              ))}
            </div>
          </div>

          <div className="mt-2 text-xs text-gray-500 italic">
            Note: All calculations assume pure sine waves in AC steady state.
          </div>
        </div>

        {/* Frequency Response Analysis */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Frequency Response Analysis</h2>
          <FrequencyResponseChart
            frequencyResponseData={frequencyResponseData}
            results={results}
          />
        </div>

        {/* Circuit Visualizations */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <CircuitVisualizations
            results={results}
            determineRegime={determineRegime}
          />
        </div>

        {/* Human Body Safety Threshold */}
        <div className="bg-blue-50 p-4 rounded-lg shadow mb-6">
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

        {/* Results and Interpretation */}
        <ResultsAndInterpretation
          results={results}
          determineRegime={determineRegime}
        />
      </div>
    </ErrorBoundary>
  );
};

export default RCCircuitAnalysis;