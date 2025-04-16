
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
        
        // If the email was unread, mark it as read
        if (email && !email.read) {
          markAsRead.mutate(selectedEmail);
        }
        
        return data as ConversationDetailResponse;
      } catch (error) {
        console.error('Error fetching conversation:', error);
        throw error;
      }
    },
    enabled: !!selectedEmail && !!data?.emails?.length,
    retry: 1, // Limit retries to avoid infinite loops
  });
  
  const emails = data?.emails || [];
  const unreadCount = data?.unreadCount || 0;
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
    return emails.find(email => email.id === emailId);
  };

  // Mark email as read
  const markAsRead = useMutation({
    mutationFn: async (emailId: string) => {
      // In a real implementation, we would call an API to mark the email as read
      console.log('Marking email as read:', emailId);
      
      // For now, just return success
      return { success: true };
    },
    onSuccess: () => {
      // Invalidate the emails query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      
      toast({
        title: "Email marked as read",
        description: "The email has been marked as read.",
      });
    },
    onError: (error) => {
      console.error('Error marking email as read:', error);
      toast({
        title: "Failed to mark email as read",
        description: "There was an error marking the email as read.",
        variant: "destructive",
      });
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
    markAsRead,
    unreadCount,
    conversation,
    conversationLoading,
    conversationError
  };
};
