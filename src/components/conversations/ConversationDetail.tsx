
import React, { useEffect } from 'react';
import { ConversationDetailResponse } from '@/types/email';
import ConversationEmpty from './ConversationEmpty';
import ConversationLoading from './ConversationLoading';
import ConversationError from './ConversationError';
import ConversationHeader from './ConversationHeader';
import MessageList from './MessageList';
import ConversationReply from './ConversationReply';
import { useQueryClient } from '@tanstack/react-query';

interface ConversationDetailProps {
  selectedEmail: string | null;
  conversation: ConversationDetailResponse | null;
  isLoading: boolean;
  error: unknown;
  mode?: 'inbox' | 'conversation';
}

export const ConversationDetail: React.FC<ConversationDetailProps> = ({ 
  selectedEmail, 
  conversation, 
  isLoading, 
  error,
  mode = 'inbox'
}) => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    console.log('ConversationDetail received props:', {
      hasSelectedEmail: !!selectedEmail,
      selectedEmailId: selectedEmail,
      hasConversation: !!conversation,
      isLoading,
      error: error ? String(error) : null,
      mode
    });

    if (conversation) {
      console.log('Conversation details:', {
        emailSubject: conversation.email?.subject,
        messagesCount: conversation.messages?.length,
        customerInfo: conversation.customer
      });
    }
  }, [selectedEmail, conversation, isLoading, error, mode]);
  
  const handleRetry = () => {
    if (selectedEmail) {
      console.log('Retrying to fetch conversation for email:', selectedEmail);
      queryClient.invalidateQueries({ queryKey: ['conversation', selectedEmail] });
    }
  };
  
  if (!selectedEmail) {
    return <ConversationEmpty />;
  }

  if (isLoading) {
    return <ConversationLoading />;
  }
  
  if (error || !conversation) {
    return <ConversationError 
      error={error} 
      selectedEmail={selectedEmail} 
      onRetry={handleRetry}
    />;
  }
  
  const { email, messages } = conversation;
  
  return (
    <div className="bg-white border rounded-md overflow-hidden h-full flex flex-col">
      <ConversationHeader email={email} customer={conversation.customer} />
      <MessageList messages={messages} />
      <ConversationReply mode={mode} />
    </div>
  );
};

export default ConversationDetail;
