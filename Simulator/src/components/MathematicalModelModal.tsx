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

              {/* New Section: Transition Frequency Formula */}
              <div className="bg-gray-50 p-4 rounded shadow border-l-4 border-indigo-300">
                <h3 className="font-medium mb-3 text-lg">Transition Frequency</h3>
                <div className="space-y-3">
                  <p className="font-semibold">The transition frequency occurs when ωRC = 1, where the circuit shifts from resistive to capacitive behavior</p>
                  
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="text-center font-medium">f<sub>transition</sub> = 1/(2πRC)</p>
                  </div>
                  
                  <p>At this frequency:</p>
                  <ul className="list-disc ml-5">
                    <li>Resistive and capacitive currents are equal: I<sub>R</sub> = I<sub>C</sub></li>
                    <li>Phase angle is 45° (halfway between 0° and 90°)</li>
                    <li>Power factor is 0.707 (1/√2)</li>
                    <li>Impedance is 0.707×R (R/√2)</li>
                  </ul>
                  
                  <p>In the frequency response chart, this transition point is marked with a vertical red dashed line.</p>
                  
                  <div className="bg-blue-50 p-3 rounded text-sm">
                    <p className="font-medium">Example calculation:</p>
                    <p>For R = 10 kΩ and C = 1 μF:</p>
                    <p>f<sub>transition</sub> = 1/(2π × 10×10<sup>3</sup> × 1×10<sup>-6</sup>) = 15.9 Hz</p>
                  </div>
                  
                  <p className="text-sm italic">This critical frequency is also called the "corner frequency" or "cutoff frequency" in filter design.</p>
                </div>
              </div>
              
              {/* Alternate Impedance Representation */}
              <div className="bg-gray-50 p-4 rounded shadow border-l-4 border-purple-300">
                <h3 className="font-medium mb-3 text-lg">Impedance Representations</h3>
                <div className="space-y-2">
                  <p className="font-semibold">The impedance of a parallel RC circuit can be represented in multiple equivalent forms:</p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <p className="text-center font-medium mb-2">Application Form</p>
                      <p className="text-center">Z = R/√(1 + (ωRC)<sup>2</sup>)</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <p className="text-center font-medium mb-2">Textbook Form</p>
                      <p className="text-center">Z = 1/√((1/R)<sup>2</sup> + (ωC)<sup>2</sup>)</p>
                    </div>
                  </div>
                  
                  <p className="mt-3">These forms are mathematically equivalent, derived from the parallel impedance formula:</p>
                  <div className="bg-white p-3 rounded border border-gray-200 mt-2">
                    <p>1/Z = 1/R + jωC</p>
                    <p>Z = R/(1 + jωRC)</p>
                    <p>|Z| = R/√(1 + (ωRC)<sup>2</sup>)</p>
                  </div>
                </div>
              </div>
              
              {/* Vector Current Relationship */}
              <div className="bg-gray-50 p-4 rounded shadow border-l-4 border-purple-300">
                <h3 className="font-medium mb-3 text-lg">Vector Current Relationship</h3>
                <div className="space-y-2">
                  <p className="font-semibold">Why resistive and capacitive currents don&apos;t add to 100%:</p>
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
                    <p className="text-center mb-2">Mathematical derivation:</p>
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
              
              {/* White Noise vs Sine Wave Comparison */}
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
              
              {/* Noise Bandwidth Analysis */}
              <div className="bg-gray-50 p-4 rounded shadow border-l-4 border-blue-300">
                <h3 className="font-medium mb-3 text-lg">Noise Bandwidth Effects</h3>
                <div className="space-y-3">
                  <p>Bandwidth selection significantly impacts the circuit response in noise mode:</p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <p className="font-medium mb-2">Narrow Bandwidth</p>
                      <ul className="list-disc ml-5">
                        <li>More predictable response</li>
                        <li>Less frequency-dependent variation</li>
                        <li>Closer to sine wave model if bandwidth is very narrow</li>
                        <li>Lower capacitive current contribution</li>
                      </ul>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <p className="font-medium mb-2">Wide Bandwidth</p>
                      <ul className="list-disc ml-5">
                        <li>Complex integrated response</li>
                        <li>Higher frequencies dominate capacitive current</li>
                        <li>Greater divergence from sine wave model</li>
                        <li>Higher overall current for same RMS voltage</li>
                      </ul>
                    </div>
                  </div>
                  
                  <p className="mt-2">Key calculation insight: The capacitive current increases with the cube root of the upper frequency limit due to the f³ term in the integration formula.</p>
                </div>
              </div>
              
              {/* Noise Regime Classification - Added from new version */}
              <div className="bg-gray-50 p-4 rounded shadow border-l-4 border-purple-300">
                <h3 className="font-medium mb-3 text-lg">Noise Regime Classification</h3>
                <div className="space-y-3">
                  <p>When analyzing RC circuits under white noise excitation, we classify the circuit's behavior into regimes based on the "effective ωRC" value:</p>
                  
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <ol className="list-decimal ml-5 space-y-1">
                      <li>For <strong>predominantly resistive</strong> circuits: effective ωRC &lt; 0.5</li>
                      <li>For <strong>transition region</strong>: 0.5 ≤ effective ωRC ≤ 1.5</li>
                      <li>For <strong>predominantly capacitive</strong> circuits: effective ωRC &gt; 1.5</li>
                    </ol>
                  </div>
                  
                  <p>The effective ωRC for noise is calculated using frequency-weighted integration across the band:</p>
    <div className="bg-white p-3 rounded border border-gray-200">
      <p className="mb-2">effective ωRC = 2πRC × 3(f<sub>max</sub><sup>4</sup> - f<sub>min</sub><sup>4</sup>)/(4(f<sub>max</sub><sup>3</sup> - f<sub>min</sub><sup>3</sup>))</p>
      <p className="text-sm text-gray-600">This frequency-weighted approach accounts for the fact that higher frequencies contribute more to capacitive behavior</p>
    </div>

    <div className="bg-blue-50 p-3 rounded text-sm mt-2">
      <p className="font-medium">Mathematical derivation:</p>
      <p>1. For a frequency-weighted average of ωRC, we integrate across the frequency band:</p>
      <p className="ml-4">∫(2πfRC × f²) df / ∫f² df from f<sub>min</sub> to f<sub>max</sub></p>
      <p>2. The f² weighting reflects how capacitive current contribution scales with frequency</p>
      <p>3. Solving the integrals yields the formula above</p>
    </div>
                  
                  <p className="text-sm">Note: This integration-based approach provides a more accurate representation than the simple center frequency approximation, especially for wide frequency bands.</p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'safety' && (
            <div className="space-y-8">
              <div className="bg-gray-50 p-4 rounded shadow border-l-4 border-purple-300">
                <h3 className="font-medium mb-3 text-lg">Human Body Application</h3>
                <ul className="list-disc pl-5">
                  <li><strong>Typical human body circuit:</strong> Resistive dominated (ωRC range of 0.001-0.2)</li>
                  <li><strong>Safety threshold:</strong> Typically 500 μA (0.5 mA) for most human body applications</li>
                  <li><strong>Risk levels:</strong>
                    <ul className="list-disc ml-5 mt-1">
                      <li>1-5 mA: Perception threshold, mild tingling sensation</li>
                      <li>5-10 mA: Painful shock, potential "can&apos;t let go" phenomenon</li>
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
              
              {/* Human Body Electrical Model */}
              <div className="bg-gray-50 p-4 rounded shadow border-l-4 border-yellow-300">
                <h3 className="font-medium mb-3 text-lg">Human Body Electrical Model</h3>
                <div className="space-y-3">
                  <p className="font-semibold">The human body can be modeled as a complex RC circuit:</p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <p className="font-medium mb-2">Resistance Components</p>
                      <ul className="list-disc ml-5">
                        <li>Skin resistance: 1-100 kΩ (varies with moisture)</li>
                        <li>Internal body resistance: 300-1000 Ω</li>
                        <li>Contact resistance: Variable based on contact area</li>
                        <li>Hand-to-hand path: ~1500 Ω typical</li>
                        <li>Hand-to-foot path: ~1000 Ω typical</li>
                      </ul>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <p className="font-medium mb-2">Capacitance Components</p>
                      <ul className="list-disc ml-5">
                        <li>Cell membrane capacitance</li>
                        <li>Skin capacitance: 10-40 nF</li>
                        <li>Body-to-ground capacitance: 100-200 pF</li>
                        <li>Frequency-dependent behavior</li>
                        <li>Skin impedance decreases at higher frequencies</li>
                      </ul>
                    </div>
                  </div>
                  
                  <p className="mt-3">The human body&apos;s electrical response varies significantly with frequency:</p>
                  <ul className="list-disc ml-5">
                    <li>At low frequencies (&le;1 kHz), the body behaves primarily as a resistor</li>
                    <li>At high frequencies (&gt;10 kHz), capacitive effects become more significant</li>
                    <li>This changes both the path of current flow and the physiological effects</li>
                  </ul>
                  
                  <div className="bg-yellow-50 p-3 rounded text-sm mt-3">
                    <p className="font-medium">Important safety consideration:</p>
                    <p>The perception threshold of 500 μA is valid for DC to 100 Hz. At higher frequencies, this threshold increases, but safety standards typically use the 50-60 Hz threshold as a conservative baseline for all applications.</p>
                  </div>
                </div>
              </div>
              
              {/* Noise vs Sine Wave Safety */}
              <div className="bg-gray-50 p-4 rounded shadow border-l-4 border-orange-300">
                <h3 className="font-medium mb-3 text-lg">Safety: Noise vs Sine Wave</h3>
                <div className="space-y-3">
                  <p>Different signal types can have different safety implications:</p>
                  
                  <table className="w-full border-collapse mt-2">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="p-2 text-left">Aspect</th>
                        <th className="p-2 text-left">Sine Wave</th>
                        <th className="p-2 text-left">White Noise</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="p-2 font-medium">Perception</td>
                        <td className="p-2">Strong periodic sensation</td>
                        <td className="p-2">Diffuse, broadband sensation</td>
                      </tr>
                      <tr className="border-t">
                        <td className="p-2 font-medium">Muscle response</td>
                        <td className="p-2">Can cause rhythmic contraction</td>
                        <td className="p-2">Less coordinated muscle response</td>
                      </tr>
                      <tr className="border-t">
                        <td className="p-2 font-medium">Cardiac risk</td>
                        <td className="p-2">Higher risk at 50-60 Hz</td>
                        <td className="p-2">Risk depends on spectral content</td>
                      </tr>
                      <tr className="border-t">
                        <td className="p-2 font-medium">Current threshold</td>
                        <td className="p-2">Well-established standards</td>
                        <td className="p-2">More complex to assess</td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <p className="mt-3 text-sm italic">Note: Safety assessments for noise signals typically use the RMS current and the most dangerous frequency components to establish a conservative safety threshold.</p>
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