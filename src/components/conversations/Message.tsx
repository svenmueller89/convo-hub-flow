
import React from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageProps {
  sender: string;
  content: string;
  timestamp: string;
  isCustomer: boolean;
  avatar?: string;
  attachments?: { id: string; filename: string; contentType: string; size: number }[];
}

const Message: React.FC<MessageProps> = ({ 
  sender, 
  content, 
  timestamp, 
  isCustomer, 
  avatar, 
  attachments 
}) => {
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

export default Message;
