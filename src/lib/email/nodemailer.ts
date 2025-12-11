import 'server-only';
import * as nodemailer from 'nodemailer';

// Create reusable transporter using GoDaddy 365 SMTP
export const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER, // community@kineticdogfood.com
    pass: process.env.SMTP_PASSWORD, // your email password
  },
  tls: {
    ciphers: 'SSLv3',
  },
});

export async function sendEmail({
  to,
  subject,
  html,
  from = process.env.SMTP_FROM || 'community@kineticdogfood.com',
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

