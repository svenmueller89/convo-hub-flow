
import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EmailSummary } from '@/types/email';
import { useEmails } from '@/hooks/use-emails';
import { formatDistanceToNow } from 'date-fns';
import { Paperclip } from 'lucide-react';

const statusClasses: Record<string, { color: string; label: string }> = {
  'new': { color: 'bg-convo-warning text-white', label: 'New' },
  'in-progress': { color: 'bg-convo-primary text-white', label: 'In Progress' },
  'resolved': { color: 'bg-convo-success text-white', label: 'Resolved' },
};

interface EmailItemProps {
  email: EmailSummary;
  selected: boolean;
  onClick: () => void;
}

const EmailItem: React.FC<EmailItemProps> = ({
  email,
  selected,
  onClick,
}) => {
  const statusClass = statusClasses[email.status];
  const fromName = email.from.split('<')[0].trim();
  const initials = fromName.split(' ')
    .map(name => name[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  
  const formattedDate = formatDistanceToNow(new Date(email.date), { addSuffix: true });
  
  return (
    <div 
      className={cn(
        "p-3 border-b border-gray-200 cursor-pointer",
        selected ? "bg-convo-secondary" : "hover:bg-gray-50",
        !email.read ? "bg-blue-50" : ""
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 bg-convo-gray-200">
          <span className="text-xs font-medium">{initials}</span>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <p className={cn("text-sm font-medium truncate", !email.read && "font-semibold")}>
              {fromName}
            </p>
            <p className="text-xs text-gray-500">{formattedDate}</p>
          </div>
          
          <p className="text-sm font-medium truncate">{email.subject}</p>
          
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-500 truncate max-w-[70%]">{email.preview}</p>
            <div className="flex items-center space-x-2">
              {email.has_attachments && (
                <Paperclip className="h-3 w-3 text-gray-400" />
              )}
              <Badge className={cn("text-xs", statusClass.color)}>
                {statusClass.label}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const EmailList: React.FC = () => {
  const { emails, isLoading, selectedEmail, setSelectedEmail, unreadCount } = useEmails();
  
  // Debug logging to see what's happening
  React.useEffect(() => {
    console.log('EmailList rendering with:', { 
      emailsCount: emails?.length,
      selectedEmail,
      isLoading
    });
  }, [emails, selectedEmail, isLoading]);
  
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
        <p className="text-gray-500">No emails found</p>
      </div>
    );
  }

  // This function should directly call setSelectedEmail from the useEmails hook
  const handleEmailClick = (emailId: string) => {
    console.log('Email clicked in EmailList component:', emailId);
    setSelectedEmail(emailId);
  };

  return (
    <div className="bg-white border rounded-md overflow-hidden h-full">
      <div className="flex items-center justify-between border-b p-3">
        <h2 className="text-lg font-semibold">Inbox</h2>
        <span className="text-sm text-convo-primary font-medium">{unreadCount} unread</span>
      </div>
      <div className="divide-y divide-gray-200 max-h-[calc(100%-3rem)] overflow-y-auto">
        {emails.map((email) => (
          <EmailItem
            key={email.id}
            email={email}
            selected={selectedEmail === email.id}
            onClick={() => handleEmailClick(email.id)}
          />
        ))}
      </div>
    </div>
  );
};
