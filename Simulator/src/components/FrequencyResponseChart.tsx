import React, { useRef, useEffect } from 'react';
import { FrequencyResponseData, CircuitResults } from '../types';

// Props for FrequencyResponseChart
interface FrequencyResponseChartProps {
  frequencyResponseData: FrequencyResponseData;
  results: CircuitResults;
}

// Optimized frequency response chart component
const FrequencyResponseChart: React.FC<FrequencyResponseChartProps> = ({ 
  frequencyResponseData, 
  results 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { data, transitionFrequency, currentFrequency, error } = frequencyResponseData;
  const { wRC } = results;

  // Track rendering to avoid unnecessary redraws
  const renderCountRef = useRef(0);

  // Define drawing functions inside useEffect to avoid dependency issues
  useEffect(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas || !data || data.length === 0) return;

      // Skip rendering if data hasn't changed meaningfully
      renderCountRef.current++;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const margin = { top: 30, right: 70, bottom: 50, left: 70 };
      const plotWidth = width - margin.left - margin.right;
      const plotHeight = height - margin.top - margin.bottom;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // If there's an error, show error message
      if (error) {
        ctx.fillStyle = 'red';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Error generating frequency response data', width / 2, height / 2);
        ctx.font = '12px Arial';
        ctx.fillText('Try adjusting parameters to valid ranges', width / 2, height / 2 + 20);
        return;
      }

      // Bail out if data is invalid
      if (!Array.isArray(data) || data.length === 0) {
        ctx.fillStyle = 'orange';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No frequency response data available', width / 2, height / 2);
        return;
      }

      // Handle edge cases
      if (!isFinite(currentFrequency) || isNaN(currentFrequency) ||
        data.some(d => !isFinite(d.impedance) || !isFinite(d.current) || !isFinite(d.phaseAngle))) {
        ctx.fillStyle = 'orange';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Invalid parameter values causing calculation errors', width / 2, height / 2);
        return;
      }

      // Calculate data ranges safely
      const minFreq = Math.min(...data.map(d => d.frequency));
      const maxFreq = Math.max(...data.map(d => d.frequency));

      // Protect against zero or infinity
      if (minFreq <= 0 || !isFinite(minFreq) || maxFreq <= 0 || !isFinite(maxFreq) || minFreq === maxFreq) {
        ctx.fillStyle = 'orange';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Invalid frequency range', width / 2, height / 2);
        return;
      }

      const logMin = Math.log10(minFreq);
      const logMax = Math.log10(maxFreq);

      // Calculate max values with protection against NaN or infinity
      const validCurrents = data.map(d => d.current).filter(c => isFinite(c) && !isNaN(c));
      const validImpedances = data.map(d => d.impedance).filter(i => isFinite(i) && !isNaN(i));

      const maxCurrent = validCurrents.length > 0 ?
        Math.max(...validCurrents, 0.01) * 1.2 : 0.01;
      const maxImpedance = validImpedances.length > 0 ?
        Math.max(...validImpedances, 100) * 1.2 : 100;

      // Find current operating point safely
      const opX = Math.max(margin.left, Math.min(
        margin.left + (Math.log10(currentFrequency) - logMin) / (logMax - logMin) * plotWidth,
        width - margin.right
      ));

      const currentDataPoint = data.reduce((closest, point) => {
        return Math.abs(point.frequency - currentFrequency) <
          Math.abs(closest.frequency - currentFrequency) ? point : closest;
      }, data[0]);

      // Helper functions for drawing the chart
      const drawChartFrame = () => {
        // Title
        ctx.fillStyle = 'black';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Frequency Response Curves', width / 2, margin.top / 2);

        // X-axis
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(margin.left, height - margin.bottom);
        ctx.lineTo(width - margin.right, height - margin.bottom);
        ctx.stroke();

        // X-axis label
        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Frequency (Hz)', width / 2, height - 10);

        // X-axis ticks with safety checks
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Determine reasonable tick spacing
        const logSpan = logMax - logMin;
        const maxTicks = 10; // Prevent too many ticks
        let tickStep = 1; // Default to every power of 10

        if (logSpan > maxTicks) {
          tickStep = Math.ceil(logSpan / maxTicks);
        }

        // Generate ticks safely
        for (let i = Math.ceil(logMin); i <= Math.floor(logMax); i += tickStep) {
          try {
            const tickFreq = Math.pow(10, i);
            if (!isFinite(tickFreq)) continue;

            const x = margin.left + (Math.log10(tickFreq) - logMin) / (logMax - logMin) * plotWidth;

            // Skip out-of-bounds ticks
            if (x < margin.left || x > width - margin.right) continue;

            ctx.beginPath();
            ctx.moveTo(x, height - margin.bottom);
            ctx.lineTo(x, height - margin.bottom + 5);
            ctx.stroke();

            // Format tick labels using scientific notation for extreme values
            let tickLabel = tickFreq.toString();
            if (tickFreq >= 1e6 || tickFreq <= 1e-3) {
              tickLabel = tickFreq.toExponential(0);
            } else if (tickFreq >= 1e3) {
              tickLabel = (tickFreq / 1e3).toFixed(0) + 'k';
            }

            ctx.fillText(tickLabel, x, height - margin.bottom + 8);
          } catch (error) {
            console.error("Error drawing tick:", error);
            // Continue with next tick
          }
        }

        // Left y-axis (Current/Phase)
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top);
        ctx.lineTo(margin.left, height - margin.bottom);
        ctx.stroke();

        ctx.fillStyle = '#0066cc';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('Current / Phase', margin.left - 10, margin.top - 15);

        // Right y-axis (Impedance)
        ctx.beginPath();
        ctx.moveTo(width - margin.right, margin.top);
        ctx.lineTo(width - margin.right, height - margin.bottom);
        ctx.stroke();

        ctx.fillStyle = '#cc6600';
        ctx.textAlign = 'left';
        ctx.fillText('Impedance', width - margin.right + 10, margin.top - 15);
      };

      const drawImpedanceCurve = () => {
        if (!maxImpedance || maxImpedance <= 0) return;

        ctx.strokeStyle = '#cc6600';
        ctx.lineWidth = 2;
        ctx.beginPath();

        let isFirstPoint = true;

        for (let i = 0; i < data.length; i++) {
          try {
            const d = data[i];

            // Skip invalid data points
            if (!isFinite(d.frequency) || !isFinite(d.impedance) || d.frequency <= 0) {
              continue;
            }

            const x = margin.left + (Math.log10(d.frequency) - logMin) / (logMax - logMin) * plotWidth;
            // Limit the y value to prevent drawing outside the chart area
            const rawY = height - margin.bottom - (d.impedance / maxImpedance * plotHeight);
            const y = Math.max(margin.top, Math.min(height - margin.bottom, rawY));

            if (isFirstPoint) {
              ctx.moveTo(x, y);
              isFirstPoint = false;
            } else {
              ctx.lineTo(x, y);
            }
          } catch (error) {
            console.error("Error drawing impedance point:", error);
            // Continue with next point
          }
        }

        if (!isFirstPoint) { // Only stroke if we've added points
          ctx.stroke();
        }

        // Label
        ctx.fillStyle = '#cc6600';
        ctx.textAlign = 'left';
        ctx.fillText('Impedance (Ω)', margin.left + plotWidth + 10, margin.top);
      };

      const drawCurrentCurve = () => {
        if (!maxCurrent || maxCurrent <= 0) return;

        ctx.strokeStyle = '#0066cc';
        ctx.lineWidth = 2;
        ctx.beginPath();

        let isFirstPoint = true;

        for (let i = 0; i < data.length; i++) {
          try {
            const d = data[i];

            // Skip invalid data points
            if (!isFinite(d.frequency) || !isFinite(d.current) || d.frequency <= 0) {
              continue;
            }

            const x = margin.left + (Math.log10(d.frequency) - logMin) / (logMax - logMin) * plotWidth;
            // Limit the y value to prevent drawing outside the chart area
            const rawY = height - margin.bottom - (d.current / maxCurrent * plotHeight);
            const y = Math.max(margin.top, Math.min(height - margin.bottom, rawY));

            if (isFirstPoint) {
              ctx.moveTo(x, y);
              isFirstPoint = false;
            } else {
              ctx.lineTo(x, y);
            }
          } catch (error) {
            console.error("Error drawing current point:", error);
            // Continue with next point
          }
        }

        if (!isFirstPoint) { // Only stroke if we've added points
          ctx.stroke();
        }

        // Label
        ctx.fillStyle = '#0066cc';
        ctx.textAlign = 'right';
        ctx.fillText('Current (normalized)', margin.left - 10, margin.top);
      };

      const drawPhaseCurve = () => {
        ctx.strokeStyle = '#9933cc';
        ctx.lineWidth = 2;
        ctx.beginPath();

        let isFirstPoint = true;

        for (let i = 0; i < data.length; i++) {
          try {
            const d = data[i];

            // Skip invalid data points
            if (!isFinite(d.frequency) || !isFinite(d.phaseAngle) || d.frequency <= 0) {
              continue;
            }

            const x = margin.left + (Math.log10(d.frequency) - logMin) / (logMax - logMin) * plotWidth;
            // Limit the y value to prevent drawing outside the chart area
            const rawY = height - margin.bottom - (d.phaseAngle / 90 * plotHeight);
            const y = Math.max(margin.top, Math.min(height - margin.bottom, rawY));

            if (isFirstPoint) {
              ctx.moveTo(x, y);
              isFirstPoint = false;
            } else {
              ctx.lineTo(x, y);
            }
          } catch (error) {
            console.error("Error drawing phase point:", error);
            // Continue with next point
          }
        }

        if (!isFirstPoint) { // Only stroke if we've added points
          ctx.stroke();
        }

        // Label
        ctx.fillStyle = '#9933cc';
        ctx.textAlign = 'right';
        ctx.fillText('Phase Angle (°)', margin.left - 10, margin.top + 20);
      };

      const drawOperatingPoint = () => {
        try {
          // Check for valid data
          if (!isFinite(currentDataPoint.impedance) || !isFinite(currentDataPoint.current) ||
            !isFinite(currentDataPoint.phaseAngle) || !maxCurrent || !maxImpedance) {
            return;
          }

          // Impedance point
          const rawImpedanceY = height - margin.bottom - (currentDataPoint.impedance / maxImpedance * plotHeight);
          const opImpedanceY = Math.max(margin.top, Math.min(height - margin.bottom, rawImpedanceY));

          ctx.fillStyle = '#cc6600';
          ctx.beginPath();
          ctx.arc(opX, opImpedanceY, 5, 0, 2 * Math.PI);
          ctx.fill();

          // Current point
          const rawCurrentY = height - margin.bottom - (currentDataPoint.current / maxCurrent * plotHeight);
          const opCurrentY = Math.max(margin.top, Math.min(height - margin.bottom, rawCurrentY));

          ctx.fillStyle = '#0066cc';
          ctx.beginPath();
          ctx.arc(opX, opCurrentY, 5, 0, 2 * Math.PI);
          ctx.fill();

          // Phase angle point
          const rawPhaseY = height - margin.bottom - (currentDataPoint.phaseAngle / 90 * plotHeight);
          const opPhaseY = Math.max(margin.top, Math.min(height - margin.bottom, rawPhaseY));

          ctx.fillStyle = '#9933cc';
          ctx.beginPath();
          ctx.arc(opX, opPhaseY, 5, 0, 2 * Math.PI);
          ctx.fill();

          // Operating frequency line
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(opX, margin.top);
          ctx.lineTo(opX, height - margin.bottom);
          ctx.stroke();
          ctx.setLineDash([]);

          // Labels
          ctx.fillStyle = 'black';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';

          // Format labels for extreme values
          let freqLabel = currentDataPoint.frequency.toFixed(2) + " Hz";
          if (currentDataPoint.frequency >= 1e6 || currentDataPoint.frequency <= 1e-3) {
            freqLabel = currentDataPoint.frequency.toExponential(2) + " Hz";
          } else if (currentDataPoint.frequency >= 1e3) {
            freqLabel = (currentDataPoint.frequency / 1e3).toFixed(2) + " kHz";
          }

          ctx.fillText(`f = ${freqLabel}`, opX, height - margin.bottom + 15);
          ctx.fillText(`ωRC = ${currentDataPoint.wRC.toFixed(2)}`, opX, height - margin.bottom + 30);
        } catch (error) {
          console.error("Error drawing operating point:", error);
        }
      };

      const drawTransitionPoint = () => {
        try {
          // Check for valid transition frequency
          if (!isFinite(transitionFrequency) || transitionFrequency <= 0) return;

          // Check if transition point is within range
          if (transitionFrequency >= minFreq && transitionFrequency <= maxFreq) {
            const transitionX = margin.left + (Math.log10(transitionFrequency) - logMin) / (logMax - logMin) * plotWidth;

            // Ensure x is within chart bounds
            if (transitionX >= margin.left && transitionX <= (margin.left + plotWidth)) {
              ctx.strokeStyle = 'red';
              ctx.lineWidth = 1;
              ctx.setLineDash([5, 3]);
              ctx.beginPath();
              ctx.moveTo(transitionX, margin.top);
              ctx.lineTo(transitionX, height - margin.bottom);
              ctx.stroke();
              ctx.setLineDash([]);

              ctx.fillStyle = 'red';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';
              ctx.fillText('ωRC = 1', transitionX, margin.top - 5);
            }
          }
        } catch (error) {
          console.error("Error drawing transition point:", error);
        }
      };

      const drawLegend = () => {
        try {
          const legendX = width - margin.right - 120;
          const legendY = margin.top + 20;

          // Impedance
          ctx.strokeStyle = '#cc6600';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(legendX, legendY);
          ctx.lineTo(legendX + 20, legendY);
          ctx.stroke();

          ctx.fillStyle = '#cc6600';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText('Impedance', legendX + 25, legendY);

          // Current
          ctx.strokeStyle = '#0066cc';
          ctx.beginPath();
          ctx.moveTo(legendX, legendY + 20);
          ctx.lineTo(legendX + 20, legendY + 20);
          ctx.stroke();

          ctx.fillStyle = '#0066cc';
          ctx.fillText('Current', legendX + 25, legendY + 20);

          // Phase
          ctx.strokeStyle = '#9933cc';
          ctx.beginPath();
          ctx.moveTo(legendX, legendY + 40);
          ctx.lineTo(legendX + 20, legendY + 40);
          ctx.stroke();

          ctx.fillStyle = '#9933cc';
          ctx.fillText('Phase Angle', legendX + 25, legendY + 40);
        } catch (error) {
          console.error("Error drawing legend:", error);
        }
      };

      // Draw chart with comprehensive error handling
      try {
        drawChartFrame();

        // Only draw curves if we have valid data
        if (validImpedances.length > 0) {
          drawImpedanceCurve();
        }

        if (validCurrents.length > 0) {
          drawCurrentCurve();
        }

        drawPhaseCurve();

        // Only draw points if we have a valid current data point
        if (isFinite(currentDataPoint.impedance) && isFinite(currentDataPoint.current)) {
          drawOperatingPoint();
        }

        // Only draw transition if it's within range and valid
        if (isFinite(transitionFrequency) && transitionFrequency > minFreq && transitionFrequency < maxFreq) {
          drawTransitionPoint();
        }

        drawLegend();

        // Add note about sine wave assumptions
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.font = 'italic 10px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('Note: All calculations assume pure sine waves in AC steady state', width - margin.right, height - 5);
      } catch (chartError) {
        console.error("Chart rendering error:", chartError);
        ctx.fillStyle = 'red';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Error rendering chart', width / 2, height / 2);
      }

    } catch (error) {
      console.error("Error in frequency response chart:", error);
    }

    // Clean up function
    return () => {
      // Access canvasRef.current directly in cleanup
      const canvasElement = canvasRef.current;
      if (canvasElement) {
        const ctx = canvasElement.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        }
      }
    };
  }, [data, transitionFrequency, currentFrequency, wRC, error]);

  // Show error state if calculations failed
  if (error) {
    return (
      <div className="mb-4">
        <div className="border border-red-300 bg-red-50 p-4 rounded-md mb-4">
          <h3 className="text-red-700 font-medium mb-2">Chart Generation Error</h3>
          <p className="text-red-600 text-sm">{error}</p>
          <p className="text-red-600 text-sm mt-2">
            Try adjusting parameters to physically reasonable values.
          </p>
        </div>

        <canvas
          ref={canvasRef}
          width="700"
          height="400"
          className="border border-gray-300 rounded mx-auto"
        />
      </div>
    );
  }

  return (
    <div className="mb-4">
      <canvas
        ref={canvasRef}
        width="700"
        height="400"
        className="border border-gray-300 rounded mx-auto"
      />

      <div className="mt-2 text-sm text-center text-gray-600">
        This graph shows how the circuit responds across a frequency range. The blue line shows current,
        the orange line shows impedance, and the purple line shows phase angle. The vertical red line marks
        the transition point (ωRC = 1) between resistive and capacitive regimes.
        The current operating point is marked with colored dots on each curve.
      </div>

      <div className="mt-1 text-xs text-center text-gray-500 italic">
        Note: All calculations assume pure sine waves in AC steady state.
        Safety thresholds are valid for frequencies up to 2 kHz.
      </div>
    </div>
  );
};

export default FrequencyResponseChart;