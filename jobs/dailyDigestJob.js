// File: jobs/dailyDigestJob.js
import cron from 'node-cron';
import Audit from '../models/audit.js';
import sendEmail from '../utils/sendEmail.js';

// Run every day at 08:00 AM with retry
cron.schedule('0 8 * * *', async () => {
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const logs = await Audit.find({
      action: { $in: ['email_failed', 'email_retry_failed'] },
      timestamp: { $gte: yesterday.toISOString() }
    });

    if (logs.length > 0) {
      const summary = logs.map(entry =>
        `• ${entry.timestamp} - ${entry.key}: ${entry.note || entry.action}`
      ).join('<br>');

      await sendEmail({
        to: ['admin@example.com'],
        subject: 'Daily Digest: Failed Invoice Notifications',
        html: `<h3>24h Failed Notification Summary</h3><p>${summary}</p>`
      });

      await Promise.all(logs.map(async (entry) => {
        try {
          await sendEmail({
            to: ['admin@example.com', 'billing@example.com'],
            subject: 'Retry: Invoice Notification',
            html: `Retrying email for invoice: <strong>${entry.key}</strong><br>${entry.note || ''}`
          });
          await Audit.create({
            action: 'email_retry_batch_success',
            user: 'system',
            role: 'system',
            key: entry.key,
            note: 'Batch retry of invoice email notification succeeded',
            timestamp: new Date().toISOString()
          });
        } catch (retryError) {
          await Audit.create({
            action: 'email_retry_batch_failed',
            user: 'system',
            role: 'system',
            key: entry.key,
            note: 'Batch retry failed',
            timestamp: new Date().toISOString()
          });
        }
      }));
      console.log('Daily digest sent with batch retries.');
    } else {
      console.log('No failed notifications to report.');
    }
  } catch (error) {
    console.error('Failed to send daily digest:', error);
  }
});
