import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const ResolutionCheckModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    // Check screen resolution on component mount
    const checkResolution = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      if (width < 1920 || height < 1080) {
        setIsOpen(true);
      }
    };
    
    // Initial check
    checkResolution();
    
    // Also check on resize
    window.addEventListener('resize', checkResolution);
    
    // Clean up
    return () => window.removeEventListener('resize', checkResolution);
  }, []);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Screen Resolution Notice
          </h3>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            We noticed that your screen resolution is less than the recommended 1920 x 1080 pixels.
          </p>
          <p className="text-gray-600">
            For the best experience with our RC Circuit Analysis application, please consider using a larger screen or higher resolution.
          </p>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Continue Anyway
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResolutionCheckModal;