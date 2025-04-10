import React from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Clock, ArrowDown, User, MessageCircle, ArrowUp, Send, Paperclip, ChevronRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface MessageProps {
  sender: string;
  content: string;
  timestamp: string;
  isCustomer: boolean;
  avatar?: string;
}

const Message: React.FC<MessageProps> = ({ sender, content, timestamp, isCustomer, avatar }) => {
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
      </div>
    </div>
  );
};

export const ConversationDetail: React.FC = () => {
  const conversation = {
    id: "1",
    customer: "Acme Inc.",
    subject: "Website Redesign Quote",
    assignedTo: "John Smith",
    status: "new",
    createdAt: "March 1, 2025",
  };
  
  const messages = [
    {
      id: "1",
      sender: "Acme Inc.",
      content: "Hi there,\n\nI'm reaching out to discuss the quote for our website redesign project. We're looking to modernize our online presence and improve our customer experience. Can you provide more details about your pricing structure and timeline?\n\nBest regards,\nTom Johnson\nMarketing Director, Acme Inc.",
      timestamp: "10:30 AM",
      isCustomer: true,
    },
    {
      id: "2",
      sender: "John Smith",
      content: "Hello Tom,\n\nThank you for reaching out about the website redesign project. I'd be happy to discuss our pricing structure and timeline in more detail.\n\nOur basic website redesign package starts at $5,000 and includes:\n- Custom design\n- Responsive layout\n- Basic SEO optimization\n- Content migration\n\nThe timeline is typically 4-6 weeks depending on the complexity of the project.\n\nWould you like to schedule a call to discuss your specific requirements?\n\nBest regards,\nJohn",
      timestamp: "10:45 AM",
      isCustomer: false,
    },
  ];
  
  return (
    <div className="bg-white border rounded-md overflow-hidden h-full flex flex-col">
      <div className="border-b p-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold">{conversation.subject}</h2>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <span className="font-medium text-gray-700">{conversation.customer}</span>
              <ChevronRight className="h-4 w-4 mx-1" />
              <span>Created {conversation.createdAt}</span>
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
            <span className="ml-1">{conversation.assignedTo}</span>
          </div>
          
          <div className="flex items-center text-sm">
            <MessageCircle className="h-4 w-4 mr-1 text-gray-500" />
            <span className="font-medium">Status:</span>
            <span className="ml-1 capitalize">{conversation.status}</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          {messages.map((message) => (
            <Message key={message.id} {...message} />
          ))}
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
