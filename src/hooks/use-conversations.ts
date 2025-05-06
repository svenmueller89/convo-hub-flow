import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EmailSummary } from '@/types/email';

type ConversationFilter = 'all' | 'in-progress' | 'resolved';
type SortOption = 'newest' | 'oldest';

export const useConversations = () => {
  const { toast } = useToast();
  const [filter, setFilter] = useState<ConversationFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [search, setSearch] = useState('');

  // Fetch conversations (which are actually emails in our current system)
  const { 
    data, 
    isLoading, 
    error, 
    refetch: refetchEmails
  } = useQuery({
    queryKey: ['emails'],
    queryFn: async () => {
      try {
        console.log('Fetching conversations data');
        const { data, error } = await supabase.functions.invoke('fetch-emails', {
          body: { limit: 50 } // Get more emails to ensure we have enough for filtering
        });
        
        if (error) {
          console.error('Error fetching conversations:', error);
          throw error;
        }
        
        console.log('Conversations data fetched:', data);
        return data;
      } catch (error) {
        console.error('Error in conversation query function:', error);
        toast({
          title: "Failed to load conversations",
          description: "There was a problem loading your conversations.",
          variant: "destructive",
        });
        throw error;
      }
    },
    // Set a relatively short staleTime to ensure data is refreshed frequently
    staleTime: 1000 * 10, // 10 seconds
    refetchOnWindowFocus: true,
  });

  // Process and filter conversations - only include emails with a status (not 'new')
  const conversations = useMemo(() => {
    if (!data?.emails || !Array.isArray(data.emails)) return [];
    
    // First filter emails to only include those with a status of in-progress or resolved
    let result = data.emails.filter(email => 
      email.status === 'in-progress' || email.status === 'resolved'
    );
    
    // Group emails by conversation_id to get unique conversations
    const conversationMap = new Map();
    
    result.forEach((email: EmailSummary) => {
      if (!conversationMap.has(email.conversation_id)) {
        conversationMap.set(email.conversation_id, email);
      } else {
        // If we already have this conversation, keep the newest one
        const existing = conversationMap.get(email.conversation_id);
        if (new Date(email.date) > new Date(existing.date)) {
          conversationMap.set(email.conversation_id, email);
        }
      }
    });
    
    result = Array.from(conversationMap.values());
    
    // Apply filters
    if (filter !== 'all') {
      result = result.filter(item => item.status === filter);
    }
    
    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(item => 
        item.subject.toLowerCase().includes(searchLower) || 
        item.from.toLowerCase().includes(searchLower) || 
        item.preview.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort conversations
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
    });
    
    return result;
  }, [data, filter, sortBy, search]);

  return {
    conversations,
    isLoading,
    error,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    search,
    setSearch,
    refetch: refetchEmails
  };
};
