import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventApi, bookingApi, type EventItem, type HoldSeatResponseData, type BookingItem } from '../api/events';
import { useAuth } from '../context/AuthContext';
import { generateQrDataUrl } from '../utils/qrHelper';
import { CURATED_DOSSIERS } from './Events';
import { computeRealtimeEvent, broadcastInventoryChange } from '../utils/realtimeInventory';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  Check,
  Plus,
  Minus,
  X,
  ShieldCheck
} from 'lucide-react';

export interface DaisSeat {
  id: number;
  seatNum: string;
  name: string;
  role: string;
  flank: string;
  badge: string;
  subBadge?: string;
  tier: 'SOVEREIGN' | 'DIPLOMATIC' | 'ROYAL';
  color: string;
  dietary: string;
  protection: string;
  annex: string;
  price: number;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED';
  coverCharge?: number;
  coverDescription?: string;
  guestsPerPass?: number;
}

const getEventPassTiers = (evt: EventItem | null): DaisSeat[] => {
  if (evt) {

    if (evt.description && evt.description.includes('__VENU_PASS_TIERS__:')) {
      try {
        const rawJson = evt.description.split('__VENU_PASS_TIERS__:')[1];
        const parsed = JSON.parse(rawJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((tier: any, idx: number): DaisSeat => ({
            id: idx + 1,
            seatNum: String(idx + 1).padStart(2, '0'),
            name: tier.name,
            role:
              tier.entryGuidelines ||
              (tier.hasCoverCharge
                ? `Includes ₹${Number(tier.coverAmount || 0).toLocaleString('en-IN')} food & beverage meal voucher redeemable at venue stalls.`
                : 'Fast-track digital admission pass with dynamic RFID turnstile access.'),
            flank: `${tier.badge || 'PASS'} • ${tier.guestsPerPass > 1 ? `${tier.guestsPerPass} GUESTS` : 'SINGLE ENTRY'}`,
            badge: tier.badge || 'PASS',
            subBadge: tier.hasCoverCharge
              ? `₹${Number(tier.coverAmount || 0).toLocaleString('en-IN')} MEAL VOUCHER`
              : tier.guestsPerPass > 1
              ? `${tier.guestsPerPass} GUESTS`
              : 'FAST-TRACK',
            tier: tier.tier || (tier.price >= 5000 ? 'SOVEREIGN' : tier.price >= 2500 ? 'DIPLOMATIC' : 'ROYAL'),
            color: tier.color || (tier.hasCoverCharge ? '#FFD026' : '#FF5722'),
            dietary: tier.hasCoverCharge
              ? `₹${Number(tier.coverAmount || 0).toLocaleString('en-IN')} Voucher: ${tier.coverDescription || 'Redeemable at Food & Refreshment Promenades'}`
              : tier.perks || 'Standard Venue Ingress',
            protection: 'Dynamic Anti-Scalp QR Ingress',
            annex: tier.entryGuidelines || 'Valid Physical ID Required',
            price: Number(tier.price) || 2999,
            status: 'AVAILABLE',
            coverCharge: tier.hasCoverCharge ? Number(tier.coverAmount) : 0,
            coverDescription: tier.coverDescription,
            guestsPerPass: tier.guestsPerPass || 1,
          }));
        }
      } catch (e) {
        console.warn('Failed parsing embedded pass tiers', e);
      }
    }

    try {
      const storedTiersStr = localStorage.getItem(`venu_custom_event_tiers_${evt.id}`);
      if (storedTiersStr) {
        const parsed = JSON.parse(storedTiersStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((tier: any, idx: number): DaisSeat => ({
            id: idx + 1,
            seatNum: String(idx + 1).padStart(2, '0'),
            name: tier.name,
            role:
              tier.entryGuidelines ||
              (tier.hasCoverCharge
                ? `Includes ₹${Number(tier.coverAmount || 0).toLocaleString('en-IN')} food & beverage meal voucher redeemable at venue stalls.`
                : 'Fast-track digital admission pass with dynamic RFID turnstile access.'),
            flank: `${tier.badge || 'PASS'} • ${tier.guestsPerPass > 1 ? `${tier.guestsPerPass} GUESTS` : 'SINGLE ENTRY'}`,
            badge: tier.badge || 'PASS',
            subBadge: tier.hasCoverCharge
              ? `₹${Number(tier.coverAmount || 0).toLocaleString('en-IN')} MEAL VOUCHER`
              : tier.guestsPerPass > 1
              ? `${tier.guestsPerPass} GUESTS`
              : 'FAST-TRACK',
            tier: tier.tier || (tier.price >= 5000 ? 'SOVEREIGN' : tier.price >= 2500 ? 'DIPLOMATIC' : 'ROYAL'),
            color: tier.color || (tier.hasCoverCharge ? '#FFD026' : '#FF5722'),
            dietary: tier.hasCoverCharge
              ? `₹${Number(tier.coverAmount || 0).toLocaleString('en-IN')} Voucher: ${tier.coverDescription || 'Redeemable at Food & Refreshment Promenades'}`
              : tier.perks || 'Standard Venue Ingress',
            protection: 'Dynamic Anti-Scalp QR Ingress',
            annex: tier.entryGuidelines || 'Valid Physical ID Required',
            price: Number(tier.price) || 2999,
            status: 'AVAILABLE',
            coverCharge: tier.hasCoverCharge ? Number(tier.coverAmount) : 0,
            coverDescription: tier.coverDescription,
            guestsPerPass: tier.guestsPerPass || 1,
          }));
        }
      }
    } catch (e) {}
  }

  const base = evt?.basePrice || 2999;
  return [
    {
      id: 1,
      seatNum: '01',
      name: 'Diamond VIP Apex Pass (Front Row & Soundcheck)',
      role: 'Unobstructed front-row catwalk access, backstage soundcheck experience, official artist merchandise kit, and VIP lounge access.',
      flank: 'FRONT ROW APEX • SOUNDCHECK ACCESS',
      badge: 'DIAMOND VIP',
      subBadge: 'APEX ACCESS',
      tier: 'SOVEREIGN',
      color: '#00F0FF',
      dietary: 'Complimentary 5-Star Dinner Buffet & Mocktail Bar',
      protection: 'Priority Gate 1 Biometric RFID Turnstile',
      annex: 'Official Tour Souvenir Lanyard & Tour Laminate',
      price: Math.max(5999, Math.round(base * 2.2)),
      status: 'AVAILABLE',
    },
    {
      id: 2,
      seatNum: '02',
      name: 'Platinum Premium Reserved Pass (Elevated Bay)',
      role: 'Numbered elevated central tiered seating with pristine sightlines of stage visual lasers, pyrotechnics, and spatial acoustics.',
      flank: 'ELEVATED TIER • PRIME SIGHTLINES',
      badge: 'PLATINUM PASS',
      subBadge: 'RESERVED BAY',
      tier: 'SOVEREIGN',
      color: '#E2E8F0',
      dietary: 'Gourmet Food Court Meal Box & Artisan Beverage Included',
      protection: 'Express Gate 2 Usher Escort Detail',
      annex: 'Direct Escalator & Elevator Bay Access',
      price: Math.max(3999, Math.round(base * 1.5)),
      status: 'AVAILABLE',
    },
    {
      id: 3,
      seatNum: '03',
      name: 'Gold Circle Grandstand Pass (Priority Seated)',
      role: 'Reserved seating in lower grandstand bowl with high-fidelity concert stereo sound and food truck promenade access.',
      flank: 'LOWER GRANDSTAND • STEREO ACOUSTICS',
      badge: 'GOLD PASS',
      subBadge: 'PRIORITY SEATED',
      tier: 'DIPLOMATIC',
      color: '#FFD026',
      dietary: 'Pre-packaged artisan snacks & fruit cooler voucher',
      protection: 'Dedicated Bay Attendant Detail',
      annex: 'Fast-Track Turnstile Checkpoint',
      price: Math.max(2499, base),
      status: 'AVAILABLE',
    },
  ];
};

