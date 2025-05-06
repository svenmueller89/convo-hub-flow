
import React, { useEffect } from 'react';
import { ConversationDetailResponse } from '@/types/email';
import ConversationEmpty from './ConversationEmpty';
import ConversationLoading from './ConversationLoading';
import ConversationError from './ConversationError';
import ConversationHeader from './ConversationHeader';
import MessageList from './MessageList';
import ConversationReply from './ConversationReply';
import { useQueryClient } from '@tanstack/react-query';
import { StatusDropdown } from './StatusDropdown';
import { useConversationStatuses } from '@/hooks/use-conversation-statuses';
import { useConversationStatus } from '@/hooks/use-conversation-status';

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
  const { statuses = [] } = useConversationStatuses();
  const { updateConversationStatus } = useConversationStatus();
  
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
  
  // Get the current status of this conversation
  const currentStatus = statuses.find(
    s => s.name.toLowerCase() === email?.status
  ) || {
    id: '0',
    name: email?.status ? (email.status.charAt(0).toUpperCase() + email.status.slice(1)) : 'Open',
    color: email?.status === 'in-progress' ? '#3B82F6' : email?.status === 'resolved' ? '#10B981' : '#6B7280',
    is_default: false,
    display_order: 0,
    created_at: '',
    updated_at: ''
  };

  const handleStatusChange = async (statusId: string) => {
    if (email) {
      await updateConversationStatus.mutateAsync({
        conversationId: email.conversation_id,
        statusId
      });
    }
  };
  
  console.log(`ConversationDetail rendering with mode: ${mode}`);
  
  return (
    <div className="bg-white border rounded-md overflow-hidden h-full flex flex-col">
      <div className="p-3 border-b flex items-center justify-between">
        <StatusDropdown 
          currentStatus={currentStatus}
          allStatuses={statuses}
          onChangeStatus={handleStatusChange}
        />
      </div>
      <ConversationHeader email={email} customer={conversation.customer} />
      <MessageList messages={messages} />
      <ConversationReply mode={mode} />
    </div>
  );
};

export default ConversationDetail;
