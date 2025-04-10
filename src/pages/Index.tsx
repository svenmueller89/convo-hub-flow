
import React, { useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { EmailList } from '@/components/conversations/EmailList';
import { ConversationDetail } from '@/components/conversations/ConversationDetail';
import { CustomerInfo } from '@/components/conversations/CustomerInfo';
import { useEmails } from '@/hooks/use-emails';

const Index = () => {
  const { selectedEmail } = useEmails();
  
  // Debug logging
  useEffect(() => {
    console.log('Index page rendered with selectedEmail:', selectedEmail);
  }, [selectedEmail]);
  
  return (
    <AppShell>
      <div className="h-full grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-3 h-[calc(100vh-7rem)] overflow-hidden">
          <EmailList />
        </div>
        <div className="md:col-span-6 h-[calc(100vh-7rem)] overflow-hidden">
          <ConversationDetail />
        </div>
        <div className="md:col-span-3 h-[calc(100vh-7rem)] overflow-hidden">
          <CustomerInfo />
        </div>
      </div>
    </AppShell>
  );
};

export default Index;
