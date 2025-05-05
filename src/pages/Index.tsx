
import React, { useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { EmailList } from '@/components/conversations/EmailList';
import { ConversationDetail } from '@/components/conversations/ConversationDetail';
import { CustomerInfo } from '@/components/conversations/CustomerInfo';
import { useEmails } from '@/hooks/emails/use-emails';
import { useCustomers } from '@/hooks/use-customers';

const Index = () => {
  const { 
    selectedEmail, 
    conversation, 
    conversationLoading, 
    emails, 
    conversationError,
    setSelectedEmail,
    allEmails
  } = useEmails();
  
  const { customers } = useCustomers();
  
  // Handle email selection
  const handleEmailSelect = (emailId: string) => {
    console.log(`Index: selecting email ${emailId}`);
    setSelectedEmail(emailId);
  };
  
  // Log email processing information
  useEffect(() => {
    if (!allEmails || !customers) return;
    
    console.log('Email processing stats:', {
      totalEmails: allEmails.length,
      newEmails: allEmails.filter(e => e.status === 'new').length,
      inProgressEmails: allEmails.filter(e => e.status === 'in-progress').length,
      resolvedEmails: allEmails.filter(e => e.status === 'resolved').length,
      knownCustomerEmails: allEmails.filter(e => {
        const emailFrom = e.from.match(/<([^>]+)>/)?.[1] || e.from;
        return customers.some(c => c.email?.toLowerCase() === emailFrom.toLowerCase());
      }).length
    });
  }, [allEmails, customers]);
  
  // Add console log to verify mode is set
  console.log("Index page rendering ConversationDetail with mode: inbox");
  
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
            mode="inbox"
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
