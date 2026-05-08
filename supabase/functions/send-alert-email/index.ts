import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentName, message, timestamp } = await req.json();

    const GMAIL_USER = Deno.env.get('GMAIL_USER');
    const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD');
    const ALERT_RECIPIENT_EMAIL = Deno.env.get('ALERT_RECIPIENT_EMAIL');

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD || !ALERT_RECIPIENT_EMAIL) {
      throw new Error('Email configuration missing (GMAIL_USER / GMAIL_APP_PASSWORD / ALERT_RECIPIENT_EMAIL)');
    }

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

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: GMAIL_USER,
          password: GMAIL_APP_PASSWORD,
        },
      },
    });

    await client.send({
      from: GMAIL_USER,
      to: ALERT_RECIPIENT_EMAIL,
      subject,
      content: body,
    });

    await client.close();

    console.log(`Alert email sent to ${ALERT_RECIPIENT_EMAIL} for ${studentName}`);

    return new Response(JSON.stringify({ success: true, message: 'Alert email sent' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
