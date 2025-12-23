import { NextRequest, NextResponse } from 'next/server';

const CONTACT_EMAIL = 'bittucreators@gmail.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Using Unosend API
    if (process.env.UNOSEND_API_KEY) {
      const response = await fetch('https://www.unosend.co/api/v1/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.UNOSEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: `${process.env.UNOSEND_FROM_NAME || 'Writine'} <${process.env.UNOSEND_FROM_EMAIL || 'contact@writine.com'}>`,
          to: [CONTACT_EMAIL],
          reply_to: email,
          subject: subject || `Contact from ${name}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject || 'No subject'}</p>
            <hr />
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
          `,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Unosend error:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to send email' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    // Fallback: Log the message when no email service is configured
    console.log('=== New Contact Form Submission ===');
    console.log('To:', CONTACT_EMAIL);
    console.log('From:', name, `<${email}>`);
    console.log('Subject:', subject || 'No subject');
    console.log('Message:', message);
    console.log('===================================');

    // For now, just return success (in production, configure Unosend)
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
