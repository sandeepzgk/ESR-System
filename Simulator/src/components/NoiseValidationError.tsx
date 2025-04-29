import React from 'react';

interface NoiseValidationErrorProps {
  error?: string;
  onReset: () => void;
}

const NoiseValidationError: React.FC<NoiseValidationErrorProps> = ({ error, onReset }) => {
  if (!error) return null;

  return (
    <div className="mb-4 p-3 bg-orange-50 border border-orange-300 rounded-md">
      <h3 className="text-orange-800 font-medium mb-2">Noise Frequency Error:</h3>
      <p className="text-orange-700 text-sm">{error}</p>
      <button
        onClick={onReset}
        className="mt-2 px-3 py-1 bg-orange-200 text-orange-800 rounded hover:bg-orange-300 text-sm"
      >
        Reset to Defaults
      </button>
    </div>
  );
};

export default NoiseValidationError;