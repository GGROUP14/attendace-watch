import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentName, message, timestamp } = await req.json();

    const GMAIL_USER = Deno.env.get('GMAIL_USER');
    const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD');
    const ALERT_RECIPIENT_EMAIL = Deno.env.get('ALERT_RECIPIENT_EMAIL');

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD || !ALERT_RECIPIENT_EMAIL) {
      throw new Error('Email configuration missing');
    }

    // Build email content
    const subject = `🚨 Student Alert: ${studentName}`;
    const body = [
      `Student Alert Notification`,
      ``,
      `Student: ${studentName}`,
      `Time: ${timestamp}`,
      `Details: ${message}`,
      ``,
      `This is an automated alert from the Classroom Attendance System.`,
    ].join('\n');

    // Send via Gmail SMTP using Deno's smtp client approach
    // We'll use the Gmail API via fetch with basic auth
    const emailContent = [
      `From: ${GMAIL_USER}`,
      `To: ${ALERT_RECIPIENT_EMAIL}`,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset=utf-8`,
      ``,
      body,
    ].join('\r\n');

    const base64Email = btoa(unescape(encodeURIComponent(emailContent)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Use nodemailer-like approach with raw SMTP via Deno
    // Alternative: use a simple HTTP-based email sending approach
    const smtpResponse = await sendViaSMTP(GMAIL_USER, GMAIL_APP_PASSWORD, ALERT_RECIPIENT_EMAIL, subject, body);

    return new Response(JSON.stringify({ success: true, message: 'Alert email sent' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function sendViaSMTP(from: string, password: string, to: string, subject: string, body: string) {
  const conn = await Deno.connect({ hostname: "smtp.gmail.com", port: 465, transport: "tcp" });
  
  // Use TLS connection
  const tlsConn = await Deno.startTls(conn, { hostname: "smtp.gmail.com" });
  
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  async function read(): Promise<string> {
    const buf = new Uint8Array(1024);
    const n = await tlsConn.read(buf);
    return decoder.decode(buf.subarray(0, n || 0));
  }

  async function write(data: string) {
    await tlsConn.write(encoder.encode(data + "\r\n"));
  }

  // SMTP conversation
  await read(); // greeting
  await write(`EHLO localhost`);
  await read();
  
  // AUTH LOGIN
  await write(`AUTH LOGIN`);
  await read();
  await write(btoa(from));
  await read();
  await write(btoa(password));
  const authResponse = await read();
  
  if (!authResponse.startsWith('235')) {
    tlsConn.close();
    throw new Error('SMTP authentication failed');
  }

  await write(`MAIL FROM:<${from}>`);
  await read();
  await write(`RCPT TO:<${to}>`);
  await read();
  await write(`DATA`);
  await read();
  
  const message = `From: ${from}\r\nTo: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}\r\n.`;
  await write(message);
  await read();
  
  await write(`QUIT`);
  tlsConn.close();
}
