import React, { useState } from 'react';
import { X } from 'lucide-react';

interface MathematicalModelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MathematicalModelModal: React.FC<MathematicalModelModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'equations' | 'safety'>('equations');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-xl font-semibold">Circuit Theory & Safety Reference</h2>
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
              activeTab === 'equations' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-blue-500'
            }`}
            onClick={() => setActiveTab('equations')}
          >
            Mathematical Models
          </button>
          <button
            className={`py-3 px-6 font-medium ${
              activeTab === 'safety' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-blue-500'
            }`}
            onClick={() => setActiveTab('safety')}
          >
            Human Body Application
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {activeTab === 'equations' ? (
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
              
              <div className="bg-gray-50 p-4 rounded shadow border-l-4 border-green-300">
                <h3 className="font-medium mb-3 text-lg">White Noise Model</h3>
                <div className="space-y-2">
                  <p>I<sub>total,RMS</sub> = √(I<sub>R,RMS</sub><sup>2</sup> + I<sub>C,RMS</sub><sup>2</sup>)</p>
                  <p>I<sub>R,RMS</sub> = V<sub>RMS</sub>/R</p>
                  <p>I<sub>C,RMS</sub> = V<sub>RMS</sub>·2πC·√[(f<sub>max</sub><sup>3</sup> - f<sub>min</sub><sup>3</sup>)/(3·(f<sub>max</sub> - f<sub>min</sub>))]</p>
                  <p className="mt-2 font-semibold">White noise has equal power across all frequencies</p>
                  <p>For a band-limited white noise from f<sub>min</sub> to f<sub>max</sub>:</p>
                  <ul className="list-disc ml-5 mt-2">
                    <li>Higher frequencies contribute more to capacitive current</li>
                    <li>Capacitive reactance decreases with frequency: X<sub>C</sub> = 1/(2πfC)</li>
                    <li>The RMS capacitive current requires integrating over the frequency range</li>
                  </ul>
                </div>
              </div>
              
              {/* New section explaining vector currents and percentages */}
              <div className="bg-gray-50 p-4 rounded shadow border-l-4 border-purple-300">
                <h3 className="font-medium mb-3 text-lg">Vector Current Relationship</h3>
                <div className="space-y-2">
                  <p className="font-semibold">Why resistive and capacitive currents don't add to 100%:</p>
                  <p>In AC circuits, currents are vectors with both magnitude and direction (phase).</p>
                  
                  <div className="bg-white p-4 rounded my-3 border border-gray-200">
                    <div className="flex items-center justify-center">
                      <div className="relative h-40 w-40">
                        {/* Coordinate axes */}
                        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gray-300"></div>
                        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-300"></div>
                        
                        {/* Vector arrows */}
                        <div className="absolute top-1/2 left-1/2 w-16 h-0.5 bg-green-500 origin-left rotate-0"></div>
                        <div className="absolute top-1/2 left-1/2 h-16 w-0.5 bg-blue-500 origin-top rotate-0 -translate-y-full"></div>
                        <div className="absolute top-1/2 left-1/2 w-[90px] h-0.5 bg-red-500 origin-left rotate-45 -translate-y-[45px]"></div>
                        
                        {/* Labels */}
                        <div className="absolute top-1/2 left-[75%] text-green-700 font-medium">I<sub>R</sub></div>
                        <div className="absolute top-[15%] left-1/2 text-blue-700 font-medium">I<sub>C</sub></div>
                        <div className="absolute top-[25%] left-[80%] text-red-700 font-medium">I<sub>total</sub></div>
                      </div>
                    </div>
                    <p className="text-center text-sm mt-2">Currents as vectors: Resistive (horizontal), Capacitive (vertical), Total (diagonal)</p>
                  </div>
                  
                  <p><strong>Key insights:</strong></p>
                  <ul className="list-disc ml-5">
                    <li>Resistive current (I<sub>R</sub>) and capacitive current (I<sub>C</sub>) are 90° out of phase</li>
                    <li>The total current (I<sub>total</sub>) is calculated using the Pythagorean theorem</li>
                    <li>When each current is expressed as a percentage of the total:
                      <ul className="list-disc ml-5 mt-1">
                        <li>Resistive %: (I<sub>R</sub>/I<sub>total</sub>) × 100%</li>
                        <li>Capacitive %: (I<sub>C</sub>/I<sub>total</sub>) × 100%</li>
                      </ul>
                    </li>
                    <li>These percentages can each approach 100% and their sum can exceed 100%</li>
                    <li>But the sum of their squares will always equal 100%:
                      <div className="bg-gray-100 p-2 mt-1 rounded text-center">
                        (Resistive %)² + (Capacitive %)² = 100%
                      </div>
                    </li>
                  </ul>
                  
                  <p className="mt-2">For example, in a circuit with equal resistive and capacitive components (ωRC = 1):</p>
                  <ul className="list-disc ml-5">
                    <li>I<sub>R</sub> = I<sub>C</sub> (equal currents)</li>
                    <li>I<sub>total</sub> = √(I<sub>R</sub>² + I<sub>C</sub>²) = √2 × I<sub>R</sub></li>
                    <li>Resistive % = (I<sub>R</sub>/I<sub>total</sub>) × 100% = 70.7%</li>
                    <li>Capacitive % = (I<sub>C</sub>/I<sub>total</sub>) × 100% = 70.7%</li>
                    <li>Sum = 141.4%, but (70.7%)² + (70.7%)² = 100%</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded shadow border-l-4 border-gray-300">
                <h3 className="font-medium mb-3 text-lg">Comparison</h3>
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
                      <td className="p-2 font-medium">Circuit response</td>
                      <td className="p-2">Determined by single ωRC value</td>
                      <td className="p-2">Integrated response across all frequencies</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="bg-gray-50 p-4 rounded shadow border-l-4 border-purple-300">
                <h3 className="font-medium mb-3 text-lg">Human Body Application</h3>
                <ul className="list-disc pl-5">
                  <li><strong>Typical human body circuit:</strong> Resistive dominated (ωRC range of 0.001-0.2)</li>
                  <li><strong>Safety threshold:</strong> Typically 500 μA (0.5 mA) for most human body applications</li>
                  <li><strong>Risk levels:</strong>
                    <ul className="list-disc ml-5 mt-1">
                      <li>1-5 mA: Perception threshold, mild tingling sensation</li>
                      <li>5-10 mA: Painful shock, potential "can't let go" phenomenon</li>
                      <li>10-100 mA: Muscle contraction, respiratory paralysis</li>
                      <li>&gt;100 mA: Ventricular fibrillation, potentially lethal</li>
                    </ul>
                  </li>
                  <li><strong>Path matters:</strong> Current across the heart is more dangerous than across extremities</li>
                </ul>
                
                <div className="mt-4 bg-blue-50 p-3 rounded text-sm">
                  <strong>Note:</strong> Safety thresholds are frequency-dependent in reality. The model used here is 
                  applicable for frequencies up to 2 kHz. At higher frequencies, human sensitivity to electrical current 
                  changes significantly.
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded shadow border-l-4 border-red-300">
                <h3 className="font-medium mb-3 text-lg">Safety Considerations</h3>
                <div className="space-y-3">
                  <p><strong>Frequency dependence:</strong> The human body is primarily resistive at low frequencies, but 
                  capacitive elements become more significant at higher frequencies.</p>
                  
                  <p><strong>IEC 60479 standards</strong> specify frequency-dependent safety thresholds:</p>
                  <ul className="list-disc ml-5">
                    <li>DC: Higher thresholds compared to AC</li>
                    <li>15-100 Hz: Most dangerous frequency range</li>
                    <li>&gt;1000 Hz: Higher thresholds due to reduced physiological effects</li>
                  </ul>
                  
                  <p><strong>Circuit design recommendations:</strong></p>
                  <ul className="list-disc ml-5">
                    <li>Maintain current levels below 500 μA for body-contact applications</li>
                    <li>Include current-limiting resistors in human-interfacing circuits</li>
                    <li>Consider isolation methods for higher voltage applications</li>
                    <li>Use GFCIs (Ground Fault Circuit Interrupters) for additional protection</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MathematicalModelModal;