import React, { useRef, useEffect, useState } from 'react';
import './CircuitAnimation.css';

const CircuitAnimation = () => {
  const svgRef = useRef(null);
  const animationLayerRef = useRef(null);
  const [svgViewBox, setSvgViewBox] = useState('0 0 50 30'); // Default viewBox, will be updated
  const [svgLoaded, setSvgLoaded] = useState(false);
  
  // Function to extract viewBox from loaded SVG
  const extractSvgInfo = () => {
    if (!svgRef.current) return;
    
    try {
      // Access the SVG document inside the object
      const svgDoc = svgRef.current.contentDocument;
      if (!svgDoc) return;
      
      // Get the root SVG element
      const svgElement = svgDoc.querySelector('svg');
      if (!svgElement) return;
      
      // Extract the viewBox value
      const viewBox = svgElement.getAttribute('viewBox');
      if (viewBox) {
        setSvgViewBox(viewBox);
      }
      
      setSvgLoaded(true);
    } catch (error) {
      console.error('Error accessing SVG:', error);
    }
  };
  
  // Handle SVG load event
  useEffect(() => {
    if (svgRef.current) {
      svgRef.current.addEventListener('load', extractSvgInfo);
      
      // If already loaded, extract info immediately
      if (svgRef.current.contentDocument) {
        extractSvgInfo();
      }
      
      return () => {
        if (svgRef.current) {
          svgRef.current.removeEventListener('load', extractSvgInfo);
        }
      };
    }
  }, []);
  
  // Position and resize the animation layer when SVG is loaded
  useEffect(() => {
    if (svgLoaded && svgRef.current && animationLayerRef.current) {
      const svgRect = svgRef.current.getBoundingClientRect();
      
      // Apply the same dimensions and position to the animation layer
      const container = animationLayerRef.current.parentElement;
      const containerRect = container.getBoundingClientRect();
      
      animationLayerRef.current.style.width = `${svgRect.width}px`;
      animationLayerRef.current.style.height = `${svgRect.height}px`;
      animationLayerRef.current.style.left = `${svgRect.left - containerRect.left}px`;
      animationLayerRef.current.style.top = `${svgRect.top - containerRect.top}px`;
    }
  }, [svgLoaded, svgViewBox]);
  
  // Add resize observer to handle window resizing
  useEffect(() => {
    if (!svgRef.current || !animationLayerRef.current) return;
    
    const handleResize = () => {
      if (svgLoaded && svgRef.current && animationLayerRef.current) {
        const svgRect = svgRef.current.getBoundingClientRect();
        const container = animationLayerRef.current.parentElement;
        const containerRect = container.getBoundingClientRect();
        
        animationLayerRef.current.style.width = `${svgRect.width}px`;
        animationLayerRef.current.style.height = `${svgRect.height}px`;
        animationLayerRef.current.style.left = `${svgRect.left - containerRect.left}px`;
        animationLayerRef.current.style.top = `${svgRect.top - containerRect.top}px`;
      }
    };
    
    // Create resize observer
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(document.body);
    
    // Clean up
    return () => {
      resizeObserver.disconnect();
    };
  }, [svgLoaded]);

  return (
    <div className="circuit-container">
      {/* SVG imported directly from file */}
      <div className="svg-container">
        <object 
          ref={svgRef}
          type="image/svg+xml" 
          data="drawing.svg" 
          className="circuit-svg"
        >
          Your browser does not support SVG
        </object>
      </div>
      
      {/* Animation layer positioned over the SVG */}
      <div 
        ref={animationLayerRef}
        className="animation-layer"
      >
        <svg
          viewBox={svgViewBox}
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Define forward and reverse circuit paths for animation */}
          <path 
            id="circuitPathForward" 
            d="M 11.674,3.387 h 16.51 h 10.16 v 7.62 v 7.62 v 8.89 h -10.16 h -16.51 v -7.62 v -10.16 v -6.35" 
            fill="none" 
            stroke="none" 
          />
          <path 
            id="circuitPathReverse" 
            d="M 11.674,3.387 v 6.35 v 10.16 v 7.62 h 16.51 h 10.16 v -8.89 v -7.62 v -7.62 h -10.16 h -16.51" 
            fill="none" 
            stroke="none" 
          />
          <path 
            id="capPath" 
            d="M 28.184,13.801 V 15.833" 
            fill="none" 
            stroke="none" 
          />
          
          {/* Animation for electrons */}
          <g className="electrons">
            {/* Direction switching electrons - 10 evenly spaced */}
            {[...Array(10)].map((_, i) => (
              <circle 
                key={`electron-${i}`} 
                r="0.3" 
                fill="#00aaff"
                opacity="0.8"
              >
                <animate 
                  id={`forwardVisible-${i}`} 
                  attributeName="visibility" 
                  values="visible;hidden" 
                  begin={`${15 + i * 0.01}s`} 
                  dur="0.01s" 
                  repeatCount="indefinite"
                />
                <animate 
                  id={`reverseVisible-${i}`} 
                  attributeName="visibility" 
                  values="hidden;visible" 
                  begin={`${30 + i * 0.01}s`} 
                  dur="0.01s" 
                  repeatCount="indefinite"
                />
                <animateMotion 
                  dur="20s" 
                  repeatCount="indefinite" 
                  begin={`${i * 2}s; reverseVisible-${i}.end`}
                >
                  <mpath href="#circuitPathForward" />
                </animateMotion>
                <animateMotion 
                  dur="20s" 
                  repeatCount="indefinite" 
                  begin={`forwardVisible-${i}.end`}
                >
                  <mpath href="#circuitPathReverse" />
                </animateMotion>
              </circle>
            ))}
            
            {/* Capacitor electrons - showing charge/discharge */}
            <circle r="0.25" fill="#00aaff">
              <animate 
                attributeName="opacity" 
                values="0;1;1;0" 
                dur="30s" 
                begin="3s" 
                repeatCount="indefinite" 
              />
              <animateMotion 
                path="M 0,0 V 2.032" 
                dur="2s" 
                begin="3s" 
                repeatCount="indefinite" 
              />
              <animateTransform 
                attributeName="transform" 
                type="translate" 
                values="28.184,13.801" 
                dur="1s" 
                repeatCount="indefinite" 
              />
            </circle>
            
            <circle r="0.25" fill="#00aaff">
              <animate 
                attributeName="opacity" 
                values="0;1;1;0" 
                dur="30s" 
                begin="18s" 
                repeatCount="indefinite" 
              />
              <animateMotion 
                path="M 0,0 V -2.032" 
                dur="2s" 
                begin="18s" 
                repeatCount="indefinite" 
              />
              <animateTransform 
                attributeName="transform" 
                type="translate" 
                values="28.184,15.833" 
                dur="1s" 
                repeatCount="indefinite" 
              />
            </circle>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default CircuitAnimation;