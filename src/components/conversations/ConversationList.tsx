
import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

type Status = 'new' | 'in-progress' | 'resolved';

interface ConversationProps {
  id: string;
  customer: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  status: Status;
  selected?: boolean;
  avatar?: string;
}

const statusClasses: Record<Status, { color: string; label: string }> = {
  'new': { color: 'bg-convo-warning text-white', label: 'New' },
  'in-progress': { color: 'bg-convo-primary text-white', label: 'In Progress' },
  'resolved': { color: 'bg-convo-success text-white', label: 'Resolved' },
};

const ConversationItem: React.FC<ConversationProps & { onClick: () => void }> = ({
  customer,
  subject,
  preview,
  time,
  unread,
  status,
  selected,
  avatar,
  onClick,
}) => {
  const statusClass = statusClasses[status];
  
  return (
    <div 
      className={cn(
        "p-3 border-b border-gray-200 cursor-pointer",
        selected ? "bg-convo-secondary" : "hover:bg-gray-50",
        unread ? "bg-blue-50" : ""
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 bg-convo-gray-200">
          <span className="text-xs font-medium">{avatar || customer.substring(0, 2).toUpperCase()}</span>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <p className={cn("text-sm font-medium truncate", unread && "font-semibold")}>
              {customer}
            </p>
            <p className="text-xs text-gray-500">{time}</p>
          </div>
          
          <p className="text-sm font-medium truncate">{subject}</p>
          
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-500 truncate">{preview}</p>
            <Badge className={cn("text-xs", statusClass.color)}>
              {statusClass.label}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ConversationList: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = React.useState<string | null>("1");
  
  const conversations: ConversationProps[] = [
    {
      id: "1",
      customer: "Acme Inc.",
      subject: "Website Redesign Quote",
      preview: "Hi, I'd like to discuss the quote for our website redesign project...",
      time: "10:45 AM",
      unread: true,
      status: "new",
    },
    {
      id: "2",
      customer: "Jane Cooper",
      subject: "Product Return RMA-29384",
      preview: "I received my order yesterday but the product is damaged. I'd like to...",
      time: "Yesterday",
      unread: true,
      status: "in-progress",
    },
    {
      id: "3",
      customer: "Globex Corporation",
      subject: "Partnership Opportunity",
      preview: "We're interested in exploring a potential partnership with your...",
      time: "Yesterday",
      unread: false,
      status: "new",
    },
    {
      id: "4",
      customer: "Robert Fox",
      subject: "Invoice #INV-5678",
      preview: "Thank you for the prompt payment. The invoice has been marked as paid.",
      time: "Feb 28",
      unread: false,
      status: "resolved",
    },
    {
      id: "5",
      customer: "Cory Smith",
      subject: "Technical Support Request",
      preview: "I'm having trouble logging into my account. I've tried resetting...",
      time: "Feb 27",
      unread: false,
      status: "in-progress",
    },
    {
      id: "6",
      customer: "Abstergo Ltd.",
      subject: "Order Confirmation #1234",
      preview: "Thank you for your order. We're processing it now and will ship...",
      time: "Feb 26",
      unread: false,
      status: "resolved",
    },
  ];

  return (
    <div className="bg-white border rounded-md overflow-hidden h-full">
      <div className="flex items-center justify-between border-b p-3">
        <h2 className="text-lg font-semibold">Inbox</h2>
        <span className="text-sm text-convo-primary font-medium">12 unread</span>
      </div>
      <div className="divide-y divide-gray-200 max-h-[calc(100%-3rem)] overflow-y-auto">
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            {...conversation}
            selected={selectedConversation === conversation.id}
            onClick={() => setSelectedConversation(conversation.id)}
          />
        ))}
      </div>
    </div>
  );
};
