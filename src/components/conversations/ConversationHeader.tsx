
import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock, ArrowDown, User, MessageCircle, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Email } from '@/types/email';

interface ConversationHeaderProps {
  email: Email;
  customer?: {
    id: string;
    name: string;
    email: string;
    company?: string;
  };
}

const ConversationHeader: React.FC<ConversationHeaderProps> = ({ email, customer }) => {
  return (
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
  );
};

export default ConversationHeader;
