
import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const NotificationSettings: React.FC = () => {
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [browserNotifications, setBrowserNotifications] = useState(true);
  const [newMessageNotifications, setNewMessageNotifications] = useState(true);
  const [mentionNotifications, setMentionNotifications] = useState(true);
  const [digests, setDigests] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveSettings = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Notification settings saved",
        description: "Your notification preferences have been updated."
      });
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Notification Channels</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-gray-500">Receive notifications via email</p>
            </div>
            <Switch 
              id="email-notifications" 
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="browser-notifications">Browser Notifications</Label>
              <p className="text-sm text-gray-500">Show desktop notifications in your browser</p>
            </div>
            <Switch 
              id="browser-notifications" 
              checked={browserNotifications}
              onCheckedChange={setBrowserNotifications}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Notification Types</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="new-message-notifications">New Messages</Label>
              <p className="text-sm text-gray-500">When you receive new customer messages</p>
            </div>
            <Switch 
              id="new-message-notifications" 
              checked={newMessageNotifications}
              onCheckedChange={setNewMessageNotifications}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="mention-notifications">Mentions</Label>
              <p className="text-sm text-gray-500">When someone mentions you in a conversation</p>
            </div>
            <Switch 
              id="mention-notifications" 
              checked={mentionNotifications}
              onCheckedChange={setMentionNotifications}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="digest-notifications">Daily Digest</Label>
              <p className="text-sm text-gray-500">Receive a summary of activity each day</p>
            </div>
            <Switch 
              id="digest-notifications" 
              checked={digests}
              onCheckedChange={setDigests}
            />
          </div>
        </div>
      </div>
      
      <Button 
        onClick={handleSaveSettings} 
        disabled={isLoading}
        className="mt-6"
      >
        {isLoading ? "Saving..." : "Save Notification Settings"}
      </Button>
    </div>
  );
};

export default NotificationSettings;
