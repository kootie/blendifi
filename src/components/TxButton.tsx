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
    <div>
      <button
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? 'Processing...' : children}
      </button>
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </div>
  );
};

export default TxButton; 