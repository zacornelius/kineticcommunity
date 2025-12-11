import 'server-only';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.SES_ACCESS_KEY_ID!,
    secretAccessKey: process.env.SES_SECRET_ACCESS_KEY!,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
  from = 'community@kineticdogfood.com',
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  try {
    const command = new SendEmailCommand({
      Source: from,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: html,
            Charset: 'UTF-8',
          },
        },
      },
    });

    const response = await sesClient.send(command);
    console.log('Email sent via SES:', response.MessageId);
    return response;
  } catch (error) {
    console.error('Failed to send email via SES:', error);
    throw error;
  }
}

