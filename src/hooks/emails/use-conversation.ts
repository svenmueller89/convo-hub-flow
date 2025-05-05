
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ConversationDetailResponse } from '@/types/email';

export function useConversation(selectedEmail: string | null, emailsData: any) {
  const queryClient = useQueryClient();
  
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
  
  return {
    conversation: conversationData || null,
    conversationLoading,
    conversationError,
    refetchConversation
  };
}
