
import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { EmailList } from '@/components/conversations/EmailList';
import { ConversationDetail } from '@/components/conversations/ConversationDetail';
import { CustomerInfo } from '@/components/conversations/CustomerInfo';
import { useEmails } from '@/hooks/use-emails';

const Index = () => {
  const { 
    selectedEmail, 
    conversation, 
    conversationLoading, 
    emails, 
    conversationError,
    setSelectedEmail
  } = useEmails();
  
  // Handle email selection
  const handleEmailSelect = (emailId: string) => {
    console.log(`Index: selecting email ${emailId}`);
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
