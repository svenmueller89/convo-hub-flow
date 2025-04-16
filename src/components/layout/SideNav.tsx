
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Inbox, 
  Users, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  Settings, 
  Mail,
  PlusCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useEmails } from '@/hooks/use-emails';

export const SideNav: React.FC = () => {
  const location = useLocation();
  const { emails } = useEmails();
  
  // Count of new emails (inbox)
  const newCount = emails?.length || 0;
  
  const navigation = [
    { name: 'Inbox', href: '/', icon: Inbox, count: newCount, active: location.pathname === '/' },
    { name: 'Customers', href: '/customers', icon: Users, active: location.pathname === '/customers' },
    { 
      name: 'Conversations', 
      href: '/conversations', 
      icon: MessageSquare, 
      active: location.pathname === '/conversations' 
    },
    { name: 'Completed', href: '/completed', icon: CheckCircle, active: location.pathname === '/completed' },
    { name: 'Snoozed', href: '/snoozed', icon: Clock, active: location.pathname === '/snoozed' },
    { name: 'Settings', href: '/settings', icon: Settings, active: location.pathname === '/settings' },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 border-r border-gray-200 bg-white">
      <div className="flex items-center h-16 px-4 border-b border-gray-200">
        <div className="flex items-center">
          <Mail className="h-6 w-6 text-convo-primary" />
          <span className="ml-2 text-xl font-semibold text-gray-800">ConvoHub</span>
        </div>
      </div>
      <div className="flex-1 px-3 py-4 space-y-1">
        <Button 
          className="w-full justify-start bg-convo-primary hover:bg-convo-primary/90 text-white"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          New Conversation
        </Button>
        
        <nav className="space-y-1 mt-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                item.active
                  ? 'bg-convo-secondary text-convo-primary font-medium'
                  : 'text-gray-600 hover:bg-gray-50',
                'group flex items-center px-3 py-2 text-sm rounded-md'
              )}
            >
              <item.icon
                className={cn(
                  item.active ? 'text-convo-primary' : 'text-gray-500',
                  'mr-3 flex-shrink-0 h-5 w-5'
                )}
                aria-hidden="true"
              />
              <span className="flex-1">{item.name}</span>
              {item.count ? (
                <span
                  className={cn(
                    item.active ? 'bg-convo-primary text-white' : 'bg-gray-200 text-gray-600',
                    'ml-3 inline-block py-0.5 px-2 text-xs rounded-full'
                  )}
                >
                  {item.count}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-convo-primary flex items-center justify-center text-white">
            JS
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">John Smith</p>
            <p className="text-xs text-gray-500">john@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};
