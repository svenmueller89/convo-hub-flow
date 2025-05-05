
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { EmailSummary } from '@/types/email';
import { Customer } from '@/types/customer';

export function useEmailProcessing(
  emails: EmailSummary[] | undefined,
  customers: Customer[] | undefined,
  emailsLoading: boolean,
  customersLoading: boolean,
  setEmailStatus: any
) {
  const { toast } = useToast();
  
  // Effect to automatically process emails based on customer recognition and conversation status
  useEffect(() => {
    if (emailsLoading || customersLoading || !emails || !customers) return;
    
    console.log('Checking emails for auto-processing');
    
    // Process each new email
    emails.forEach(email => {
      // Only process new emails (no status set)
      if (email.status !== 'new') return;
      
      // Extract sender email
      const senderEmail = email.from.match(/<([^>]+)>/)?.[1] || email.from;
      
      // Check if this is from an existing customer
      const existingCustomer = customers.find(c => 
        c.email?.toLowerCase() === senderEmail.toLowerCase()
      );
      
      if (existingCustomer) {
        console.log(`Email ${email.id} is from existing customer ${existingCustomer.name}`);
        
        // Find if there are any existing conversations in in-progress status
        const existingConversations = emails.filter(e => 
          e.conversation_id === email.conversation_id && 
          e.id !== email.id && 
          e.status === 'in-progress'
        );
        
        if (existingConversations.length > 0) {
          // If this is part of an existing conversation, automatically set to in-progress
          console.log(`Email ${email.id} belongs to existing conversation ${email.conversation_id}, auto-processing`);
          setEmailStatus.mutate({ 
            emailId: email.id, 
            status: 'in-progress' 
          }, {
            onSuccess: () => {
              toast({
                title: "Email auto-processed",
                description: `Email from ${existingCustomer.name} was automatically added to an existing conversation.`,
              });
            }
          });
        } else {
          // If it's a new conversation but from known customer, prompt to create new conversation
          console.log(`Email ${email.id} is from existing customer but needs new conversation`);
          toast({
            title: "Customer email received",
            description: `New email from existing customer ${existingCustomer.name} received.`,
            variant: "default",
          });
        }
      }
    });
  }, [emails, customers, emailsLoading, customersLoading, setEmailStatus, toast]);
}
