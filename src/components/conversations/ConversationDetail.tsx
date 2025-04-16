import React, { useEffect } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Clock, ArrowDown, User, MessageCircle, ArrowUp, Send, Paperclip, ChevronRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ConversationDetailResponse } from '@/types/email';

interface MessageProps {
  sender: string;
  content: string;
  timestamp: string;
  isCustomer: boolean;
  avatar?: string;
  attachments?: { id: string; filename: string; contentType: string; size: number }[];
}

const Message: React.FC<MessageProps> = ({ sender, content, timestamp, isCustomer, avatar, attachments }) => {
  return (
    <div className={cn("flex gap-3 mb-6", isCustomer ? "flex-row" : "flex-row")}>
      <Avatar className={cn(
        "h-8 w-8 flex-shrink-0",
        isCustomer ? "bg-convo-secondary text-convo-primary" : "bg-convo-primary text-white"
      )}>
        <span className="text-xs">{avatar || sender.substring(0, 2).toUpperCase()}</span>
      </Avatar>
      
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{sender}</span>
          <span className="text-xs text-gray-500">{timestamp}</span>
        </div>
        
        <div className="text-sm text-gray-800 whitespace-pre-line">
          {content}
        </div>
        
        {attachments && attachments.length > 0 && (
          <div className="mt-3 space-y-1">
            <p className="text-xs font-medium text-gray-500">Attachments:</p>
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <div 
                  key={attachment.id} 
                  className="flex items-center gap-1 text-xs bg-gray-100 py-1 px-2 rounded"
                >
                  <Paperclip className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-700">{attachment.filename}</span>
                  <span className="text-gray-500">
                    ({Math.round(attachment.size / 1024)}KB)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

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
    return (
      <div className="bg-white border rounded-md overflow-hidden h-full flex items-center justify-center">
        <div className="text-center p-8">
          <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-700">No conversation selected</h3>
          <p className="text-sm text-gray-500 mt-1">
            Select an email from the inbox to view the conversation
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white border rounded-md overflow-hidden h-full flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-gray-500">Loading conversation...</p>
        </div>
      </div>
    );
  }
  
  if (error || !conversation) {
    const errorMessage = error 
      ? typeof error === 'object'
        ? (error as any)?.message || 'Unknown error'
        : String(error)
      : 'Could not retrieve conversation data';
      
    console.error('Conversation Detail Error:', {
      errorMessage,
      selectedEmail,
      conversation
    });
      
    return (
      <div className="bg-white border rounded-md overflow-hidden h-full flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-red-500">Failed to load conversation</p>
          <p className="text-sm text-gray-500 mt-2">
            {errorMessage}
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              window.location.reload();
            }}
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }
  
  const { email, messages, customer } = conversation;
  
  return (
    <div className="bg-white border rounded-md overflow-hidden h-full flex flex-col">
      <div className="border-b p-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold">{email.subject}</h2>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <span className="font-medium text-gray-700">
                {customer?.company || customer?.name || email.from.split('<')[0].trim()}
              </span>
              <ChevronRight className="h-4 w-4 mx-1" />
              <span>Created {format(new Date(email.date), 'MMM d, yyyy')}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Clock className="mr-1 h-4 w-4" />
              Snooze
            </Button>
            <Button variant="outline" size="sm">
              <ArrowDown className="mr-1 h-4 w-4" />
              Assign
            </Button>
          </div>
        </div>
        
        <div className="flex gap-4 mt-4">
          <div className="flex items-center text-sm">
            <User className="h-4 w-4 mr-1 text-gray-500" />
            <span className="font-medium">Assigned to:</span>
            <span className="ml-1">John Smith</span>
          </div>
          
          <div className="flex items-center text-sm">
            <MessageCircle className="h-4 w-4 mr-1 text-gray-500" />
            <span className="font-medium">Status:</span>
            <span className="ml-1 capitalize">in progress</span>
          </div>
        </div>
      </div>
      
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
      
      <div className="border-t p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">
                <ArrowUp className="mr-1 h-4 w-4" />
                Reply
              </Button>
              <Separator orientation="vertical" className="h-5" />
              <Button variant="ghost" size="sm">Note</Button>
              <Button variant="ghost" size="sm">Forward</Button>
            </div>
            <div>
              <Button variant="ghost" size="sm">
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="border rounded-md bg-white">
            <Textarea 
              placeholder="Type your reply..."
              className="border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={5}
            />
            
            <div className="flex justify-between items-center p-2 border-t">
              <div></div>
              <Button>
                <Send className="mr-1 h-4 w-4" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationDetail;
