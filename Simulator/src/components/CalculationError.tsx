import React from 'react';

interface CalculationErrorProps {
  hasError: boolean;
  onReset: () => void;
}

const CalculationError: React.FC<CalculationErrorProps> = ({ hasError, onReset }) => {
  if (!hasError) return null;

  return (
    <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-md">
      <h3 className="text-red-800 font-medium mb-2">Calculation Error!</h3>
      <p className="text-red-700 text-sm">
        The current parameter combination is causing calculation errors. Please adjust parameters
        or reset to default values.
      </p>
      <button
        onClick={onReset}
        className="mt-2 px-3 py-1 bg-red-200 text-red-800 rounded hover:bg-red-300 text-sm"
      >
        Reset to Defaults
      </button>
    </div>
  );
};

export default CalculationError;