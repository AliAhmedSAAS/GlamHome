import { IStorage } from '../storage';
import { Booking, Service, Beautician } from '@shared/schema';

export interface BookingPattern {
  customerId: string;
  favoriteBeautician: {
    id: string;
    bookingCount: number;
  } | null;
  frequentServices: {
    id: string;
    name: string;
    count: number;
    averageInterval: number; // days between bookings
  }[];
  lastBookingDate: Date | null;
  nextPredictedDate: Date | null;
  totalBookings: number;
  averageSpend: number;
}

export interface OfferRecommendation {
  customerId: string;
  beauticianId: string;
  serviceId: string;
  serviceName: string;
  reason: string;
  urgency: 'high' | 'medium' | 'low';
  suggestedDiscount: number; // percentage
  predictedBookingDate: Date;
}

export class BookingAnalyticsService {
  constructor(private storage: IStorage) {}

  /**
   * Analyze customer booking patterns
   */
  async analyzeCustomerPattern(customerId: string): Promise<BookingPattern> {
    const bookings = await this.storage.getBookingsByCustomerId(customerId);
    
    if (bookings.length === 0) {
      return {
        customerId,
        favoriteBeautician: null,
        frequentServices: [],
        lastBookingDate: null,
        nextPredictedDate: null,
        totalBookings: 0,
        averageSpend: 0,
      };
    }

    // Find favorite beautician
    const beauticianCounts = new Map<string, number>();
    bookings.forEach(b => {
      beauticianCounts.set(b.beauticianId, (beauticianCounts.get(b.beauticianId) || 0) + 1);
    });
    
    let favoriteBeautician = null;
    let maxCount = 0;
    beauticianCounts.forEach((count, beauticianId) => {
      if (count > maxCount) {
        maxCount = count;
        favoriteBeautician = { id: beauticianId, bookingCount: count };
      }
    });

    // Analyze frequent services with intervals
    const serviceBookings = new Map<string, { dates: Date[], name: string }>();
    for (const booking of bookings) {
      const service = await this.storage.getService(booking.serviceId);
      if (!service) continue;

      if (!serviceBookings.has(booking.serviceId)) {
        serviceBookings.set(booking.serviceId, { dates: [], name: service.name });
      }
      serviceBookings.get(booking.serviceId)!.dates.push(new Date(booking.scheduledDate));
    }

    const frequentServices = Array.from(serviceBookings.entries())
      .map(([serviceId, data]) => {
        const sortedDates = data.dates.sort((a, b) => a.getTime() - b.getTime());
        let totalInterval = 0;
        let intervalCount = 0;

        for (let i = 1; i < sortedDates.length; i++) {
          const diff = (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
          totalInterval += diff;
          intervalCount++;
        }

        const averageInterval = intervalCount > 0 ? totalInterval / intervalCount : 0;

        return {
          id: serviceId,
          name: data.name,
          count: data.dates.length,
          averageInterval: Math.round(averageInterval),
        };
      })
      .sort((a, b) => b.count - a.count);

    // Calculate average spend
    const totalSpend = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const averageSpend = Math.round(totalSpend / bookings.length);

    // Find last booking and predict next
    const sortedBookings = bookings.sort((a, b) => 
      new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
    );
    const lastBookingDate = new Date(sortedBookings[0].scheduledDate);

    // Predict next booking based on most frequent service interval
    let nextPredictedDate = null;
    if (frequentServices.length > 0 && frequentServices[0].averageInterval > 0) {
      nextPredictedDate = new Date(lastBookingDate);
      nextPredictedDate.setDate(nextPredictedDate.getDate() + frequentServices[0].averageInterval);
    }

    return {
      customerId,
      favoriteBeautician,
      frequentServices,
      lastBookingDate,
      nextPredictedDate,
      totalBookings: bookings.length,
      averageSpend,
    };
  }

  /**
   * Generate offer recommendations for a customer
   */
  async generateOfferRecommendations(customerId: string): Promise<OfferRecommendation[]> {
    const pattern = await this.analyzeCustomerPattern(customerId);
    const recommendations: OfferRecommendation[] = [];

    if (!pattern.favoriteBeautician || pattern.frequentServices.length === 0) {
      return recommendations;
    }

    const now = new Date();

    // Check each frequent service
    for (const service of pattern.frequentServices) {
      // Skip services with no interval data
      if (service.averageInterval === 0) continue;

      // Services typically done every 2-3 weeks (manicure, lashes, pedicure)
      const isFrequentService = service.averageInterval >= 14 && service.averageInterval <= 28;
      
      if (!isFrequentService) continue;

      // Calculate days since last booking
      const daysSinceLastBooking = pattern.lastBookingDate 
        ? Math.floor((now.getTime() - pattern.lastBookingDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      // Calculate predicted next booking date
      const predictedDate = new Date(pattern.lastBookingDate!);
      predictedDate.setDate(predictedDate.getDate() + service.averageInterval);
      
      // Days until predicted booking
      const daysUntilPredicted = Math.floor((predictedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Determine urgency and discount
      let urgency: 'high' | 'medium' | 'low' = 'low';
      let suggestedDiscount = 10;
      let reason = `Time for your regular ${service.name} appointment!`;

      if (daysUntilPredicted <= 3 && daysUntilPredicted >= -3) {
        // Within 3 days of predicted date
        urgency = 'high';
        suggestedDiscount = 15;
        reason = `Your ${service.name} is due! Book now with ${suggestedDiscount}% off.`;
      } else if (daysUntilPredicted <= 7 && daysUntilPredicted >= -7) {
        // Within a week of predicted date
        urgency = 'medium';
        suggestedDiscount = 12;
        reason = `Upcoming ${service.name} appointment - book ahead with ${suggestedDiscount}% off!`;
      } else if (daysSinceLastBooking > service.averageInterval + 7) {
        // Overdue for service
        urgency = 'high';
        suggestedDiscount = 20;
        reason = `We miss you! Get ${suggestedDiscount}% off your next ${service.name}.`;
      }

      recommendations.push({
        customerId,
        beauticianId: pattern.favoriteBeautician.id,
        serviceId: service.id,
        serviceName: service.name,
        reason,
        urgency,
        suggestedDiscount,
        predictedBookingDate: predictedDate,
      });
    }

    // Sort by urgency
    const urgencyOrder = { high: 0, medium: 1, low: 2 };
    return recommendations.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
  }

  /**
   * Find all customers who should receive offers today
   */
  async findCustomersForOffers(): Promise<string[]> {
    const allCustomers = await this.storage.getAllCustomers();
    const customersToNotify: string[] = [];

    for (const customer of allCustomers) {
      const recommendations = await this.generateOfferRecommendations(customer.id);
      
      // If customer has high or medium urgency recommendations, add to list
      if (recommendations.some(r => r.urgency === 'high' || r.urgency === 'medium')) {
        customersToNotify.push(customer.id);
      }
    }

    return customersToNotify;
  }
}
