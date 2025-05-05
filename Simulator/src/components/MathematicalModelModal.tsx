import React, { useState } from 'react';
import { X } from 'lucide-react';

interface MathematicalModelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MathematicalModelModal: React.FC<MathematicalModelModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'theory' | 'noise' | 'safety'>('theory');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-xl font-semibold">Circuit Theory &amp; Safety Reference</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`py-3 px-6 font-medium ${
              activeTab === 'theory' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-blue-500'
            }`}
            onClick={() => setActiveTab('theory')}
          >
            Sine Wave Theory
          </button>
          <button
            className={`py-3 px-6 font-medium ${
              activeTab === 'noise' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-blue-500'
            }`}
            onClick={() => setActiveTab('noise')}
          >
            Noise Analysis
          </button>
          <button
            className={`py-3 px-6 font-medium ${
              activeTab === 'safety' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-blue-500'
            }`}
            onClick={() => setActiveTab('safety')}
          >
            Human Body Safety
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {activeTab === 'theory' && (
            <div className="space-y-8">
              <div className="bg-gray-50 p-4 rounded shadow border-l-4 border-blue-300">
                <h3 className="font-medium mb-3 text-lg">Sine Wave Model</h3>
                <div className="space-y-2">
                  <p>I<sub>total</sub> = √(I<sub>R</sub><sup>2</sup> + I<sub>C</sub><sup>2</sup>)</p>
                  <p>I<sub>R</sub> = V<sub>RMS</sub>/R</p>
                  <p>I<sub>C</sub> = V<sub>RMS</sub>·2πfC</p>
                  <p>V<sub>RMS</sub> = V<sub>pk-pk</sub>/(2√2) for sine waves</p>
                  <p className="mt-2 font-semibold">The dimensionless parameter ωRC = 2πfRC determines circuit behavior</p>
                  <ul className="list-disc ml-5 mt-2">
                    <li>If ωRC &lt; 1: Resistive dominated</li>
                    <li>If ωRC = 1: Transition point</li>
                    <li>If ωRC &gt; 1: Capacitive dominated</li>
                  </ul>
                  <p className="mt-2">Phase angle: φ = arctan(ωRC)</p>
                  <p>Power factor: cos(φ) = 1/√(1 + (ωRC)<sup>2</sup>)</p>
                  <p>Impedance: Z = R/√(1 + (ωRC)<sup>2</sup>)</p>
                </div>
              </div>

              {/* Additional sine wave theory sections remain unchanged */}
            </div>
          )}
          
          {activeTab === 'noise' && (
            <div className="space-y-8">
              {/* White Noise Model - Updated with corrected formula */}
              <div className="bg-gray-50 p-4 rounded shadow border-l-4 border-green-300">
                <h3 className="font-medium mb-3 text-lg">White Noise Model</h3>
                <div className="space-y-2">
                  <p>I<sub>total,RMS</sub> = √(I<sub>R,RMS</sub><sup>2</sup> + I<sub>C,RMS</sub><sup>2</sup>)</p>
                  <p>I<sub>R,RMS</sub> = V<sub>RMS</sub>/R</p>
                  <p>I<sub>C,RMS</sub> = √[V<sub>RMS</sub><sup>2</sup> × (2πC)<sup>2</sup> × (f<sub>max</sub><sup>3</sup> - f<sub>min</sub><sup>3</sup>)/(3·(f<sub>max</sub> - f<sub>min</sub>))]</p>
                  <p className="mt-2 font-semibold">White noise has equal power across all frequencies</p>
                  <p>For a band-limited white noise from f<sub>min</sub> to f<sub>max</sub>:</p>
                  <ul className="list-disc ml-5 mt-2">
                    <li>Higher frequencies contribute more to capacitive current</li>
                    <li>Capacitive reactance decreases with frequency: X<sub>C</sub> = 1/(2πfC)</li>
                    <li>The RMS capacitive current requires integrating over the frequency range</li>
                  </ul>
                </div>
              </div>
              
              {/* Enhanced Noise Integration Theory Section - Corrected with dimensionally consistent derivation */}
              <div className="bg-gray-50 p-4 rounded shadow border-l-4 border-amber-300">
                <h3 className="font-medium mb-3 text-lg">Noise Integration Theory</h3>
                <div className="space-y-3">
                  <p className="font-semibold">The capacitive current for white noise requires integration across the frequency band</p>
                  
                  <p>Unlike a sine wave where the current occurs at a single frequency, white noise contains power across a range of frequencies. Since capacitive reactance (X<sub>C</sub>) changes with frequency, we must integrate the current response across the entire band:</p>
                  
                  <div className="bg-white p-3 rounded border border-gray-200 my-3">
                    <p className="text-center mb-2">Corrected mathematical derivation:</p>
                    <p>1. For white noise with voltage spectral density S<sub>v</sub>(f) = V<sub>RMS</sub><sup>2</sup>/(f<sub>max</sub> - f<sub>min</sub>):</p>
                    <p>2. The capacitor admittance is Y(f) = j2πfC</p>
                    <p>3. The current spectral density is S<sub>i</sub>(f) = S<sub>v</sub>(f) × |Y(f)|<sup>2</sup> = S<sub>v</sub>(f) × (2πfC)<sup>2</sup></p>
                    <p>4. The total mean square current is the integral of S<sub>i</sub>(f) over the frequency band:</p>
                    <p className="ml-4 font-medium">I<sub>C,RMS</sub><sup>2</sup> = ∫<sub>f<sub>min</sub></sub><sup>f<sub>max</sub></sup> S<sub>i</sub>(f) df</p>
                    <p>5. Expanding this integral:</p>
                    <p className="ml-4">I<sub>C,RMS</sub><sup>2</sup> = ∫<sub>f<sub>min</sub></sub><sup>f<sub>max</sub></sup> [V<sub>RMS</sub><sup>2</sup>/(f<sub>max</sub>-f<sub>min</sub>)] × (2πfC)<sup>2</sup> df</p>
                    <p>6. Factoring out constants:</p>
                    <p className="ml-4">I<sub>C,RMS</sub><sup>2</sup> = [V<sub>RMS</sub><sup>2</sup>/(f<sub>max</sub>-f<sub>min</sub>)] × (2πC)<sup>2</sup> × ∫<sub>f<sub>min</sub></sub><sup>f<sub>max</sub></sup> f<sup>2</sup> df</p>
                    <p>7. Solving the integral: ∫f<sup>2</sup> df = f<sup>3</sup>/3</p>
                    <p className="ml-4">I<sub>C,RMS</sub><sup>2</sup> = [V<sub>RMS</sub><sup>2</sup>/(f<sub>max</sub>-f<sub>min</sub>)] × (2πC)<sup>2</sup> × [(f<sub>max</sub><sup>3</sup> - f<sub>min</sub><sup>3</sup>)/3]</p>
                    <p>8. Taking the square root yields our final formula:</p>
                    <p className="mt-2 text-center font-medium">I<sub>C,RMS</sub> = √[V<sub>RMS</sub><sup>2</sup> × (2πC)<sup>2</sup> × (f<sub>max</sub><sup>3</sup> - f<sub>min</sub><sup>3</sup>)/(3 × (f<sub>max</sub> - f<sub>min</sub>))]</p>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded text-sm">
                    <p className="font-medium">Example calculation:</p>
                    <p>For V<sub>RMS</sub> = 1 V, C = 100 nF, f<sub>min</sub> = 20 Hz, f<sub>max</sub> = 200 Hz:</p>
                    <ol className="list-decimal ml-5 mt-2">
                      <li>f<sub>max</sub><sup>3</sup> - f<sub>min</sub><sup>3</sup> = 200³ - 20³ = 8,000,000 - 8,000 = 7,992,000</li>
                      <li>3 × (f<sub>max</sub> - f<sub>min</sub>) = 3 × (200 - 20) = 3 × 180 = 540</li>
                      <li>(f<sub>max</sub><sup>3</sup> - f<sub>min</sub><sup>3</sup>)/(3 × (f<sub>max</sub> - f<sub>min</sub>)) = 7,992,000 / 540 = 14,800</li>
                      <li>(2πC)<sup>2</sup> = (2π × 100×10<sup>-9</sup>)<sup>2</sup> = (6.28×10<sup>-7</sup>)<sup>2</sup> = 3.95×10<sup>-13</sup></li>
                      <li>V<sub>RMS</sub><sup>2</sup> × (2πC)<sup>2</sup> × (f<sub>max</sub><sup>3</sup> - f<sub>min</sub><sup>3</sup>)/(3 × (f<sub>max</sub> - f<sub>min</sub>)) = 1<sup>2</sup> × 3.95×10<sup>-13</sup> × 14,800 = 5.84×10<sup>-9</sup></li>
                      <li>I<sub>C,RMS</sub> = √(5.84×10<sup>-9</sup>) = 76.4 μA</li>
                    </ol>
                  </div>
                  
                  <p className="text-sm italic">Note: This integration approach gives a dimensionally consistent result with units of Amperes, properly accounting for the frequency-dependent behavior of capacitors under white noise excitation.</p>
                </div>
              </div>
              
              {/* White Noise vs Sine Wave Comparison - updated */}
              <div className="bg-gray-50 p-4 rounded shadow border-l-4 border-gray-300">
                <h3 className="font-medium mb-3 text-lg">Comparison: Noise vs Sine Wave</h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="p-2 text-left">Parameter</th>
                      <th className="p-2 text-left">Sine Wave</th>
                      <th className="p-2 text-left">White Noise</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="p-2 font-medium">Frequency</td>
                      <td className="p-2">Single frequency (f)</td>
                      <td className="p-2">Band of frequencies (f<sub>min</sub> to f<sub>max</sub>)</td>
                    </tr>
                    <tr className="border-t">
                      <td className="p-2 font-medium">Phase</td>
                      <td className="p-2">Fixed phase relationship</td>
                      <td className="p-2">Random phases across spectrum</td>
                    </tr>
                    <tr className="border-t">
                      <td className="p-2 font-medium">Power distribution</td>
                      <td className="p-2">All power at one frequency</td>
                      <td className="p-2">Equal power across all frequencies</td>
                    </tr>
                    <tr className="border-t">
                      <td className="p-2 font-medium">Capacitive current</td>
                      <td className="p-2">I<sub>C</sub> = V<sub>RMS</sub>·2πfC</td>
                      <td className="p-2">Requires frequency band integration</td>
                    </tr>
                    <tr className="border-t">
                      <td className="p-2 font-medium">Circuit response</td>
                      <td className="p-2">Determined by single ωRC value</td>
                      <td className="p-2">Integrated response across all frequencies</td>
                    </tr>
                    <tr className="border-t">
                      <td className="p-2 font-medium">Effective ωRC</td>
                      <td className="p-2">Single value: 2πfRC</td>
                      <td className="p-2">Varies across frequency band</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Other noise mode sections remain unchanged */}
            </div>
          )}
          
          {activeTab === 'safety' && (
            <div className="space-y-8">
              {/* Safety sections remain unchanged */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MathematicalModelModal;