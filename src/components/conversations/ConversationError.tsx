
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface ConversationErrorProps {
  error: unknown;
  selectedEmail: string | null;
  onRetry?: () => void;
}

const ConversationError: React.FC<ConversationErrorProps> = ({ 
  error, 
  selectedEmail,
  onRetry 
}) => {
  const errorMessage = error 
    ? typeof error === 'object'
      ? (error as any)?.message || 'Unknown error'
      : String(error)
    : 'Could not retrieve conversation data';
    
  console.error('Conversation Detail Error:', {
    errorMessage,
    selectedEmail,
    errorObject: error
  });
    
  return (
    <div className="bg-white border rounded-md overflow-hidden h-full flex items-center justify-center">
      <div className="text-center p-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-500 font-medium">Failed to load conversation</p>
        <p className="text-sm text-gray-500 mt-2 max-w-md">
          {errorMessage}
        </p>
        {onRetry && (
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={onRetry}
          >
            Try again
          </Button>
        )}
      </div>
    </div>
  );
};

export default ConversationError;
