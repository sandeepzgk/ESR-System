import React, { useRef, useEffect, useState } from 'react';
import { FrequencyResponseData, CircuitResults } from '../types';

interface FrequencyResponseChartProps {
  frequencyResponseData: FrequencyResponseData;
  results: CircuitResults;
  signalType: 'sine' | 'noise';
}

const FrequencyResponseChart: React.FC<FrequencyResponseChartProps> = ({
  frequencyResponseData,
  results,
  signalType
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data, transitionFrequency, currentFrequency, error } = frequencyResponseData;
  const { wRC, noiseBandwidth } = results;

  // Track container size for responsive rendering
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Track rendering to avoid unnecessary redraws
  const renderCountRef = useRef<number>(0);

  // Set up resize observer to handle responsive canvas
  useEffect(() => {
    if (!containerRef.current) return;

    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Keep a reasonable aspect ratio
        const height = Math.max(400, Math.min(550, rect.width * 0.6));
        setContainerSize({ width: rect.width, height });
      }
    };

    // Initial size calculation
    updateContainerSize();

    // Set up resize observer
    const resizeObserver = new ResizeObserver(updateContainerSize);
    resizeObserver.observe(containerRef.current);

    // Cleanup
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      resizeObserver.disconnect();
    };
  }, []);

  // Define drawing functions inside useEffect to avoid dependency issues
  useEffect(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas || containerSize.width === 0) return;

      // Set canvas dimensions based on container size
      canvas.width = containerSize.width;
      canvas.height = containerSize.height;

      // Set up high DPI canvas for crisp rendering
      const setupHiDPICanvas = (canvas: HTMLCanvasElement) => {
        // Get the device pixel ratio
        const dpr = window.devicePixelRatio || 1;
        
        // Get the current CSS dimensions
        const rect = canvas.getBoundingClientRect();
        
        // Logical size (CSS pixels)
        const logicalWidth = rect.width;
        const logicalHeight = rect.height;
        
        // Physical size (actual pixels)
        canvas.width = logicalWidth * dpr;
        canvas.height = logicalHeight * dpr;
        
        // Set display size via CSS
        canvas.style.width = `${logicalWidth}px`;
        canvas.style.height = `${logicalHeight}px`;
        
        // Get the context and scale it
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
          return { ctx, width: logicalWidth, height: logicalHeight, dpr };
        }
        return null;
      };

      // Initialize the HiDPI canvas
      const canvasSetup = setupHiDPICanvas(canvas);
      if (!canvasSetup) return;
      
      const { ctx, width, height, dpr } = canvasSetup;
      
      // Clear the canvas
      ctx.clearRect(0, 0, width, height);

      // Skip rendering if in noise mode - not applicable
      if (signalType === 'noise') {
        // Display message explaining chart is not available in noise mode
        ctx.fillStyle = '#666';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Frequency response chart not available in noise mode', width / 2, height / 2 - 20);

        ctx.font = '14px Arial';
        ctx.fillText('This visualization applies only to single-frequency sine wave analysis', width / 2, height / 2 + 10);

        if (noiseBandwidth) {
          ctx.fillStyle = '#0066cc';
          ctx.fillText(`Current noise bandwidth: ${noiseBandwidth.min} Hz to ${noiseBandwidth.max} Hz`, width / 2, height / 2 + 40);
        }

        return;
      }

      if (!data || data.length === 0) return;

      // Skip rendering if data hasn't changed meaningfully
      renderCountRef.current++;

      // Modified margins to make plot wider and closer to the edges
      const margin = {
        top: Math.max(50, height * 0.11),        // Slightly reduced top margin
        right: Math.max(40, width * 0.05),       // Further reduced right margin
        bottom: Math.max(60, height * 0.14),     // Keep bottom margin for frequency labels
        left: Math.max(60, width * 0.07)         // Further reduced left margin
      };
      const plotWidth = width - margin.left - margin.right;
      const plotHeight = height - margin.top - margin.bottom;

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

      // Better calculation of maxCurrent to avoid repetitive values
      const maxCurrent = validCurrents.length > 0 ?
        Math.max(...validCurrents) * 1.5 : 0.01;
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

      // Draw grid lines first (behind all other elements)
      const drawGrid = () => {
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
        ctx.lineWidth = 0.5;

        // Draw grid only if we have valid data
        if (!data || data.length === 0) return;

        const validFrequencies = data.map(d => d.frequency).filter(f => isFinite(f) && f > 0);
        if (validFrequencies.length === 0) return;

        const minFreq = Math.min(...validFrequencies);
        const maxFreq = Math.max(...validFrequencies);

        // Protect against zero or infinity
        if (minFreq <= 0 || !isFinite(minFreq) || maxFreq <= 0 || !isFinite(maxFreq) || minFreq === maxFreq) {
          return;
        }

        const logMin = Math.log10(minFreq);
        const logMax = Math.log10(maxFreq);

        // Vertical grid lines (logarithmic for frequency)
        for (let i = Math.ceil(logMin); i <= Math.floor(logMax); i++) {
          const tickFreq = Math.pow(10, i);
          const x = margin.left + (Math.log10(tickFreq) - logMin) / (logMax - logMin) * plotWidth;

          ctx.beginPath();
          ctx.moveTo(x, margin.top);
          ctx.lineTo(x, height - margin.bottom);
          ctx.stroke();

          // Additional lines between major log divisions (2, 3, 4, 5, etc.)
          for (let j = 2; j <= 9; j++) {
            const minorTickFreq = Math.pow(10, i - 1) * j;
            if (minorTickFreq >= minFreq && minorTickFreq <= maxFreq) {
              const minorX = margin.left + (Math.log10(minorTickFreq) - logMin) / (logMax - logMin) * plotWidth;
              ctx.beginPath();
              ctx.moveTo(minorX, margin.top);
              ctx.lineTo(minorX, height - margin.bottom);
              ctx.stroke();
            }
          }
        }

        // Horizontal grid lines
        const horizontalLines = 10; // Number of horizontal grid lines
        for (let i = 0; i <= horizontalLines; i++) {
          const y = margin.top + (i / horizontalLines) * plotHeight;
          ctx.beginPath();
          ctx.moveTo(margin.left, y);
          ctx.lineTo(width - margin.right, y);
          ctx.stroke();
        }
      };

      // Draw chart frame with improved spacing
      const drawChartFrame = () => {
        // X-axis
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(margin.left, height - margin.bottom);
        ctx.lineTo(width - margin.right, height - margin.bottom);
        ctx.stroke();

        // X-axis label - positioned at far right
        ctx.fillStyle = 'black';
        ctx.font = '14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('Frequency (Hz)', width - margin.right, height - margin.bottom / 2 );

        // X-axis ticks with safety checks and improved spacing
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.font = '12px Arial';

        // Determine reasonable tick spacing
        const logSpan = logMax - logMin;
        const maxTicks = 6; // Reduced number of ticks to prevent crowding
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

            // Position tick labels with more space
            ctx.fillText(tickLabel, x, height - margin.bottom + 10);
          } catch (error) {
            console.error("Error drawing tick:", error);
          }
        }

        // Left y-axis (Current/Phase)
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top);
        ctx.lineTo(margin.left, height - margin.bottom);
        ctx.stroke();

        // Move labels above the chart - placed more compactly
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Current label (blue)
        ctx.fillStyle = '#0066cc';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('Current (normalized, A/Ω)', margin.left, margin.top - 30);

        // Phase angle label (purple)
        ctx.fillStyle = '#9933cc';
        ctx.fillText('Phase Angle-φ (°)', width / 2, margin.top - 30);

        // Right y-axis (Impedance)
        ctx.beginPath();
        ctx.moveTo(width - margin.right, margin.top);
        ctx.lineTo(width - margin.right, height - margin.bottom);
        ctx.stroke();

        // Impedance label (orange) - moved above
        ctx.fillStyle = '#cc6600';
        ctx.textAlign = 'center';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('Impedance (Ω)', width - margin.right, margin.top - 30);

        // Add Y-axis tick marks with better scaling
        // Left Y-axis for Current (blue)
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.font = '10px Arial';
        ctx.fillStyle = '#0066cc';

        // Better current tick values
        // Use 5 ticks with dynamically calculated values
        const currentTickCount = 5;
        for (let i = 0; i < currentTickCount; i++) {
          const value = i * (maxCurrent / (currentTickCount - 1));
          const y = height - margin.bottom - (value / maxCurrent * plotHeight);

          // Ensure y is within chart bounds
          if (y >= margin.top && y <= height - margin.bottom) {
            ctx.beginPath();
            ctx.moveTo(margin.left - 5, y);
            ctx.lineTo(margin.left, y);
            ctx.stroke();

            // Format with appropriate precision based on value
            let formattedValue = value.toFixed(4);
            if (value >= 0.01) formattedValue = value.toFixed(2);
            if (value >= 0.1) formattedValue = value.toFixed(1);
            if (value >= 1) formattedValue = value.toFixed(0);

            ctx.fillText(formattedValue, margin.left - 8, y);
          }
        }

        // Add Phase Angle ticks (purple)
        ctx.fillStyle = '#9933cc';
        // Use degree markers from -90 to +90
        for (let degree = -90; degree <= 90; degree += 30) {
          // Map phase angle to y-coordinate
          const y = height - margin.bottom - ((degree + 90) / 180 * plotHeight);

          // Only draw if in chart bounds
          if (y >= margin.top && y <= height - margin.bottom) {
            ctx.beginPath();
            ctx.moveTo(margin.left - 35, y);
            ctx.lineTo(margin.left - 30, y);
            ctx.stroke();
            ctx.fillText(degree + "°", margin.left - 38, y);
          }
        }

        // Right Y-axis (Impedance)
        ctx.textAlign = 'left';
        ctx.fillStyle = '#cc6600';

        // Make impedance ticks more meaningful
        const impTickCount = 5;
        for (let i = 0; i < impTickCount; i++) {
          const value = i * (maxImpedance / (impTickCount - 1));
          const y = height - margin.bottom - (value / maxImpedance * plotHeight);

          if (y >= margin.top && y <= height - margin.bottom) {
            ctx.beginPath();
            ctx.moveTo(width - margin.right, y);
            ctx.lineTo(width - margin.right + 5, y);
            ctx.stroke();

            // Format impedance values
            let formatted = value.toFixed(0) + ' Ω';
            if (value >= 1000) formatted = (value / 1000).toFixed(1) + ' kΩ';

            ctx.fillText(formatted, width - margin.right + 8, y);
          }
        }
      };

      // Draw impedance curve
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
          }
        }

        if (!isFirstPoint) { // Only stroke if we've added points
          ctx.stroke();
        }
      };

      // Draw current curve
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
          }
        }

        if (!isFirstPoint) { // Only stroke if we've added points
          ctx.stroke();
        }
      };

      // Draw phase curve
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
            // Map phase angle range (-90 to +90 degrees) to plot height
            const rawY = height - margin.bottom - ((d.phaseAngle + 90) / 180 * plotHeight);
            const y = Math.max(margin.top, Math.min(height - margin.bottom, rawY));

            if (isFirstPoint) {
              ctx.moveTo(x, y);
              isFirstPoint = false;
            } else {
              ctx.lineTo(x, y);
            }
          } catch (error) {
            console.error("Error drawing phase point:", error);
          }
        }

        if (!isFirstPoint) { // Only stroke if we've added points
          ctx.stroke();
        }
      };

      // Draw operating point
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

          // Phase angle point - adjusted for new range mapping
          const rawPhaseY = height - margin.bottom - ((currentDataPoint.phaseAngle + 90) / 180 * plotHeight);
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

          // Improve frequency label positioning
          ctx.fillStyle = 'black';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.font = '12px Arial';

          // Format labels with precision
          let freqLabel = currentDataPoint.frequency.toFixed(2) + " Hz";
          if (currentDataPoint.frequency >= 1e6 || currentDataPoint.frequency <= 1e-3) {
            freqLabel = currentDataPoint.frequency.toExponential(2) + " Hz";
          } else if (currentDataPoint.frequency >= 1e3) {
            freqLabel = (currentDataPoint.frequency / 1e3).toFixed(2) + " kHz";
          }

          // Calculate ωRC using π for more accuracy
          // display ωRC = 2πf*RC when the value is close to π
          const calculatedWRC = currentDataPoint.wRC;
          let wrcLabel = calculatedWRC.toFixed(2);
          if (Math.abs(calculatedWRC - Math.PI) < 0.1) {
            wrcLabel = "π";
          } else if (Math.abs(calculatedWRC - 2 * Math.PI) < 0.1) {
            wrcLabel = "2π";
          } else if (Math.abs(calculatedWRC - Math.PI / 2) < 0.05) {
            wrcLabel = "π/2";
          }

          // Add background to labels for better visibility
          const labelBgPadding = 4;

          // Frequency label - positioned above Frequency (Hz) text
          const freqLabelWidth = ctx.measureText(`f = ${freqLabel}`).width;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillRect(
            opX - freqLabelWidth / 2 - labelBgPadding,
            height - margin.bottom + 20,
            freqLabelWidth + labelBgPadding * 2,
            16
          );

          // ωRC label - positioned in a better location
          const wrcLabelWidth = ctx.measureText(`ωRC = ${wrcLabel}`).width;
          ctx.fillRect(
            opX - wrcLabelWidth / 2 - labelBgPadding,
            height - margin.bottom + 35 - 12,
            wrcLabelWidth + labelBgPadding * 2,
            16
          );

          // Draw the text on top of the background
          ctx.fillStyle = 'black';
          ctx.fillText(`f = ${freqLabel}`, opX, height - margin.bottom + 25);
          ctx.fillText(`ωRC = ${wrcLabel}`, opX, height - margin.bottom + 45);
        } catch (error) {
          console.error("Error drawing operating point:", error);
        }
      };

      // Draw transition point
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

              // Add background for better visibility
              const labelWidth = ctx.measureText('ωRC = 1').width;
              ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
              ctx.fillRect(
                transitionX - labelWidth / 2 - 4,
                margin.top - 24,
                labelWidth + 8,
                16
              );

              ctx.fillStyle = 'red';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';
              ctx.font = '12px Arial';
              ctx.fillText('ωRC = 1', transitionX, margin.top - 10);
            }
          }
        } catch (error) {
          console.error("Error drawing transition point:", error);
        }
      };

      // Modified legend to be positioned at bottom left with linear arrangement
      const drawLegend = () => {
        try {
          // Position legend in the bottom left
          const legendX = margin.left + 10;
          const legendY = height - 30;
          const legendSpacing = 20; // Spacing between legend items
          const lineLength = 15; // Length of legend lines
          
          // Set up context for legend
          ctx.font = '11px Arial';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          
          // Calculate widths for dynamic positioning
          const impedanceText = 'Impedance';
          const currentText = 'Current';
          const phaseText = 'Phase (φ)';
          
          const impedanceWidth = ctx.measureText(impedanceText).width;
          const currentWidth = ctx.measureText(currentText).width;
          
          // First item - Impedance
          ctx.strokeStyle = '#cc6600';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(legendX, legendY);
          ctx.lineTo(legendX + lineLength, legendY);
          ctx.stroke();
          
          ctx.fillStyle = '#cc6600';
          ctx.fillText(impedanceText, legendX + lineLength + 5, legendY);
          
          // Second item - Current (positioned to the right of Impedance)
          const currentX = legendX + lineLength + impedanceWidth + 25;
          
          ctx.strokeStyle = '#0066cc';
          ctx.beginPath();
          ctx.moveTo(currentX, legendY);
          ctx.lineTo(currentX + lineLength, legendY);
          ctx.stroke();
          
          ctx.fillStyle = '#0066cc';
          ctx.fillText(currentText, currentX + lineLength + 5, legendY);
          
          // Third item - Phase (positioned to the right of Current)
          const phaseX = currentX + lineLength + currentWidth + 25;
          
          ctx.strokeStyle = '#9933cc';
          ctx.beginPath();
          ctx.moveTo(phaseX, legendY);
          ctx.lineTo(phaseX + lineLength, legendY);
          ctx.stroke();
          
          ctx.fillStyle = '#9933cc';
          ctx.fillText(phaseText, phaseX + lineLength + 5, legendY);
          
          // Create a semi-transparent background for the legend
          const totalWidth = phaseX + lineLength + ctx.measureText(phaseText).width + 15 - legendX;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillRect(legendX - 5, legendY - 10, totalWidth, 20);
          
          // Redraw the legend items on top of the background
          // Impedance
          ctx.strokeStyle = '#cc6600';
          ctx.beginPath();
          ctx.moveTo(legendX, legendY);
          ctx.lineTo(legendX + lineLength, legendY);
          ctx.stroke();
          ctx.fillStyle = '#cc6600';
          ctx.fillText(impedanceText, legendX + lineLength + 5, legendY);
          
          // Current
          ctx.strokeStyle = '#0066cc';
          ctx.beginPath();
          ctx.moveTo(currentX, legendY);
          ctx.lineTo(currentX + lineLength, legendY);
          ctx.stroke();
          ctx.fillStyle = '#0066cc';
          ctx.fillText(currentText, currentX + lineLength + 5, legendY);
          
          // Phase
          ctx.strokeStyle = '#9933cc';
          ctx.beginPath();
          ctx.moveTo(phaseX, legendY);
          ctx.lineTo(phaseX + lineLength, legendY);
          ctx.stroke();
          ctx.fillStyle = '#9933cc';
          ctx.fillText(phaseText, phaseX + lineLength + 5, legendY);
        } catch (error) {
          console.error("Error drawing legend:", error);
        }
      };

      // Draw chart with comprehensive error handling
      try {
        // Draw the chart in proper order
        drawGrid();
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

        // Add note about sine wave assumptions - moved to bottom right
        const noteText = 'Note: All calculations assume pure sine waves in AC steady state';
        const noteWidth = ctx.measureText(noteText).width;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(width - margin.right - noteWidth - 15, height - 15, noteWidth + 10, 15);

        ctx.fillStyle = 'rgba(0,0,0,0.7)';  // Made text darker for better readability
        ctx.font = 'italic 10px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(noteText, width - margin.right - 10, height - 5);
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
      const canvasElement = canvasRef.current;
      if (canvasElement) {
        const ctx = canvasElement.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        }
      }
    };
  }, [data, transitionFrequency, currentFrequency, wRC, error, signalType, noiseBandwidth, containerSize]);

  // Show error state if calculations failed in sine mode
  if (signalType === 'sine' && error) {
    return (
      <div className="mb-4" ref={containerRef}>
        <div className="border border-red-300 bg-red-50 p-4 rounded-md mb-4">
          <h3 className="text-red-700 font-medium mb-2">Chart Generation Error</h3>
          <p className="text-red-600 text-sm">{error}</p>
          <p className="text-red-600 text-sm mt-2">
            Try adjusting parameters to physically reasonable values.
          </p>
        </div>

        <canvas
          ref={canvasRef}
          className="w-full border border-gray-300 rounded"
          style={{ height: `${containerSize.height}px` }}
        />
      </div>
    );
  }

  return (
    <div className="mb-4 w-full" ref={containerRef}>
      {/* Responsive canvas */}
      <canvas
        ref={canvasRef}
        className="w-full border border-gray-300 rounded"
        style={{ height: `${containerSize.height}px` }}
      />

      <div className="mt-2 text-sm text-left text-gray-600">
        {signalType === 'sine' ? (
          <>
            This graph shows how the circuit responds across a frequency range. The blue line shows current,
            the orange line shows impedance, and the purple line shows phase angle. The vertical red line marks
            the transition point (ωRC = 1) between resistive and capacitive regimes.
            The current operating point is marked with colored dots on each curve.
          </>
        ) : (
          <>
            Frequency response chart is not available in noise mode since it applies only to single-frequency
            sine wave analysis. In noise mode, the circuit responds across a band of frequencies simultaneously.
          </>
        )}
      </div>
    </div>
  );
};

export default FrequencyResponseChart;