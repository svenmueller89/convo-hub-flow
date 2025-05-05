
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
      
      // Extract sender email - improved extraction
      const extractEmail = (emailString: string): string => {
        // Try to extract from angle brackets first
        const emailMatch = emailString.match(/<([^>]+)>/);
        if (emailMatch && emailMatch[1]) {
          return emailMatch[1].trim().toLowerCase();
        }
        
        // If no email in brackets, try to find something that looks like an email
        const simpleEmailMatch = emailString.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (simpleEmailMatch) {
          return simpleEmailMatch[0].trim().toLowerCase();
        }
        
        // Return the original string as last resort
        return emailString.trim().toLowerCase();
      };
      
      const senderEmail = extractEmail(email.from);
      console.log('Processing email from:', senderEmail, 'Original from field:', email.from);
      
      // Check if this is from an existing customer - improved matching
      const existingCustomer = customers.find(c => {
        if (!c.email) return false;
        const customerEmail = c.email.toLowerCase().trim();
        const emailToCheck = senderEmail.toLowerCase().trim();
        const isMatch = customerEmail === emailToCheck || email.from.toLowerCase().includes(customerEmail);
        if (isMatch) console.log('Auto-processing: Customer match found:', c.name, c.email);
        return isMatch;
      });
      
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
