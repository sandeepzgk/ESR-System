import React from 'react';

interface ValidationErrorsProps {
  errors: string[];
  onReset: () => void;
}

const ValidationErrors: React.FC<ValidationErrorsProps> = ({ errors, onReset }) => {
  if (!errors || errors.length === 0) return null;

  return (
    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-md">
      <h3 className="text-yellow-800 font-medium mb-2">Parameter Warnings:</h3>
      <ul className="list-disc pl-5 text-yellow-700 text-sm">
        {errors.map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
      <button
        onClick={onReset}
        className="mt-2 px-3 py-1 bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300 text-sm"
      >
        Reset to Defaults
      </button>
    </div>
  );
};

export default ValidationErrors;