
import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Clock, CheckCircle } from 'lucide-react';
import { useEmails } from '@/hooks/emails';
import { useToast } from '@/hooks/use-toast';

interface ConversationReplyProps {
  mode?: 'inbox' | 'conversation';
}

const ConversationReply: React.FC<ConversationReplyProps> = ({ mode = 'inbox' }) => {
  const { selectedEmail, setEmailStatus } = useEmails();
  const { toast } = useToast();
  
  const handleSetStatus = (status: 'in-progress' | 'resolved') => {
    if (!selectedEmail) return;
    
    console.log(`Setting email ${selectedEmail} status to ${status}`);
    setEmailStatus.mutate({ emailId: selectedEmail, status });
  };
  
  return (
    <div className="border-t p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col gap-4">
          {mode === 'inbox' ? (
            <div className="flex gap-2 flex-col sm:flex-row">
              <Button 
                variant="default" 
                className="w-full"
                onClick={() => handleSetStatus('in-progress')}
              >
                <Clock className="mr-2 h-4 w-4" />
                Mark In Progress
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleSetStatus('resolved')}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark Resolved
              </Button>
            </div>
          ) : (
            <Button 
              variant="default" 
              className="w-full"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Reply to Conversation
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationReply;
