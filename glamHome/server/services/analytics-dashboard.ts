import { IStorage } from '../storage';
import { subDays, startOfDay, endOfDay, differenceInDays, format } from 'date-fns';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface OverviewMetrics {
  totalRevenue: number;
  revenueGrowth: number;
  activeCustomers: number;
  totalBookings: number;
  conversionRate: number;
  averageBookingValue: number;
  customerRetentionRate: number;
  whatsappOptInRate: number;
}

export interface CustomerMetrics {
  newCustomersThisPeriod: number;
  newCustomersTrend: Array<{ date: string; count: number }>;
  topCustomers: Array<{
    id: string;
    name: string;
    email: string | null;
    totalSpent: number;
    bookingCount: number;
  }>;
  customerSegments: {
    vip: number;
    active: number;
    atRisk: number;
    dormant: number;
  };
  servicePreferences: Array<{ service: string; count: number }>;
}

export interface BeauticianMetrics {
  performanceLeaderboard: Array<{
    id: string;
    name: string;
    totalRevenue: number;
    bookingCount: number;
    averageRating: number;
    completionRate: number;
  }>;
  revenueByBeautician: Array<{ name: string; revenue: number }>;
  serviceDistribution: Array<{ beauticianId: string; name: string; services: Array<{ service: string; count: number }> }>;
}

export interface RetentionMetrics {
  cohortRetention: Array<{
    cohort: string;
    month0: number;
    month1: number;
    month2: number;
    month3: number;
  }>;
  repeatBookingRate: number;
  averageDaysBetweenBookings: number;
  churnRate: number;
  atRiskCustomers: Array<{
    id: string;
    name: string;
    email: string | null;
    lastBookingDate: Date;
    daysSinceLastBooking: number;
  }>;
}

export class AnalyticsDashboardService {
  constructor(private storage: IStorage) {}

  async getOverviewMetrics(dateRange: DateRange): Promise<OverviewMetrics> {
    const bookings = await this.storage.getAllBookings();
    const users = await this.storage.getAllUsers();
    const preferences = await this.storage.getAllCustomerPreferences();

    const filteredBookings = bookings.filter(
      b => new Date(b.scheduledDate) >= dateRange.startDate && 
           new Date(b.scheduledDate) <= dateRange.endDate
    );

    const previousPeriod = {
      startDate: subDays(dateRange.startDate, differenceInDays(dateRange.endDate, dateRange.startDate)),
      endDate: dateRange.startDate
    };

    const previousBookings = bookings.filter(
      b => new Date(b.scheduledDate) >= previousPeriod.startDate && 
           new Date(b.scheduledDate) < previousPeriod.endDate
    );

    const totalRevenue = filteredBookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    const previousRevenue = previousBookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    const revenueGrowth = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    const activeCustomerIds = new Set(
      filteredBookings.map(b => b.customerId)
    );

    const totalBookings = filteredBookings.length;
    const completedBookings = filteredBookings.filter(b => b.status === 'completed').length;
    const conversionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

    const averageBookingValue = completedBookings > 0 
      ? totalRevenue / completedBookings 
      : 0;

    const customerRetentionRate = await this.calculateRetentionRate(dateRange);

    const customersWithWhatsApp = preferences.filter(p => p.whatsappOptIn).length;
    const totalCustomers = users.filter(u => u.role === 'customer').length;
    const whatsappOptInRate = totalCustomers > 0 
      ? (customersWithWhatsApp / totalCustomers) * 100 
      : 0;

    return {
      totalRevenue,
      revenueGrowth,
      activeCustomers: activeCustomerIds.size,
      totalBookings,
      conversionRate,
      averageBookingValue,
      customerRetentionRate,
      whatsappOptInRate,
    };
  }

  async getCustomerMetrics(dateRange: DateRange): Promise<CustomerMetrics> {
    const bookings = await this.storage.getAllBookings();
    const users = await this.storage.getAllUsers();

    const customers = users.filter(u => u.role === 'customer');

    const newCustomersThisPeriod = customers.filter(c => {
      const firstBooking = bookings
        .filter(b => b.customerId === c.id)
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())[0];
      
      if (!firstBooking) return false;
      
      const bookingDate = new Date(firstBooking.scheduledDate);
      return bookingDate >= dateRange.startDate && bookingDate <= dateRange.endDate;
    }).length;

