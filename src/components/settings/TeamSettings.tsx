
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, MoreVertical } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Define types for team members
type UserStatus = "active" | "invited" | "inactive";
type UserRole = "user" | "admin";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  role: UserRole;
}

// Mock data for demonstration
const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@example.com',
    status: 'active',
    role: 'admin',
  },
  {
    id: '2',
    name: 'Jane Doe',
    email: 'jane@example.com',
    status: 'active',
    role: 'user',
  },
  {
    id: '3',
    name: 'Pending User',
    email: 'pending@example.com',
    status: 'invited',
    role: 'user',
  },
  {
    id: '4',
    name: 'Former User',
    email: 'former@example.com',
    status: 'inactive',
    role: 'user',
  },
];

// Form schema for inviting users
const inviteFormSchema = z.object({
  email: z.string()
    .email("Please enter a valid email address")
    .refine((email) => !mockTeamMembers.some(member => member.email === email), {
      message: "This email is already in the workspace"
    }),
  role: z.enum(["user", "admin"]).default("user"),
});

const TeamSettings: React.FC = () => {
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Initialize form with zod validation
  const form = useForm<z.infer<typeof inviteFormSchema>>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
      role: "user",
    },
  });

  // Filter users based on search query and status filter
  const filterUsers = () => {
    let filtered = teamMembers;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(member => 
        member.name.toLowerCase().includes(query) || 
        member.email.toLowerCase().includes(query)
      );
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => member.status === statusFilter);
    }
    
    setFilteredMembers(filtered);
  };

  // Update filters when search query or status filter changes
  React.useEffect(() => {
    filterUsers();
  }, [searchQuery, statusFilter, teamMembers]);

  // Handle invite form submission
  const handleInviteSubmit = (values: z.infer<typeof inviteFormSchema>) => {
    // In a real app, send API request to invite user
    console.log("Inviting user:", values);
    
    // Create new team member in "invited" status
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: values.email.split('@')[0], // Placeholder name from email
      email: values.email,
      status: 'invited',
      role: values.role,
    };
    
    // Add to team members
    setTeamMembers(prev => [...prev, newMember]);
    
    // Close dialog and show success message
    setInviteDialogOpen(false);
    form.reset();
    
    toast({
      title: "Invitation sent",
      description: `Invitation sent to ${values.email}`,
    });
  };

  // Handle member removal
  const handleRemoveMember = () => {
    if (selectedMember) {
      // In a real app, send API request to remove user
      console.log("Removing user:", selectedMember);
      
      // Update member status to inactive
      const updatedMembers = teamMembers.map(member => 
        member.id === selectedMember.id 
          ? { ...member, status: 'inactive' as UserStatus } 
          : member
      );
      
      setTeamMembers(updatedMembers);
      
      // Close dialog and show success message
      setRemoveDialogOpen(false);
      setSelectedMember(null);
      
      toast({
        title: "User removed",
        description: `${selectedMember.name} has been removed from the workspace`,
      });
    }
  };

  // Handle invite revocation
  const handleRevokeInvite = (member: TeamMember) => {
    // In a real app, send API request to revoke invitation
    console.log("Revoking invitation:", member);
    
    // Update member status to inactive
    const updatedMembers = teamMembers.map(m => 
      m.id === member.id 
        ? { ...m, status: 'inactive' as UserStatus } 
        : m
    );
    
    setTeamMembers(updatedMembers);
    
    toast({
      title: "Invitation revoked",
      description: `Invitation to ${member.email} has been revoked`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="invited">Invited</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button 
          onClick={() => setInviteDialogOpen(true)}
          className="flex items-center"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        member.status === 'active' ? 'default' : 
                        member.status === 'invited' ? 'secondary' : 'outline'
                      }
                    >
                      {member.status === 'active' ? 'Active' : 
                       member.status === 'invited' ? 'Invited' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {member.role === 'admin' ? 'Admin' : 'User'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {member.status === 'invited' ? (
                          <DropdownMenuItem 
                            onClick={() => handleRevokeInvite(member)}
                            className="text-destructive"
                          >
                            Revoke Invite
                          </DropdownMenuItem>
                        ) : member.status === 'active' ? (
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedMember(member);
                              setRemoveDialogOpen(true);
                            }}
                            className="text-destructive"
                          >
                            Remove User
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No team members found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation email to add a new team member to your workspace.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleInviteSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="email@example.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setInviteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Send Invite</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Remove User Dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedMember && (
                <>
                  Remove access for {selectedMember.name}? All user data remains but they can no longer log in.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeamSettings;
