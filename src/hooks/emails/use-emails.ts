
import { useState, useEffect } from 'react';
import { useMailboxes } from '@/hooks/use-mailboxes';
import { useCustomers } from '@/hooks/use-customers';
import { EmailSummary } from '@/types/email';
import { useEmailsQuery } from './use-emails-query';
import { useConversation } from './use-conversation';
import { useEmailActions } from './use-email-actions';
import { useEmailSelection } from './use-email-selection';
import { useEmailProcessing } from './use-email-processing';
import { UseEmailsReturnType } from './types';

export const useEmails = (): UseEmailsReturnType => {
  const { mailboxes, isLoading: mailboxesLoading, hasPrimaryMailbox } = useMailboxes();
  const { customers, isLoading: customersLoading } = useCustomers();
  
  // Get the primary mailbox if available
  const primaryMailbox = mailboxes?.find(mailbox => mailbox.is_primary);
  
  // Get email data from query hook
  const { 
    emailsData, 
    emailsLoading, 
    emailsError, 
    refetchEmails 
  } = useEmailsQuery(primaryMailbox, hasPrimaryMailbox, mailboxesLoading);
  
  // Handle email selection
  const { selectedEmail, setSelectedEmail } = useEmailSelection();
  
  // Get conversation data
  const { 
    conversation, 
    conversationLoading, 
    conversationError 
  } = useConversation(selectedEmail, emailsData);
  
  // Get email action mutations
  const { 
    setEmailStatus, 
    markAsIrrelevant, 
    markAsSpam 
  } = useEmailActions(primaryMailbox, emailsData);
  
  // Process emails automatically
  useEmailProcessing(
    emailsData?.emails, 
    customers, 
    emailsLoading, 
    customersLoading, 
    setEmailStatus
  );
  
  // Debug logging
  useEffect(() => {
    console.log('useEmails state:', { 
      selectedEmail, 
      conversation: !!conversation,
      conversationLoading,
      emailsCount: emailsData?.emails?.length || 0
    });
  }, [selectedEmail, conversation, conversationLoading, emailsData?.emails?.length]);
  
  // Filter emails - show only 'new' emails (no status set) in the inbox
  const emails = (emailsData?.emails || []).filter(email => !email.status || email.status === 'new');

  // Get a single email by ID
  const getEmailById = (emailId: string): EmailSummary | undefined => {
    return (emailsData?.emails || []).find(email => email.id === emailId);
  };

  const isLoading = mailboxesLoading || emailsLoading;

  return {
    emails,
    isLoading,
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
    allEmails: emailsData?.emails || []
  };
};