    const newCustomersTrend = await this.calculateNewCustomersTrend(dateRange);

    const customerSpending = customers.map(customer => {
      const customerBookings = bookings.filter(
        b => b.customerId === customer.id && b.status === 'completed'
      );
      const totalSpent = customerBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      
      return {
        id: customer.id,
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        totalSpent,
        bookingCount: customerBookings.length,
      };
    });

    const topCustomers = customerSpending
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    const customerSegments = this.segmentCustomers(customers, bookings);

    const services = await this.storage.getAllServices();
    const serviceMap = new Map(services.map(s => [s.id, s.name]));
    
    const servicePreferences = bookings
      .filter(b => b.status === 'completed')
      .reduce((acc, booking) => {
        const serviceName = serviceMap.get(booking.serviceId) || 'Unknown';
        acc[serviceName] = (acc[serviceName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const servicePreferencesArray = Object.entries(servicePreferences)
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count);

    return {
      newCustomersThisPeriod,
      newCustomersTrend,
      topCustomers,
      customerSegments,
      servicePreferences: servicePreferencesArray,
    };
  }

  async getBeauticianMetrics(dateRange: DateRange): Promise<BeauticianMetrics> {
    const bookings = await this.storage.getAllBookings();
    const beauticians = await this.storage.getAllBeauticians();
    const users = await this.storage.getAllUsers();
    const services = await this.storage.getAllServices();
    const reviews = await this.storage.getAllReviews();

    const userMap = new Map(users.map(u => [u.id, u]));
    const serviceMap = new Map(services.map(s => [s.id, s.name]));

    const filteredBookings = bookings.filter(
      b => new Date(b.scheduledDate) >= dateRange.startDate && 
           new Date(b.scheduledDate) <= dateRange.endDate
    );

    const performanceLeaderboard = beauticians.map(beautician => {
      const user = userMap.get(beautician.userId);
      const beauticianBookings = filteredBookings.filter(b => b.beauticianId === beautician.id);
      
      const totalRevenue = beauticianBookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      const beauticianReviews = reviews.filter(r => r.beauticianId === beautician.id);
      const averageRating = beauticianReviews.length > 0
        ? beauticianReviews.reduce((sum, r) => sum + r.rating, 0) / beauticianReviews.length
        : 0;

      const completedBookings = beauticianBookings.filter(b => b.status === 'completed').length;
      const completionRate = beauticianBookings.length > 0
        ? (completedBookings / beauticianBookings.length) * 100
        : 0;

      return {
        id: beautician.id,
        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        totalRevenue,
        bookingCount: beauticianBookings.length,
        averageRating,
        completionRate,
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);

    const revenueByBeautician = performanceLeaderboard.map(b => ({
      name: b.name,
      revenue: b.totalRevenue,
    }));

    const serviceDistribution = beauticians.map(beautician => {
      const user = userMap.get(beautician.userId);
      const beauticianBookings = filteredBookings.filter(
        b => b.beauticianId === beautician.id && b.status === 'completed'
      );

      const serviceCounts = beauticianBookings.reduce((acc, booking) => {
        const serviceName = serviceMap.get(booking.serviceId) || 'Unknown';
        acc[serviceName] = (acc[serviceName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        beauticianId: beautician.id,
        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        services: Object.entries(serviceCounts).map(([service, count]) => ({
          service,
          count,
        })),
      };
    });

    return {
      performanceLeaderboard,
      revenueByBeautician,
      serviceDistribution,
    };
  }

  async getRetentionMetrics(dateRange: DateRange): Promise<RetentionMetrics> {
    const bookings = await this.storage.getAllBookings();
    const users = await this.storage.getAllUsers();

    const cohortRetention = await this.calculateCohortRetention();

    const customerBookings = new Map<string, Date[]>();
    bookings
      .filter(b => b.status === 'completed')
      .forEach(booking => {
        const dates = customerBookings.get(booking.customerId) || [];
        dates.push(new Date(booking.scheduledDate));
        customerBookings.set(booking.customerId, dates);
      });

    let totalDaysBetween = 0;
    let intervalCount = 0;
    customerBookings.forEach(dates => {
      if (dates.length > 1) {
        const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
        for (let i = 1; i < sortedDates.length; i++) {
          totalDaysBetween += differenceInDays(sortedDates[i], sortedDates[i - 1]);
          intervalCount++;
        }
      }
    });

    const averageDaysBetweenBookings = intervalCount > 0 
      ? totalDaysBetween / intervalCount 
      : 0;

    const customersWithMultipleBookings = Array.from(customerBookings.values())
      .filter(dates => dates.length > 1).length;
    
    const totalCustomers = customerBookings.size;
    const repeatBookingRate = totalCustomers > 0 
      ? (customersWithMultipleBookings / totalCustomers) * 100 
      : 0;

    const churnRate = await this.calculateChurnRate(dateRange);

    const atRiskCustomers = await this.getAtRiskCustomers();

    return {
      cohortRetention,
      repeatBookingRate,
      averageDaysBetweenBookings,
      churnRate,
      atRiskCustomers,
    };
  }

  private async calculateRetentionRate(dateRange: DateRange): Promise<number> {
    const bookings = await this.storage.getAllBookings();
    
    const previousPeriodStart = subDays(
      dateRange.startDate, 
      differenceInDays(dateRange.endDate, dateRange.startDate)
    );

    const previousCustomers = new Set(
      bookings
        .filter(b => 
          new Date(b.scheduledDate) >= previousPeriodStart && 
          new Date(b.scheduledDate) < dateRange.startDate
        )
        .map(b => b.customerId)
    );

    const currentCustomers = new Set(
      bookings
        .filter(b => 
          new Date(b.scheduledDate) >= dateRange.startDate && 
          new Date(b.scheduledDate) <= dateRange.endDate
        )
        .map(b => b.customerId)
    );

    const retainedCustomers = Array.from(previousCustomers).filter(
      id => currentCustomers.has(id)
    ).length;

    return previousCustomers.size > 0 
      ? (retainedCustomers / previousCustomers.size) * 100 
      : 0;
  }

  private async calculateNewCustomersTrend(dateRange: DateRange): Promise<Array<{ date: string; count: number }>> {
    const bookings = await this.storage.getAllBookings();
    const users = await this.storage.getAllUsers();
    
    const customers = users.filter(u => u.role === 'customer');
    
    const dailyCounts = new Map<string, number>();
    
    customers.forEach(customer => {
      const firstBooking = bookings
        .filter(b => b.customerId === customer.id)
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())[0];
      
      if (firstBooking) {
        const bookingDate = new Date(firstBooking.scheduledDate);
        if (bookingDate >= dateRange.startDate && bookingDate <= dateRange.endDate) {
          const dateKey = format(bookingDate, 'yyyy-MM-dd');
          dailyCounts.set(dateKey, (dailyCounts.get(dateKey) || 0) + 1);
        }
      }
    });

    return Array.from(dailyCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private segmentCustomers(customers: any[], bookings: any[]): {
    vip: number;
    active: number;
    atRisk: number;
    dormant: number;
  } {
    const now = new Date();
    const segments = { vip: 0, active: 0, atRisk: 0, dormant: 0 };

    customers.forEach(customer => {
      const customerBookings = bookings.filter(
        b => b.customerId === customer.id && b.status === 'completed'
      );

      if (customerBookings.length === 0) {
        segments.dormant++;
        return;
      }

      const totalSpent = customerBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      const lastBooking = customerBookings
        .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())[0];
      
      const daysSinceLastBooking = differenceInDays(now, new Date(lastBooking.scheduledDate));

      if (totalSpent > 1000 && customerBookings.length >= 5) {
        segments.vip++;
      } else if (daysSinceLastBooking <= 60) {
        segments.active++;
      } else if (daysSinceLastBooking <= 90) {
        segments.atRisk++;
      } else {
        segments.dormant++;
      }
    });

    return segments;
  }

  private async calculateCohortRetention(): Promise<Array<{
    cohort: string;
    month0: number;
    month1: number;
    month2: number;
    month3: number;
  }>> {
    const bookings = await this.storage.getAllBookings();
    const users = await this.storage.getAllUsers();
    
    const customers = users.filter(u => u.role === 'customer');
    
    const cohorts = new Map<string, Set<string>>();
    
    customers.forEach(customer => {
      const firstBooking = bookings
        .filter(b => b.customerId === customer.id)
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())[0];
      
      if (firstBooking) {
        const cohortMonth = format(new Date(firstBooking.scheduledDate), 'yyyy-MM');
        const cohortSet = cohorts.get(cohortMonth) || new Set<string>();
        cohortSet.add(customer.id);
        cohorts.set(cohortMonth, cohortSet);
      }
    });

    const cohortData: Array<{
      cohort: string;
      month0: number;
      month1: number;
      month2: number;
      month3: number;
    }> = [];

    cohorts.forEach((customerIds, cohortMonth) => {
      const cohortDate = new Date(cohortMonth + '-01');
      
      const month0 = customerIds.size;
      
      const month1Count = Array.from(customerIds).filter(customerId => {
        return bookings.some(b => 
          b.customerId === customerId &&
          new Date(b.scheduledDate) >= new Date(cohortDate.getFullYear(), cohortDate.getMonth() + 1, 1) &&
          new Date(b.scheduledDate) < new Date(cohortDate.getFullYear(), cohortDate.getMonth() + 2, 1)
        );
      }).length;

      const month2Count = Array.from(customerIds).filter(customerId => {
        return bookings.some(b => 
          b.customerId === customerId &&
          new Date(b.scheduledDate) >= new Date(cohortDate.getFullYear(), cohortDate.getMonth() + 2, 1) &&
          new Date(b.scheduledDate) < new Date(cohortDate.getFullYear(), cohortDate.getMonth() + 3, 1)
        );
      }).length;

      const month3Count = Array.from(customerIds).filter(customerId => {
        return bookings.some(b => 
          b.customerId === customerId &&
          new Date(b.scheduledDate) >= new Date(cohortDate.getFullYear(), cohortDate.getMonth() + 3, 1) &&
          new Date(b.scheduledDate) < new Date(cohortDate.getFullYear(), cohortDate.getMonth() + 4, 1)
        );
      }).length;

      cohortData.push({
        cohort: cohortMonth,
        month0: 100,
        month1: month0 > 0 ? (month1Count / month0) * 100 : 0,
        month2: month0 > 0 ? (month2Count / month0) * 100 : 0,
        month3: month0 > 0 ? (month3Count / month0) * 100 : 0,
      });
    });

    return cohortData.sort((a, b) => b.cohort.localeCompare(a.cohort)).slice(0, 6);
  }

  private async calculateChurnRate(dateRange: DateRange): Promise<number> {
    const bookings = await this.storage.getAllBookings();
    
    const previousPeriodStart = subDays(
      dateRange.startDate, 
      differenceInDays(dateRange.endDate, dateRange.startDate)
    );

    const previousCustomers = new Set(
      bookings
        .filter(b => 
          new Date(b.scheduledDate) >= previousPeriodStart && 
          new Date(b.scheduledDate) < dateRange.startDate
        )
        .map(b => b.customerId)
    );

    const currentCustomers = new Set(
      bookings
        .filter(b => 
          new Date(b.scheduledDate) >= dateRange.startDate && 
          new Date(b.scheduledDate) <= dateRange.endDate
        )
        .map(b => b.customerId)
    );

    const churnedCustomers = Array.from(previousCustomers).filter(
      id => !currentCustomers.has(id)
    ).length;

    return previousCustomers.size > 0 
      ? (churnedCustomers / previousCustomers.size) * 100 
      : 0;
  }

  private async getAtRiskCustomers(): Promise<Array<{
    id: number;
    name: string;
    email: string;
    lastBookingDate: Date;
    daysSinceLastBooking: number;
  }>> {
    const bookings = await this.storage.getAllBookings();
    const users = await this.storage.getAllUsers();
    
    const customers = users.filter(u => u.role === 'customer');
    const now = new Date();

    const atRisk = customers
      .map(customer => {
        const customerBookings = bookings
          .filter(b => b.customerId === customer.id && b.status === 'completed')
          .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());

        if (customerBookings.length === 0) return null;

        const lastBooking = customerBookings[0];
        const lastBookingDate = new Date(lastBooking.scheduledDate);
        const daysSinceLastBooking = differenceInDays(now, lastBookingDate);

        if (daysSinceLastBooking >= 60 && daysSinceLastBooking <= 90) {
          return {
            id: customer.id,
            name: `${customer.firstName} ${customer.lastName}`,
            email: customer.email,
            lastBookingDate,
            daysSinceLastBooking,
          };
        }

        return null;
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => b.daysSinceLastBooking - a.daysSinceLastBooking);

    return atRisk;
  }
}
