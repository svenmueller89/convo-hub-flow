
import React from 'react';

const ConversationLoading: React.FC = () => {
  return (
    <div className="bg-white border rounded-md overflow-hidden h-full flex items-center justify-center">
      <div className="text-center p-8">
        <p className="text-gray-500">Loading conversation...</p>
      </div>
    </div>
  );
};

export default ConversationLoading;
