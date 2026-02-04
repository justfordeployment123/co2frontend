/**
 * ========================================================================
 * EMAIL SERVICE
 * ========================================================================
 * 
 * Handles email delivery with templates for notifications and attachments
 */

import nodemailer from 'nodemailer';
import fs from 'fs';

// Email configuration (use environment variables in production)
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-password'
  }
};

/**
 * Create email transporter
 */
function createTransporter() {
  return nodemailer.createTransport(EMAIL_CONFIG);
}

/**
 * Send email with optional attachments
 * @param {object} options - Email options
 * @returns {Promise<object>} Send result
 */
export async function sendEmail({ to, subject, html, text, attachments = [] }) {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"AURIXON GHG Platform" <${EMAIL_CONFIG.auth.user}>`,
    to,
    subject,
    text,
    html,
    attachments
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EmailService] Error sending email:', error);
    throw error;
  }
}

/**
 * Send report export email with attachment
 * @param {string} recipientEmail - Recipient email address
 * @param {string} periodName - Reporting period name
 * @param {string} filePath - Path to export file
 * @param {string} fileType - Type of export (PDF, CSV, Excel)
 * @returns {Promise<object>} Send result
 */
export async function sendReportEmail(recipientEmail, periodName, filePath, fileType) {
  const subject = `GHG Emissions Report - ${periodName}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Your GHG Emissions Report is Ready</h2>
      <p>Hello,</p>
      <p>Your requested <strong>${fileType}</strong> report for <strong>${periodName}</strong> is attached to this email.</p>
      <p>The report includes:</p>
      <ul>
        <li>Total emissions summary</li>
        <li>Breakdown by activity type</li>
        <li>GHG composition analysis</li>
        <li>Detailed calculations</li>
      </ul>
      <p>If you have any questions, please contact support.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #7f8c8d; font-size: 12px;">
        This is an automated message from AURIXON GHG Platform.<br>
        © ${new Date().getFullYear()} AURIXON. All rights reserved.
      </p>
    </div>
  `;

  const text = `Your GHG Emissions Report for ${periodName} is attached to this email.`;

  const attachments = [{
    filename: `${periodName.replace(/[^a-z0-9]/gi, '_')}_report.${fileType.toLowerCase()}`,
    path: filePath
  }];

  return await sendEmail({
    to: recipientEmail,
    subject,
    html,
    text,
    attachments
  });
}

/**
 * Send approval workflow notification
 * @param {string} recipientEmail - Recipient email address
 * @param {object} workflowData - Workflow data
 * @param {string} action - Action type (submitted, approved, rejected, commented)
 * @returns {Promise<object>} Send result
 */
export async function sendApprovalNotification(recipientEmail, workflowData, action) {
  const { periodName, companyName, submittedBy, reviewerName, comments } = workflowData;

  let subject, html, text;

  switch (action) {
    case 'submitted':
      subject = `Approval Request: ${periodName} - ${companyName}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3498db;">New Approval Request</h2>
          <p>A new emissions report has been submitted for your review:</p>
          <ul>
            <li><strong>Period:</strong> ${periodName}</li>
            <li><strong>Company:</strong> ${companyName}</li>
            <li><strong>Submitted by:</strong> ${submittedBy}</li>
          </ul>
          <p>Please log in to the platform to review and approve/reject this report.</p>
          <a href="${process.env.APP_URL}/approvals" style="display: inline-block; background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">
            Review Now
          </a>
        </div>
      `;
      text = `New approval request for ${periodName} submitted by ${submittedBy}`;
      break;

    case 'approved':
      subject = `Approved: ${periodName} - ${companyName}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #27ae60;">Report Approved</h2>
          <p>Your emissions report has been approved:</p>
          <ul>
            <li><strong>Period:</strong> ${periodName}</li>
            <li><strong>Company:</strong> ${companyName}</li>
            <li><strong>Approved by:</strong> ${reviewerName}</li>
          </ul>
          ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ''}
          <p>The report is now finalized and ready for submission to regulatory bodies.</p>
        </div>
      `;
      text = `Your report for ${periodName} has been approved by ${reviewerName}`;
      break;

    case 'rejected':
      subject = `Changes Requested: ${periodName} - ${companyName}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e74c3c;">Changes Requested</h2>
          <p>Your emissions report requires revisions:</p>
          <ul>
            <li><strong>Period:</strong> ${periodName}</li>
            <li><strong>Company:</strong> ${companyName}</li>
            <li><strong>Reviewed by:</strong> ${reviewerName}</li>
          </ul>
          ${comments ? `<p><strong>Reason:</strong> ${comments}</p>` : ''}
          <p>Please review the feedback and make necessary corrections before resubmitting.</p>
          <a href="${process.env.APP_URL}/periods/${periodName}" style="display: inline-block; background: #e74c3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">
            View Feedback
          </a>
        </div>
      `;
      text = `Changes requested for ${periodName} by ${reviewerName}: ${comments}`;
      break;

    case 'commented':
      subject = `New Comment: ${periodName} - ${companyName}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f39c12;">New Comment Added</h2>
          <p>A comment has been added to your approval workflow:</p>
          <ul>
            <li><strong>Period:</strong> ${periodName}</li>
            <li><strong>Company:</strong> ${companyName}</li>
            <li><strong>Comment by:</strong> ${reviewerName}</li>
          </ul>
          <p><strong>Comment:</strong> ${comments}</p>
          <a href="${process.env.APP_URL}/approvals" style="display: inline-block; background: #f39c12; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">
            View Discussion
          </a>
        </div>
      `;
      text = `New comment on ${periodName} by ${reviewerName}: ${comments}`;
      break;

    default:
      throw new Error(`Unknown action: ${action}`);
  }

  return await sendEmail({
    to: recipientEmail,
    subject,
    html,
    text
  });
}

/**
 * Send alert notification
 * @param {string} recipientEmail - Recipient email address
 * @param {object} alertData - Alert data
 * @returns {Promise<object>} Send result
 */
export async function sendAlertNotification(recipientEmail, alertData) {
  const { alertType, message, severity, periodName } = alertData;

  const severityColors = {
    high: '#e74c3c',
    medium: '#f39c12',
    low: '#3498db'
  };

  const color = severityColors[severity] || '#95a5a6';

  const subject = `[${severity.toUpperCase()}] ${alertType} - ${periodName}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${color}; color: white; padding: 15px; border-radius: 5px 5px 0 0;">
        <h2 style="margin: 0;">${alertType}</h2>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">Severity: ${severity.toUpperCase()}</p>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <p><strong>Period:</strong> ${periodName}</p>
        <p><strong>Message:</strong> ${message}</p>
        <p>Please review and take appropriate action if necessary.</p>
        <a href="${process.env.APP_URL}/dashboard" style="display: inline-block; background: ${color}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">
          View Dashboard
        </a>
      </div>
    </div>
  `;

  const text = `[${severity.toUpperCase()}] ${alertType}: ${message}`;

  return await sendEmail({
    to: recipientEmail,
    subject,
    html,
    text
  });
}

/**
 * Send welcome email to new user
 * @param {string} recipientEmail - Recipient email address
 * @param {string} userName - User name
 * @param {string} companyName - Company name
 * @returns {Promise<object>} Send result
 */
export async function sendWelcomeEmail(recipientEmail, userName, companyName, password = null) {
  const subject = 'Welcome to AURIXON GHG Platform';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Welcome to AURIXON!</h2>
      <p>Hi ${userName},</p>
      <p>Your account has been created for <strong>${companyName}</strong>.</p>
      
      ${password ? `
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Your Login Credentials:</strong></p>
        <p style="margin: 5px 0 0 0;">Email: ${recipientEmail}</p>
        <p style="margin: 5px 0 0 0;">Password: ${password}</p>
      </div>
      <p>Please change your password after your first login.</p>
      ` : ''}

      <p>You can now start tracking and managing your greenhouse gas emissions.</p>
      <h3>Getting Started:</h3>
      <ol>
        <li>Create a reporting period</li>
        <li>Add your activity data</li>
        <li>Calculate emissions</li>
        <li>Generate reports</li>
      </ol>
      <a href="${process.env.APP_URL || 'http://localhost:3000'}/login" style="display: inline-block; background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">
        Login to Dashboard
      </a>
      <p style="margin-top: 20px;">If you have any questions, please contact our support team.</p>
    </div>
  `;

  const text = `Welcome to AURIXON, ${userName}! Your account for ${companyName} is ready.${password ? `\n\nCredentials:\nEmail: ${recipientEmail}\nPassword: ${password}` : ''}`;

  return await sendEmail({
    to: recipientEmail,
    subject,
    html,
    text
  });
}

export default {
  sendEmail,
  sendReportEmail,
  sendApprovalNotification,
  sendAlertNotification,
  sendWelcomeEmail
};
