
import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MessageSquare } from 'lucide-react';
import { useEmails } from '@/hooks/emails'; // Updated import path
import { useToast } from '@/hooks/use-toast';

const ConversationReply: React.FC = () => {
  const { selectedEmail } = useEmails();
  const { toast } = useToast();
  
  return (
    <div className="border-t p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col gap-4">
          <Button 
            variant="default" 
            className="w-full"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Reply to Conversation
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConversationReply;
