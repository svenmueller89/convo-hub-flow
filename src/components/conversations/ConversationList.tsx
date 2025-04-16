
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Search, Filter, ArrowUpDown, Paperclip } from 'lucide-react';
import { useConversations } from '@/hooks/use-conversations';
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

interface ConversationItemProps {
  id: string;
  from: string;
  subject: string;
  preview: string;
  date: string;
  unread: boolean;
  status: 'new' | 'in-progress' | 'resolved';
  selected?: boolean;
  hasAttachments: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  from,
  subject,
  preview,
  date,
  unread,
  status,
  selected,
  hasAttachments,
  onClick,
}) => {
  const statusClass = statusClasses[status];
  const fromName = from.split('<')[0].trim();
  const initials = fromName
    .split(' ')
    .map(name => name[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  
  const formattedDate = formatDistanceToNow(new Date(date), { addSuffix: true });
  
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
          <span className="text-xs font-medium">{initials}</span>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <p className={cn("text-sm font-medium truncate", unread && "font-semibold")}>
              {fromName}
            </p>
            <p className="text-xs text-gray-500">{formattedDate}</p>
          </div>
          
          <p className="text-sm font-medium truncate">{subject}</p>
          
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-500 truncate max-w-[70%]">{preview}</p>
            <div className="flex items-center space-x-2">
              {hasAttachments && (
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

export const ConversationList: React.FC = () => {
  const navigate = useNavigate();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  
  const { 
    conversations, 
    isLoading, 
    filter, 
    setFilter, 
    search, 
    setSearch, 
    sortBy, 
    setSortBy, 
    unreadCounts 
  } = useConversations();
  
  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);
    navigate(`/conversation/${conversationId}`);
  };

  return (
    <div className="bg-white border rounded-md overflow-hidden h-full flex flex-col">
      <div className="border-b p-3 space-y-3">
        <h2 className="text-lg font-semibold">Conversations</h2>
        
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" />
                <span>Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setFilter('all')}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('new')}>
                New
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('in-progress')}>
                In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('resolved')}>
                Resolved
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
            className="flex items-center gap-1"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span>{sortBy === 'newest' ? 'Newest' : 'Oldest'}</span>
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger 
              value="all" 
              onClick={() => setFilter('all')}
              className="relative"
            >
              All
              {unreadCounts.total > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-convo-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCounts.total}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="new" 
              onClick={() => setFilter('new')}
              className="relative"
            >
              New
              {unreadCounts.new > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-convo-warning text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCounts.new}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="in-progress" 
              onClick={() => setFilter('in-progress')}
              className="relative"
            >
              In Progress
              {unreadCounts.inProgress > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-convo-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCounts.inProgress}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="resolved" 
              onClick={() => setFilter('resolved')}
              className="relative"
            >
              Resolved
              {unreadCounts.resolved > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-convo-success text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCounts.resolved}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No conversations found</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              id={conversation.id}
              from={conversation.from}
              subject={conversation.subject}
              preview={conversation.preview}
              date={conversation.date}
              unread={!conversation.read}
              status={conversation.status}
              selected={selectedConversation === conversation.conversation_id}
              hasAttachments={conversation.has_attachments}
              onClick={() => handleConversationSelect(conversation.conversation_id)}
            />
          ))
        )}
      </div>
    </div>
  );
};
