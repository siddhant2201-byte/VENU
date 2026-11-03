import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventApi, type EventItem } from '../api/events';
import { CURATED_DOSSIERS } from './Events';
import {
  Calendar,
  PlusCircle,
  ArrowUpRight,
  ArrowDown,
  Clock,
  MapPin,
  Zap,
  Activity,
  QrCode
} from 'lucide-react';

import { useRealtimeEvents } from '../utils/realtimeInventory';

interface VenueHostItem {
  id: string;
  name: string;
  badge: string;
  city: string;
  state: string;
  address: string;
  capacity: number;
  type: string;
  image: string;
  turnstiles: number;
  specs: string[];
  bestFor: string;
  rateTier: string;
  territoryKey: string;
  coords: string;
}

const VENUES_CATALOG: VenueHostItem[] = [
  {
    id: 'jln-stadium-delhi',
    name: 'Jawaharlal Nehru (JLN) Stadium Arena',
    badge: 'DELHI APEX ARENA',
    city: 'New Delhi',
    state: 'Delhi NCR',
    address: 'Pragati Vihar, Lodhi Road, New Delhi',
    capacity: 60000,
    type: 'Olympic-Grade Arena & Stadium Bowl',
    image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80',
    turnstiles: 28,
    specs: ['360° Rigging Trusses', 'RFID Turnstiles', 'Presidential VVIP Bay', 'OB Compound'],
    bestFor: 'Mega Arena Tours • Diljit Dosanjh • Stadium Concerts',
    rateTier: 'Apex Stadium Tier',
    territoryKey: 'DELHI',
    coords: 'IN-DEL-JLN-01',
  },
  {
    id: 'dy-patil-mumbai',
    name: 'DY Patil Grand Arena Stadium',
    badge: 'MUMBAI GRANDSTAND',
    city: 'Navi Mumbai',
    state: 'Maharashtra',
    address: 'Sector 7, Nerul, Navi Mumbai',
    capacity: 55000,
    type: 'Acoustic Shell Cricket & Concert Bowl',
    image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=600&q=80',
    turnstiles: 32,
    specs: ['Acoustic Shell System', 'Symphonic Sound Truss', '32 Gate Corridors', 'Dedicated Helipad'],
    bestFor: 'A.R. Rahman Live • Symphony Orchestras • Global Arena Acts',
    rateTier: 'Apex Stadium Tier',
    territoryKey: 'DYPATIL',
    coords: 'IN-BOM-DYPATIL-02',
  },
  {
    id: 'vagator-beach-goa',
    name: 'Vagator Coastal Festival Arena',
    badge: 'GOA COASTAL APEX',
    city: 'Vagator Beach',
    state: 'Goa',
    address: 'Vagator Cliffside Sands, North Goa',
    capacity: 35000,
    type: 'Open-Air Coastal Amphitheatre',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80',
    turnstiles: 18,
    specs: ['Laser Reflection Grid', 'Dual Mega-Stage Rig', 'VIP Sand Lounges', 'Sunset Viewing Deck'],
    bestFor: 'Sunburn Youth EDM • Multi-Day Electronic Festivals',
    rateTier: 'Coastal Open-Air',
    territoryKey: 'GOA',
    coords: 'IN-GOA-VAGATOR',
  },
  {
    id: 'jio-world-mumbai',
    name: 'Jio World Centre & BKC Pavilions',
    badge: 'BKC HIGH-TECH ARENA',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'G Block, Bandra Kurla Complex (BKC), Mumbai',
    capacity: 18000,
    type: 'Ultra-Modern Pillarless Arena & Pavilion',
    image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80',
    turnstiles: 16,
    specs: ['5G Ingress Network', 'Meyer Sound Rigging', 'Subterranean VIP Bay', 'Diamond Hospitality'],
    bestFor: 'Arijit Singh Symphony • Luxury Premieres • Arena Shows',
    rateTier: 'Convention Apex Tier',
    territoryKey: 'MUMBAI',
    coords: 'IN-MUM-BKC-01',
  },
  {
    id: 'palace-grounds-blr',
    name: 'Palace Grounds (Jayamahal & Gayatri)',
    badge: 'BENGALURU ROYAL ENCLAVE',
    city: 'Bengaluru',
    state: 'Karnataka',
    address: 'Bellary Road, Jayamahal, Bengaluru',
    capacity: 45000,
    type: 'Royal Heritage Open-Air Staging Grounds',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
    turnstiles: 22,
    specs: ['Outdoor Sound Clearance', 'Heavy Truss Staging', 'Tree Canopy Lighting', 'Transit Corridors'],
    bestFor: 'Karan Aujla Arena Tour • Rock Concerts • Tech Expos',
    rateTier: 'Heritage Outdoor Tier',
    territoryKey: 'BENGALURU',
    coords: 'IN-BLR-PALACE',
  },
  {
    id: 'bharat-mandapam-delhi',
    name: 'Bharat Mandapam Plenary Complex',
    badge: 'NATIONAL PLENARY APEX',
    city: 'New Delhi',
    state: 'Delhi NCR',
    address: 'Pragati Maidan, Mathura Road, New Delhi',
    capacity: 12000,
    type: 'Diplomatic Plenary Amphitheatre & Conclave Halls',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80',
    turnstiles: 14,
    specs: ['Keynote Acoustic Dome', 'Diplomatic Security Ingress', 'Wi-Fi 6E Multi-Cell', 'VIP Press Lounges'],
    bestFor: 'India Tech & AI Conclave • Unicorn Summits • Galas',
    rateTier: 'Plenary Diplomatic Tier',
    territoryKey: 'MANDAPAM',
    coords: 'IN-DEL-MANDAPAM-03',
  },
];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const [rawEvents, setRawEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizerTab, setOrganizerTab] = useState<'venues' | 'events'>('venues');

  const events = useRealtimeEvents(rawEvents);

  const isOrganizerOrAdmin = user?.roles?.some(
    (role) =>
      role === 'ROLE_ORGANIZER' ||
      role === 'ROLE_ADMIN' ||
      role === 'ORGANIZER' ||
      role === 'ADMIN'
  );
  const isAttendee = !isOrganizerOrAdmin;

  const scrollToEvents = () => {
    const el = document.getElementById('active-events-portfolio');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    eventApi
      .getMyEvents()
      .then((res) => {
        if (res.success && res.data && res.data.content && res.data.content.length > 0) {
          setRawEvents(res.data.content);
        } else {
          setRawEvents(CURATED_DOSSIERS.slice(0, 6));
        }
      })
      .catch(() => {
        setRawEvents(CURATED_DOSSIERS.slice(0, 6));
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0C] bg-ambient-radial px-6 py-12 text-[#e5e1e4]">
      <div className="mx-auto max-w-7xl space-y-10">

        <div className="glass-card p-8 sm:p-10 border border-white/[0.12] shadow-[0_0_50px_rgba(255,87,34,0.15)] relative overflow-hidden rounded-xl">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF5722] via-[#F59E0B] to-[#FFD026]" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5 mb-3 font-['Plus_Jakarta_Sans'] text-[9.5px]">
                <span className="badge-purple">
                  {user?.roles[0]?.replace('ROLE_', '') || 'ATTENDEE'}
                </span>
              </div>

              <h1 className="font-['Outfit'] text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#FFD026]">
                Dashboard
              </h1>

              <p className="mt-2 font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#958ea0] max-w-2xl leading-relaxed">
                {isAttendee
                  ? `Welcome back, ${user?.fullName || 'Passholder'}. Browse upcoming headline spectacles, access your digital admission passes, and reserve seats.`
                  : `Welcome back, ${user?.fullName || 'Event Administrator'}. Executive overview of verified arenas, stadium logistics, active deployments, and ticketing.`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isOrganizerOrAdmin ? (
                <>
                  <Link
                    to="/events/create"
                    className="btn-primary-cta text-xs py-3 px-6 inline-flex items-center gap-2 shadow-[0_0_24px_rgba(255,87,34,0.45)]"
                  >
                    <PlusCircle className="h-4 w-4" />
                    + HOST AN EVENT
                  </Link>

                  <Link
                    to="/analytics"
                    className="btn-secondary-ghost text-xs py-3 px-5 inline-flex items-center gap-2 border-white/20 text-[#e5e1e4] hover:text-[#FFD026] hover:border-[#FF5722] hover:bg-[#FF5722]/10"
                  >
                    <Activity className="h-4 w-4 text-[#FFD026]" />
                    RUN-OF-SHOW OPS
                  </Link>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={scrollToEvents}
                    className="btn-primary-cta text-xs py-3 px-6 inline-flex items-center gap-2 shadow-[0_0_24px_rgba(255,87,34,0.45)] cursor-pointer"
                  >
                    <Calendar className="h-4 w-4" />
                    BROWSE LIVE EVENTS
                  </button>

                  <Link
                    to="/bookings"
                    className="btn-secondary-ghost text-xs py-3 px-5 inline-flex items-center gap-2 border-white/20 text-[#e5e1e4] hover:text-[#FFD026] hover:border-[#FF5722] hover:bg-[#FF5722]/10"
                  >
                    <QrCode className="h-4 w-4 text-[#FFD026]" />
                    MY PASSES
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Access Action Cards */}
        <div className={`grid grid-cols-1 ${isAttendee ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6`}>
          {isOrganizerOrAdmin ? (
            /* Screenshot 1 Replacement: Host an Event Card for Organizers */
            <Link
              to="/events/create"
              className="text-left w-full glass-card glass-card-hover p-6 flex flex-col justify-between group border border-white/[0.08] rounded-xl transition-all duration-300 hover:border-[#FF5722]/50 hover:shadow-[0_10px_35px_rgba(255,87,34,0.2)]"
            >
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-[#FF5722]/30 bg-[#FF5722]/10 text-[#FF5722] group-hover:bg-[#FF5722]/20 transition">
                  <PlusCircle className="h-6 w-6" />
                </div>
                <h3 className="font-['Outfit'] text-xl font-bold text-white group-hover:text-[#FFD026] transition mb-1">
                  Host an Event
                </h3>
                <p className="font-['Plus_Jakarta_Sans'] text-xs text-[#958ea0] leading-relaxed">
                  Deploy headline arena concerts, stadium spectacles, and tech conclaves with custom multi-tier pass charts and live turnstile sync.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between font-['Plus_Jakarta_Sans'] text-xs font-semibold text-[#FF5722]">
                <span>CREATE NEW EVENT</span>
                <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </Link>
          ) : (
            /* Original Card for Attendees */
            <button
              type="button"
              onClick={scrollToEvents}
              className="text-left w-full glass-card glass-card-hover p-6 flex flex-col justify-between group border border-white/[0.08] rounded-xl transition-all duration-300 hover:border-[#FF5722]/50 hover:shadow-[0_10px_35px_rgba(255,87,34,0.2)] cursor-pointer"
            >
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-[#FF5722]/30 bg-[#FF5722]/10 text-[#FF5722]">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="font-['Outfit'] text-xl font-bold text-white group-hover:text-[#FFD026] transition mb-1">
                  Browse Live Events
                </h3>
                <p className="font-['Plus_Jakarta_Sans'] text-xs text-[#958ea0] leading-relaxed">
                  Explore the top headline events and full curated roster with live Diamond, Platinum, Gold & Silver passes.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between font-['Plus_Jakarta_Sans'] text-xs font-semibold text-[#FF5722]">
                <span>VIEW ACTIVE EVENTS BELOW</span>
                <ArrowDown className="h-3.5 w-3.5 group-hover:translate-y-1 transition-transform" />
              </div>
            </button>
          )}

          {isOrganizerOrAdmin && (
            <Link
              to="/analytics"
              className="glass-card glass-card-hover p-6 flex flex-col justify-between group border border-white/[0.08] rounded-xl transition-all duration-300 hover:border-[#F59E0B]/50 hover:shadow-[0_10px_35px_rgba(245,158,11,0.2)]"
            >
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#FFD026]">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="font-['Outfit'] text-xl font-bold text-white group-hover:text-[#FFD026] transition mb-1">
                  Run-of-Show Ops & Cues
                </h3>
                <p className="font-['Plus_Jakarta_Sans'] text-xs text-[#958ea0] leading-relaxed">
                  Live Director Cue Engine with stage sequence timeline, arena turnstile telemetry, and director overrides.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between font-['Plus_Jakarta_Sans'] text-xs font-semibold text-[#F59E0B]">
                <span>LAUNCH OPS CONSOLE</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          )}

          <Link
            to="/bookings"
            className="glass-card glass-card-hover p-6 flex flex-col justify-between group border border-white/[0.08] rounded-xl transition-all duration-300 hover:border-[#FFD026]/50 hover:shadow-[0_10px_35px_rgba(255,208,38,0.2)]"
          >
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-[#FFD026]/30 bg-[#FFD026]/10 text-[#FFD026]">
                <QrCode className="h-6 w-6" />
              </div>
              <h3 className="font-['Outfit'] text-xl font-bold text-white group-hover:text-[#FFD026] transition mb-1">
                {isAttendee ? 'My Passes & Tickets' : 'Pass Vault & Gate Scanner'}
              </h3>
              <p className="font-['Plus_Jakarta_Sans'] text-xs text-[#958ea0] leading-relaxed">
                {isAttendee
                  ? 'Inspect your confirmed digital admission tickets, seat allocations, and verified turnstile QR codes.'
                  : 'Inspect encrypted digital tickets, seat assignments, and launch the staff gate check-in scanner terminal.'}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between font-['Plus_Jakarta_Sans'] text-xs font-semibold text-[#FFD026]">
              <span>{isAttendee ? 'VIEW MY PASSES' : 'ACCESS PASS VAULT'}</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        </div>

        {/* Screenshot 2 Replacement: In Organizer Mode, display "All Venues to Host an Event" */}
        <div id="active-events-portfolio" className="glass-card p-6 sm:p-8 border border-white/[0.08] rounded-xl scroll-mt-24">
          {isOrganizerOrAdmin ? (
            /* ORGANIZER VIEW: All Venues to Host an Event (with toggle to managed concerts) */
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/[0.08]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-['Plus_Jakarta_Sans'] text-[11px] uppercase tracking-wider text-[#FFD026] font-semibold block">
                      {organizerTab === 'venues' ? 'Verified Arena Infrastructure' : 'Active Events Portfolio'}
                    </span>
                    <span className="badge-purple !text-[8.5px] !py-0.5 !px-2 font-['Plus_Jakarta_Sans'] font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
                      <span className="h-1.5 w-1.5 rounded-[1px] bg-[#A855F7] animate-pulse" />
                      {organizerTab === 'venues' ? 'HOSTING VENUES DIRECTORY' : 'REALTIME INVENTORY ACTIVE'}
                    </span>
                  </div>
                  <h2 className="font-['Outfit'] text-2xl font-bold tracking-tight text-white">
                    {organizerTab === 'venues' ? 'All Venues to Host an Event' : 'Managed Concerts & Events'}
                  </h2>
                  <p className="font-['Plus_Jakarta_Sans'] text-xs text-[#958ea0] mt-1 max-w-2xl">
                    {organizerTab === 'venues'
                      ? 'Pre-configured national stadiums, acoustic shells, and open-air festival grounds equipped with turnstile RFID ingress, high-decibel line arrays, and broadcast compound staging.'
                      : 'Live overview of active scheduled concerts and headline spectacles under your management portfolio.'}
                  </p>
                </div>

                <div className="flex flex-col sm:items-end gap-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOrganizerTab('venues')}
                      className={`font-['Plus_Jakarta_Sans'] text-[10.5px] uppercase font-bold px-3 py-1.5 rounded-[4px] transition-all cursor-pointer ${
                        organizerTab === 'venues'
                          ? 'bg-gradient-to-r from-[#FF5722] to-[#FF7A00] text-white shadow-[0_0_15px_rgba(255,87,34,0.35)]'
                          : 'bg-white/[0.05] text-[#958ea0] hover:text-white border border-white/10'
                      }`}
                    >
                      🏛️ All Venues ({VENUES_CATALOG.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrganizerTab('events')}
                      className={`font-['Plus_Jakarta_Sans'] text-[10.5px] uppercase font-bold px-3 py-1.5 rounded-[4px] transition-all cursor-pointer ${
                        organizerTab === 'events'
                          ? 'bg-gradient-to-r from-[#FF5722] to-[#FF7A00] text-white shadow-[0_0_15px_rgba(255,87,34,0.35)]'
                          : 'bg-white/[0.05] text-[#958ea0] hover:text-white border border-white/10'
                      }`}
                    >
                      📋 Managed Concerts ({events.length})
                    </button>
                  </div>
                  <div className="font-['Plus_Jakarta_Sans'] text-xs text-[#958ea0]">
                    {organizerTab === 'venues' ? (
                      <>
                        Showing: <strong className="text-white font-medium">{VENUES_CATALOG.length} Verified Arenas</strong> • <span className="text-[#FFD026] font-['Plus_Jakarta_Sans'] text-[11px]">225,000+ Total Capacity</span>
                      </>
                    ) : (
                      <>
                        Showing: <strong className="text-white font-medium">{events.length} of 6 Events</strong>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {organizerTab === 'venues' ? (
                /* VENUES DIRECTORY TABLE */
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-['Plus_Jakarta_Sans'] text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-[#958ea0] uppercase text-[9.5px] tracking-wider font-['Plus_Jakarta_Sans']">
                        <th className="pb-3 font-semibold">VENUE & SPECIFICATIONS</th>
                        <th className="pb-3 font-semibold">LOCATION & ENCLOSURE</th>
                        <th className="pb-3 font-semibold">INFRASTRUCTURE & AMENITIES</th>
                        <th className="pb-3 font-semibold">CAPACITY & INGRESS</th>
                        <th className="pb-3 font-semibold text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {VENUES_CATALOG.map((venue) => (
                        <tr key={venue.id} className="hover:bg-white/[0.02] transition group">
                          {/* VENUE & SPECIFICATIONS */}
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={venue.image}
                                alt={venue.name}
                                className="h-14 w-14 rounded-[4px] object-cover shrink-0 border border-white/10 group-hover:border-[#FF5722]/50 transition shadow-sm"
                              />
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-['Plus_Jakarta_Sans'] text-[8.5px] px-1.5 py-0.5 rounded-[2px] bg-[#FF5722]/15 text-[#FF7A00] font-bold border border-[#FF5722]/30">
                                    {venue.badge}
                                  </span>
                                  <span className="font-['Plus_Jakarta_Sans'] text-[8.5px] text-[#958ea0]">
                                    {venue.coords}
                                  </span>
                                </div>
                                <strong className="text-white block font-['Outfit'] text-base font-semibold tracking-tight group-hover:text-[#FFD026] transition">
                                  {venue.name}
                                </strong>
                                <div className="flex items-center gap-2 text-[10.5px] text-[#958ea0] mt-0.5">
                                  <span>{venue.type}</span>
                                  <span>•</span>
                                  <span className="text-[#cbc3d7] font-medium">{venue.rateTier}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* LOCATION & ENCLOSURE */}
                          <td className="py-4 text-[#cbc3d7] pr-4">
                            <div className="flex items-center gap-1.5 font-medium text-white">
                              <MapPin className="h-3.5 w-3.5 text-[#FFD026] shrink-0" />
                              <span>{venue.city}, {venue.state}</span>
                            </div>
                            <span className="text-[10px] text-[#958ea0] block mt-1 leading-snug">
                              {venue.address}
                            </span>
                          </td>

                          {/* INFRASTRUCTURE & AMENITIES */}
                          <td className="py-4 pr-4">
                            <div className="flex flex-wrap gap-1 mb-1.5">
                              {venue.specs.map((spec, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 rounded-[2px] bg-white/[0.06] border border-white/10 text-[#cbc3d7] font-['Plus_Jakarta_Sans'] text-[8.5px] font-medium"
                                >
                                  {spec}
                                </span>
                              ))}
                            </div>
                            <span className="text-[9.5px] text-[#FFD026] block font-['Plus_Jakarta_Sans'] font-medium">
                              ★ {venue.bestFor}
                            </span>
                          </td>

                          {/* CAPACITY & INGRESS */}
                          <td className="py-4 pr-4 min-w-[190px]">
                            <div className="flex items-center justify-between gap-3 text-[11px] mb-1.5">
                              <span className="text-white font-['Outfit'] font-bold text-sm tracking-wide shrink-0">
                                {venue.capacity.toLocaleString('en-IN')} seats
                              </span>
                              <span className="font-['Plus_Jakarta_Sans'] text-[9.5px] text-emerald-400 font-semibold shrink-0 text-right">
                                {venue.turnstiles} RFID Gates
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-white/[0.08] rounded-[2px] overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#FF5722] to-[#FFD026] rounded-[2px]"
                                style={{ width: `${Math.min(100, Math.round((venue.capacity / 60000) * 100))}%` }}
                              />
                            </div>
                            <span className="text-[9.5px] text-[#958ea0] font-['Plus_Jakarta_Sans'] block mt-1">
                              Dual-lane turnstiles configured
                            </span>
                          </td>

                          {/* ACTION */}
                          <td className="py-4 text-right whitespace-nowrap">
                            <Link
                              to={`/events/create?territory=${venue.territoryKey}&venue=${encodeURIComponent(venue.name)}`}
                              className="font-['Plus_Jakarta_Sans'] text-[10.5px] font-bold uppercase tracking-wider py-2 px-3.5 bg-gradient-to-r from-[#FF5722] to-[#FF7A00] text-white hover:brightness-110 rounded-[4px] inline-flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(255,87,34,0.35)]"
                            >
                              <span>HOST AN EVENT</span>
                              <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* MANAGED CONCERTS TABLE (FOR ORGANIZERS WHEN TOGGLED) */
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-['Plus_Jakarta_Sans'] text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-[#958ea0] uppercase text-[9.5px] tracking-wider font-['Plus_Jakarta_Sans']">
                        <th className="pb-3 font-semibold">EVENT & ARENA</th>
                        <th className="pb-3 font-semibold">DATE & TIME</th>
                        <th className="pb-3 font-semibold">TIERED PASS PRICING</th>
                        <th className="pb-3 font-semibold">CAPACITY OCCUPANCY</th>
                        <th className="pb-3 font-semibold text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-[#958ea0]">
                            Loading active spectacles & telemetry...
                          </td>
                        </tr>
                      ) : events.map((evt) => {
                        const available = evt.availableSeats;
                        const total = evt.totalSeats || 15000;
                        const soldPct = evt.soldPct !== undefined ? evt.soldPct : Math.round(((total - available) / total) * 100);

                        return (
                          <tr key={evt.id} className="hover:bg-white/[0.02] transition">
                            <td className="py-4 pr-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={evt.bannerUrl}
                                  alt={evt.title}
                                  className="h-12 w-12 rounded-[4px] object-cover shrink-0 border border-white/10"
                                />
                                <div>
                                  <strong className="text-white block font-['Outfit'] text-base font-semibold tracking-tight">
                                    {evt.title}
                                  </strong>
                                  <div className="flex items-center gap-2 text-[10px] text-[#958ea0] mt-0.5">
                                    <span className="text-[#FFD026] flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {evt.venue?.name || 'Grand Arena'}
                                    </span>
                                    <span>•</span>
                                    <span>{evt.venue?.city || 'India'}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 text-[#cbc3d7]">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-[#FF7A00]" />
                                <span>
                                  {new Date(evt.startTime).toLocaleDateString('en-IN', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </span>
                              </div>
                              <span className="text-[10px] text-[#958ea0] block mt-0.5">
                                {new Date(evt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>

                            <td className="py-4">
                              <div className="flex flex-wrap gap-1">
                                <span className="px-1.5 py-0.5 rounded-[2px] bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-[8.5px] font-bold">
                                  DIAMOND
                                </span>
                                <span className="px-1.5 py-0.5 rounded-[2px] bg-white/10 border border-white/20 text-white text-[8.5px] font-bold">
                                  PLATINUM
                                </span>
                                <span className="px-1.5 py-0.5 rounded-[2px] bg-[#FFD026]/10 border border-[#FFD026]/30 text-[#FFD026] text-[8.5px] font-bold">
                                  GOLD
                                </span>
                                <span className="px-1.5 py-0.5 rounded-[2px] bg-slate-500/20 border border-slate-500/40 text-slate-300 text-[8.5px] font-bold">
                                  SILVER
                                </span>
                              </div>
                              <span className="text-[10px] text-[#958ea0] block mt-1">
                                From ₹{evt.basePrice.toLocaleString('en-IN')}
                              </span>
                            </td>

                            <td className="py-4 min-w-[160px] pr-4">
                              <div className="flex items-center justify-between gap-2 text-[10px] mb-1">
                                <span className="text-white font-semibold shrink-0">{soldPct}% Booked</span>
                                <span className="text-[#958ea0] shrink-0">{available} passes left</span>
                              </div>
                              <div className="h-1.5 w-full max-w-[160px] bg-white/[0.08] rounded-[2px] overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-[#FF5722] to-[#FFD026] rounded-[2px]"
                                  style={{ width: `${soldPct}%` }}
                                />
                              </div>
                            </td>

                            <td className="py-4 text-right">
                              <Link
                                to={`/events/${evt.id}`}
                                className="font-['Plus_Jakarta_Sans'] text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 border border-white/20 hover:border-[#FFD026] hover:text-[#FFD026] inline-flex items-center gap-1 rounded-[4px] transition"
                              >
                                <span>VIEW TELEMETRY</span>
                                <ArrowUpRight className="h-3 w-3" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            /* ATTENDEE VIEW: Active Events Portfolio Table */
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/[0.08]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-['Plus_Jakarta_Sans'] text-[11px] uppercase tracking-wider text-[#FFD026] font-semibold block">
                      Active Events Portfolio
                    </span>
                    <span className="badge-rose !text-[8.5px] !py-0.5 !px-2 font-['Plus_Jakarta_Sans'] font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(255,87,34,0.3)]">
                      <span className="h-1.5 w-1.5 rounded-[1px] bg-[#FF3366] animate-pulse" />
                      REALTIME INVENTORY ACTIVE
                    </span>
                  </div>
                  <h2 className="font-['Outfit'] text-2xl font-bold tracking-tight text-white">
                    Live Concerts & Available Passes
                  </h2>
                </div>

                <div className="font-['Plus_Jakarta_Sans'] text-xs text-[#958ea0]">
                  Showing: <strong className="text-white font-medium">{events.length} of 6 Events</strong>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-['Plus_Jakarta_Sans'] text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-[#958ea0] uppercase text-[9.5px] tracking-wider font-['Plus_Jakarta_Sans']">
                      <th className="pb-3 font-semibold">EVENT & ARENA</th>
                      <th className="pb-3 font-semibold">DATE & TIME</th>
                      <th className="pb-3 font-semibold">TIERED PASS PRICING</th>
                      <th className="pb-3 font-semibold">CAPACITY OCCUPANCY</th>
                      <th className="pb-3 font-semibold text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-[#958ea0]">
                          Loading active spectacles & telemetry...
                        </td>
                      </tr>
                    ) : events.map((evt) => {
                      const available = evt.availableSeats;
                      const total = evt.totalSeats || 15000;
                      const soldPct = evt.soldPct !== undefined ? evt.soldPct : Math.round(((total - available) / total) * 100);

                      return (
                        <tr key={evt.id} className="hover:bg-white/[0.02] transition">
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={evt.bannerUrl}
                                alt={evt.title}
                                className="h-12 w-12 rounded-[4px] object-cover shrink-0 border border-white/10"
                              />
                              <div>
                                <strong className="text-white block font-['Outfit'] text-base font-semibold tracking-tight">
                                  {evt.title}
                                </strong>
                                <div className="flex items-center gap-2 text-[10px] text-[#958ea0] mt-0.5">
                                  <span className="text-[#FFD026] flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {evt.venue?.name || 'Grand Arena'}
                                  </span>
                                  <span>•</span>
                                  <span>{evt.venue?.city || 'India'}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 text-[#cbc3d7]">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-[#FF7A00]" />
                              <span>
                                {new Date(evt.startTime).toLocaleDateString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#958ea0] block mt-0.5">
                              {new Date(evt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>

                          <td className="py-4">
                            <div className="flex flex-wrap gap-1">
                              <span className="px-1.5 py-0.5 rounded-[2px] bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-[8.5px] font-bold">
                                DIAMOND
                              </span>
                              <span className="px-1.5 py-0.5 rounded-[2px] bg-white/10 border border-white/20 text-white text-[8.5px] font-bold">
                                PLATINUM
                              </span>
                              <span className="px-1.5 py-0.5 rounded-[2px] bg-[#FFD026]/10 border border-[#FFD026]/30 text-[#FFD026] text-[8.5px] font-bold">
                                GOLD
                              </span>
                              <span className="px-1.5 py-0.5 rounded-[2px] bg-slate-500/20 border border-slate-500/40 text-slate-300 text-[8.5px] font-bold">
                                SILVER
                              </span>
                            </div>
                            <span className="text-[10px] text-[#958ea0] block mt-1">
                              From ₹{evt.basePrice.toLocaleString('en-IN')}
                            </span>
                          </td>

                          <td className="py-4 min-w-[160px] pr-4">
                            <div className="flex items-center justify-between gap-2 text-[10px] mb-1">
                              <span className="text-white font-semibold shrink-0">{soldPct}% Booked</span>
                              <span className="text-[#958ea0] shrink-0">{available} passes left</span>
                            </div>
                            <div className="h-1.5 w-full max-w-[160px] bg-white/[0.08] rounded-[2px] overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#FF5722] to-[#FFD026] rounded-[2px]"
                                style={{ width: `${soldPct}%` }}
                              />
                            </div>
                          </td>

                          <td className="py-4 text-right">
                            <Link
                              to={`/events/${evt.id}`}
                              className="font-['Plus_Jakarta_Sans'] text-[10.5px] font-bold uppercase tracking-wider py-1.5 px-3 bg-gradient-to-r from-[#FF5722] to-[#FF7A00] text-white hover:brightness-110 rounded-[4px] inline-flex items-center gap-1 transition shadow-[0_0_12px_rgba(255,87,34,0.3)]"
                            >
                              <span>BOOK PASSES</span>
                              <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
