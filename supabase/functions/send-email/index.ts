
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface SendEmailRequest {
  mailboxId: string;
  to: string;
  subject: string;
  message: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const { mailboxId, to, subject, message } = await req.json() as SendEmailRequest;
    
    console.log('Received request to send email:', { mailboxId, to, subject });
    
    // Simulate sending email - in a real implementation, 
    // this would connect to an email service
    console.log('Sending email from mailbox:', mailboxId);
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Message:', message);
    
    // Simulate a delay to mimic actual email sending
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate a mock conversation ID and email ID
    const conversationId = `conv_${Math.random().toString(36).substring(2, 10)}`;
    const emailId = `email_${Math.random().toString(36).substring(2, 10)}`;
    
    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          conversationId,
          emailId,
          status: 'sent',
          timestamp: new Date().toISOString()
        } 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
    
  } catch (error) {
    console.error('Error sending email:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
