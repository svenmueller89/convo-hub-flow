
import React from 'react';
import { format } from 'date-fns';
import { Email } from '@/types/email';
import Message from './Message';
import { parseEmailAddress, extractEmailContent } from '@/lib/email-utils';

interface MessageListProps {
  messages: Email[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        {messages.map((message) => {
          // Parse sender information properly
          const parsedSender = parseEmailAddress(message.from);
          const isCustomer = !parsedSender.email.includes('support@') && !parsedSender.email.includes('onlinesaat.de');
          const formattedTime = format(new Date(message.date), 'h:mm a');
          
          // Extract readable content from email body
          const cleanContent = extractEmailContent(message.body);
          
          return (
            <Message 
              key={message.id} 
              sender={parsedSender.name}
              content={cleanContent}
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
