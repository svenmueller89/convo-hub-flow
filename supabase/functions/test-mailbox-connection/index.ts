import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

interface TestConnectionRequest {
  email: string;
  imap_host: string;
  imap_port: number;
  imap_encryption: 'SSL/TLS' | 'STARTTLS' | 'None';
  smtp_host: string;
  smtp_port: number;
  smtp_encryption: 'SSL/TLS' | 'STARTTLS' | 'None';
  username: string;
  password: string;
}

interface TestResult {
  success: boolean;
  message: string;
  details?: {
    imap?: {
      success: boolean;
      message: string;
    };
    smtp?: {
      success: boolean;
      message: string;
    };
  };
}

async function testImapConnection(config: TestConnectionRequest): Promise<{ success: boolean; message: string }> {
  try {
    // For a real implementation, you would use a library like node-imap or similar
    // Since we're in Deno, we'll use a TCP connection test
    const hostname = config.imap_host;
    const port = config.imap_port;
    
    // Basic connection test
    try {
      const conn = await Deno.connect({ hostname, port });
      conn.close();
      
      return {
        success: true,
        message: `IMAP connection to ${hostname}:${port} established successfully`
      };
    } catch (error) {
      return {
        success: false,
        message: `IMAP connection failed: ${error.message}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `IMAP test error: ${error.message}`
    };
  }
}

async function testSmtpConnection(config: TestConnectionRequest): Promise<{ success: boolean; message: string }> {
  try {
    // For a real implementation, you would use SMTP libraries
    // For now, we'll do a basic TCP connection test
    const hostname = config.smtp_host;
    const port = config.smtp_port;
    
    try {
      const conn = await Deno.connect({ hostname, port });
      conn.close();
      
      return {
        success: true,
        message: `SMTP connection to ${hostname}:${port} established successfully`
      };
    } catch (error) {
      return {
        success: false,
        message: `SMTP connection failed: ${error.message}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `SMTP test error: ${error.message}`
    };
  }
}

const handler = async (req: Request) => {
  console.log("[test-mailbox-connection] Function called");
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get JWT token from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header provided' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Parse request data
    const config: TestConnectionRequest = await req.json();
    
    console.log(`Testing connection for ${config.email}`);
    console.log(`IMAP: ${config.imap_host}:${config.imap_port} (${config.imap_encryption})`);
    console.log(`SMTP: ${config.smtp_host}:${config.smtp_port} (${config.smtp_encryption})`);

    // Test both IMAP and SMTP connections
    const [imapResult, smtpResult] = await Promise.all([
      testImapConnection(config),
      testSmtpConnection(config)
    ]);

    const result: TestResult = {
      success: imapResult.success && smtpResult.success,
      message: imapResult.success && smtpResult.success 
        ? "Both IMAP and SMTP connections successful"
        : "One or more connections failed",
      details: {
        imap: imapResult,
        smtp: smtpResult
      }
    };

    console.log("Connection test result:", result);

    return new Response(
      JSON.stringify(result),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('Error in test-mailbox-connection function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: `Connection test failed: ${error.message}`,
        error: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

Deno.serve(handler);