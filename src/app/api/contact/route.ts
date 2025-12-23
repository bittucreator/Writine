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
    const apiKey = process.env.UNOSEND_API_KEY;
    
    if (!apiKey) {
      console.error('UNOSEND_API_KEY is not configured');
      return NextResponse.json(
        { success: false, error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const emailPayload = {
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
    };

    const response = await fetch('https://www.unosend.co/api/v1/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Unosend API error:', response.status, errorText);
      return NextResponse.json(
        { success: false, error: `Email failed: ${response.status}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
