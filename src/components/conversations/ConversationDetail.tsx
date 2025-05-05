
import React, { useEffect } from 'react';
import { ConversationDetailResponse } from '@/types/email';
import ConversationEmpty from './ConversationEmpty';
import ConversationLoading from './ConversationLoading';
import ConversationError from './ConversationError';
import ConversationHeader from './ConversationHeader';
import MessageList from './MessageList';
import ConversationReply from './ConversationReply';

interface ConversationDetailProps {
  selectedEmail: string | null;
  conversation: ConversationDetailResponse | null;
  isLoading: boolean;
  error: unknown;
}

export const ConversationDetail: React.FC<ConversationDetailProps> = ({ 
  selectedEmail, 
  conversation, 
  isLoading, 
  error 
}) => {
  useEffect(() => {
    console.log('ConversationDetail received props:', {
      hasSelectedEmail: !!selectedEmail,
      selectedEmailId: selectedEmail,
      hasConversation: !!conversation,
      isLoading,
      error: error ? String(error) : null
    });

    if (conversation) {
      console.log('Conversation details:', {
        emailSubject: conversation.email?.subject,
        messagesCount: conversation.messages?.length,
        customerInfo: conversation.customer
      });
    }
  }, [selectedEmail, conversation, isLoading, error]);
  
  if (!selectedEmail) {
    return <ConversationEmpty />;
  }

  if (isLoading) {
    return <ConversationLoading />;
  }
  
  if (error || !conversation) {
    return <ConversationError error={error} selectedEmail={selectedEmail} />;
  }
  
  const { email, messages } = conversation;
  
  return (
    <div className="bg-white border rounded-md overflow-hidden h-full flex flex-col">
      <ConversationHeader email={email} customer={conversation.customer} />
      <MessageList messages={messages} />
      <ConversationReply />
    </div>
  );
};

export default ConversationDetail;
