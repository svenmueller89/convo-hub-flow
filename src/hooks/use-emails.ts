
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useMailboxes } from '@/hooks/use-mailboxes';
import { Email, EmailSummary, ConversationDetailResponse, FetchEmailsParams } from '@/types/email';
import { supabase } from '@/integrations/supabase/client';

export const useEmails = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mailboxes, isLoading: mailboxesLoading, hasPrimaryMailbox } = useMailboxes();
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  
  // Get the primary mailbox if available
  const primaryMailbox = mailboxes?.find(mailbox => mailbox.is_primary);
  
  // Fetch emails using edge function
  const { 
    data, 
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
        
        // Get conversation ID from the selected email
        const email = emails.find(email => email.id === selectedEmail);
        if (!email) {
          console.error('Email not found with ID:', selectedEmail);
          throw new Error('Email not found');
        }
        
        console.log('Using conversation ID for fetch:', email.conversation_id);
        
        // Call the edge function to fetch conversation details
        const { data, error } = await supabase.functions.invoke('fetch-conversation', {
          body: {
            conversationId: email.conversation_id
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
    enabled: !!selectedEmail && !!data?.emails?.length,
    retry: 1, // Limit retries to avoid infinite loops
  });
  
  // Filter emails - show only 'new' emails (no status set) in the inbox
  const emails = (data?.emails || []).filter(email => !email.status || email.status === 'new');
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
    return (data?.emails || []).find(email => email.id === emailId);
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
      if (data && data.emails) {
        const optimisticData = {
          ...data,
          emails: data.emails.map(email => {
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
    allEmails: data?.emails || []
  };
};
