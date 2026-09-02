import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/resend';
import type { FeedbackType, BrowserInfo, Feedback } from '@/lib/supabase/types';

export interface CreateFeedbackInput {
  type: FeedbackType;
  subject: string;
  content: string;
  screenshotUrl?: string;
  pageUrl?: string;
  browserInfo?: BrowserInfo;
}

/**
 * Submit feedback from a user
 */
export async function createFeedback(
  userId: string | null,
  input: CreateFeedbackInput
): Promise<{ success: boolean; feedbackId: string }> {
  const supabase = await createAdminClient();

  const { type, subject, content, screenshotUrl, pageUrl, browserInfo } = input;

  // Get founder info if user is logged in
  let founderId: string | null = null;
  let founderName: string | null = null;
  let userEmail: string | null = null;

  if (userId) {
    const { data: founder } = await supabase
      .from('founders')
      .select('id, name')
      .eq('user_id', userId)
      .single();

    founderId = founder?.id || null;
    founderName = founder?.name || null;

    // Get user email
    const { data: { user } } = await supabase.auth.admin.getUserById(userId);
    userEmail = user?.email || null;
  }

  // Insert feedback
  const { data: feedback, error } = await supabase
    .from('feedback')
    .insert({
      user_id: userId,
      founder_id: founderId,
      type,
      subject,
      content,
      screenshot_url: screenshotUrl || null,
      page_url: pageUrl || null,
      browser_info: browserInfo || null,
      status: 'new',
    })
    .select()
    .single();

  if (error || !feedback) {
    throw new Error(`Failed to submit feedback: ${error?.message}`);
  }

  // Send email notification to team
  await sendFeedbackNotification({
    feedbackId: feedback.id,
    type,
    subject,
    content,
    pageUrl,
    browserInfo,
    userName: founderName,
    userEmail,
    screenshotUrl,
  });

  return { success: true, feedbackId: feedback.id };
}

/**
 * Get feedback by ID
 */
export async function getFeedbackById(feedbackId: string): Promise<Feedback | null> {
  const supabase = await createAdminClient();

  const { data } = await supabase
    .from('feedback')
    .select('*')
    .eq('id', feedbackId)
    .single();

  return data as Feedback | null;
}

/**
 * Get all feedback for a user
 */
export async function getFeedbackByUser(userId: string): Promise<Feedback[]> {
  const supabase = await createAdminClient();

  const { data } = await supabase
    .from('feedback')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return (data || []) as Feedback[];
}

/**
 * Send email notification for new feedback
 */
async function sendFeedbackNotification(params: {
  feedbackId: string;
  type: FeedbackType;
  subject: string;
  content: string;
  pageUrl?: string;
  browserInfo?: BrowserInfo;
  userName: string | null;
  userEmail: string | null;
  screenshotUrl?: string;
}) {
  const {
    feedbackId,
    type,
    subject,
    content,
    pageUrl,
    browserInfo,
    userName,
    userEmail,
    screenshotUrl,
  } = params;

  const typeLabel = type === 'bug' ? 'Bug Report' : type === 'feature' ? 'Feature Request' : 'Feedback';
  const typeEmoji = type === 'bug' ? '🐛' : type === 'feature' ? '✨' : '💬';

  const browserLine = browserInfo
    ? `${browserInfo.browser} ${browserInfo.version} on ${browserInfo.os}`
    : 'Unknown';

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0E0E0E;">${typeEmoji} New ${typeLabel}</h2>

      <div style="background: #F4F4F1; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 12px 0; color: #0E0E0E;">${subject}</h3>
        <p style="margin: 0; color: #565656; white-space: pre-wrap;">${content}</p>
      </div>

      <table style="width: 100%; font-size: 14px; color: #565656;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #E4E4E1;"><strong>From:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #E4E4E1;">${userName || 'Anonymous'} ${userEmail ? `(${userEmail})` : ''}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #E4E4E1;"><strong>Page:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #E4E4E1;">${pageUrl || 'Not captured'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #E4E4E1;"><strong>Browser:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #E4E4E1;">${browserLine}</td>
        </tr>
        ${browserInfo?.screen ? `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #E4E4E1;"><strong>Screen:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #E4E4E1;">${browserInfo.screen}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px 0;"><strong>ID:</strong></td>
          <td style="padding: 8px 0; font-family: monospace;">${feedbackId}</td>
        </tr>
      </table>

      ${screenshotUrl ? `
      <div style="margin-top: 20px;">
        <p style="margin: 0 0 8px 0; font-weight: 600; color: #0E0E0E;">Screenshot attached:</p>
        <img src="${screenshotUrl}" style="max-width: 100%; border-radius: 8px; border: 1px solid #E4E4E1;" />
      </div>
      ` : ''}

      <p style="margin-top: 24px; font-size: 12px; color: #8A8A8A;">
        This is an automated notification from Vibed feedback system.
      </p>
    </div>
  `;

  // Send to support email (you'd configure this)
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.RESEND_FROM_EMAIL?.replace('noreply@', 'support@');

  if (supportEmail) {
    await sendEmail({
      to: supportEmail,
      subject: `${typeEmoji} [${typeLabel}] ${subject}`,
      html,
    });
  }
}
