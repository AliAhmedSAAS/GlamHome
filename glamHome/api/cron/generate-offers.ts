import { storage } from "../../server/storage";
import { OfferService } from "../../server/services/offers";

/**
 * Vercel Cron Job endpoint for automated offer generation
 * 
 * For Vercel Cron (Pro plan):
 * - Add CRON_SECRET to environment variables
 * - Configure in vercel.json
 * 
 * For external cron services:
 * - Call this endpoint with Authorization header
 */
export default async function handler(req: any, res: any) {
  // Verify authorization
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    // If CRON_SECRET is set, verify it
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  } else {
    // Log warning if no CRON_SECRET is set
    console.warn('⚠️  CRON_SECRET not set. This endpoint is unprotected!');
  }

  try {
    console.log('🔄 Starting automated offer generation...');
    
    const offerService = new OfferService(storage);
    
    // Get all customers who haven't received an offer recently
    const allCustomers = await storage.getAllCustomers();
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const customer of allCustomers) {
      try {
        // Check if customer has bookings
        const bookings = await storage.getBookingsByCustomerId(customer.id);
        
        if (bookings.length === 0) {
          console.log(`⏭️  Skipping customer ${customer.id} (no bookings)`);
          continue;
        }

        // Check when they last received an offer
        const existingOffers = await storage.getOffersByCustomerId(customer.id);
        const lastOffer = existingOffers[0]; // Assuming sorted by date desc
        
        if (lastOffer) {
          const daysSinceLastOffer = Math.floor(
            (Date.now() - new Date(lastOffer.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          );
          
          // Only send if it's been more than 7 days
          if (daysSinceLastOffer < 7) {
            console.log(`⏭️  Skipping customer ${customer.id} (offer sent ${daysSinceLastOffer} days ago)`);
            continue;
          }
        }

        // Generate and send offer
        const result = await offerService.generateAndSendOffer(customer.id);
        
        if (result.success) {
          sent++;
          console.log(`✅ Sent offer to customer ${customer.id}`);
        } else {
          failed++;
          errors.push(`Customer ${customer.id}: ${result.message}`);
          console.log(`❌ Failed to send to customer ${customer.id}: ${result.message}`);
        }
      } catch (error: any) {
        failed++;
        errors.push(`Customer ${customer.id}: ${error.message}`);
        console.error(`❌ Error for customer ${customer.id}:`, error);
      }
    }

    console.log(`✅ Automated offer generation completed: ${sent} sent, ${failed} failed`);
    
    return res.status(200).json({
      success: true,
      message: 'Automated offer generation completed',
      sent,
      failed,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Automated offer generation failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

