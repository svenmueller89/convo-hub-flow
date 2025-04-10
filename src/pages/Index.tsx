
import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ConversationList } from '@/components/conversations/ConversationList';
import { ConversationDetail } from '@/components/conversations/ConversationDetail';
import { CustomerInfo } from '@/components/conversations/CustomerInfo';

const Index = () => {
  return (
    <AppShell>
      <div className="h-full grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-3 h-[calc(100vh-7rem)] overflow-hidden">
          <ConversationList />
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
