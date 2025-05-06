
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ConversationStatus } from '@/types/conversation-status';

interface StatusBadgeProps {
  status: ConversationStatus;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  return (
    <Badge 
      className={cn(
        "text-white font-medium px-2 py-1",
        className
      )}
      style={{ backgroundColor: status.color }}
    >
      {status.name}
    </Badge>
  );
};
