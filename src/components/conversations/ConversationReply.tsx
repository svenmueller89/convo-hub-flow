
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Clock, CheckCircle, UserPlus, MailX } from 'lucide-react';
import { useEmails } from '@/hooks/emails';
import { useToast } from '@/hooks/use-toast';
import { useCustomers } from '@/hooks/use-customers';

interface ConversationReplyProps {
  mode?: 'inbox' | 'conversation';
}

const ConversationReply: React.FC<ConversationReplyProps> = ({ mode = 'inbox' }) => {
  const { selectedEmail, setEmailStatus, markAsIrrelevant, markAsSpam, allEmails, getEmailById } = useEmails();
  const { customers } = useCustomers();
  const { toast } = useToast();
  
  const [customerStatus, setCustomerStatus] = useState<'new' | 'existing-new-conversation' | 'existing-conversation'>('new');
  
  useEffect(() => {
    if (!selectedEmail || !customers || !allEmails) return;
    
    const email = getEmailById(selectedEmail);
    if (!email) return;
    
    // Extract sender email from the "from" field
    const senderEmail = email.from.match(/<([^>]+)>/)?.[1] || email.from;
    
    // Check if this is from an existing customer
    const existingCustomer = customers.find(c => 
      c.email?.toLowerCase() === senderEmail.toLowerCase()
    );
    
    if (!existingCustomer) {
      // Not a known customer
      setCustomerStatus('new');
      return;
    }
    
    // Check if there's an existing conversation for this customer that's in progress
    const existingConversation = allEmails.some(e => 
      e.conversation_id === email.conversation_id && 
      e.id !== email.id && 
      e.status === 'in-progress'
    );
    
    if (existingConversation) {
      setCustomerStatus('existing-conversation');
    } else {
      setCustomerStatus('existing-new-conversation');
    }
    
    console.log(`Email status determined: ${customerStatus} for email ${selectedEmail}`);
  }, [selectedEmail, customers, allEmails, getEmailById]);
  
  const handleSetStatus = (status: 'in-progress' | 'resolved') => {
    if (!selectedEmail) return;
    
    console.log(`Setting email ${selectedEmail} status to ${status}`);
    setEmailStatus.mutate({ emailId: selectedEmail, status });
  };
  
  const handleMarkIrrelevant = () => {
    if (!selectedEmail) return;
    markAsIrrelevant.mutate(selectedEmail);
  };
  
  const handleMarkSpam = () => {
    if (!selectedEmail) return;
    markAsSpam.mutate(selectedEmail);
  };
  
  console.log("ConversationReply rendering with mode:", mode, "customerStatus:", customerStatus);
  
  if (mode === 'conversation') {
    return (
      <div className="border-t p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col gap-4">
            <Button variant="default" className="w-full">
              <MessageSquare className="mr-2 h-4 w-4" />
              Reply to Conversation
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // For inbox mode, show different options based on customerStatus
  return (
    <div className="border-t p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col gap-4">
          {customerStatus === 'new' && (
            <>
              <p className="text-sm text-muted-foreground mb-2">This email is from a new customer.</p>
              <div className="flex gap-2 flex-col sm:flex-row">
                <Button 
                  variant="default" 
                  className="w-full"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create New Customer
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleMarkIrrelevant}
                >
                  <MailX className="mr-2 h-4 w-4" />
                  Mark as Irrelevant
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleMarkSpam}
                >
                  <MailX className="mr-2 h-4 w-4" />
                  Mark as Spam
                </Button>
              </div>
            </>
          )}
          
          {customerStatus === 'existing-new-conversation' && (
            <>
              <p className="text-sm text-muted-foreground mb-2">This email is from an existing customer.</p>
              <div className="flex gap-2 flex-col sm:flex-row">
                <Button 
                  variant="default" 
                  className="w-full"
                  onClick={() => handleSetStatus('in-progress')}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Start New Conversation
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleMarkIrrelevant}
                >
                  <MailX className="mr-2 h-4 w-4" />
                  Mark as Irrelevant
                </Button>
              </div>
            </>
          )}
          
          {customerStatus === 'existing-conversation' && (
            <>
              <p className="text-sm text-muted-foreground mb-2">This email belongs to an existing conversation.</p>
              <div className="flex gap-2 flex-col sm:flex-row">
                <Button 
                  variant="default" 
                  className="w-full"
                  onClick={() => handleSetStatus('in-progress')}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Add to Existing Conversation
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleMarkIrrelevant}
                >
                  <MailX className="mr-2 h-4 w-4" />
                  Mark as Irrelevant
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationReply;
