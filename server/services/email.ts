import nodemailer from 'nodemailer';
import * as logger from '../logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly EMAIL_TIMEOUT_MS = 5000; // 5 seconds timeout for email sending

  constructor() {
    // Initialize email transporter using SMTP
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        connectionTimeout: this.EMAIL_TIMEOUT_MS, // 5 seconds to connect
        socketTimeout: this.EMAIL_TIMEOUT_MS, // 5 seconds for socket operations
        greetingTimeout: this.EMAIL_TIMEOUT_MS, // 5 seconds for SMTP greeting
      });
      logger.info('Email service initialized', { 
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || '587',
      });
    } else {
      logger.warn('Email service not configured - SMTP credentials missing');
    }
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    if (!this.transporter) {
      logger.warn('Email service not configured - email not sent', { to: options.to });
      return { success: false, error: 'Email service not configured' };
    }

    const startTime = Date.now();
    
    try {
      const mailOptions = {
        from: process.env.SMTP_USER, // Always use SMTP_USER to avoid "send on behalf of" authorization issues
        to: options.to,
        subject: options.subject,
        html: options.html,
      };

      logger.info('Attempting to send email', { 
        to: options.to, 
        subject: options.subject,
      });

      // Create send promise
      const sendPromise = this.transporter.sendMail(mailOptions);
      
      // Create timeout promise that rejects after timeout duration
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Email send timeout after ${this.EMAIL_TIMEOUT_MS}ms - SMTP server may be slow or unresponsive`));
        }, this.EMAIL_TIMEOUT_MS);
      });
      
      // Race between sending and timeout
      // If timeout wins, we return error immediately to prevent 408 timeout
      // Note: The sendMail operation may still complete in background, but we don't wait
      const result = await Promise.race([sendPromise, timeoutPromise]);
      
      const duration = Date.now() - startTime;
      logger.info('Email sent successfully', { 
        to: options.to, 
        subject: options.subject,
        duration: `${duration}ms`,
        messageId: (result as any)?.messageId,
      });
      
      return { success: true };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error('Failed to send email', {
        to: options.to,
        subject: options.subject,
        error: errorMessage,
        duration: `${duration}ms`,
      });
      
      // Check if it's a timeout error
      if (errorMessage.includes('timeout')) {
        return {
          success: false,
          error: `Email sending timed out or failed after ${this.EMAIL_TIMEOUT_MS}ms. The email may still be queued for delivery.`,
        };
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async sendBeauticianApprovalEmail(
    email: string,
    firstName: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    const loginUrl = process.env.FRONTEND_URL || process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://www.kosmospace.com';
    const subject = 'Welcome to Kosmospace - Your Application Has Been Approved!';
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Kosmospace!</h1>
            </div>
            <div class="content">
              <p>Dear ${firstName},</p>
              
              <p>Great news! Your beautician application has been <strong>approved</strong>! 🎉</p>
              
              <p>You can now access your beautician dashboard to manage your services, view bookings, and start accepting customers.</p>
              
              <div class="credentials">
                <h3>Your Login Credentials:</h3>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Password:</strong> <code style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-size: 14px;">${password}</code></p>
                <p style="color: #d32f2f; font-size: 12px; margin-top: 10px;">
                  ⚠️ Please change your password after your first login for security.
                </p>
              </div>
              
              <div style="text-align: center;">
                <a href="${loginUrl}/login" class="button">Login to Dashboard</a>
              </div>
              
              <p>Once logged in, you can:</p>
              <ul>
                <li>Add and manage your services</li>
                <li>View and manage bookings</li>
                <li>Update your profile information</li>
                <li>Track your earnings</li>
              </ul>
              
              <p>If you have any questions, please don't hesitate to contact our support team.</p>
              
              <p>Welcome aboard!</p>
              <p><strong>The Kosmospace Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await this.sendEmail({ to: email, subject, html });
  }
}

export const emailService = new EmailService();


