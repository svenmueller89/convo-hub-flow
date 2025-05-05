
import React from 'react';
import { format } from 'date-fns';
import { Email } from '@/types/email';
import Message from './Message';

interface MessageListProps {
  messages: Email[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        {messages.map((message) => {
          const isCustomer = !message.from.includes('support@convohub.com');
          const senderName = message.from.split('<')[0].trim();
          const formattedTime = format(new Date(message.date), 'h:mm a');
          
          return (
            <Message 
              key={message.id} 
              sender={senderName}
              content={message.body}
              timestamp={formattedTime}
              isCustomer={isCustomer}
              attachments={message.attachments}
            />
          );
        })}
      </div>
    </div>
  );
};

export default MessageList;
