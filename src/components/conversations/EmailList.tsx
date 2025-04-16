
import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmailSummary } from '@/types/email';
import { useEmails } from '@/hooks/use-emails';
import { formatDistanceToNow } from 'date-fns';
import { Paperclip, ArrowRightCircle, Clock, CheckCircle } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const statusClasses: Record<string, { color: string; label: string }> = {
  'new': { color: 'bg-convo-warning text-white', label: 'New' },
  'in-progress': { color: 'bg-convo-primary text-white', label: 'In Progress' },
  'resolved': { color: 'bg-convo-success text-white', label: 'Resolved' },
};

interface EmailItemProps {
  email: EmailSummary;
  selected: boolean;
  onClick: (emailId: string) => void;
  onSetStatus: (emailId: string, status: 'in-progress' | 'resolved') => void;
}

const EmailItem: React.FC<EmailItemProps> = ({
  email,
  selected,
  onClick,
  onSetStatus,
}) => {
  const fromName = email.from.split('<')[0].trim();
  const initials = fromName.split(' ')
    .map(name => name[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  
  const formattedDate = formatDistanceToNow(new Date(email.date), { addSuffix: true });
  
  // Enhanced click handler
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log(`Email clicked: ${email.id} - ${email.subject}`);
    onClick(email.id);
  };
  
  return (
    <div 
      className={cn(
        "p-3 border-b border-gray-200 cursor-pointer",
        selected ? "bg-convo-secondary" : "hover:bg-gray-50"
      )}
      onClick={handleClick}
      data-email-id={email.id}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 bg-convo-gray-200">
          <span className="text-xs font-medium">{initials}</span>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium truncate">
                {fromName}
              </p>
              <p className="text-sm font-medium truncate">{email.subject}</p>
            </div>
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ArrowRightCircle className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onSetStatus(email.id, 'in-progress');
                  }}>
                    <Clock className="mr-2 h-4 w-4" />
                    <span>Mark In Progress</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onSetStatus(email.id, 'resolved');
                  }}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    <span>Mark Resolved</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-500 truncate max-w-[70%]">{email.preview}</p>
            <div className="flex items-center space-x-2">
              {email.has_attachments && (
                <Paperclip className="h-3 w-3 text-gray-400" />
              )}
              <p className="text-xs text-gray-500">{formattedDate}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface EmailListProps {
  selectedEmail: string | null;
  onSelectEmail: (emailId: string) => void;
}

export const EmailList: React.FC<EmailListProps> = ({ selectedEmail, onSelectEmail }) => {
  const { emails, isLoading, setEmailStatus } = useEmails();
  
  // Debug logging
  useEffect(() => {
    console.log('EmailList rendering with:', { 
      emailsCount: emails?.length,
      selectedEmail,
      isLoading
    });
  }, [emails, selectedEmail, isLoading]);
  
  const handleSelectEmail = (emailId: string) => {
    console.log(`EmailList: selecting email ${emailId}`);
    onSelectEmail(emailId);
  };
  
  const handleSetStatus = (emailId: string, status: 'in-progress' | 'resolved') => {
    console.log(`Setting status for email ${emailId} to ${status}`);
    setEmailStatus.mutate({ emailId, status });
  };
  
  if (isLoading) {
    return (
      <div className="bg-white border rounded-md overflow-hidden h-full flex items-center justify-center">
        <p className="text-gray-500">Loading emails...</p>
      </div>
    );
  }
  
  if (!emails || emails.length === 0) {
    return (
      <div className="bg-white border rounded-md overflow-hidden h-full flex items-center justify-center">
        <p className="text-gray-500">No new emails found</p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-md overflow-hidden h-full">
      <div className="flex items-center justify-between border-b p-3">
        <h2 className="text-lg font-semibold">New Emails</h2>
        <span className="text-sm text-gray-500">{emails.length} new</span>
      </div>
      <div className="divide-y divide-gray-200 max-h-[calc(100%-3rem)] overflow-y-auto">
        {emails.map((email) => (
          <EmailItem
            key={email.id}
            email={email}
            selected={selectedEmail === email.id}
            onClick={handleSelectEmail}
            onSetStatus={handleSetStatus}
          />
        ))}
      </div>
    </div>
  );
};
