
import { useMailboxes } from '@/hooks/use-mailboxes';
import { useEmailsQuery } from './use-emails-query';
import { useConversation } from './use-conversation';
import { useEmailActions } from './use-email-actions';
import { useEmailSelection } from './use-email-selection';
import { useEmailProcessing } from './use-email-processing';
import { useCustomers } from '@/hooks/use-customers';
import { useState, useEffect } from 'react';
import { EmailSummary } from '@/types/email';
import { UseEmailsReturnType } from './types';

export function useEmails(): UseEmailsReturnType {
  // Get primary mailbox info
  const { 
    primaryMailbox, 
    hasPrimaryMailbox,
    isLoading: mailboxesLoading
  } = useMailboxes();
  
  // Fetch customers for auto-processing
  const { customers, isLoading: customersLoading } = useCustomers();
  
  // Fetch emails
  const { 
    emailsData, 
    emailsLoading, 
    emailsError, 
    refetchEmails 
  } = useEmailsQuery(primaryMailbox, hasPrimaryMailbox, mailboxesLoading);
  
  // Email selection state
  const { selectedEmail, setSelectedEmail } = useEmailSelection();
  
  // Fetch conversation details for selected email
  const {
    conversation,
    conversationLoading,
    conversationError,
    refetchConversation
  } = useConversation(selectedEmail, emailsData);
  
  // Email actions
  const {
    setEmailStatus,
    markAsIrrelevant,
    markAsSpam
  } = useEmailActions(primaryMailbox, emailsData);
  
  // Filter emails by status
  const [allEmails, setAllEmails] = useState<EmailSummary[]>([]);
  
  // Update emails when data changes
  useEffect(() => {
    if (emailsData?.emails) {
      setAllEmails(emailsData.emails);
    }
  }, [emailsData]);
  
  // For status="new" filtering
  const emails = allEmails.filter(email => 
    email.status === 'new'
  );
  
  // Auto-process emails based on rules
  useEmailProcessing(
    allEmails,
    customers,
    emailsLoading,
    customersLoading,
    setEmailStatus
  );
  
  // Helper to get email by ID
  const getEmailById = (emailId: string) => {
    return allEmails.find(email => email.id === emailId);
  };
  
  return {
    emails,
    isLoading: emailsLoading || mailboxesLoading,
    error: emailsError,
    refetch: refetchEmails,
    selectedEmail,
    setSelectedEmail,
    getEmailById,
    setEmailStatus,
    markAsIrrelevant,
    markAsSpam,
    conversation,
    conversationLoading,
    conversationError,
    allEmails
  };
}
