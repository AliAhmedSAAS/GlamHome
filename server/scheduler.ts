import cron from 'node-cron';
import { storage } from './storage';
import { OfferService } from './services/offers';

// Create offer service instance
const offerService = new OfferService(storage);

/**
 * Schedule daily offer processing
 * Runs every day at 10:00 AM Dubai time (UTC+4)
 */
export function initializeScheduler() {
  // Run every day at 10:00 AM
  cron.schedule('0 10 * * *', async () => {
    console.log('Starting automated offer generation...');
    
    try {
      const result = await offerService.processAutomatedOffers();
      console.log(`Automated offers complete: ${result.sent} sent, ${result.failed} failed`);
    } catch (error) {
      console.error('Error processing automated offers:', error);
    }
  }, {
    timezone: 'Asia/Dubai'
  });

  // Also schedule a mid-day reminder check at 2:00 PM
  cron.schedule('0 14 * * *', async () => {
    console.log('Starting afternoon reminder check...');
    
    try {
      const result = await offerService.processAutomatedOffers();
      console.log(`Afternoon reminders complete: ${result.sent} sent, ${result.failed} failed`);
    } catch (error) {
      console.error('Error processing afternoon reminders:', error);
    }
  }, {
    timezone: 'Asia/Dubai'
  });

  console.log('WhatsApp offer scheduler initialized');
  console.log('- Daily offers: 10:00 AM Dubai time');
  console.log('- Afternoon check: 2:00 PM Dubai time');
}

/**
 * Manual trigger for testing
 */
export async function triggerManualOfferGeneration() {
  console.log('Manually triggering offer generation...');
  const result = await offerService.processAutomatedOffers();
  console.log(`Manual offer generation complete: ${result.sent} sent, ${result.failed} failed`);
  return result;
}
