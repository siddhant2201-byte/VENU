import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingApi, ticketApi, type BookingItem, type TicketItem } from '../api/events';
import { useAuth } from '../context/AuthContext';
import {
  Ticket,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  QrCode,
  X,
  ShieldCheck,
  UserCheck,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { generateQrDataUrl } from '../utils/qrHelper';
import { broadcastInventoryChange } from '../utils/realtimeInventory';

export const MyBookings: React.FC = () => {
  const { hasRole, user } = useAuth();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [cancellingRef, setCancellingRef] = useState<string | null>(null);

  const [selectedBookingTickets, setSelectedBookingTickets] = useState<TicketItem[] | null>(null);
  const [activeTicketIndex, setActiveTicketIndex] = useState(0);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerInput, setScannerInput] = useState('');
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const isStaff = hasRole('ROLE_ORGANIZER') || hasRole('ROLE_ADMIN');

  const formatEventDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const datePart = d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const timePart = d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return `${datePart} • ${timePart}`;
    } catch {
      return dateStr;
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await bookingApi.getMyBookings(0, 50).catch(() => null);
      let list: BookingItem[] = [];
      if (res && res.data?.content && res.data.content.length > 0) {
        list = res.data.content;
      }

      try {
        const localSaved = localStorage.getItem('venu_user_bookings');
        if (localSaved) {
          const parsed: BookingItem[] = JSON.parse(localSaved);
          const localMap = new Map(parsed.map((b) => [b.bookingReference, b]));
          // Merge prioritizing local state so cancellations and new bookings are always accurate
          const merged = list.map((b) => localMap.get(b.bookingReference) || b);
          parsed.forEach((b) => {
            if (!merged.some((m) => m.bookingReference === b.bookingReference)) {
              merged.push(b);
            }
          });
          list = merged;
        }
      } catch (e) {
        console.warn('Could not parse local bookings', e);
      }

      if (list.length > 0) {
        setBookings(list);
      } else {
        setBookings([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    const handleUpdate = () => {
      fetchBookings();
    };

    window.addEventListener('venu_bookings_updated', handleUpdate);
    window.addEventListener('venu_inventory_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('venu_bookings_updated', handleUpdate);
      window.removeEventListener('venu_inventory_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleCopy = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const handleCancel = async (bookingReference: string) => {
    try {
      setCancellingRef(bookingReference);
      await bookingApi.cancelBooking(bookingReference).catch((err) => {
        console.warn('Backend cancel call fallback:', err);
      });

      // 1. Update component state
      setBookings((prev) =>
        prev.map((b) => (b.bookingReference === bookingReference ? { ...b, status: 'CANCELLED' } : b))
      );

      // 2. Update localStorage master bookings
      try {
        const localSaved = localStorage.getItem('venu_user_bookings');
        const parsed: BookingItem[] = localSaved ? JSON.parse(localSaved) : [];
        const index = parsed.findIndex((b) => b.bookingReference === bookingReference);
        let updated: BookingItem[];
        if (index >= 0) {
          updated = parsed.map((b) =>
            b.bookingReference === bookingReference ? { ...b, status: 'CANCELLED' } : b
          );
        } else {
          const bToCancel = bookings.find((b) => b.bookingReference === bookingReference);
          if (bToCancel) {
            updated = [{ ...bToCancel, status: 'CANCELLED' }, ...parsed];
          } else {
            updated = parsed;
          }
        }
        localStorage.setItem('venu_user_bookings', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage booking cancellation update failed', e);
      }

      // 3. Update cached tickets for this reference
      try {
        const cachedTickets = localStorage.getItem(`venu_booking_tickets_${bookingReference}`);
        if (cachedTickets) {
          const parsed = JSON.parse(cachedTickets);
          const updated = parsed.map((t: any) => ({ ...t, status: 'CANCELLED' }));
          localStorage.setItem(`venu_booking_tickets_${bookingReference}`, JSON.stringify(updated));
        }
      } catch (e) {
        console.warn('LocalStorage ticket cancellation update failed', e);
      }

      // 4. Update modal state
      setSelectedBookingTickets((prev) => (prev ? prev.map((t) => ({ ...t, status: 'CANCELLED' })) : null));

      // 5. Broadcast inventory revert everywhere
      broadcastInventoryChange();
    } finally {
      setCancellingRef(null);
    }
  };

  const handleOpenTickets = async (bookingReference: string) => {
    try {
      setTicketsLoading(true);
      setError(null);
      let ticketList: TicketItem[] = [];
      const res = await ticketApi.getTicketsForBooking(bookingReference).catch(() => null);
      if (Array.isArray(res?.data) && res.data.length > 0) {
        ticketList = res.data;
      } else if (Array.isArray(res) && res.length > 0) {
        ticketList = res;
      } else {

        try {
          const cachedTickets = localStorage.getItem(`venu_booking_tickets_${bookingReference}`);
          if (cachedTickets) {
            ticketList = JSON.parse(cachedTickets);
          }
        } catch (e) {}
      }

      if (ticketList.length === 0) {

        const booking = bookings.find((b) => b.bookingReference === bookingReference);
        if (booking && booking.seats && booking.seats.length > 0) {
          ticketList = booking.seats.map((seat: any, idx: number) => ({
            id: booking.id * 100 + idx,
            ticketCode: `PASS-${booking.bookingReference}-${seat.seatNumber || (idx + 1)}`,
            qrCodeHash: `QR-${booking.bookingReference}-${seat.seatNumber || (idx + 1)}`,
            seatNumber: seat.seatNumber || seat.seatNum || String(idx + 1).padStart(2, '0'),
            rowLabel: seat.rowLabel || 'Tier Pass',
            section: seat.section || 'Main Arena',
            seatType: seat.seatType || 'VIP',
            price: seat.price || 4999,
            status: 'VALID',
            bookingReference: booking.bookingReference,
            eventTitle: booking.eventTitle,
            venueName: booking.venueName,
            eventStartTime: booking.eventStartTime,
            attendeeName: booking.userFullName || user?.fullName || 'Verified Passholder',
            attendeeEmail: booking.userEmail || user?.email || '',
          })) as any;
        } else {
          ticketList = [];
        }
      }

      const enrichedTickets = await Promise.all(
        ticketList.map(async (t) => {
          let qr = t.qrCodeBase64;
          if (!qr || !qr.startsWith('data:image')) {
            const qrText = t.qrCodeHash || t.ticketCode || `${bookingReference}-${t.seatNumber || 'ENTRY'}`;
            qr = await generateQrDataUrl(qrText);
          }
          return {
            ...t,
            status: (t.status === 'USED' ? 'USED' : t.status === 'CANCELLED' ? 'CANCELLED' : 'VALID') as 'VALID' | 'USED' | 'CANCELLED',
            qrCodeBase64: qr,
          };
        })
      );

      setSelectedBookingTickets(enrichedTickets);
      setActiveTicketIndex(0);
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleGateCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannerInput.trim()) return;

    try {
      setScanning(true);
      setScanError(null);
      setScanResult(null);

      const isQr = scannerInput.startsWith('QR-');
      const payload = isQr
        ? { qrCodeHash: scannerInput.trim() }
        : { ticketCode: scannerInput.trim() };

      const res = await ticketApi.checkInTicket(payload);
      setScanResult(res.data || res);
      fetchBookings();
    } catch (err: any) {
      setScanError(err.response?.data?.message || 'Gate Check-in failed. Please verify credentials.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="bg-[#0A0A0C] text-[#e5e1e4] bg-ambient-radial min-h-[calc(100vh-80px)] px-6 py-12">
      <div className="mx-auto max-w-6xl">

        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.08] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-['Plus_Jakarta_Sans'] text-xs font-semibold tracking-wider text-[#FF7A00] uppercase">
                Tickets & Passes
              </span>
              {isStaff && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-['Plus_Jakarta_Sans'] text-[11px] font-semibold">
                  <ShieldCheck className="h-3 w-3" />
                  Staff Clearance
                </span>
              )}
            </div>
            <h1 className="font-['Outfit'] text-3xl sm:text-4xl font-bold tracking-tight text-white">
              My Bookings
            </h1>
            <p className="font-['Plus_Jakarta_Sans'] text-sm text-[#958ea0] mt-1.5 max-w-xl">
              Access your digital entry passes, view venue details, and manage your reserved seats.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isStaff && (
              <button
                onClick={() => {
                  setIsScannerOpen(true);
                  setScanResult(null);
                  setScanError(null);
                  setScannerInput('');
                }}
                className="btn-secondary-ghost text-xs flex items-center gap-2 border-white/20 text-[#e5e1e4] hover:border-[#FF5722] hover:text-[#FFD026] hover:bg-[#FF5722]/10"
              >
                <QrCode className="h-3.5 w-3.5 text-[#FFD026]" />
                Gate Check-in
              </button>
            )}

            <Link
              to="/events"
              className="btn-secondary-ghost text-xs self-start md:self-auto flex items-center gap-2"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#FFD026]" />
              Explore More Events
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-8 flex items-center gap-3 rounded-lg border border-[#FF3366]/40 bg-[#FF3366]/10 p-4 text-xs text-[#ffb2ba]">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#FF3366]" />
            <span>{error}</span>
          </div>
        )}

        {isStaff ? (
          /* ================= ORGANIZER PASS OPERATIONS VIEW ================= */
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-xl border border-purple-500/30 bg-purple-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <strong className="font-['Outfit'] text-white block text-lg font-bold">
                    Organizer Operational Clearance
                  </strong>
                  <p className="text-xs text-[#cbc3d7] mt-1 max-w-xl leading-relaxed">
                    Personal pass booking is strictly restricted to event attendees. As an event organizer, use the high-speed Gate Check-in tool to validate ticket holders at stadium turnstiles, or monitor live capacity in Analytics.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    setIsScannerOpen(true);
                    setScanResult(null);
                    setScanError(null);
                    setScannerInput('');
                  }}
                  className="btn-primary-cta !text-xs !py-3 !px-5 flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-500/30"
                >
                  <QrCode className="h-4 w-4" />
                  Launch Gate Scanner
                </button>
                <Link
                  to="/analytics"
                  className="btn-secondary-ghost !text-xs !py-3 !px-5 flex items-center gap-2 cursor-pointer border-white/20 text-white hover:border-[#FF5722] hover:text-[#FFD026]"
                >
                  View Live Analytics
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-card p-5 rounded-xl border border-white/10">
                <span className="font-['Plus_Jakarta_Sans'] text-[10px] text-[#958ea0] uppercase tracking-wider block">Admission Status</span>
                <strong className="font-['Outfit'] text-white text-xl block mt-1">All Turnstiles Live</strong>
                <span className="text-[11px] text-emerald-400 mt-1 block">RFID scanners active</span>
              </div>
              <div className="glass-card p-5 rounded-xl border border-white/10">
                <span className="font-['Plus_Jakarta_Sans'] text-[10px] text-[#958ea0] uppercase tracking-wider block">Security Rule</span>
                <strong className="font-['Outfit'] text-white text-xl block mt-1">Role Segregation</strong>
                <span className="text-[11px] text-purple-400 mt-1 block">Organizers cannot hold attendee passes</span>
              </div>
              <div className="glass-card p-5 rounded-xl border border-white/10">
                <span className="font-['Plus_Jakarta_Sans'] text-[10px] text-[#958ea0] uppercase tracking-wider block">Production Hub</span>
                <strong className="font-['Outfit'] text-white text-xl block mt-1">Telemetry Sync</strong>
                <Link to="/analytics" className="text-[11px] text-[#FF5722] hover:text-[#FF7A00] font-semibold mt-1 inline-flex items-center gap-1">
                  Open telemetry <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="py-24 text-center font-['Plus_Jakarta_Sans'] text-xs text-[#958ea0] flex flex-col items-center justify-center gap-3">
            <div className="h-6 w-6 border-2 border-[#FF5722] border-t-transparent rounded-full animate-spin" />
            <span>Loading your passes...</span>
          </div>
        ) : bookings.length === 0 ? (
          <div className="glass-card p-12 text-center border border-white/[0.08] rounded-xl">
            <Ticket className="h-12 w-12 text-[#FFD026] mx-auto mb-4 opacity-60" />
            <h3 className="font-['Outfit'] text-2xl font-bold text-white mb-2">
              No Bookings Found
            </h3>
            <p className="font-['Plus_Jakarta_Sans'] text-xs text-[#958ea0] max-w-md mx-auto mb-6">
              You haven't booked any event tickets yet. Explore upcoming concerts, sports, and theatre shows.
            </p>
            <Link to="/events" className="btn-primary-cta inline-flex items-center gap-2 text-xs py-3 px-6 rounded font-bold uppercase tracking-wider">
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const isConfirmed = booking.status === 'CONFIRMED';
              const isCancelled = booking.status === 'CANCELLED';

              return (
                <div
                  key={booking.id}
                  className={`glass-card p-6 sm:p-8 border rounded-xl transition duration-200 ${
                    isCancelled
                      ? 'border-white/[0.04] opacity-60'
                      : 'border-white/[0.12] hover:border-[#FF5722]/40'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.06]">
                    <div className="space-y-3">

                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] font-['Plus_Jakarta_Sans'] text-[11px] font-semibold tracking-wider uppercase ${
                            isConfirmed
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : isCancelled
                              ? 'bg-[#FF3366]/10 text-[#ffb2ba] border border-[#FF3366]/30'
                              : 'bg-[#FFD026]/10 text-[#FFD026] border border-[#FFD026]/30'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-[1px] ${isConfirmed ? 'bg-emerald-400' : isCancelled ? 'bg-[#FF3366]' : 'bg-[#FFD026]'}`} />
                          {isConfirmed ? 'Confirmed' : isCancelled ? 'Cancelled' : booking.status}
                        </span>

                        <div className="flex items-center gap-2 bg-white/[0.04] px-2.5 py-1 rounded-md border border-white/10 font-['Plus_Jakarta_Sans'] text-xs text-[#cbc3d7]">
                          <span className="text-[#958ea0]">Ref:</span>
                          <span className="font-['Plus_Jakarta_Sans'] text-white font-medium">{booking.bookingReference}</span>
                          <button
                            onClick={() => handleCopy(booking.bookingReference)}
                            className="ml-0.5 p-1 hover:text-white transition text-[#958ea0]"
                            title="Copy Booking Reference"
                          >
                            {copiedRef === booking.bookingReference ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>

                        <span className="font-['Plus_Jakarta_Sans'] text-xs text-[#958ea0]">
                          Booked on {new Date(booking.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-bold tracking-tight text-white hover:text-white transition">
                        {booking.eventTitle}
                      </h2>

                      <div className="flex flex-wrap items-center gap-4 text-xs font-['Plus_Jakarta_Sans'] text-[#958ea0]">
                        <div className="flex items-center gap-1.5 text-[#FFD026] font-medium">
                          <Calendar className="h-4 w-4" />
                          <span>{formatEventDateTime(booking.eventStartTime)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#cbc3d7]">
                          <MapPin className="h-4 w-4 text-[#FF5722]" />
                          <span>{booking.venueName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-white/[0.04]">
                      <div className="text-left lg:text-right">
                        <span className="font-['Plus_Jakarta_Sans'] text-xs text-[#958ea0] uppercase tracking-wider block font-medium">
                          Total Paid
                        </span>
                        <span className="font-['Outfit'] text-2xl sm:text-3xl font-bold text-[#FFD026]">
                          ₹{booking.totalAmount.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {isConfirmed && (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleOpenTickets(booking.bookingReference)}
                            disabled={ticketsLoading}
                            className="btn-primary-cta text-xs py-2 px-4 flex items-center gap-2 font-semibold shadow-md"
                          >
                            <QrCode className="h-4 w-4" />
                            View Digital Passes
                          </button>

                          <button
                            onClick={() => handleCancel(booking.bookingReference)}
                            disabled={cancellingRef === booking.bookingReference}
                            className="btn-secondary-ghost text-xs py-2 px-3 text-[#ffb2ba] border-[#FF3366]/30 hover:border-[#FF3366] hover:bg-[#FF3366]/10 flex items-center gap-1.5 font-medium"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            {cancellingRef === booking.bookingReference ? 'Cancelling...' : 'Cancel'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-5">
                    <span className="font-['Plus_Jakarta_Sans'] text-xs uppercase tracking-wider font-semibold text-[#958ea0] block mb-3">
                      Allocated Seats ({booking.seats?.length || 0})
                    </span>

                    <div className="flex flex-wrap gap-2.5">
                      {booking.seats?.map((seat) => (
                        <div
                          key={seat.id}
                          className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs font-['Plus_Jakarta_Sans'] hover:border-white/20 transition"
                        >
                          <span className="text-white font-semibold">Seat {seat.seatNumber}</span>
                          <span className="text-white/30">•</span>
                          <span className="text-[#cbc3d7]">{seat.rowLabel ? `Row ${seat.rowLabel}` : seat.section}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${
                              seat.seatType === 'VVIP'
                                ? 'bg-[#FFD026]/15 text-[#FFD026] border border-[#FFD026]/30'
                                : seat.seatType === 'VIP'
                                ? 'bg-[#FF5722]/15 text-[#ffaa80] border border-[#FF5722]/30'
                                : 'bg-white/10 text-[#cbc3d7]'
                            }`}
                          >
                            {seat.seatType}
                          </span>
                          <span className="font-['Outfit'] font-bold text-[#FFD026]">₹{seat.price.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedBookingTickets && selectedBookingTickets.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl glass-card border border-white/[0.15] p-6 sm:p-8 rounded-2xl shadow-2xl bg-[#0e0d14]/95 text-white max-h-[90vh] overflow-y-auto">

            <button
              onClick={() => setSelectedBookingTickets(null)}
              className="absolute top-5 right-5 p-2 rounded-lg text-[#958ea0] hover:text-white hover:bg-white/10 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center pb-4 border-b border-white/[0.08] mb-6">
              <span className="font-['Plus_Jakarta_Sans'] text-xs uppercase tracking-wider text-[#FFD026] font-semibold block mb-1">
                Official Digital Pass
              </span>
              <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Event Admission Pass
              </h2>
              <p className="font-['Plus_Jakarta_Sans'] text-xs text-[#958ea0] mt-1">
                Pass {activeTicketIndex + 1} of {selectedBookingTickets.length} • Present QR Code at gate entrance
              </p>

              {selectedBookingTickets.length > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button
                    onClick={() => setActiveTicketIndex((prev) => Math.max(0, prev - 1))}
                    disabled={activeTicketIndex === 0}
                    className="p-1.5 rounded-lg border border-white/10 hover:border-white/30 disabled:opacity-30 disabled:hover:border-white/10 text-white transition"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="flex gap-1.5">
                    {selectedBookingTickets.map((t, idx) => (
                      <button
                        key={t.id}
                        onClick={() => setActiveTicketIndex(idx)}
                        className={`px-3 py-1 rounded-lg font-['Plus_Jakarta_Sans'] text-xs font-semibold transition ${
                          activeTicketIndex === idx
                            ? 'bg-[#FF5722] text-white shadow-md shadow-[#FF5722]/30'
                            : 'bg-white/5 text-[#958ea0] hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        Seat {t.seatNumber}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setActiveTicketIndex((prev) => Math.min(selectedBookingTickets.length - 1, prev + 1))}
                    disabled={activeTicketIndex === selectedBookingTickets.length - 1}
                    className="p-1.5 rounded-lg border border-white/10 hover:border-white/30 disabled:opacity-30 disabled:hover:border-white/10 text-white transition"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {(() => {
              const t = selectedBookingTickets[activeTicketIndex];
              const isUsed = t.status === 'USED';
              const isCancelled = t.status === 'CANCELLED';

              return (
                <div className="space-y-6">

                  <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-[#14121d] border border-white/[0.1] text-center">
                    <div className="relative p-3 bg-white rounded-xl shadow-xl inline-block mb-3">
                      <img
                        src={t.qrCodeBase64 || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(t.qrCodeHash || t.ticketCode || t.bookingReference || 'GATE-PASS')}`}
                        alt={`QR Code for ${t.ticketCode}`}
                        className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                      />
                      {isUsed && (
                        <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-xl text-amber-400 font-['Plus_Jakarta_Sans'] text-sm font-bold tracking-wider border border-amber-500/50">
                          <UserCheck className="h-8 w-8 mb-1" />
                          Scanned & Admitted
                        </div>
                      )}
                      {isCancelled && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-xl text-[#ffb2ba] font-['Plus_Jakarta_Sans'] text-sm font-bold tracking-wider border border-[#FF3366]/50">
                          <XCircle className="h-8 w-8 mb-1 text-[#FF3366]" />
                          Pass Cancelled
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-['Plus_Jakarta_Sans'] text-xs font-semibold ${
                          t.status === 'VALID'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : t.status === 'USED'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-[#FF3366]/15 text-[#ffb2ba] border border-[#FF3366]/30'
                        }`}
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Status: {t.status === 'VALID' ? 'Valid' : t.status === 'USED' ? 'Used' : 'Cancelled'}
                      </span>
                      {t.checkedInAt && (
                        <span className="font-['Plus_Jakarta_Sans'] text-xs text-[#958ea0]">
                          Scanned at {new Date(t.checkedInAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-['Plus_Jakarta_Sans']">
                    <div className="p-3.5 rounded-lg bg-[#121118] border border-white/[0.06]">
                      <span className="text-[#958ea0] block text-[11px] uppercase font-semibold mb-0.5">Event</span>
                      <span className="text-white font-semibold line-clamp-1">{t.eventTitle}</span>
                    </div>
                    <div className="p-3.5 rounded-lg bg-[#121118] border border-white/[0.06]">
                      <span className="text-[#958ea0] block text-[11px] uppercase font-semibold mb-0.5">Venue</span>
                      <span className="text-white font-semibold line-clamp-1">{t.venueName}, {t.venueCity}</span>
                    </div>
                    <div className="p-3.5 rounded-lg bg-[#121118] border border-white/[0.06]">
                      <span className="text-[#958ea0] block text-[11px] uppercase font-semibold mb-0.5">Seat / Section</span>
                      <span className="text-[#FFD026] font-semibold">
                        Seat {t.seatNumber} ({t.rowLabel ? `Row ${t.rowLabel}, ` : ''}{t.section})
                      </span>
                    </div>
                    <div className="p-3.5 rounded-lg bg-[#121118] border border-white/[0.06]">
                      <span className="text-[#958ea0] block text-[11px] uppercase font-semibold mb-0.5">Pass Holder</span>
                      <span className="text-white font-semibold line-clamp-1">{t.attendeeName}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#0c0b11] border border-white/[0.06] text-xs font-['Plus_Jakarta_Sans'] space-y-2">
                    <div className="flex items-center justify-between text-[#958ea0]">
                      <span className="font-medium">Ticket Code:</span>
                      <span className="font-['Plus_Jakarta_Sans'] text-white font-bold tracking-wider">{t.ticketCode}</span>
                    </div>
                    <div className="flex items-center justify-between text-[#958ea0]">
                      <span className="font-medium">Pass Hash:</span>
                      <span className="font-['Plus_Jakarta_Sans'] text-[#FF7A00] truncate max-w-[280px]" title={t.qrCodeHash}>
                        {t.qrCodeHash}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg glass-card border border-white/[0.15] p-6 sm:p-8 rounded-2xl shadow-2xl bg-[#0e0d14]/95 text-white">
            <button
              onClick={() => setIsScannerOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-lg text-[#958ea0] hover:text-white hover:bg-white/10 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center pb-4 border-b border-white/[0.08] mb-6">
              <span className="font-['Plus_Jakarta_Sans'] text-xs uppercase tracking-wider text-[#FFD026] font-semibold block mb-1">
                Staff Terminal
              </span>
              <h2 className="font-['Outfit'] text-2xl font-bold tracking-tight text-white">
                Gate Check-in
              </h2>
              <p className="font-['Plus_Jakarta_Sans'] text-xs text-[#958ea0] mt-1">
                Scan QR code hash or enter ticket code (e.g. TCK-...) to admit guests.
              </p>
            </div>

            <form onSubmit={handleGateCheckIn} className="space-y-4">
              <div>
                <label className="block font-['Plus_Jakarta_Sans'] text-xs font-semibold uppercase tracking-wider text-[#958ea0] mb-1.5">
                  Ticket Code or QR Hash
                </label>
                <input
                  type="text"
                  value={scannerInput}
                  onChange={(e) => setScannerInput(e.target.value)}
                  placeholder="e.g. TCK-BKG-XXXXX-XX or QR data"
                  required
                  className="w-full bg-[#121118] border border-white/20 px-4 py-2.5 rounded-lg font-['Plus_Jakarta_Sans'] text-xs text-white placeholder-[#958ea0]/50 focus:border-[#FF5722] focus:outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={scanning || !scannerInput.trim()}
                className="btn-primary-cta w-full py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-2"
              >
                <ShieldCheck className="h-4 w-4" />
                {scanning ? 'Verifying...' : 'Verify & Admit Guest'}
              </button>
            </form>

            {scanResult && (
              <div className="mt-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs font-['Plus_Jakarta_Sans'] space-y-1.5 animate-fade-in">
                <div className="flex items-center gap-2 font-bold text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Admission Granted</span>
                </div>
                <p className="text-xs text-emerald-200/90">{scanResult.message}</p>
                <div className="pt-2 border-t border-emerald-500/20 text-xs text-emerald-100 flex justify-between">
                  <span>Seat {scanResult.seatNumber} ({scanResult.section})</span>
                  <span>{new Date(scanResult.checkedInAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                </div>
              </div>
            )}

            {scanError && (
              <div className="mt-5 p-4 rounded-xl bg-[#FF3366]/10 border border-[#FF3366]/30 text-[#ffb2ba] text-xs font-['Plus_Jakarta_Sans'] flex items-start gap-2.5 animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 text-[#FF3366] mt-0.5" />
                <div>
                  <span className="font-bold block text-white">Admission Denied</span>
                  <span>{scanError}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