const getCleanPerks = (seat: DaisSeat): string[] => {
  if (seat.id === 1) {
    return ['Front-row stage view', 'Soundcheck experience', 'Dinner buffet & drinks', 'VIP lounge access'];
  }
  if (seat.id === 2) {
    return ['Elevated central tier', 'Direct stage sightlines', 'Gourmet meal box included'];
  }
  if (seat.id === 3) {
    return ['Reserved grandstand seat', 'Acoustic clarity bowl', 'Snack & beverage voucher'];
  }
  if (seat.id === 4) {
    return ['Main arena bowl access', 'Full stage visibility', 'Promenade access'];
  }
  if (seat.id === 5) {
    return ['Subsidized campus pass', 'Youth enclosure', 'College ID verification'];
  }
  const perks: string[] = [];
  if (seat.coverCharge && seat.coverCharge > 0) {
    perks.push(`₹${seat.coverCharge.toLocaleString('en-IN')} Food & Drink Cover`);
  }
  if (seat.dietary && seat.dietary.length < 35) {
    perks.push(seat.dietary);
  }
  if (perks.length === 0) {
    perks.push('Digital QR Entry', 'Fast-Track Ingress');
  }
  return perks.slice(0, 3);
};

export const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const isOrganizer = user?.roles?.some(
    (r) => r === 'ROLE_ORGANIZER' || r === 'ROLE_ADMIN' || r === 'ORGANIZER' || r === 'ADMIN'
  ) || false;

  const [event, setEvent] = useState<EventItem | null>(null);
  const [passQuantities, setPassQuantities] = useState<Record<number, number>>(
    isOrganizer ? {} : { 1: 1 }
  );
  const [holdData, setHoldData] = useState<HoldSeatResponseData | null>(null);
  const [holdTimeRemaining, setHoldTimeRemaining] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingItem | null>(null);
  const [confirmedQrCode, setConfirmedQrCode] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');

  const passTiers = useMemo(() => getEventPassTiers(event), [event]);

  const selectedSeatsList = useMemo(() => {
    const list: { tier: DaisSeat; seatIndex: number; uniqueId: number }[] = [];
    passTiers.forEach((tier) => {
      const count = passQuantities[tier.id] || 0;
      for (let i = 0; i < count; i++) {
        list.push({
          tier,
          seatIndex: i + 1,
          uniqueId: tier.id * 100 + (i + 1),
        });
      }
    });
    return list;
  }, [passTiers, passQuantities]);

  const totalPassCount = useMemo(() => {
    return Object.values(passQuantities).reduce((sum, q) => sum + q, 0);
  }, [passQuantities]);

  const totalPassPrice = useMemo(() => {
    return passTiers.reduce((sum, tier) => {
      const q = passQuantities[tier.id] || 0;
      return sum + q * tier.price;
    }, 0);
  }, [passTiers, passQuantities]);

  const selectedSeatIds = useMemo(() => {
    return selectedSeatsList.map((s) => s.uniqueId);
  }, [selectedSeatsList]);

  const loadData = async () => {
    if (!id) return;
    try {
      const [evtRes] = await Promise.all([
        eventApi.getEventById(id).catch(() => null),
      ]);

      if (evtRes && evtRes.success && evtRes.data) {
        setEvent(computeRealtimeEvent(evtRes.data));
      } else {

        try {
          const customMetaStr = localStorage.getItem(`venu_custom_event_meta_${id}`);
          if (customMetaStr) {
            const customMeta = JSON.parse(customMetaStr);
            setEvent(computeRealtimeEvent(customMeta));
            return;
          }
        } catch (e) {}

        const matched = CURATED_DOSSIERS.find((d) => d.id === Number(id));
        setEvent(computeRealtimeEvent(matched || CURATED_DOSSIERS[0]));
      }
    } catch (err: any) {
      console.warn('Silent data load fallback', err);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('venu_inventory_updated', handleUpdate);
    window.addEventListener('venu_bookings_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('venu_inventory_updated', handleUpdate);
      window.removeEventListener('venu_bookings_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [id]);

  useEffect(() => {
    if (holdTimeRemaining <= 0) {
      if (holdData) {
        setHoldData(null);
        setPassQuantities({});
        loadData();
      }
      return;
    }
    const timer = setInterval(() => {
      setHoldTimeRemaining((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [holdTimeRemaining, holdData]);

  const handleUpdateQuantity = (tierId: number, delta: number) => {
    if (isOrganizer) {
      setError('Pass reservation is restricted to attendees. Organizers monitor pass tier inventory.');
      return;
    }
    setPassQuantities((prev) => {
      const currentQty = prev[tierId] || 0;
      const newQty = Math.max(0, currentQty + delta);

      const otherPassesCount = Object.entries(prev)
        .filter(([tId]) => Number(tId) !== tierId)
        .reduce((sum, [, q]) => sum + q, 0);

      if (otherPassesCount + newQty > 10) {
        setError('Maximum of 10 admission passes can be selected concurrently.');
        return prev;
      }
      setError(null);

      const updated = { ...prev };
      if (newQty === 0) {
        delete updated[tierId];
      } else {
        updated[tierId] = newQty;
      }
      return updated;
    });
  };

  const handleSetQuantity = (tierId: number, qty: number) => {
    if (isOrganizer) {
      setError('Pass reservation is restricted to attendees. Organizers monitor pass tier inventory.');
      return;
    }
    setPassQuantities((prev) => {
      const safeQty = Math.max(0, qty);
      const otherPassesCount = Object.entries(prev)
        .filter(([tId]) => Number(tId) !== tierId)
        .reduce((sum, [, q]) => sum + q, 0);

      if (otherPassesCount + safeQty > 10) {
        setError('Maximum of 10 admission passes can be selected concurrently.');
        return prev;
      }
      setError(null);

      const updated = { ...prev };
      if (safeQty === 0) {
        delete updated[tierId];
      } else {
        updated[tierId] = safeQty;
      }
      return updated;
    });
  };

  const toggleSeatSelection = (seatId: number) => {
    if (isOrganizer) {
      setError('Pass reservation is restricted to attendees. Organizers monitor pass tier inventory.');
      return;
    }
    setPassQuantities((prev) => {
      if ((prev[seatId] || 0) > 0) {
        const updated = { ...prev };
        delete updated[seatId];
        return updated;
      } else {
        const totalSelected = Object.values(prev).reduce((s, q) => s + q, 0);
        if (totalSelected >= 10) {
          setError('Maximum of 10 admission passes can be selected concurrently.');
          return prev;
        }
        return { ...prev, [seatId]: 1 };
      }
    });
  };

  const handleHoldSeats = async () => {
    if (isOrganizer) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (totalPassCount === 0) return;

    setError(null);
    try {
      const res = await eventApi.holdSeats(id || '1', selectedSeatIds).catch(() => null);
      if (res && res.success && res.data) {
        setHoldData(res.data);
        setHoldTimeRemaining(res.data.expiresInSeconds || 300);
      } else {

        setHoldData({
          holdToken: `HOLD-TK-${Date.now().toString(36).toUpperCase()}`,
          eventId: Number(id) || 1,
          userId: user?.id || 1,
          heldSeatIds: selectedSeatIds,
          totalPrice: totalPassPrice,
          expiresInSeconds: 300,
          expiresAt: new Date(Date.now() + 300000).toISOString(),
        });
        setHoldTimeRemaining(300);
      }
    } catch (e) {
      console.warn('Hold seats error', e);
    }
  };

  const handleOpenCheckout = () => {
    if (isOrganizer) {
      setError('Pass booking is restricted to attendees. Event organizers manage stadium capacity and admissions via Analytics.');
      return;
    }
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (totalPassCount === 0) {
      setError('Please select at least one admission pass to proceed.');
      return;
    }
    if (!holdData) {
      handleHoldSeats();
    }
    const generatedKey = `IDEM-PASS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setIdempotencyKey(generatedKey);
    setIsCheckoutOpen(true);
  };

  const handleConfirmReservation = async () => {
    setBookingSubmitting(true);
    setError(null);

    try {
      const token = holdData?.holdToken || `HOLD-SIM-${Date.now()}`;
      const payload = {
        holdToken: token,
        idempotencyKey,
        paymentMethod: 'UPI_INSTANT_PASS',
        cardLast4: '9920',
      };

      const res = await bookingApi.createBooking(payload).catch(() => null);
      let bookingData: BookingItem;

      if (res && res.success && res.data) {
        bookingData = res.data;
      } else {

        bookingData = {
          id: Date.now(),
          bookingReference: `REF-PASS-${Math.floor(100000 + Math.random() * 900000)}`,
          eventId: Number(id) || 1,
          eventTitle: event?.title || 'Diljit Dosanjh — Dil-Luminati Arena India Tour',
          venueName: event?.venue?.name || 'JLN Stadium Arena, New Delhi',
          eventStartTime: event?.startTime || '2026-11-28T19:30:00Z',
          userId: user?.id || 1,
          userFullName: user?.fullName || 'Verified Passholder',
          userEmail: user?.email || 'guest@venu-platform.com',
          totalAmount: totalPassPrice,
          status: 'CONFIRMED',
          seats: selectedSeatsList.map((item) => {
            const tier = item.tier;
            return {
              id: item.uniqueId,
              seatNumber: `${tier.seatNum}-${String(item.seatIndex).padStart(2, '0')}`,
              rowLabel: tier.badge || 'PASS',
              section: tier.flank || 'General Admission',
              seatType: (tier.tier === 'SOVEREIGN' ? 'VVIP' : tier.tier === 'ROYAL' ? 'VIP' : 'REGULAR') as 'REGULAR' | 'VIP' | 'VVIP',
              price: tier.price || 3999,
              status: 'BOOKED',
              heldByCurrentUser: true,
            };
          }),
          createdAt: new Date().toISOString(),
        };
      }

      setConfirmedBooking(bookingData);

      const qrHash = `QR-${bookingData.bookingReference}-${Date.now()}`;
      const generatedQrUrl = await generateQrDataUrl(qrHash);
      setConfirmedQrCode(generatedQrUrl);

      try {
        const storedStr = localStorage.getItem('venu_user_bookings');
        const existing: BookingItem[] = storedStr ? JSON.parse(storedStr) : [];
        const updated = [bookingData, ...existing.filter(b => b.bookingReference !== bookingData.bookingReference)];
        localStorage.setItem('venu_user_bookings', JSON.stringify(updated));
        window.dispatchEvent(new Event('venu_bookings_updated'));

        const ticketsToCache = bookingData.seats.map((seat, idx) => ({
          id: Date.now() + idx,
          ticketCode: `TCK-${bookingData.bookingReference}-${seat.seatNumber}`,
          bookingReference: bookingData.bookingReference,
          eventId: bookingData.eventId,
          eventTitle: bookingData.eventTitle,
          venueName: bookingData.venueName,
          venueCity: event?.venue?.city || 'New Delhi',
          eventStartTime: bookingData.eventStartTime,
          attendeeName: bookingData.userFullName,
          attendeeEmail: bookingData.userEmail,
          seatNumber: seat.seatNumber,
          rowLabel: seat.rowLabel,
          section: seat.section,
          seatType: seat.seatType,
          price: seat.price,
          qrCodeHash: `${qrHash}-${idx + 1}`,
          qrCodeBase64: generatedQrUrl,
          status: 'VALID',
          createdAt: new Date().toISOString(),
        }));
        localStorage.setItem(`venu_booking_tickets_${bookingData.bookingReference}`, JSON.stringify(ticketsToCache));

        broadcastInventoryChange();
        loadData();
      } catch (err) {
        console.warn('LocalStorage booking cache warning:', err);
      }
    } finally {
      setBookingSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#0A0A0C] text-[#e5e1e4] min-h-screen px-6 py-10 bg-ambient-radial">
      <div className="mx-auto max-w-7xl">

        <div className="glass-card p-6 mb-8 border border-white/[0.1] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-[6px]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-['Plus_Jakarta_Sans'] text-xs font-semibold text-[#FF5722] uppercase tracking-wider block">
                Official Admission
              </span>
              <span className="badge-rose !text-[9px] !py-0.5 !px-2 font-['Plus_Jakarta_Sans'] font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(255,87,34,0.3)]">
                <span className="h-1.5 w-1.5 rounded-[1px] bg-[#FF3366] animate-pulse" />
                {event?.availableSeats !== undefined ? `${event.availableSeats} PASSES AVAILABLE` : 'LIVE REALTIME PASS INVENTORY'}
              </span>
            </div>
            <h1 className="font-['Outfit'] text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {event?.title || 'Diljit Dosanjh — Dil-Luminati Arena India Tour'}
            </h1>
            <p className="font-['Plus_Jakarta_Sans'] text-xs text-[#958ea0] mt-1">
              {event?.venue?.name || 'JLN Stadium Arena'}, {event?.venue?.city || 'New Delhi'}
            </p>
          </div>

          {isOrganizer ? (
            <div className="flex items-center gap-3">
              <Link
                to="/analytics"
                className="btn-primary-cta !text-xs !py-2 !px-4 shadow-[0_0_20px_rgba(255,87,34,0.4)]"
              >
                VIEW TELEMETRY & ROSTER
              </Link>
              <Link
                to="/announcements"
                className="btn-secondary-ghost !text-xs !py-2 !px-4"
              >
                BROADCAST NOTICE
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/bookings"
                className="btn-secondary-ghost text-xs py-2 px-4"
              >
                My Bookings
              </Link>
              <button
                onClick={handleOpenCheckout}
                className="btn-primary-cta text-xs py-2 px-5 shadow-[0_0_20px_rgba(255,87,34,0.4)]"
              >
                {totalPassCount > 0
                  ? `Book ${totalPassCount} Pass${totalPassCount > 1 ? 'es' : ''} • ₹${totalPassPrice.toLocaleString('en-IN')}`
                  : 'Book Passes'}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2.5 rounded-[4px] border border-[#FF3366]/40 bg-[#FF3366]/10 p-3.5 text-xs text-[#ffb2ba]">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#FF3366]" />
            <span>{error}</span>
          </div>
        )}

        {holdTimeRemaining > 0 && (
          <div className="mb-6 p-4 rounded-xl border border-[#FFD026]/40 bg-[#FFD026]/10 flex items-center justify-between text-xs text-[#FFD026] font-['Plus_Jakarta_Sans']">
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 animate-spin" />
              <span>
                Pass Reservation Lock: <strong>{formatTimer(holdTimeRemaining)} remaining</strong>
              </span>
            </div>
            <button
              onClick={handleOpenCheckout}
              className="btn-primary-cta text-xs py-1.5 px-3"
            >
              PROCEED TO BOOK PASSES
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          <div className="lg:col-span-5 space-y-6">
            <div className="glass-card p-6 border border-white/[0.1] relative rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="font-['Plus_Jakarta_Sans'] text-[11px] font-semibold text-[#FF5722] uppercase tracking-wider block">
                    Venue Seating Chart
                  </span>
                  <h2 className="font-['Outfit'] text-2xl font-bold tracking-tight text-white">
                    Stage & Arena Layout
                  </h2>
                </div>
                <span className="badge-purple text-xs font-['Plus_Jakarta_Sans']">
                  {totalPassCount} Pass{totalPassCount !== 1 ? 'es' : ''} Selected
                </span>
              </div>

              <div className="relative w-full my-3 rounded-2xl border border-white/[0.1] bg-[#0E0D14] p-4 flex flex-col items-center gap-3 overflow-hidden shadow-2xl">

                <div className="w-full">
                  <svg
                    viewBox="0 0 460 360"
                    className="w-full h-auto select-none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id="stageGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#FF5722" stopOpacity="1" />
                      </linearGradient>
                      <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    <path
                      d="M 25 100 C 25 30, 435 30, 435 100 L 435 320 C 435 350, 25 350, 25 320 Z"
                      fill="#121118"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="1.5"
                    />

                    <rect
                      x="130"
                      y="18"
                      width="200"
                      height="40"
                      rx="8"
                      fill="url(#stageGlow)"
                      stroke="#FF7A00"
                      strokeWidth="2"
                    />
                    <text
                      x="230"
                      y="43"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontFamily="Outfit, sans-serif"
                      fontWeight="800"
                      fontSize="14"
                      letterSpacing="3"
                    >
                      ★ STAGE ★
                    </text>

                    <rect
                      x="212"
                      y="58"
                      width="36"
                      height="32"
                      rx="4"
                      fill="#FF5722"
                    />
                    <circle cx="230" cy="84" r="5" fill="#FFD026" />

                    <g
                      onClick={() => toggleSeatSelection(1)}
                      className="cursor-pointer transition-all duration-200 group"
                    >
                      <path
                        d="M 95 68 Q 230 100 365 68 L 350 128 Q 230 156 110 128 Z"
                        fill={(passQuantities[1] || 0) > 0 ? "rgba(255, 87, 34, 0.45)" : "rgba(255, 208, 38, 0.18)"}
                        stroke={(passQuantities[1] || 0) > 0 ? "#FF5722" : "#FFD026"}
                        strokeWidth={(passQuantities[1] || 0) > 0 ? "2.5" : "1.5"}
                      />
                      <text
                        x="230"
                        y="126"
                        textAnchor="middle"
                        fill={(passQuantities[1] || 0) > 0 ? "#FFFFFF" : "#FFD026"}
                        fontFamily="Outfit, sans-serif"
                        fontWeight="700"
                        fontSize="11.5"
                        letterSpacing="0.5"
                      >
                        01 • DIAMOND VIP PIT {(passQuantities[1] || 0) > 0 ? `[×${passQuantities[1]}]` : ''}
                      </text>
                    </g>

                    <g
                      onClick={() => toggleSeatSelection(2)}
                      className="cursor-pointer transition-all duration-200 group"
                    >
                      <path
                        d="M 85 136 Q 230 166 375 136 L 388 188 Q 230 216 72 188 Z"
                        fill={(passQuantities[2] || 0) > 0 ? "rgba(255, 87, 34, 0.45)" : "rgba(226, 232, 240, 0.12)"}
                        stroke={(passQuantities[2] || 0) > 0 ? "#FF5722" : "rgba(226, 232, 240, 0.45)"}
                        strokeWidth={(passQuantities[2] || 0) > 0 ? "2.5" : "1.2"}
                      />
                      <text
                        x="230"
                        y="178"
                        textAnchor="middle"
                        fill={(passQuantities[2] || 0) > 0 ? "#FFFFFF" : "#E2E8F0"}
                        fontFamily="Outfit, sans-serif"
                        fontWeight="700"
                        fontSize="11"
                        letterSpacing="0.5"
                      >
                        02 • PLATINUM ELEVATED BAY {(passQuantities[2] || 0) > 0 ? `[×${passQuantities[2]}]` : ''}
                      </text>
                    </g>

                    <g
                      onClick={() => toggleSeatSelection(3)}
                      className="cursor-pointer transition-all duration-200 group"
                    >

                      <path
                        d="M 45 135 L 75 135 L 62 245 L 32 235 Z"
                        fill={(passQuantities[3] || 0) > 0 ? "rgba(255, 87, 34, 0.45)" : "rgba(255, 122, 0, 0.15)"}
                        stroke={(passQuantities[3] || 0) > 0 ? "#FF5722" : "#FF7A00"}
                        strokeWidth={(passQuantities[3] || 0) > 0 ? "2.5" : "1.2"}
                      />
                      <text x="52" y="195" textAnchor="middle" fill="#FF7A00" fontFamily="Outfit" fontSize="8.5" fontWeight="700" transform="rotate(-75 52 195)">WEST WING</text>

                      <path
                        d="M 64 196 Q 230 226 396 196 L 408 248 Q 230 276 52 248 Z"
                        fill={(passQuantities[3] || 0) > 0 ? "rgba(255, 87, 34, 0.45)" : "rgba(255, 122, 0, 0.15)"}
                        stroke={(passQuantities[3] || 0) > 0 ? "#FF5722" : "#FF7A00"}
                        strokeWidth={(passQuantities[3] || 0) > 0 ? "2.5" : "1.2"}
                      />
                      <text
                        x="230"
                        y="235"
                        textAnchor="middle"
                        fill={(passQuantities[3] || 0) > 0 ? "#FFFFFF" : "#FF7A00"}
                        fontFamily="Outfit, sans-serif"
                        fontWeight="700"
                        fontSize="11"
                        letterSpacing="0.5"
                      >
                        03 • GOLD CIRCLE GRANDSTAND {(passQuantities[3] || 0) > 0 ? `[×${passQuantities[3]}]` : ''}
                      </text>

                      <path
                        d="M 385 135 L 415 135 L 428 235 L 398 245 Z"
                        fill={(passQuantities[3] || 0) > 0 ? "rgba(255, 87, 34, 0.45)" : "rgba(255, 122, 0, 0.15)"}
                        stroke={(passQuantities[3] || 0) > 0 ? "#FF5722" : "#FF7A00"}
                        strokeWidth={(passQuantities[3] || 0) > 0 ? "2.5" : "1.2"}
                      />
                      <text x="408" y="195" textAnchor="middle" fill="#FF7A00" fontFamily="Outfit" fontSize="8.5" fontWeight="700" transform="rotate(75 408 195)">EAST WING</text>
                    </g>

                    <g
                      onClick={() => toggleSeatSelection(4)}
                      className="cursor-pointer transition-all duration-200 group"
                    >
                      <path
                        d="M 40 256 Q 225 282 225 282 L 225 340 Q 30 340 30 310 Z"
                        fill={(passQuantities[4] || 0) > 0 ? "rgba(255, 87, 34, 0.45)" : "rgba(148, 163, 184, 0.12)"}
                        stroke={(passQuantities[4] || 0) > 0 ? "#FF5722" : "#94A3B8"}
                        strokeWidth={(passQuantities[4] || 0) > 0 ? "2.5" : "1.2"}
                      />
                      <text
                        x="125"
                        y="312"
                        textAnchor="middle"
                        fill={(passQuantities[4] || 0) > 0 ? "#FFFFFF" : "#CBD5E1"}
                        fontFamily="Outfit, sans-serif"
                        fontWeight="700"
                        fontSize="10"
                      >
                        04 • SILVER ARENA {(passQuantities[4] || 0) > 0 ? `[×${passQuantities[4]}]` : ''}
                      </text>
                    </g>

                    <g
                      onClick={() => toggleSeatSelection(5)}
                      className="cursor-pointer transition-all duration-200 group"
                    >
                      <path
                        d="M 235 282 Q 420 256 420 256 L 430 310 Q 430 340 235 340 Z"
                        fill={(passQuantities[5] || 0) > 0 ? "rgba(255, 87, 34, 0.45)" : "rgba(255, 122, 0, 0.12)"}
                        stroke={(passQuantities[5] || 0) > 0 ? "#FF5722" : "rgba(255, 122, 0, 0.45)"}
                        strokeWidth={(passQuantities[5] || 0) > 0 ? "2.5" : "1.2"}
                      />
                      <text
                        x="335"
                        y="312"
                        textAnchor="middle"
                        fill={(passQuantities[5] || 0) > 0 ? "#FFFFFF" : "#FFD026"}
                        fontFamily="Outfit, sans-serif"
                        fontWeight="700"
                        fontSize="10"
                      >
                        05 • STUDENT CAMPUS {(passQuantities[5] || 0) > 0 ? `[×${passQuantities[5]}]` : ''}
                      </text>
                    </g>
                  </svg>
                </div>

                <div className="text-[11px] text-[#958ea0] font-['Plus_Jakarta_Sans'] flex items-center justify-between w-full px-2 pt-1">
                  <span>↑ Stage Front</span>
                  <span className="text-[#FF5722] font-medium">Click section to toggle pass</span>
                  <span>Rear Exit ↓</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-white/[0.08]">
                {passTiers.map((seat) => {
                  const qty = passQuantities[seat.id] || 0;
                  const isSelected = qty > 0;
                  return (
                    <button
                      key={seat.id}
                      type="button"
                      onClick={() => toggleSeatSelection(seat.id)}
                      className={`p-2 rounded-xl border text-left transition-all text-xs font-['Plus_Jakarta_Sans'] ${
                        isSelected
                          ? 'border-[#FF5722] bg-[#FF5722]/20 text-white shadow-sm'
                          : 'border-white/10 bg-white/[0.03] text-[#cbc3d7] hover:border-white/25 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold font-['Outfit'] text-white">
                          {seat.seatNum} • {seat.badge.split(' ')[0]}
                        </span>
                        {isSelected && (
                          <span className="text-[#FF5722] text-[10px] font-bold bg-[#FF5722]/20 px-1.5 py-0.5 rounded">
                            ×{qty}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#958ea0]">
                        ₹{seat.price.toLocaleString('en-IN')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="glass-card overflow-hidden border border-white/[0.08] rounded-xl relative group">
              <div className="h-28 relative overflow-hidden bg-black/60">
                <img
                  src={event?.bannerUrl || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80"}
                  alt="Venue Staging"
                  className="h-full w-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121118] via-transparent to-black/40" />

                <div className="absolute top-3 left-3 right-3 flex justify-between font-['Plus_Jakarta_Sans'] text-xs">
                  <span className="text-white font-semibold">Venue & Staging Environment</span>
                  <span className="text-[#FFD026] font-medium">360° Concert Acoustics</span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex justify-between font-['Plus_Jakarta_Sans'] text-xs">
                  <span className="text-[#cbc3d7] font-medium">{event?.venue?.name || 'Main Stage & Arena'}</span>
                  <span className="text-emerald-400 font-medium">Live Ingress Ready</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/[0.08]">
              <div>
                <h2 className="font-['Outfit'] text-2xl font-bold tracking-tight text-white">
                  Available Admission Passes
                </h2>
                <p className="font-['Plus_Jakarta_Sans'] text-xs text-[#958ea0] mt-0.5">
                  Select your desired pass tier and quantity for verified instant digital entry.
                </p>
              </div>

              <span className="badge-subtle text-xs font-['Plus_Jakarta_Sans'] self-start sm:self-auto">
                Official Digital Admission
              </span>
            </div>

            <div className="space-y-3">
              {isOrganizer && (
                <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 text-xs text-purple-300 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-purple-400 shrink-0" />
                    <span>
                      <strong>Organizer Mode:</strong> Pass booking is reserved for attendees. Organizers monitor pass tier inventory and admissions.
                    </span>
                  </div>
                  <Link to="/analytics" className="text-purple-300 hover:text-white font-semibold underline shrink-0 font-['Plus_Jakarta_Sans'] text-[11px]">
                    Open Analytics →
                  </Link>
                </div>
              )}
              {passTiers.map((seat) => {
                const qty = passQuantities[seat.id] || 0;
                const isSelected = qty > 0;
                const perks = getCleanPerks(seat);
                const isDiamond = seat.id === 1;

                return (
                  <div
                    key={seat.id}
                    onClick={() => {
                      if (!isOrganizer && qty === 0) {
                        handleSetQuantity(seat.id, 1);
                      }
                    }}
                    className={`glass-card p-5 rounded-2xl transition-all duration-200 border relative ${
                      isOrganizer ? 'cursor-default border-white/[0.08]' : isSelected
                        ? 'border-[#FF5722] bg-[#FF5722]/10 shadow-[0_0_30px_rgba(255,87,34,0.25)] ring-1 ring-[#FF5722] cursor-pointer'
                        : 'border-white/[0.08] hover:border-white/20 bg-[#121118]/80 hover:bg-[#14121d] cursor-pointer'
                    }`}
                  >

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`h-9 w-9 rounded-xl border flex items-center justify-center font-['Outfit'] font-bold text-sm transition ${
                            isSelected
                              ? 'border-[#FF5722] bg-[#FF5722] text-white shadow-md shadow-[#FF5722]/40'
                              : 'border-white/10 bg-white/5 text-white'
                          }`}
                        >
                          {seat.seatNum}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-['Outfit'] text-lg font-bold text-white tracking-tight">
                              {seat.name.split('(')[0].trim()}
                            </h3>
                            <span
                              className={`text-[9.5px] font-['Plus_Jakarta_Sans'] font-bold tracking-wider uppercase px-2 py-0.5 rounded-[3px] ${
                                isDiamond
                                  ? 'bg-[#FFD026]/15 text-[#FFD026] border border-[#FFD026]/30'
                                  : seat.tier === 'SOVEREIGN'
                                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                                  : 'bg-white/10 text-[#cbc3d7] border border-white/10'
                              }`}
                            >
                              {seat.badge}
                            </span>
                          </div>
                          <span className="font-['Plus_Jakarta_Sans'] text-xs text-[#958ea0] block mt-0.5">
                            {seat.flank}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="text-right">
                          <div className="font-['Outfit'] text-xl font-bold text-white tracking-tight">
                            ₹{(seat.price * (qty || 1)).toLocaleString('en-IN')}
                          </div>
                          <span className="font-['Plus_Jakarta_Sans'] text-[11px] text-[#958ea0] block">
                            {qty > 1 ? `${qty} passes (₹${seat.price.toLocaleString('en-IN')} ea)` : 'per pass'}
                          </span>
                        </div>

                        {isOrganizer ? (
                          <span className="badge-purple !text-[10px] !py-1 !px-2.5 font-['Plus_Jakarta_Sans']">
                            INSPECTION ONLY
                          </span>
                        ) : qty > 0 ? (
                          <div
                            className="flex items-center gap-1.5 bg-[#14121d] border border-[#FF5722]/60 rounded-xl p-1 shadow-md"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(seat.id, -1)}
                              className="h-7 w-7 rounded-lg bg-white/[0.08] hover:bg-[#FF5722] text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
                              title="Decrease quantity"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="font-['Outfit'] font-bold text-sm text-white px-2 min-w-[24px] text-center select-none">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(seat.id, 1)}
                              className="h-7 w-7 rounded-lg bg-white/[0.08] hover:bg-[#FF5722] text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
                              title="Increase quantity"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetQuantity(seat.id, 1);
                            }}
                            className="btn-secondary-ghost text-xs py-1.5 px-3 rounded-xl border border-white/15 hover:border-[#FF5722] hover:text-white flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5 text-[#FF5722]" />
                            <span>Add Pass</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="font-['Plus_Jakarta_Sans'] text-xs text-[#cbc3d7] leading-relaxed mt-3 mb-3.5">
                      {seat.role}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/[0.06]">
                      <div className="flex flex-wrap items-center gap-2">
                        {perks.map((perk, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#e5e1e4] font-['Plus_Jakarta_Sans'] text-[11px]"
                          >
                            <Check className="h-3 w-3 text-[#FF5722]" />
                            {perk}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-['Plus_Jakarta_Sans'] font-semibold shrink-0">
                        {isSelected ? (
                          <span className="text-[#FF5722] flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            {qty} {qty === 1 ? 'Pass' : 'Passes'} Selected
                          </span>
                        ) : (
                          <span className="text-[#958ea0] hover:text-white transition">
                            Tap to Select
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {isCheckoutOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            onClick={() => setIsCheckoutOpen(false)}
          >
            <div
              className="glass-modal max-w-lg w-full p-8 border border-white/20 shadow-[0_0_60px_rgba(255,87,34,0.3)] relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="absolute top-5 right-5 text-[#958ea0] hover:text-white"
                aria-label="Close checkout modal"
              >
                <X className="h-5 w-5" />
              </button>

              {!confirmedBooking ? (
                <div>
                  <h3 className="font-['Outfit'] text-2xl font-bold text-white mb-1">
                    Confirm Pass Reservation
                  </h3>
                  <p className="font-['Plus_Jakarta_Sans'] text-xs text-[#958ea0] mb-6">
                    Review selected admission passes and authorize booking with instant pass issuance.
                  </p>

                  <div className="space-y-3 font-['Plus_Jakarta_Sans'] text-xs border-y border-white/[0.08] py-4 mb-6">
                    <div className="flex justify-between text-[#958ea0]">
                      <span>Event:</span>
                      <strong className="text-white truncate max-w-[240px]">{event?.title}</strong>
                    </div>
                    <div className="flex justify-between text-[#958ea0]">
                      <span>Venue:</span>
                      <strong className="text-white">{event?.venue?.name}, {event?.venue?.city}</strong>
                    </div>
                    <div className="text-[#958ea0]">
                      <div className="flex justify-between mb-1.5">
                        <span>Selected Passes Breakdown:</span>
                        <span className="text-white font-semibold">{totalPassCount} Pass(es)</span>
                      </div>
                      <div className="space-y-1.5 bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.06]">
                        {passTiers
                          .filter((tier) => (passQuantities[tier.id] || 0) > 0)
                          .map((tier) => {
                            const q = passQuantities[tier.id];
                            return (
                              <div key={tier.id} className="flex justify-between items-center text-[11px]">
                                <span className="text-white truncate max-w-[220px]">
                                  {q} × {tier.name.split('(')[0].trim()}
                                </span>
                                <strong className="text-[#FFD026]">
                                  ₹{(tier.price * q).toLocaleString('en-IN')}
                                </strong>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-white/[0.04]">
                      <span className="text-white font-semibold">Total Pass Fee:</span>
                      <strong className="text-[#FF5722] text-base">₹{totalPassPrice.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsCheckoutOpen(false)}
                      className="btn-secondary-ghost flex-1 py-3.5 text-xs font-semibold rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/[0.05] transition text-[#cbc3d7] hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmReservation}
                      disabled={bookingSubmitting}
                      className="btn-primary-cta flex-[2] py-3.5 text-xs font-semibold shadow-[0_0_20px_rgba(255,87,34,0.5)] cursor-pointer"
                    >
                      {bookingSubmitting ? 'ISSUING DIGITAL PASSES...' : 'CONFIRM & BOOK PASSES'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2 space-y-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-1">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h3 className="font-['Outfit'] text-2xl font-bold tracking-tight text-white">
                    Pass Reservation Confirmed!
                  </h3>
                  <p className="font-['Plus_Jakarta_Sans'] text-xs text-[#958ea0] max-w-sm mx-auto">
                    Your digital pass has been generated with verified gate admission QR encryption.
                  </p>

                  <div className="p-4 rounded-2xl bg-[#14121d] border border-white/10 flex flex-col items-center justify-center my-3">
                    <div className="p-3 bg-white rounded-xl shadow-2xl inline-block mb-3">
                      {confirmedQrCode ? (
                        <img
                          src={confirmedQrCode}
                          alt={`QR Pass for ${confirmedBooking.bookingReference}`}
                          className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                        />
                      ) : (
                        <div className="w-48 h-48 flex items-center justify-center">
                          <div className="h-7 w-7 border-2 border-[#FF5722] border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold font-['Plus_Jakarta_Sans'] tracking-wider uppercase">
                      <span className="h-1.5 w-1.5 rounded-[1px] bg-emerald-400" />
                      Official Gate Entry Pass
                    </div>
                    <span className="text-[11px] text-[#958ea0] mt-1.5 font-['Plus_Jakarta_Sans']">
                      Present at gate turnstiles for fast-track entry
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 font-['Plus_Jakarta_Sans'] text-xs text-left space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#958ea0]">Booking Reference:</span>
                      <strong className="font-['Plus_Jakarta_Sans'] text-[#FFD026]">{confirmedBooking.bookingReference}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#958ea0]">Seats Allocated:</span>
                      <span className="text-white font-medium">
                        {confirmedBooking.seats?.map(s => `Seat ${s.seatNumber} (${s.rowLabel})`).join(', ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#958ea0]">Total Paid:</span>
                      <strong className="font-['Outfit'] text-base text-[#FF5722]">₹{confirmedBooking.totalAmount.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Link
                      to="/bookings"
                      className="btn-primary-cta flex-1 text-center py-2.5 text-xs font-semibold rounded-lg shadow-md shadow-[#FF5722]/30"
                    >
                      View in My Bookings
                    </Link>
                    <button
                      onClick={() => setIsCheckoutOpen(false)}
                      className="btn-secondary-ghost flex-1 py-2.5 text-xs font-medium rounded-lg"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
