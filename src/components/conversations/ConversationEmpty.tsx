
import React from 'react';
import { MessageCircle } from 'lucide-react';

const ConversationEmpty: React.FC = () => {
  return (
    <div className="bg-white border rounded-md overflow-hidden h-full flex items-center justify-center">
      <div className="text-center p-8">
        <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-700">No conversation selected</h3>
        <p className="text-sm text-gray-500 mt-1">
          Select an email from the inbox to view the conversation
        </p>
      </div>
    </div>
  );
};

export default ConversationEmpty;
