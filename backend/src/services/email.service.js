import nodemailer from 'nodemailer';
import Logger from '../utils/logger.js';

/**
 * Email Service for sending transactional emails
 */
class EmailService {
    constructor() {
        this.transporter = null;
        this.initialize();
    }

    initialize() {
        // Use environment variables for email config
        // For development, we use Ethereal (fake SMTP)
        // For production, use real SMTP like Gmail, SendGrid, etc.
        if (process.env.NODE_ENV === 'production') {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        } else {
            // For development/testing - use Ethereal fake SMTP
            this.createTestAccount();
        }
    }

    async createTestAccount() {
        try {
            const testAccount = await nodemailer.createTestAccount();
            this.transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            Logger.info('Ethereal test email account created', { user: testAccount.user });
        } catch (error) {
            Logger.error('Failed to create test email account', { error: error.message });
        }
    }

    /**
     * Send password reset email
     * @param {string} to - Recipient email
     * @param {string} resetToken - Plain text reset token
     * @param {string} userName - User's name
     */
    async sendPasswordResetEmail(to, resetToken, userName) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: `"GrindMap" <${process.env.SMTP_FROM || 'noreply@grindmap.dev'}>`,
            to,
            subject: 'Password Reset Request - GrindMap',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">Password Reset Request</h2>
          <p>Hi ${userName || 'there'},</p>
          <p>You requested to reset your password. Click the button below to proceed:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 12px 30px; 
                      text-decoration: none; 
                      border-radius: 8px;
                      font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="color: #e74c3c;"><strong>This link expires in 10 minutes.</strong></p>
          <p>If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #888; font-size: 12px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}">${resetUrl}</a>
          </p>
        </div>
      `,
            text: `
        Password Reset Request
        
        Hi ${userName || 'there'},
        
        You requested to reset your password. Visit the following link to proceed:
        ${resetUrl}
        
        This link expires in 10 minutes.
        
        If you didn't request this, please ignore this email.
      `,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            Logger.info('Password reset email sent', {
                messageId: info.messageId,
                to,
                previewUrl: nodemailer.getTestMessageUrl(info) // Only works for Ethereal
            });
            return { success: true, messageId: info.messageId, previewUrl: nodemailer.getTestMessageUrl(info) };
        } catch (error) {
            Logger.error('Failed to send password reset email', { error: error.message, to });
            throw error;
        }
    }

    /**
     * Send mentorship session confirmation email
     */
    static async sendMentorshipConfirmation(mentorEmail, menteeEmail, mentorName, menteeName, session) {
        // In a real implementation, this would send actual emails
        // For now, we'll just log the action
        console.log(`Mentorship confirmation sent:`);
        console.log(`Mentor: ${mentorName} (${mentorEmail})`);
        console.log(`Mentee: ${menteeName} (${menteeEmail})`);
        console.log(`Session: ${session.scheduledAt} for ${session.duration} minutes`);
        
        // Return a mock success response
        return { success: true, message: 'Confirmation sent successfully' };
    }
}

export default new EmailService();
