
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useMailboxes } from '@/hooks/use-mailboxes';
import { Email, EmailSummary, ConversationDetailResponse, FetchEmailsParams } from '@/types/email';
import { supabase } from '@/integrations/supabase/client';
import { useCustomers } from '@/hooks/use-customers';

export const useEmails = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mailboxes, isLoading: mailboxesLoading, hasPrimaryMailbox } = useMailboxes();
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const { customers, isLoading: customersLoading } = useCustomers();
  
  // Get the primary mailbox if available
  const primaryMailbox = mailboxes?.find(mailbox => mailbox.is_primary);
  
  // Fetch emails using edge function
  const { 
    data: emailsData, 
    isLoading: emailsLoading, 
    error: emailsError, 
    refetch: refetchEmails
  } = useQuery({
    queryKey: ['emails', primaryMailbox?.id],
    queryFn: async () => {
      // Check if we have a primary mailbox
      if (!hasPrimaryMailbox()) {
        console.log('No primary mailbox found, returning empty emails array');
        return {
          emails: [],
          totalCount: 0,
          unreadCount: 0
        };
      }
      
      try {
        console.log('Fetching emails for mailbox:', primaryMailbox?.id);
        // Call the edge function to fetch emails
        const { data, error } = await supabase.functions.invoke('fetch-emails', {
          body: {
            mailboxId: primaryMailbox?.id,
            page: 1,
            limit: 20
          }
        });
        
        if (error) {
          console.error('Error from fetch-emails function:', error);
          throw error;
        }
        
        console.log('Emails fetched successfully:', data);
        return data;
      } catch (error) {
        console.error('Error fetching emails:', error);
        throw error;
      }
    },
    enabled: !mailboxesLoading && hasPrimaryMailbox(),
    staleTime: 0, // Disable staleTime to ensure we always get fresh data
  });
  
  // Fetch conversation details when an email is selected
  const {
    data: conversationData,
    isLoading: conversationLoading,
    error: conversationError,
    refetch: refetchConversation
  } = useQuery({
    queryKey: ['conversation', selectedEmail],
    queryFn: async () => {
      if (!selectedEmail) {
        console.log('No email selected, skipping conversation fetch');
        return null;
      }
      
      try {
        console.log('Fetching conversation for email ID:', selectedEmail);
        
        // Get conversation ID from the selected email - FIX: use emailsData instead of data
        const email = emailsData?.emails?.find(email => email.id === selectedEmail);
        if (!email) {
          console.error('Email not found with ID:', selectedEmail);
          throw new Error('Email not found');
        }
        
        const conversationId = email.conversation_id;
        console.log('Using conversation ID for fetch:', conversationId);
        
        // Call the edge function to fetch conversation details
        const { data, error } = await supabase.functions.invoke('fetch-conversation', {
          body: {
            conversationId
          }
        });
        
        if (error) {
          console.error('Error from fetch-conversation function:', error);
          throw error;
        }
        
        console.log('Conversation fetched successfully:', data);
        
        return data as ConversationDetailResponse;
      } catch (error) {
        console.error('Error fetching conversation:', error);
        throw error;
      }
    },
    enabled: !!selectedEmail && !!emailsData?.emails,
    retry: 1, // Limit retries to avoid infinite loops
  });
  
  // Effect to automatically process emails based on customer recognition and conversation status
  useEffect(() => {
    if (emailsLoading || customersLoading || !emailsData?.emails || !customers) return;
    
    console.log('Checking emails for auto-processing');
    
    // Process each new email
    emailsData.emails.forEach(email => {
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
        const existingConversations = emailsData.emails.filter(e => 
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
  }, [emailsData?.emails, customers, emailsLoading, customersLoading, toast]);

  // Filter emails - show only 'new' emails (no status set) in the inbox
  const emails = (emailsData?.emails || []).filter(email => !email.status || email.status === 'new');
  const conversation = conversationData || null;

  // Debug logging
  useEffect(() => {
    console.log('useEmails state:', { 
      selectedEmail, 
      conversation: !!conversation,
      conversationLoading,
      emailsCount: emails.length
    });
  }, [selectedEmail, conversation, conversationLoading, emails.length]);

  // Get a single email by ID
  const getEmailById = (emailId: string): EmailSummary | undefined => {
    return (emailsData?.emails || []).find(email => email.id === emailId);
  };

  // Set status for an email
  const setEmailStatus = useMutation({
    mutationFn: async ({ emailId, status }: { emailId: string; status: 'new' | 'in-progress' | 'resolved' }) => {
      console.log(`Setting email ${emailId} status to ${status}`);
      
      try {
        // Call the edge function to update email status
        const { data, error } = await supabase.functions.invoke('update-email-status', {
          body: { emailId, status }
        });
        
        if (error) {
          console.error('Error updating email status:', error);
          throw error;
        }
        
        console.log('Update email status response:', data);
        return data;
      } catch (error) {
        console.error('Error updating email status:', error);
        throw error;
      }
    },
    onMutate: async ({ emailId, status }) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['emails', primaryMailbox?.id] });
      
      // Get the current emails data
      const previousData = queryClient.getQueryData(['emails', primaryMailbox?.id]);
      
      // Optimistically update the cache
      if (emailsData && emailsData.emails) {
        const optimisticData = {
          ...emailsData,
          emails: emailsData.emails.map(email => {
            if (email.id === emailId) {
              return { ...email, status };
            }
            return email;
          })
        };
        
        // Update the cache with our optimistic data
        queryClient.setQueryData(['emails', primaryMailbox?.id], optimisticData);
      }
      
      // Return the previous data for rollback in case of error
      return { previousData };
    },
    onSuccess: async (result) => {
      console.log('Set email status mutation successful:', result);
      
      // Force a refetch to ensure everything is in sync
      await refetchEmails();
      
      toast({
        title: "Email status updated",
        description: "The email status has been updated successfully.",
      });
    },
    onError: (error, variables, context) => {
      console.error('Error in set email status mutation:', error);
      
      // Roll back to the previous data if available
      if (context?.previousData) {
        queryClient.setQueryData(['emails', primaryMailbox?.id], context.previousData);
      }
      
      toast({
        title: "Failed to update email status",
        description: "There was an error updating the email status.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Invalidate the emails query to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['emails', primaryMailbox?.id] });
    }
  });
  
  // Mark email as irrelevant
  const markAsIrrelevant = useMutation({
    mutationFn: async (emailId: string) => {
      // In a real implementation, we would call an API to mark the email as irrelevant
      console.log('Marking email as irrelevant:', emailId);
      
      // For now, just return success
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Email marked as irrelevant",
        description: "The email has been marked as irrelevant."
      });
      
      // Optionally, we could update the local state or refetch emails
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    }
  });
  
  // Mark email as spam
  const markAsSpam = useMutation({
    mutationFn: async (emailId: string) => {
      // In a real implementation, we would call an API to mark the email as spam
      console.log('Marking email as spam:', emailId);
      
      // For now, just return success
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Email marked as spam",
        description: "The email has been marked as spam."
      });
      
      // Optionally, we could update the local state or refetch emails
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    }
  });

  // Handle email selection with improved debugging
  const handleSelectEmail = useCallback((emailId: string) => {
    console.log('Selecting email with ID:', emailId);
    
    // First, set the selected email ID
    setSelectedEmail(emailId);
    
    // Force refetch conversation if needed
    if (emailId) {
      // Wait for next tick to ensure selectedEmail is updated
      setTimeout(() => {
        console.log('Triggering conversation refetch for email:', emailId);
        queryClient.invalidateQueries({ queryKey: ['conversation', emailId] });
      }, 0);
    }
  }, [queryClient]);

  const isLoading = mailboxesLoading || emailsLoading;

  return {
    emails,
    isLoading,
    error: emailsError,
    refetch: refetchEmails,
    selectedEmail,
    setSelectedEmail: handleSelectEmail,
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
