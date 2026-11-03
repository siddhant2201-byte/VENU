import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventApi, type EventItem } from '../api/events';
import {
  MapPin,
  Calendar,
  Ticket,
  ArrowUpRight,
  Sparkles,
  ArrowRight,
  Lock,
  Bell,
  MessageSquare
} from 'lucide-react';
import { HeatmapMatrixWave } from '../components/HeatmapMatrixWave';
import { useRealtimeEvents } from '../utils/realtimeInventory';

export const CURATED_DOSSIERS: EventItem[] = [
  {
    id: 1,
    organizerId: 1,
    organizerName: 'Live Nation & Dil-Luminati India Directorate',
    organizerEmail: 'diljit-tour@venu-platform.com',
    title: 'Diljit Dosanjh — Dil-Luminati Arena India Tour',
    description: "India's biggest stadium concert spectacle. Diljit Dosanjh performing live with 50,000 cheering fans, world-class dancers, high-voltage Punjabi anthems, and massive synchronized pyrotechnics. Tiered Diamond, Platinum, Gold & Silver passes.",
    category: 'CONCERT',
    bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    startTime: '2026-11-14T19:30:00Z',
    endTime: '2026-11-15T00:30:00Z',
    status: 'PUBLISHED',
    totalSeats: 25000,
    availableSeats: 480,
    basePrice: 3999,
    createdAt: '2026-01-05T10:00:00Z',
    venue: {
      id: 101,
      name: 'Jawaharlal Nehru (JLN) Stadium Arena',
      address: 'Pragati Vihar, Lodhi Road',
      city: 'New Delhi',
      capacity: 25000,
    }
  },
  {
    id: 2,
    organizerId: 1,
    organizerName: 'Royal Symphonic Arts Directorate Mumbai',
    organizerEmail: 'ar-rahman@venu-platform.com',
    title: 'A.R. Rahman Live Symphonic Orchestra World Tour',
    description: "The Mozart of Madras performing live with a 100-piece international philharmonic orchestra, world-class visual projection mapping, and legendary cinematic anthems. Exclusive Diamond VIP, Platinum, Gold and Silver tiered passes.",
    category: 'CONCERT',
    bannerUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80',
    startTime: '2026-11-28T19:00:00Z',
    endTime: '2026-11-29T00:00:00Z',
    status: 'PUBLISHED',
    totalSeats: 22000,
    availableSeats: 350,
    basePrice: 2999,
    createdAt: '2026-01-08T10:00:00Z',
    venue: {
      id: 102,
      name: 'DY Patil Grand Arena Stadium',
      address: 'Sector 7, Nerul',
      city: 'Navi Mumbai',
      capacity: 22000,
    }
  },
  {
    id: 3,
    organizerId: 1,
    organizerName: 'Percept Live & Sunburn Directorate',
    organizerEmail: 'sunburn-youth@venu-platform.com',
    title: 'Sunburn Youth EDM & Laser Light Festival 2026',
    description: "India's premier youth electronic music and laser festival on the beach. 4 monumental stages, world-class EDM producers, stunning sunset oceanfront laser shows, and midnight pyrotechnic celebrations. Non-alcoholic youth event with Diamond, Platinum, Gold & Silver passes.",
    category: 'FESTIVAL',
    bannerUrl: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=1200&q=80',
    startTime: '2026-12-29T16:00:00Z',
    endTime: '2027-01-01T02:00:00Z',
    status: 'PUBLISHED',
    totalSeats: 15000,
    availableSeats: 320,
    basePrice: 4499,
    createdAt: '2026-01-10T10:00:00Z',
    venue: {
      id: 103,
      name: 'Vagator Beach Arena',
      address: 'Ozran Beach Road, Vagator',
      city: 'Goa',
      capacity: 15000,
    }
  },
  {
    id: 4,
    organizerId: 1,
    organizerName: 'Live Nation & Royal Strings India',
    organizerEmail: 'arijit-symphony@venu-platform.com',
    title: 'Arijit Singh Soulful Symphony Arena Tour',
    description: "Intimate and soul-stirring arena concert featuring an 80-piece international grand orchestra. Soulful Bollywood anthems, acoustic string sections, and 3D spatial acoustic sound mapping across Diamond, Platinum, Gold & Silver enclosures.",
    category: 'CONCERT',
    bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    startTime: '2026-12-19T19:00:00Z',
    endTime: '2026-12-20T00:30:00Z',
    status: 'PUBLISHED',
    totalSeats: 18000,
    availableSeats: 210,
    basePrice: 2499,
    createdAt: '2026-01-12T10:00:00Z',
    venue: {
      id: 104,
      name: 'Jio World Garden & Pavilions, BKC',
      address: 'Bandra Kurla Complex',
      city: 'Mumbai',
      capacity: 18000,
    }
  },
  {
    id: 5,
    organizerId: 1,
    organizerName: 'Team Karan Aujla & Bengaluru Live',
    organizerEmail: 'karan-aujla@venu-platform.com',
    title: 'Karan Aujla — It Was All A Dream Arena Tour',
    description: "Global Punjabi sensation Karan Aujla live in Bengaluru. Performing smash hits with heavy live brass instruments, Diamond fan pit enclosures, state-of-the-art stage lasers, and numbered tiered Platinum and Gold seating.",
    category: 'CONCERT',
    bannerUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    startTime: '2027-01-10T19:30:00Z',
    endTime: '2027-01-11T01:00:00Z',
    status: 'PUBLISHED',
    totalSeats: 12000,
    availableSeats: 180,
    basePrice: 2199,
    createdAt: '2026-01-15T10:00:00Z',
    venue: {
      id: 105,
      name: 'Palace Grounds, Jayamahal',
      address: 'Bellary Road',
      city: 'Bengaluru',
      capacity: 12000,
    }
  },
  {
    id: 6,
    organizerId: 1,
    organizerName: 'NASSCOM & VENU Enterprise Directorate',
    organizerEmail: 'tech-summit@venu-platform.com',
    title: 'India Tech & AI Unicorn Founders Conclave 2026',
    description: "The premier student, startup, and unicorn founder gathering. Keynote addresses from pioneering AI founders, interactive deep-tech showcase pavilions, student innovator salons, and Diamond delegate roundtables.",
    category: 'TECH',
    bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    startTime: '2027-02-18T18:00:00Z',
    endTime: '2027-02-19T02:00:00Z',
    status: 'PUBLISHED',
    totalSeats: 1200,
    availableSeats: 94,
    basePrice: 4999,
    createdAt: '2026-01-22T10:00:00Z',
    venue: {
      id: 106,
      name: 'Bharat Mandapam, Pragati Maidan',
      address: 'Mathura Road',
      city: 'New Delhi',
      capacity: 1200,
    }
  }
];

