
import React from 'react';
import { Loader } from 'lucide-react';

const ConversationLoading: React.FC = () => {
  return (
    <div className="bg-white border rounded-md overflow-hidden h-full flex items-center justify-center">
      <div className="text-center p-8">
        <Loader className="h-10 w-10 text-convo-primary animate-spin mx-auto mb-3" />
        <p className="text-gray-500">Loading conversation...</p>
        <p className="text-xs text-gray-400 mt-1">This may take a moment</p>
      </div>
    </div>
  );
};

export default ConversationLoading;
