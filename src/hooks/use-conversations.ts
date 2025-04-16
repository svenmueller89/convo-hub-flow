import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EmailSummary } from '@/types/email';

type ConversationFilter = 'all' | 'new' | 'in-progress' | 'resolved';
type SortOption = 'newest' | 'oldest';

export const useConversations = () => {
  const { toast } = useToast();
  const [filter, setFilter] = useState<ConversationFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [search, setSearch] = useState('');

  // Fetch conversations (which are actually emails in our current system)
  const { data, isLoading, error, refetch } = useQuery({
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
  });

  // Process and filter conversations
  const conversations = useMemo(() => {
    if (!data?.emails || !Array.isArray(data.emails)) return [];
    
    // First group emails by conversation_id to get unique conversations
    const conversationMap = new Map();
    
    data.emails.forEach((email: EmailSummary) => {
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
    
    let result = Array.from(conversationMap.values());
    
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

  // Calculate unread counts
  const unreadCounts = useMemo(() => {
    if (!data?.emails) return { total: 0, new: 0, inProgress: 0, resolved: 0 };
    
    return data.emails.reduce((acc: any, email: EmailSummary) => {
      if (!email.read) {
        acc.total += 1;
        
        if (email.status === 'new') acc.new += 1;
        if (email.status === 'in-progress') acc.inProgress += 1;
        if (email.status === 'resolved') acc.resolved += 1;
      }
      return acc;
    }, { total: 0, new: 0, inProgress: 0, resolved: 0 });
  }, [data]);

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
    refetch,
    unreadCounts
  };
};
