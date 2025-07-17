
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const { toast } = useToast();

  // Check for recovery tokens in URL hash on component mount
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get('type') === 'recovery') {
      setIsRecovery(true);
    }
  }, []);

  // Redirect if user is already logged in and not in recovery mode
  if (user && !loading && !isRecovery) {
    return <Navigate to="/" />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({
        title: "Authentication failed",
        description: error.message,
        variant: "destructive"
      });
    }
    setIsSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await signUp(email, password, fullName);
    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Account created",
        description: "Please check your email for verification instructions.",
      });
    }
    setIsSubmitting(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });
      
      if (error) {
        toast({
          title: "Reset failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Reset email sent",
          description: "Please check your email for password reset instructions.",
        });
        setResetEmail('');
      }
    } catch (error) {
      toast({
        title: "Reset failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
    
    setIsSubmitting(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        toast({
          title: "Password update failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Password updated",
          description: "Your password has been successfully updated. You can now sign in with your new password.",
        });
        // Clear recovery state and redirect
        setIsRecovery(false);
        window.location.hash = '';
        window.location.href = '/';
      }
    } catch (error) {
      toast({
        title: "Password update failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
    
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md px-4 py-8">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-convo-primary" />
            <span className="ml-2 text-2xl font-bold text-gray-800">ConvoHub</span>
          </div>
          <h2 className="text-lg font-medium text-gray-600">
            Your customer communication center
          </h2>
        </div>
        
        <Card>
          {isRecovery ? (
            <form onSubmit={handleUpdatePassword}>
              <CardHeader>
                <CardTitle>Set New Password</CardTitle>
                <CardDescription>
                  Enter your new password below
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating password...' : 'Update Password'}
                </Button>
              </CardFooter>
            </form>
          ) : (
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                <TabsTrigger value="reset">Reset</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn}>
                  <CardHeader>
                    <CardTitle>Sign In</CardTitle>
                    <CardDescription>
                      Enter your email and password to access your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp}>
                  <CardHeader>
                    <CardTitle>Create Account</CardTitle>
                    <CardDescription>
                      Enter your details to create a new account
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailSignup">Email</Label>
                      <Input
                        id="emailSignup"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passwordSignup">Password</Label>
                      <Input
                        id="passwordSignup"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creating account...' : 'Sign Up'}
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>
              
              <TabsContent value="reset">
                <form onSubmit={handlePasswordReset}>
                  <CardHeader>
                    <CardTitle>Reset Password</CardTitle>
                    <CardDescription>
                      Enter your email address and we'll send you a link to reset your password
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="resetEmail">Email</Label>
                      <Input
                        id="resetEmail"
                        type="email"
                        placeholder="your@email.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Sending reset email...' : 'Send Reset Email'}
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Auth;
