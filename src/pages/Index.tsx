
import React, { useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { EmailList } from '@/components/conversations/EmailList';
import { ConversationDetail } from '@/components/conversations/ConversationDetail';
import { CustomerInfo } from '@/components/conversations/CustomerInfo';
import { useEmails } from '@/hooks/use-emails';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { toast } = useToast();
  const { 
    selectedEmail, 
    conversation, 
    conversationLoading, 
    emails, 
    conversationError,
    setSelectedEmail,
    unreadCount,
    markAsRead 
  } = useEmails();
  
  // Debug logging
  useEffect(() => {
    console.log('Index page rendered with:', { 
      selectedEmail,
      hasEmails: emails.length > 0,
      hasConversation: !!conversation,
      conversationLoading,
      unreadCount,
      conversationError: conversationError ? 'Error: ' + String(conversationError) : 'No error'
    });
    
    // Show error toast if there's an issue with conversation loading
    if (conversationError && selectedEmail) {
      toast({
        title: "Error loading conversation",
        description: "There was a problem loading the conversation details. Please try again.",
        variant: "destructive",
      });
    }
  }, [selectedEmail, emails, conversation, conversationLoading, conversationError, toast, unreadCount]);
  
  // Handle email selection and mark as read
  const handleEmailSelect = (emailId: string) => {
    console.log(`Index: selecting email ${emailId}`);
    
    // Get the email from our list
    const email = emails.find(e => e.id === emailId);
    
    // If the email exists and is unread, mark it as read
    if (email && !email.read) {
      console.log(`Email ${emailId} is unread, marking as read`);
      markAsRead.mutate(emailId, {
        onSuccess: (data) => {
          console.log('Mark as read success response:', data);
        },
        onError: (error) => {
          console.error('Mark as read error:', error);
        }
      });
    } else {
      console.log(`Email ${emailId} is already read or not found in emails list`);
    }
    
    // Set the selected email
    setSelectedEmail(emailId);
  };
  
  return (
    <AppShell>
      <div className="h-full grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-3 h-[calc(100vh-7rem)] overflow-hidden">
          <EmailList selectedEmail={selectedEmail} onSelectEmail={handleEmailSelect} />
        </div>
        <div className="md:col-span-6 h-[calc(100vh-7rem)] overflow-hidden">
          <ConversationDetail 
            selectedEmail={selectedEmail} 
            conversation={conversation} 
            isLoading={conversationLoading}
            error={conversationError}
          />
        </div>
        <div className="md:col-span-3 h-[calc(100vh-7rem)] overflow-hidden">
          <CustomerInfo 
            selectedEmail={selectedEmail} 
            conversation={conversation}
            isLoading={conversationLoading} 
            error={conversationError} 
          />
        </div>
      </div>
    </AppShell>
  );
};

export default Index;