export const Events: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const isOrganizerOrAdmin = user?.roles?.some(
    (r) => r === 'ROLE_ORGANIZER' || r === 'ROLE_ADMIN' || r === 'ORGANIZER' || r === 'ADMIN'
  );

  const [backendEvents, setBackendEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const handleEventClick = (eventId: number, eventTitle: string) => {
    if (isOrganizerOrAdmin) {
      navigate('/analytics');
      return;
    }
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: `/events/${eventId}`,
          eventTitle,
        },
      });
    } else {
      navigate(`/events/${eventId}`);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await eventApi.getEvents({ size: 50 });
      if (res.success && res.data) {
        setBackendEvents(res.data.content || []);
      }
    } catch (err) {
      console.warn('Backend events fallback to curated dossiers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const displayEvents = useRealtimeEvents(backendEvents);

  const majorHeadlineEvents: EventItem[] = displayEvents.slice(0, 3);
  const curatedRosterEvents: EventItem[] = displayEvents.slice(3, 6);

  return (
    <div className="bg-[#0A0A0C] text-[#e5e1e4] min-h-screen">

      <section className="relative px-6 pt-24 pb-48 overflow-hidden bg-[#060608] border-b border-white/[0.08]">

        <HeatmapMatrixWave />

        <div className="relative z-10 mx-auto max-w-5xl text-center space-y-7">

          <h1 className="font-['Plus_Jakarta_Sans'] text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight text-white leading-[1.08] drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
            One platform for every <br />
            <span className="font-['Outfit'] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FF5722] via-[#F59E0B] to-[#FFD026] drop-shadow-[0_0_40px_rgba(245,158,11,0.4)]">
              Live Concert & Festival
            </span>
          </h1>

          <p className="font-['Plus_Jakarta_Sans'] text-sm sm:text-base md:text-lg text-[#cbc3d7] max-w-2xl mx-auto leading-relaxed drop-shadow-md font-light">
            Discover, book passes, and experience India’s premier arena concerts, college festivals, symphonies, and tech conclaves with instant dynamic QR entry.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {(!isAuthenticated || isOrganizerOrAdmin) && (
              <Link
                to="/events/create"
                className="btn-primary-cta !text-xs !py-3.5 !px-6 inline-flex items-center gap-2 cursor-pointer"
              >
                <span>HOST AN EVENT</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}

            <a
              href="#spectacles"
              className="btn-solid-white !text-xs !py-3.5 !px-6 inline-flex items-center justify-center cursor-pointer"
            >
              Explore Events
            </a>

            <Link
              to="/announcements"
              className="btn-solid-white !text-xs !py-3.5 !px-6 inline-flex items-center justify-center cursor-pointer"
            >
              Announcements & Reviews
            </Link>
          </div>
        </div>
      </section>

      <section id="spectacles" className="px-6 py-20 border-t border-white/[0.08] bg-gradient-to-b from-[#0A0A0C] via-[#0D0C14] to-[#0A0A0C]">
        <div className="mx-auto max-w-7xl">

          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.08]">
            <div>
              <div className="inline-flex items-center gap-2 badge-gold mb-3 text-[10px]">
                <Sparkles className="h-3 w-3 text-[#FFD026]" />
                <span>MAJOR 3 HEADLINE SPECTACLES • DILJIT • ROYAL SYMPHONY • SUNBURN GOA</span>
              </div>
              <h2 className="font-['Outfit'] text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
                Major Headline Events on VENU
              </h2>
              <p className="mt-2 font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#958ea0] max-w-2xl leading-relaxed">
                India's biggest arena concerts, grand philharmonic symphonies, and beach youth festivals with dynamic Diamond, Platinum, Gold & Silver pass entry.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
            {majorHeadlineEvents.map((evt: EventItem, idx: number) => (
              <div
                key={evt.id}
                onClick={() => handleEventClick(evt.id, evt.title)}
                className="glass-card glass-card-hover flex flex-col justify-between overflow-hidden group border border-white/[0.12] rounded-xl cursor-pointer transition-all duration-300 hover:border-[#FF5722]/60 hover:shadow-[0_15px_45px_rgba(255,87,34,0.25)] relative"
              >

                <div className="relative h-64 overflow-hidden bg-black/70">
                  <img
                    src={evt.bannerUrl}
                    alt={evt.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121118] via-black/40 to-black/30" />

                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between font-['Plus_Jakarta_Sans'] text-[9px]">
                    <span className="badge-gold font-bold px-2.5 py-1">
                      ★ HEADLINE 0{idx + 1}
                    </span>
                    <span className="badge-subtle">
                      {evt.venue?.city ? evt.venue.city.toUpperCase() : 'INDIA'}
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between font-['Plus_Jakarta_Sans']">
                    <span className="badge-rose text-[9.5px]">
                      {evt.category === 'TECH' ? 'DELEGATE & VIP PASSES' : 'DIAMOND, PLATINUM & GOLD PASSES'}
                    </span>
                    <span className="badge-subtle text-[9px] bg-black/70 border border-white/20">
                      {evt.availableSeats} PASSES LEFT
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-['Outfit'] text-2xl font-bold text-white mb-2 leading-snug group-hover:text-[#FFD026] transition">
                      {evt.title}
                    </h3>
                    <p className="font-['Plus_Jakarta_Sans'] text-xs font-light text-[#958ea0] line-clamp-3 leading-relaxed mb-6">
                      {evt.description}
                    </p>

                    <div className="space-y-2.5 font-['Plus_Jakarta_Sans'] text-[11px] text-[#cbc3d7] pt-2 border-t border-white/[0.06]">
                      <div className="flex items-center gap-2.5">
                        <Calendar className="h-4 w-4 text-[#FFD026] shrink-0" />
                        <span>
                          {new Date(evt.startTime).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <MapPin className="h-4 w-4 text-[#FF3366] shrink-0" />
                        <span className="truncate">
                          {evt.venue?.name}, {evt.venue?.city}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-white/[0.08] flex items-center justify-between">
                    <div>
                      <span className="font-['Plus_Jakarta_Sans'] text-[9px] uppercase tracking-wider text-[#958ea0] block">
                        PASSES FROM
                      </span>
                      <span className="font-['Outfit'] text-2xl font-bold text-white">
                        ₹{evt.basePrice.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(evt.id, evt.title);
                      }}
                      className="btn-primary-cta text-xs py-2.5 px-5 flex items-center gap-2 rounded shadow-[0_0_20px_rgba(255,87,34,0.4)] group-hover:scale-105 transition"
                    >
                      {!isAuthenticated && <Lock className="h-3.5 w-3.5 text-white/90" />}
                      <span>{isOrganizerOrAdmin ? 'EVENT TELEMETRY' : isAuthenticated ? 'CLAIM PASS' : 'LOGIN TO BOOK'}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-white/[0.08]">
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="font-['Plus_Jakarta_Sans'] text-[10px] uppercase tracking-[0.2em] text-[#FF7A00] block mb-1">
                  PAN-INDIA EVENT ROSTER // PASSES & ACCESS
                </span>
                <h3 className="font-['Outfit'] text-3xl font-bold tracking-tight text-white">
                  Curated Concerts, Comedy & Heritage Galas
                </h3>
              </div>
              <div className="font-['Plus_Jakarta_Sans'] text-xs text-[#958ea0]">
                TOTAL EVENTS: <strong className="text-white">{curatedRosterEvents.length} SCHEDULED</strong>
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center font-['Plus_Jakarta_Sans'] text-xs text-[#958ea0]">
                AUTHENTICATING EVENT PASS AVAILABILITY...
              </div>
            ) : curatedRosterEvents.length === 0 ? (
              <div className="glass-card p-16 text-center border border-white/[0.08]">
                <Ticket className="h-10 w-10 text-[#FFD026] mx-auto mb-3 opacity-60" />
                <h3 className="font-['Outfit'] text-2xl font-bold text-white mb-2">
                  No upcoming events currently listed
                </h3>
                <p className="font-['Plus_Jakarta_Sans'] text-xs text-[#958ea0] max-w-md mx-auto">
                  Check back shortly for new arena concert and festival passes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {curatedRosterEvents.map((evt: EventItem) => (
                  <div
                    key={evt.id}
                    onClick={() => handleEventClick(evt.id, evt.title)}
                    className="glass-card glass-card-hover flex flex-col justify-between overflow-hidden group border border-white/[0.08] rounded-xl cursor-pointer transition-all hover:border-[#FF5722]/50 hover:shadow-[0_10px_35px_rgba(255,87,34,0.18)]"
                  >
                    <div>

                      <div className="relative h-52 overflow-hidden bg-black/60">
                        <img
                          src={evt.bannerUrl}
                          alt={evt.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#121118] via-transparent to-black/40" />

                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between font-['Plus_Jakarta_Sans'] text-[9px]">
                          <span className="badge-rose">PASS // OP-0{evt.id}</span>
                          <span className="badge-subtle">
                            {evt.venue?.city ? evt.venue.city.toUpperCase() : 'MUMBAI'}
                          </span>
                        </div>

                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between font-['Plus_Jakarta_Sans'] text-[10px] text-white">
                          <span className="badge-subtle text-[9px]">
                            {new Date(evt.startTime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }).toUpperCase()} • {evt.category}
                          </span>
                          <span className="badge-gold">
                            ₹{evt.basePrice.toLocaleString('en-IN')} PASS
                          </span>
                        </div>
                      </div>

                      <div className="p-6">
                        <h3 className="font-['Outfit'] text-xl font-bold text-white mb-2 leading-snug group-hover:text-[#FFD026] transition">
                          {evt.title}
                        </h3>
                        <p className="font-['Plus_Jakarta_Sans'] text-xs font-light text-[#958ea0] line-clamp-3 leading-relaxed mb-5">
                          {evt.description}
                        </p>

                        <div className="space-y-2 font-['Plus_Jakarta_Sans'] text-[11px] text-[#cbc3d7]">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-[#FFD026]" />
                            <span>
                              {new Date(evt.startTime).toLocaleString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-[#FF5722]" />
                            <span className="truncate">
                              {evt.venue?.name}, {evt.venue?.city}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Ticket className="h-3.5 w-3.5 text-[#FFD026]" />
                            <span>
                              {evt.availableSeats} passes available
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 pt-0 border-t border-white/[0.06] mt-4">
                      <div className="pt-4 flex items-center justify-between">
                        <div>
                          <span className="font-['Plus_Jakarta_Sans'] text-[9px] uppercase text-[#958ea0] block">
                            ENTRY PASS
                          </span>
                          <span className="font-['Outfit'] text-lg font-bold text-white">
                            ₹{evt.basePrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(evt.id, evt.title);
                          }}
                          className="btn-primary-cta text-[10px] py-2 px-3.5 flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(255,87,34,0.3)] hover:scale-[1.02] transition"
                        >
                          {!isAuthenticated && <Lock className="h-3 w-3 text-white/90" />}
                          <span>{isOrganizerOrAdmin ? 'EVENT TELEMETRY' : isAuthenticated ? 'CLAIM PASS' : 'LOGIN TO BOOK'}</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Community Announcements & Public Feedback Feature Section */}
      <section className="px-6 py-14 border-t border-white/[0.08] bg-gradient-to-r from-[#0F0E17] via-[#14121E] to-[#0A0A0C]">
        <div className="mx-auto max-w-7xl">
          <div className="glass-card p-8 sm:p-10 rounded-2xl border border-white/10 hover:border-[#FF5722]/40 transition duration-300 relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="badge-gold text-[10px] font-semibold tracking-wider uppercase flex items-center gap-1.5 px-3 py-1">
                    <Bell className="h-3 w-3 text-[#FFD026]" />
                    LIVE PRODUCTION DISPATCHES & AUDIENCE REVIEWS
                  </span>
                </div>
                <h2 className="font-['Outfit'] text-2xl sm:text-4xl font-bold tracking-tight text-white">
                  Stay Informed with Official Notices & Verified Reviews
                </h2>
                <p className="text-xs sm:text-sm text-[#cbc3d7] leading-relaxed">
                  Real-time turnstile advisories, surprise artist soundcheck announcements, and transparent reviews from verified passholders across Diljit Dosanjh, A.R. Rahman, and Sunburn Goa.
                </p>

                <div className="flex flex-wrap items-center gap-6 pt-2 font-['Plus_Jakarta_Sans'] text-xs text-[#958ea0]">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                    Turnstile & Gate Advisories
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#FFD026]"></span>
                    4.9★ Average Sentiment
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#FF5722]"></span>
                    Community Reviews Open
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                <Link
                  to="/announcements"
                  className="btn-primary-cta !text-xs !py-3.5 !px-6 font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/25"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Open Bulletins & Feedbacks</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-12 border-t border-white/[0.08] bg-[#0A0A0C]">
        <div className="mx-auto max-w-7xl">

          <div className="text-center max-w-3xl mx-auto mb-8">
            <span className="font-['Plus_Jakarta_Sans'] text-[10px] uppercase tracking-[0.25em] text-[#FFD026] block mb-2">
              ENTERPRISE & ENTERTAINMENT PARTNERS
            </span>
            <h3 className="font-['Plus_Jakarta_Sans'] text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
              Leading enterprises & entertainment giants stage premier events on VENU
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-6 items-center justify-items-center opacity-70 hover:opacity-100 transition py-6 border-y border-white/[0.06]">

            <div className="flex flex-col items-center group cursor-pointer">
              <span className="font-['Times_New_Roman',serif] text-xl font-bold tracking-[0.28em] text-white/80 group-hover:text-white transition">
                TATA
              </span>
            </div>

            <div className="flex flex-col items-center group cursor-pointer">
              <span className="font-['Plus_Jakarta_Sans'] text-base font-bold italic tracking-tight text-white/80 group-hover:text-white transition">
                Reliance
              </span>
            </div>

            <div className="flex items-center gap-1.5 group cursor-pointer text-white/80 group-hover:text-white transition">
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.306c-.215.353-.674.464-1.027.249-2.81-1.716-6.347-2.105-10.513-1.154-.403.092-.806-.157-.898-.56-.092-.403.157-.806.56-.898 4.564-1.043 8.473-.604 11.63 1.336.353.215.464.674.248 1.027zm1.468-3.262c-.27.441-.849.58-1.29.31-3.216-1.977-8.118-2.548-11.922-1.393-.497.151-1.028-.135-1.179-.632-.151-.497.135-1.028.632-1.179 4.348-1.32 9.756-.684 13.449 1.587.441.27.58.849.31 1.29zm.126-3.41c-3.856-2.29-10.222-2.502-13.887-1.389-.59.18-1.222-.155-1.402-.745-.18-.59.155-1.222.745-1.402 4.215-1.28 11.248-1.034 15.688 1.602.531.315.706 1.004.391 1.535-.315.531-1.004.706-1.535.391z"/>
              </svg>
              <span className="font-['Plus_Jakarta_Sans'] text-sm font-bold tracking-tight">Spotify</span>
            </div>

            <div className="flex items-center gap-1.5 group cursor-pointer text-white/80 group-hover:text-white transition">
              <span className="font-['Plus_Jakarta_Sans'] text-sm font-extrabold tracking-tighter uppercase">Red Bull</span>
            </div>

            <div className="flex flex-col items-center group cursor-pointer">
              <span className="font-['Plus_Jakarta_Sans'] text-base font-black italic tracking-tighter text-white/80 group-hover:text-white transition">
                zomato <span className="font-light text-[10px] tracking-widest uppercase not-italic">LIVE</span>
              </span>
            </div>

            <div className="flex flex-col items-center group cursor-pointer">
              <span className="font-['Plus_Jakarta_Sans'] text-xs font-black tracking-tight text-white/80 group-hover:text-white transition">
                book<span className="text-[#FF3366]">my</span>show
              </span>
            </div>

            <div className="flex flex-col items-center group cursor-pointer">
              <span className="font-['Plus_Jakarta_Sans'] text-xs font-bold tracking-[0.2em] uppercase text-white/80 group-hover:text-white transition">
                Mahindra
              </span>
            </div>

            <div className="flex flex-col items-center group cursor-pointer">
              <span className="font-['Plus_Jakarta_Sans'] text-xs font-black tracking-[0.25em] uppercase text-white/80 group-hover:text-white transition">
                SUNBURN
              </span>
            </div>

            <div className="flex flex-col items-center group cursor-pointer">
              <span className="font-serif italic text-sm font-extrabold tracking-wide text-white/80 group-hover:text-white transition">
                Budweiser
              </span>
            </div>

            <div className="flex flex-col items-center group cursor-pointer">
              <span className="font-['Plus_Jakarta_Sans'] text-base font-bold lowercase tracking-tight text-white/80 group-hover:text-white transition">
                airtel
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 border-t border-white/[0.08] bg-[#07070a]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 pb-6 border-b border-white/[0.08]">
            <span className="font-['Plus_Jakarta_Sans'] text-[10px] uppercase tracking-[0.2em] text-[#FFD026] block mb-1">
              PAN-INDIA CIRCUIT // 28+ METRO HUBS
            </span>
            <h2 className="font-['Outfit'] text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
              Premier Venues & Production Excellence Across India
            </h2>
            <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#958ea0] max-w-2xl leading-relaxed">
              From heritage royal palace courtyards in Rajasthan to 60,000-capacity arena concerts in Mumbai, Bengaluru, and New Delhi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="glass-card overflow-hidden border border-white/[0.08] group hover:border-[#FF5722]/50 transition duration-300">
              <div className="h-48 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80"
                  alt="Mumbai Metro Arena"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121118] via-black/20 to-transparent" />
                <span className="absolute bottom-3 left-3 badge-purple text-[9px]">
                  HUB 01 // MAHARASHTRA
                </span>
                <span className="absolute top-3 right-3 badge-subtle text-[9px]">
                  180,000+ PASSES
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-['Outfit'] text-xl font-bold text-white mb-1 group-hover:text-[#FF7A00] transition">
                  Mumbai • BKC & Marine Drive
                </h3>
                <p className="font-['Plus_Jakarta_Sans'] text-xs text-[#958ea0]">
                  Jio World Garden, NSCI Dome & MMRDA Mega Grounds. Symphonic orchestra tours, international arena concerts, and VIP film galas.
                </p>
              </div>
            </div>

            <div className="glass-card overflow-hidden border border-white/[0.08] group hover:border-[#F59E0B]/50 transition duration-300">
              <div className="h-48 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80"
                  alt="Delhi Conclave Grounds"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121118] via-black/20 to-transparent" />
                <span className="absolute bottom-3 left-3 badge-gold text-[9px]">
                  HUB 02 // NATIONAL CAPITAL
                </span>
                <span className="absolute top-3 right-3 badge-subtle text-[9px]">
                  145,000+ PASSES
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-['Outfit'] text-xl font-bold text-white mb-1 group-hover:text-[#FFD026] transition">
                  Delhi-NCR • Bharat Mandapam
                </h3>
                <p className="font-['Plus_Jakarta_Sans'] text-xs text-[#958ea0]">
                  Bharat Mandapam & JLN Stadium Arena. State technology summits, unicorn leadership conclaves, and stadium music festivals.
                </p>
              </div>
            </div>

            <div className="glass-card overflow-hidden border border-white/[0.08] group hover:border-[#FF5722]/50 transition duration-300">
              <div className="h-48 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80"
                  alt="Goa & Jaipur Heritage Arenas"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121118] via-black/20 to-transparent" />
                <span className="absolute bottom-3 left-3 badge-rose text-[9px]">
                  HUB 03 // HERITAGE & FESTIVALS
                </span>
                <span className="absolute top-3 right-3 badge-subtle text-[9px]">
                  210,000+ PASSES
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-['Outfit'] text-xl font-bold text-white mb-1 group-hover:text-[#FFD026] transition">
                  Bengaluru, Goa & Jaipur
                </h3>
                <p className="font-['Plus_Jakarta_Sans'] text-xs text-[#958ea0]">
                  Palace Grounds Bengaluru, Vagator Beach Goa & Rambagh Palace Jaipur. Sunburn Beach Arenas, unplugged acoustic concerts, and youth music festivals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
