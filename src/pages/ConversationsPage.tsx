
import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ConversationList } from '@/components/conversations/ConversationList';
import { ConversationDetail } from '@/components/conversations/ConversationDetail';
import { CustomerInfo } from '@/components/conversations/CustomerInfo';
import { useEmails } from '@/hooks/emails';
import { useConversationStatuses } from '@/hooks/use-conversation-statuses';

const ConversationsPage = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const { statuses } = useConversationStatuses();
  const { 
    allEmails, 
    conversation, 
    conversationLoading, 
    conversationError, 
    setSelectedEmail 
  } = useEmails();

  // Prefetch conversation statuses
  useEffect(() => {
    // This is just to ensure statuses are loaded
    console.log('Prefetching conversation statuses:', statuses?.length || 0);
  }, [statuses]);

  // Debug logging for emails data
  useEffect(() => {
    console.log('ConversationsPage: Available emails:', {
      count: allEmails?.length || 0,
      emails: allEmails?.map(e => ({ id: e.id, conversationId: e.conversation_id }))
    });
  }, [allEmails]);

  const handleSelectConversation = (conversationId: string) => {
    console.log('ConversationsPage: Selected conversation ID:', conversationId);
    setSelectedConversationId(conversationId);
    
    // Find the corresponding email ID and set it as the selected email
    const email = allEmails?.find(email => email.conversation_id === conversationId);
    if (email) {
      console.log('ConversationsPage: Setting selected email ID:', email.id);
      setSelectedEmail(email.id);
    } else {
      console.error('ConversationsPage: No matching email found for conversation:', conversationId);
    }
  };

  return (
    <AppShell>
      <div className="h-full grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-4 h-[calc(100vh-7rem)] overflow-hidden">
          <ConversationList 
            selectedConversationId={selectedConversationId} 
            onSelectConversation={handleSelectConversation}
          />
        </div>
        <div className="md:col-span-5 h-[calc(100vh-7rem)] overflow-hidden">
          {selectedConversationId ? (
            <ConversationDetail
              selectedEmail={allEmails?.find(email => email.conversation_id === selectedConversationId)?.id || null}
              conversation={conversation}
              isLoading={conversationLoading}
              error={conversationError}
              mode="conversation"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-center p-8 bg-white border rounded-md">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Select a conversation</h2>
                <p className="text-gray-500">Choose a conversation from the list to view its details</p>
              </div>
            </div>
          )}
        </div>
        <div className="md:col-span-3 h-[calc(100vh-7rem)] overflow-hidden">
          {selectedConversationId ? (
            <CustomerInfo
              selectedEmail={allEmails?.find(email => email.conversation_id === selectedConversationId)?.id || null}
              conversation={conversation}
              isLoading={conversationLoading}
              error={conversationError}
            />
          ) : (
            <div className="h-full border rounded-md bg-white flex items-center justify-center">
              <p className="text-gray-500">Select a conversation to view customer details</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default ConversationsPage;
