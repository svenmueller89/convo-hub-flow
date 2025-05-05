
import React from 'react';
import { Button } from '@/components/ui/button';

interface ConversationErrorProps {
  error: unknown;
  selectedEmail: string | null;
}

const ConversationError: React.FC<ConversationErrorProps> = ({ error, selectedEmail }) => {
  const errorMessage = error 
    ? typeof error === 'object'
      ? (error as any)?.message || 'Unknown error'
      : String(error)
    : 'Could not retrieve conversation data';
    
  console.error('Conversation Detail Error:', {
    errorMessage,
    selectedEmail
  });
    
  return (
    <div className="bg-white border rounded-md overflow-hidden h-full flex items-center justify-center">
      <div className="text-center p-8">
        <p className="text-red-500">Failed to load conversation</p>
        <p className="text-sm text-gray-500 mt-2">
          {errorMessage}
        </p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => {
            window.location.reload();
          }}
        >
          Try again
        </Button>
      </div>
    </div>
  );
};

export default ConversationError;
