import apiClient from './client';

export interface Venue {
  id: number;
  name: string;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  capacity: number;
}

export interface EventItem {
  id: number;
  organizerId: number;
  organizerName: string;
  organizerEmail: string;
  venue?: Venue;
  title: string;
  description?: string;
  category: string;
  bannerUrl?: string;
  startTime: string;
  endTime: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
  totalSeats: number;
  availableSeats: number;
  basePrice: number;
  createdAt: string;
}

export interface SeatItem {
  id: number;
  seatNumber: string;
  rowLabel: string;
  section: string;
  seatType: 'REGULAR' | 'VIP' | 'VVIP';
  price: number;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED';
  heldByCurrentUser: boolean;
}

export interface HoldSeatResponseData {
  holdToken: string;
  eventId: number;
  userId: number;
  heldSeatIds: number[];
  totalPrice: number;
  expiresInSeconds: number;
  expiresAt: string;
}

export interface BookingItem {
  id: number;
  bookingReference: string;
  eventId: number;
  eventTitle: string;
  venueName: string;
  eventStartTime: string;
  userId: number;
  userFullName: string;
  userEmail: string;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  seats: SeatItem[];
  createdAt: string;
}

export interface CreateBookingPayload {
  holdToken: string;
  idempotencyKey: string;
  paymentMethod?: string;
  cardLast4?: string;
}

export const eventApi = {
  getEvents: async (params?: { keyword?: string; category?: string; city?: string; page?: number; size?: number }) => {
    const res = await apiClient.get('/events', { params });
    return res.data;
  },

  getEventById: async (id: number | string) => {
    const res = await apiClient.get(`/events/${id}`);
    return res.data;
  },

  createEvent: async (data: any) => {
    const res = await apiClient.post('/events', data);
    return res.data;
  },

  publishEvent: async (id: number | string) => {
    const res = await apiClient.patch(`/events/${id}/publish`);
    return res.data;
  },

  getMyEvents: async (page = 0, size = 10) => {
    const res = await apiClient.get('/events/my-events', { params: { page, size } });
    return res.data;
  },

  getVenues: async () => {
    const res = await apiClient.get('/venues');
    return res.data;
  },

  createVenue: async (data: any) => {
    const res = await apiClient.post('/venues', data);
    return res.data;
  },

  getSeats: async (eventId: number | string) => {
    const res = await apiClient.get(`/events/${eventId}/seats`);
    return res.data;
  },

  holdSeats: async (eventId: number | string, seatIds: number[]) => {
    const res = await apiClient.post(`/events/${eventId}/seats/hold`, { seatIds });
    return res.data;
  },

  releaseSeats: async (eventId: number | string, seatIds: number[]) => {
    const res = await apiClient.post(`/events/${eventId}/seats/release`, { seatIds });
    return res.data;
  },
};

export const bookingApi = {
  createBooking: async (data: CreateBookingPayload) => {
    const res = await apiClient.post('/bookings', data);
    return res.data;
  },

  getMyBookings: async (page = 0, size = 10) => {
    const res = await apiClient.get('/bookings/my-bookings', { params: { page, size } });
    return res.data;
  },

  getBookingByReference: async (reference: string) => {
    const res = await apiClient.get(`/bookings/${reference}`);
    return res.data;
  },

  cancelBooking: async (reference: string) => {
    const res = await apiClient.post(`/bookings/${reference}/cancel`);
    return res.data;
  },
};

export interface TicketItem {
  id: number;
  ticketCode: string;
  bookingReference: string;
  eventId: number;
  eventTitle: string;
  venueName: string;
  venueCity: string;
  eventStartTime: string;
  attendeeName: string;
  attendeeEmail: string;
  seatNumber: string;
  rowLabel: string;
  section: string;
  seatType: string;
  price: number;
  qrCodeHash: string;
  qrCodeBase64?: string;
  status: 'VALID' | 'USED' | 'CANCELLED';
  checkedInAt?: string;
  createdAt: string;
}

export const ticketApi = {
  getTicketsForBooking: async (bookingReference: string) => {
    const res = await apiClient.get(`/tickets/booking/${bookingReference}`);
    return res.data;
  },

  getTicketByCode: async (ticketCode: string) => {
    const res = await apiClient.get(`/tickets/${ticketCode}`);
    return res.data;
  },

  checkInTicket: async (data: { ticketCode?: string; qrCodeHash?: string }) => {
    const res = await apiClient.post('/tickets/check-in', data);
    return res.data;
  },

  verifyTicket: async (qrOrCode: string) => {
    const res = await apiClient.get(`/tickets/verify/${qrOrCode}`);
    return res.data;
  },
};

export interface TierAnalytics {
  tier: string;
  totalSeats: number;
  soldSeats: number;
  revenue: number;
  occupancyRate: number;
}

export interface EventPerformance {
  eventId: number;
  title: string;
  venueName: string;
  status: string;
  totalSeats: number;
  soldSeats: number;
  availableSeats: number;
  revenue: number;
  occupancyRate: number;
}

export interface RecentSale {
  bookingReference: string;
  eventTitle: string;
  attendeeName: string;
  attendeeEmail: string;
  totalAmount: number;
  seatCount: number;
  createdAt: string;
}

export interface AnalyticsData {
  totalEvents: number;
  publishedEvents: number;
  totalSeats: number;
  soldSeats: number;
  availableSeats: number;
  overallOccupancyRate: number;
  totalRevenue: number;
  totalCheckIns: number;
  checkInRate: number;
  tierBreakdowns: TierAnalytics[];
  eventPerformances: EventPerformance[];
  recentSales: RecentSale[];
}

export const analyticsApi = {
  getAnalytics: async () => {
    const res = await apiClient.get('/analytics');
    return res.data;
  },
};
