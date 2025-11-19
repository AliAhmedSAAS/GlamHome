import { IStorage } from '../storage';
import { BookingAnalyticsService, OfferRecommendation } from './analytics';
import { whatsappService } from './whatsapp';
import { InsertOffer, InsertWhatsappMessage, CustomerPreferences } from '@shared/schema';

export class OfferService {
  private analytics: BookingAnalyticsService;

  constructor(private storage: IStorage) {
    this.analytics = new BookingAnalyticsService(storage);
  }

  /**
   * Generate and send personalized offer to a customer
   */
  async generateAndSendOffer(customerId: string): Promise<{ success: boolean; message: string }> {
    // Check customer preferences
    const prefs = await this.getCustomerPreferences(customerId);
    if (!prefs.whatsappOptIn || !prefs.receiveOffers) {
      return { success: false, message: 'Customer opted out of offers' };
    }

    if (!prefs.whatsappNumber) {
      return { success: false, message: 'Customer has no WhatsApp number' };
    }

    // Get offer recommendations
    const recommendations = await this.analytics.generateOfferRecommendations(customerId);
    if (recommendations.length === 0) {
      return { success: false, message: 'No suitable offers found for customer' };
    }

    // Take the highest priority recommendation
    const topOffer = recommendations[0];

    // Get user and beautician details
    const customer = await this.storage.getUser(customerId);
    const beautician = await this.storage.getBeautician(topOffer.beauticianId);
    const beauticianUser = beautician ? await this.storage.getUser(beautician.userId) : null;

    if (!customer || !beautician || !beauticianUser) {
      return { success: false, message: 'Missing customer or beautician data' };
    }

    // Get service details
    const service = await this.storage.getService(topOffer.serviceId);
    if (!service) {
      return { success: false, message: 'Service not found' };
    }

    // Calculate prices
    const originalPrice = service.price;
    const discountedPrice = Math.round(originalPrice * (1 - topOffer.suggestedDiscount / 100));

    // Create offer in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const offerData: InsertOffer = {
      customerId,
      beauticianId: topOffer.beauticianId,
      serviceId: topOffer.serviceId,
      offerType: this.determineOfferType(topOffer.urgency),
      discountPercent: topOffer.suggestedDiscount,
      originalPrice,
      discountedPrice,
      message: this.generateOfferMessage(
        customer.firstName || 'Valued Customer',
        beauticianUser.firstName || 'beautician',
        topOffer.serviceName,
        topOffer.suggestedDiscount,
        originalPrice,
        discountedPrice
      ),
      expiresAt,
    };

    const offer = await this.createOffer(offerData);

    // Send WhatsApp message with booking link
    const baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://kosmospace.replit.app';
    const whatsappMessage = offerData.message + `\n\nBook now: ${baseUrl}/beauticians/${topOffer.beauticianId}?offer=${offer.id}`;
    
    const sendResult = await whatsappService.sendMessage({
      to: prefs.whatsappNumber,
      body: whatsappMessage,
    });

    // Log the WhatsApp message
    const messageData: InsertWhatsappMessage = {
      offerId: offer.id,
      customerId,
      phoneNumber: prefs.whatsappNumber,
      provider: sendResult.provider,
      messageType: 'offer',
      messageBody: whatsappMessage,
      providerMessageId: sendResult.messageId,
      errorMessage: sendResult.error,
    };

    await this.logWhatsappMessage(messageData);

    if (sendResult.success) {
      // Update offer status
      await this.updateOfferStatus(offer.id, 'sent');
      return { 
        success: true, 
        message: `Offer sent successfully via ${sendResult.provider}` 
      };
    } else {
      return { 
        success: false, 
        message: `Failed to send offer: ${sendResult.error}` 
      };
    }
  }

  /**
   * Process all customers for today's offers
   */
  async processAutomatedOffers(): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    const customersToNotify = await this.analytics.findCustomersForOffers();

    for (const customerId of customersToNotify) {
      const result = await this.generateAndSendOffer(customerId);
      if (result.success) {
        sent++;
      } else {
        failed++;
        console.log(`Failed to send offer to ${customerId}: ${result.message}`);
      }

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return { sent, failed };
  }

  /**
   * Generate personalized offer message
   */
  private generateOfferMessage(
    customerName: string,
    beauticianName: string,
    serviceName: string,
    discount: number,
    originalPrice: number,
    discountedPrice: number
  ): string {
    return `Hi ${customerName}! 💅✨\n\nIt's time for your ${serviceName} with ${beauticianName}!\n\n🎁 Special offer: ${discount}% OFF\n${originalPrice} AED → ${discountedPrice} AED\n\nBook within 7 days to claim your discount.`;
  }

  /**
   * Determine offer type from urgency
   */
  private determineOfferType(urgency: string): string {
    switch (urgency) {
      case 'high':
        return 'interval_reminder';
      case 'medium':
        return 'interval_reminder';
      default:
        return 'loyalty_discount';
    }
  }

  /**
   * Get or create customer preferences
   */
  private async getCustomerPreferences(customerId: string): Promise<CustomerPreferences> {
    const existing = await this.storage.getCustomerPreferences(customerId);
    if (existing) {
      return existing;
    }

    // Create default preferences
    const user = await this.storage.getUser(customerId);
    return await this.storage.createCustomerPreferences({
      customerId,
      whatsappNumber: user?.phone || null,
      whatsappOptIn: true,
      receiveOffers: true,
      receiveReminders: true,
      preferredContactTime: 'morning',
    });
  }

  /**
   * Create offer (wrapper for storage)
   */
  private async createOffer(offerData: InsertOffer) {
    return await this.storage.createOffer(offerData);
  }

  /**
   * Update offer status
   */
  private async updateOfferStatus(offerId: string, status: string) {
    return await this.storage.updateOfferStatus(offerId, status);
  }

  /**
   * Log WhatsApp message
   */
  private async logWhatsappMessage(messageData: InsertWhatsappMessage) {
    return await this.storage.createWhatsappMessage(messageData);
  }
}
