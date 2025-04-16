
import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ConversationList } from '@/components/conversations/ConversationList';

const ConversationsPage = () => {
  return (
    <AppShell>
      <div className="h-full grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-4 h-[calc(100vh-7rem)] overflow-hidden">
          <ConversationList />
        </div>
        <div className="md:col-span-8 h-[calc(100vh-7rem)] overflow-hidden flex items-center justify-center">
          <div className="text-center p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Select a conversation</h2>
            <p className="text-gray-500">Choose a conversation from the list to view its details</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default ConversationsPage;
