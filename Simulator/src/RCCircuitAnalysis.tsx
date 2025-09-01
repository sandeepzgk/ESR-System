import React, { useState, useEffect } from 'react';
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
// ResolutionCheckModal removed
import { RefreshCw, BookOpen, Menu, X, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

interface RCCircuitAnalysisProps {
  initialParams?: Partial<ParameterState>;
}

const RCCircuitAnalysis: React.FC<RCCircuitAnalysisProps> = ({ initialParams = {} }) => {
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Mobile navigation state
  const [activeMobileSection, setActiveMobileSection] = useState<string>('parameters');
  
  // Define allowed section names as a type
  type SectionName = 'parameters' | 'safety' | 'frequencyResponse' | 'circuitCharacteristics';
  
  // Collapsible sections for mobile - all open by default
  const [collapsedSections, setCollapsedSections] = useState({
    parameters: false,
    safety: false,
    frequencyResponse: false,
    circuitCharacteristics: false
  });

  const toggleSection = (section: SectionName) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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

  // Determine if we're on mobile based on screen width
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Navigation bar for mobile view
  const MobileNavigation = () => (
    <div className="md:hidden bg-indigo-600 text-white sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-semibold">RC Circuit Analyzer</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-2 rounded-full bg-indigo-700 hover:bg-indigo-800"
          >
            <BookOpen size={20} />
          </button>
          <button
            onClick={resetCircuit}
            className="p-2 rounded-full bg-rose-600 hover:bg-rose-700"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 text-center border-t border-indigo-500">
        <button
          onClick={() => setActiveMobileSection('parameters')}
          className={`py-2 px-1 ${activeMobileSection === 'parameters' ? 'bg-indigo-800' : 'bg-indigo-600'}`}
        >
          Parameters
        </button>
        <button
          onClick={() => setActiveMobileSection('analysis')}
          className={`py-2 px-1 ${activeMobileSection === 'analysis' ? 'bg-indigo-800' : 'bg-indigo-600'}`}
        >
          Analysis
        </button>
      </div>
    </div>
  );

  // Section header component for mobile collapsible sections
  const SectionHeader = ({ title, section, icon }: { title: string, section: SectionName, icon?: React.ReactNode }) => (
    <div 
      className="flex items-center justify-between bg-gray-100 p-3 rounded-t-lg cursor-pointer md:cursor-default"
      onClick={() => isMobile && toggleSection(section)}
    >
      <h2 className="text-lg font-semibold flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {isMobile && (
        collapsedSections[section] ? 
          <ChevronDown size={20} /> : 
          <ChevronUp size={20} />
      )}
    </div>
  );

  return (
    <ErrorBoundary>
      {/* Mathematical Model Modal */}
      <MathematicalModelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Mobile Navigation */}
      <MobileNavigation />

      {/* Desktop Header - Hidden on Mobile */}
      <div className="hidden md:block p-4 w-full mx-auto bg-gray-50 relative">
        <h1 className="text-2xl font-bold mb-4">Simulated Electrical Stochastic Resonance Analyzer for Pure Tone and White Noise</h1>

        {/* Header buttons container - for desktop only */}
        <div className="absolute top-4 right-4 flex items-center gap-3">
          <button
            onClick={resetCircuit}
            className="flex items-center gap-2 px-4 py-2 bg-rose-400 text-white rounded-md shadow-md hover:bg-rose-500"
          >
            <RotateCcw size={18} />
            <span>Reset All Parameters</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-400 text-white rounded-md shadow-md hover:bg-indigo-500"
          >
            <BookOpen size={18} />
            <span>Circuit Theory & Safety</span>
          </button>
        </div>
      </div>

      <div className="p-4 w-full mx-auto bg-gray-50">
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

        {/* Mobile Content Conditional Rendering */}
        {isMobile && (
          <div className="space-y-4">
            {/* Parameters Section */}
            {activeMobileSection === 'parameters' && (
              <>
                {/* Circuit Parameters */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <SectionHeader 
                    title="Circuit Parameters" 
                    section="parameters"
                  />
                  
                  {!collapsedSections.parameters && (
                    <div className="p-3">
                      <SignalTypeSelector
                        signalType={params.signalType}
                        onToggle={toggleSignalType}
                      />
                      
                      <div className="text-xs text-gray-500 italic mt-2 mb-3">
                        {params.signalType === 'sine'
                          ? "Note: Sine mode calculations assume pure sine waves in AC steady state."
                          : "Note: Noise mode calculations assume white noise across the specified frequency band."}
                      </div>
                      
                      <div className="mb-3 flex justify-center">
                        <img
                          src={`${process.env.PUBLIC_URL}/circuit.png`}
                          alt="RC Circuit Diagram"
                          className="w-full max-w-xs h-auto"
                        />
                      </div>
                      
                      <div className="space-y-2">
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
                  )}
                </div>

                {/* Human Body Safety Threshold */}
                <div className="bg-blue-50 rounded-lg shadow overflow-hidden">
                  <SectionHeader 
                      title="User Specified Safety Threshold" 
                    section="safety"
                  />
                  
                  {!collapsedSections.safety && (
                    <div className="p-3">
                      <ParameterControl
                        paramName="safeCurrentThreshold"
                        params={params}
                        textValues={textValues}
                        onParamChange={updateParameter}
                        onTextChange={handleTextChange}
                        hasValidationErrors={checkParamValidationState('safeCurrentThreshold')}
                      />

                      <div className="text-sm mt-2 mb-4">
                          <span className="text-gray-600">Standard Safety Threshold is 500 μA (0.5 mA) for most human body applications.</span>
                      </div>

                      <SafetyMeter results={results} />

                            <div className="mt-2 text-xs text-gray-500 italic">
                              Note: Safety Thresholds are frequency-dependent in reality. The model used here is applicable
                              for frequencies up to 2 kHz. At higher frequencies, human sensitivity to electrical current
                              changes significantly.
                            </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Analysis Section */}
            {activeMobileSection === 'analysis' && (
              <>
                {/* Frequency Response */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <SectionHeader 
                    title={params.signalType === 'sine' ? "Frequency Response Analysis" : "Frequency Response (Noise Mode)"} 
                    section="frequencyResponse"
                  />
                  
                  {!collapsedSections.frequencyResponse && (
                    <div className="p-3">
                      <FrequencyResponseChart
                        frequencyResponseData={frequencyResponseData}
                        results={results}
                        signalType={params.signalType}
                      />
                    </div>
                  )}
                </div>

                {/* Circuit Characteristics */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <SectionHeader 
                    title="Circuit Characteristics" 
                    section="circuitCharacteristics"
                  />
                  
                  {!collapsedSections.circuitCharacteristics && (
                    <div className="p-3">
                      <CircuitVisualizations
                        results={results}
                        determineRegime={determineRegime}
                        signalType={params.signalType}
                      />

                      {/* Integrated Circuit Analysis Results */}
                      <div className="mt-6 border-t pt-4">
                        <h3 className="text-md font-semibold mb-3">Analysis Results</h3>
                        
                        {/* Responsive tables - stack on mobile */}
                        <div className="space-y-4">
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
                                    <td className="p-2">Phase Angle (φ)</td>
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

                        {/* Regime Analysis */}
                        <div className="mt-4 pt-3 border-t">
                          <h3 className="text-md font-semibold mb-2">Regime Analysis</h3>
                          <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                            <div className={`p-1 rounded text-center ${(params.signalType === 'sine' && determineRegime() === "Resistive") ||
                              (params.signalType === 'noise' && results.resistivePercent > results.capacitivePercent)
                              ? "bg-blue-200 font-bold" : "bg-blue-50"
                              }`}>
                              ωRC &lt; 1: Resistive
                            </div>
                            <div className={`p-1 rounded text-center ${(params.signalType === 'sine' && determineRegime() === "Transition Point") ||
                              (params.signalType === 'noise' && Math.abs(results.resistivePercent - results.capacitivePercent) < 5)
                              ? "bg-purple-200 font-bold" : "bg-purple-50"
                              }`}>
                              ωRC = 1: Transition
                            </div>
                            <div className={`p-1 rounded text-center ${(params.signalType === 'sine' && determineRegime() === "Capacitive") ||
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
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Desktop Layout */}
        {!isMobile && (
          <div className="hidden md:grid grid-cols-12 gap-4">
            {/* Top Row: Parameters and User Specified Safety Threshold */}
            <div className="col-span-8 bg-white rounded-lg shadow p-4 relative">
              <h2 className="text-lg font-semibold mb-2">Circuit Parameters</h2>

              {/* Layout: Left side for signal type, notes and right side for parameter controls */}
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
                  <div className="mt-2 mb-2 flex justify-center">
                    <img
                      src={`${process.env.PUBLIC_URL}/circuit.png`}
                      alt="RC Circuit Diagram"
                      className="w-full max-w-xs h-auto"
                    />
                  </div>
                  <div className="text-xs text-gray-500 italic">
                    Representative Circuit Diagram of the AC Parallel RC Circuit for Stochastic Resonance System
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
            </div>

            {/* Human Body User Specified Safety Threshold */}
            <div className="col-span-4 bg-blue-50 rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-2">Human Body User Specified Safety Threshold</h2>

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
                Note: Safety Thresholds are frequency-dependent in reality. The model used here is applicable
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
                            <td className="p-2">Phase Angle (φ)</td>
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
                    <div className={`p-1 rounded text-center ${(params.signalType === 'sine' && determineRegime() === "Resistive") ||
                      (params.signalType === 'noise' && results.resistivePercent > results.capacitivePercent)
                      ? "bg-blue-200 font-bold" : "bg-blue-50"
                      }`}>
                      ωRC &lt; 1: Resistive
                    </div>
                    <div className={`p-1 rounded text-center ${(params.signalType === 'sine' && determineRegime() === "Transition Point") ||
                      (params.signalType === 'noise' && Math.abs(results.resistivePercent - results.capacitivePercent) < 5)
                      ? "bg-purple-200 font-bold" : "bg-purple-50"
                      }`}>
                      ωRC = 1: Transition
                    </div>
                    <div className={`p-1 rounded text-center ${(params.signalType === 'sine' && determineRegime() === "Capacitive") ||
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
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default RCCircuitAnalysis;