
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Mail, Star, Trash2, MoreVertical, Edit2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Mailbox } from '@/types/mailbox';
import { formatDistanceToNow } from 'date-fns';

interface MailboxCardProps {
  mailbox: Mailbox;
  onDelete: (id: string) => void;
  onEdit: (mailbox: Mailbox) => void;
  onSetPrimary: (id: string) => void;
}

const MailboxCard: React.FC<MailboxCardProps> = ({ mailbox, onDelete, onEdit, onSetPrimary }) => {
  const getLastSyncText = () => {
    if (!mailbox.last_sync) return "Never synced";
    return `Last sync: ${formatDistanceToNow(new Date(mailbox.last_sync))} ago`;
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-md bg-white">
      <div className="flex items-center">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
          mailbox.connection_status === 'error' 
            ? 'bg-red-100' 
            : 'bg-convo-secondary'
        }`}>
          <Mail className={`h-5 w-5 ${
            mailbox.connection_status === 'error' 
              ? 'text-red-500' 
              : 'text-convo-primary'
          }`} />
        </div>
        <div className="ml-3">
          <div className="flex items-center">
            <p className="font-medium">{mailbox.display_name || mailbox.email}</p>
            {mailbox.is_primary && (
              <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">
                Primary
              </span>
            )}
            {mailbox.connection_status === 'connected' && (
              <span className="ml-2 flex items-center text-xs text-green-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </span>
            )}
            {mailbox.connection_status === 'error' && (
              <span className="ml-2 flex items-center text-xs text-red-700">
                <AlertCircle className="h-3 w-3 mr-1" />
                Connection error
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{mailbox.email}</p>
          <p className="text-xs text-gray-400">{getLastSyncText()}</p>
        </div>
      </div>
      <div className="flex space-x-2">
        {!mailbox.is_primary && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onSetPrimary(mailbox.id)}
            title="Set as primary mailbox"
          >
            <Star className="h-4 w-4" />
          </Button>
        )}
        {mailbox.is_primary && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-amber-500 cursor-default"
            title="Primary mailbox"
          >
            <Star className="h-4 w-4 fill-amber-500" />
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(mailbox)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit settings
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(mailbox.id)}
              disabled={mailbox.is_primary}
              className={mailbox.is_primary ? "text-gray-400" : "text-red-600"}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {mailbox.is_primary ? "Cannot delete primary" : "Remove mailbox"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default MailboxCard;
