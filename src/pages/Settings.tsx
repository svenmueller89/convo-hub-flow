
import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Mail, Palette, User, Users } from 'lucide-react';
import ProfileSettings from '@/components/settings/ProfileSettings';
import MailboxSettings from '@/components/settings/MailboxSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import AppearanceSettings from '@/components/settings/AppearanceSettings';
import TeamSettings from '@/components/settings/TeamSettings';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  if (!user) {
    return null;
  }

  // For now we assume all users are admins for demonstration purposes
  // In a real implementation, we'd check the user's role from the user object
  const isAdmin = true;

  return (
    <AppShell>
      <div className="container py-6 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-500 mt-1">Manage your account preferences and settings</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" /> Profile
            </TabsTrigger>
            <TabsTrigger value="mailboxes" className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> Mailboxes
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" /> Appearance
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Team
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Manage your personal information and account preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileSettings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mailboxes">
            <Card>
              <CardHeader>
                <CardTitle>Mailbox Settings</CardTitle>
                <CardDescription>Manage your email accounts and connection preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <MailboxSettings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Control how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationSettings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>Customize the look and feel of the application</CardDescription>
              </CardHeader>
              <CardContent>
                <AppearanceSettings />
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="team">
              <Card>
                <CardHeader>
                  <CardTitle>Team Management</CardTitle>
                  <CardDescription>Manage your team and workspace access</CardDescription>
                </CardHeader>
                <CardContent>
                  <TeamSettings />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppShell>
  );
};

export default Settings;
