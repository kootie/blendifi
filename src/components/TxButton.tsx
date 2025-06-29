import React, { useState } from 'react';

interface TxButtonProps {
  onClick: () => Promise<void>;
  children: React.ReactNode;
}

const TxButton: React.FC<TxButtonProps> = ({ onClick, children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setError(null);
    setLoading(true);
    try {
      await onClick();
    } catch (e) {
      setError('Transaction failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        className="blendify-button-primary disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </div>
        ) : (
          children
        )}
      </button>
      {error && (
        <div className="text-sm text-destructive text-center">
          {error}
        </div>
      )}
    </div>
  );
};

export default TxButton; 