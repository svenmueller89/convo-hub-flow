
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useMailboxes } from '@/hooks/use-mailboxes';
import { Email, EmailSummary } from '@/types/email';

export const useEmails = () => {
  const { toast } = useToast();
  const { mailboxes, isLoading: mailboxesLoading } = useMailboxes();
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  
  // Mock data for now as we don't have a real email API yet
  const mockEmails: EmailSummary[] = [
    {
      id: "1",
      conversation_id: "1",
      from: "Acme Inc. <info@acme.com>",
      subject: "Website Redesign Quote",
      preview: "Hi, I'd like to discuss the quote for our website redesign project...",
      date: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      read: false,
      starred: false,
      status: "new",
      has_attachments: false,
    },
    {
      id: "2",
      conversation_id: "2",
      from: "Jane Cooper <jane.cooper@example.com>",
      subject: "Product Return RMA-29384",
      preview: "I received my order yesterday but the product is damaged. I'd like to...",
      date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      read: false,
      starred: true,
      status: "in-progress",
      has_attachments: true,
    },
    {
      id: "3",
      conversation_id: "3",
      from: "Globex Corporation <contact@globex.com>",
      subject: "Partnership Opportunity",
      preview: "We're interested in exploring a potential partnership with your...",
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
      read: true,
      starred: false,
      status: "new",
      has_attachments: false,
    },
    {
      id: "4",
      conversation_id: "4",
      from: "Robert Fox <robert@foxindustries.com>",
      subject: "Invoice #INV-5678",
      preview: "Thank you for the prompt payment. The invoice has been marked as paid.",
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
      read: true,
      starred: false,
      status: "resolved",
      has_attachments: true,
    },
    {
      id: "5",
      conversation_id: "5",
      from: "Cory Smith <cory.smith@example.com>",
      subject: "Technical Support Request",
      preview: "I'm having trouble logging into my account. I've tried resetting...",
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
      read: true,
      starred: false,
      status: "in-progress",
      has_attachments: false,
    },
  ];

  // Query to fetch emails
  const { 
    data: emails, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['emails', mailboxes?.map(m => m.id)],
    queryFn: async () => {
      if (!mailboxes || mailboxes.length === 0) {
        return [];
      }
      
      // In a real implementation, we would fetch emails from an API
      // For now, we'll return mock data
      return mockEmails;
    },
    enabled: !mailboxesLoading && !!mailboxes && mailboxes.length > 0,
  });

  // Get a single email by ID
  const getEmailById = (emailId: string): EmailSummary | undefined => {
    return emails?.find(email => email.id === emailId);
  };

  // Mark email as read
  const markAsRead = async (emailId: string) => {
    try {
      // In a real implementation, we would call an API
      console.log('Marking email as read:', emailId);
      
      // For now just mark as read in local state
      // This doesn't persist, so it's just for UI demonstration
      toast({
        title: "Email marked as read",
        description: "The email has been marked as read.",
      });
    } catch (error) {
      console.error('Error marking email as read:', error);
      toast({
        title: "Failed to mark email as read",
        description: "There was an error marking the email as read.",
        variant: "destructive",
      });
    }
  };

  // Count unread emails
  const unreadCount = emails?.filter(email => !email.read).length || 0;

  return {
    emails,
    isLoading,
    error,
    refetch,
    selectedEmail,
    setSelectedEmail,
    getEmailById,
    markAsRead,
    unreadCount,
  };
};
