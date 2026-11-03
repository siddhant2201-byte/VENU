import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { eventApi } from '../api/events';
import { broadcastInventoryChange } from '../utils/realtimeInventory';
import {
  ShieldCheck,
  CheckCircle2,
  MapPin,
  AlertCircle,
  Ticket,
  Plus,
  Trash2,
  Copy,
  Utensils,
  GraduationCap
} from 'lucide-react';

export interface PassTierConfig {
  id: string;
  name: string;
  category: 'DIAMOND' | 'PLATINUM' | 'GOLD' | 'SILVER' | 'STUDENT';
  badge: string;
  tier: 'SOVEREIGN' | 'DIPLOMATIC' | 'ROYAL';
  color: string;
  price: number;
  hasMealVoucher: boolean;
  voucherAmount: number;
  voucherDescription: string;
  guestsPerPass: number;
  quota: number;
  perks: string;
  entryGuidelines: string;
}

interface Archetype {
  id: string;
  code: string;
  title: string;
  description: string;
  badge: string;
  image: string;
  category: string;
  defaultPrice: number;
  defaultPreset: 'CONCERT' | 'COLLEGE' | 'FESTIVAL' | 'CONCLAVE' | 'SYMPHONY' | 'COMEDY';
}

const ARCHETYPES: Archetype[] = [
  {
    id: 'concert',
    code: 'ARCHETYPE // 001',
    title: 'Stadium Arena Concert & Tour',
    description: 'Multi-tiered arena staging, line-array concert acoustics, 360° runway catwalk, stage pyrotechnics, and multi-lane RFID turnstiles.',
    badge: 'STADIUM ARENA APEX',
    image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=800&q=80',
    category: 'CONCERT',
    defaultPrice: 2999,
    defaultPreset: 'CONCERT',
  },
  {
    id: 'college_fest',
    code: 'ARCHETYPE // 002',
    title: 'Inter-College Cultural & Battle of Bands Fest',
    description: 'Premier university and inter-college mega festival. High-voltage rock & indie bands, dance face-offs, tech hackathons, and youth concert arenas.',
    badge: 'INTER-COLLEGE SPECIAL',
    image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80',
    category: 'COLLEGE_FEST',
    defaultPrice: 999,
    defaultPreset: 'COLLEGE',
  },
  {
    id: 'festival',
    code: 'ARCHETYPE // 003',
    title: 'Youth Open-Air EDM & Laser Light Festival',
    description: 'Non-alcoholic open-air youth music and light festival. 4 massive stages, international laser arrays, food truck promenades, and synchronized light spectacles.',
    badge: 'YOUTH FESTIVAL APEX',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
    category: 'MUSIC_FESTIVAL',
    defaultPrice: 3499,
    defaultPreset: 'FESTIVAL',
  },
  {
    id: 'tech_conclave',
    code: 'ARCHETYPE // 004',
    title: 'National Tech & AI Innovation Conclave',
    description: 'Plenary keynote auditoriums, student innovator showcases, investor salons, bilateral founder panels, and hands-on AI technology pavilions.',
    badge: 'TECH & AI CONCLAVE',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    category: 'TECH_CONCLAVE',
    defaultPrice: 4999,
    defaultPreset: 'CONCLAVE',
  },
  {
    id: 'symphony',
    code: 'ARCHETYPE // 005',
    title: 'Royal Philharmonic & Classical Symphony',
    description: 'Acoustic hall orchestral concert with a 100-piece grand philharmonic ensemble. Majestic string sections, brass movements, and pure acoustic sound staging.',
    badge: 'PHILHARMONIC SYMPHONY',
    image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80',
    category: 'HERITAGE_GALA',
    defaultPrice: 2800,
    defaultPreset: 'SYMPHONY',
  },
  {
    id: 'comedy',
    code: 'ARCHETYPE // 006',
    title: 'Standup Comedy & Cultural Theatre Special',
    description: 'Proscenium auditorium theater, numbered tiered seating, classic comedy punchlines, storytelling, and green-room artist access.',
    badge: 'LIVE COMEDY SPECIAL',
    image: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=800&q=80',
    category: 'STANDUP_COMEDY',
    defaultPrice: 899,
    defaultPreset: 'COMEDY',
  },
];

const TERRITORIES = [
  {
    id: 'DELHI',
    name: 'Jawaharlal Nehru (JLN) Stadium Arena',
    sub: 'Lodhi Road Olympic Arena',
    badge: 'DELHI APEX ARENA',
    city: 'New Delhi',
    coords: 'IN-DEL-JLN-01',
    basin: 'Olympic-Grade Arena & Stadium Bowl',
    details: 'Capacity for 60,000+ stadium spectators, 360° rigging trusses, multi-lane RFID turnstiles, and direct metro connectivity.',
    image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'DYPATIL',
    name: 'DY Patil Grand Arena Stadium',
    sub: 'Navi Mumbai Grandstand',
    badge: 'MUMBAI GRANDSTAND',
    city: 'Navi Mumbai',
    coords: 'IN-BOM-DYPATIL-02',
    basin: 'Acoustic Shell Cricket & Concert Bowl',
    details: 'Capacity for 55,000+ spectators with acoustic shell optimization, symphonic sound truss, 32 gate turnstiles, and dedicated helipad.',
    image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'MUMBAI',
    name: 'Jio World Centre & Pavilions',
    sub: 'BKC Grand Arena',
    badge: 'MUMBAI ARENA',
    city: 'Mumbai',
    coords: 'IN-MUM-BKC-01',
    basin: 'Grand Arena Bowl & Convention Halls',
    details: 'Capacity for 18,000+ attendees with multi-lane RFID turnstiles, student entry corridors, and direct suburban transit links.',
    image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'BENGALURU',
    name: 'Palace Grounds',
    sub: 'Jayamahal Royal Enclave',
    badge: 'HERITAGE TECH BELT',
    city: 'Bengaluru',
    coords: 'IN-BLR-PALACE',
    basin: 'Open-Air Amphitheatre & Tree Canopy',
    details: 'Sprawling grass lawns for open-air acoustic tours, collegiate summits, and dual-stage music festival scenography.',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'GOA',
    name: 'Vagator Coastal Arena',
    sub: 'Arabian Sea Shoreline',
    badge: 'FESTIVAL APEX',
    city: 'Goa',
    coords: 'IN-GOA-VAGATOR',
    basin: 'Vagator Beach Arena & Sunset Decks',
    details: 'Dual festival mega-stages, oceanfront laser reflection coordinates, and dedicated youth festival pavilions.',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'MANDAPAM',
    name: 'Bharat Mandapam Plenary Complex',
    sub: 'Pragati Maidan IECC',
    badge: 'NATIONAL PLENARY APEX',
    city: 'New Delhi',
    coords: 'IN-DEL-MANDAPAM-03',
    basin: 'Plenary Keynote Amphitheatre & Conclave Halls',
    details: 'Capacity for 12,000+ delegates with diplomatic security ingress, Wi-Fi 6E multi-cell, and broadcast compound staging.',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'UDAIPUR',
    name: 'Jagmandir Island Palace Grounds',
    sub: 'Lake Pichola Enclave',
    badge: 'HERITAGE SYMPHONY',
    city: 'Udaipur',
    coords: 'IN-UDR-JAGMANDIR',
    basin: 'Island Marble Courtyard & Mewar Lawns',
    details: 'Royal boat jetty ingress, candlelit 17th-century marble chhatris, and open-air acoustic classical amphitheatre.',
    image: 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=400&q=80',
  },
];

const PASS_PRESETS: Record<string, PassTierConfig[]> = {
  CONCERT: [
    {
      id: 'tier-con-1',
      name: 'Diamond VIP Apex Pass (Front Row & Soundcheck)',
      category: 'DIAMOND',
      badge: 'DIAMOND VIP',
      tier: 'SOVEREIGN',
      color: '#00F0FF',
      price: 6999,
      hasMealVoucher: true,
      voucherAmount: 1000,
      voucherDescription: 'Complimentary gourmet dinner buffet & mocktail refreshments',
      guestsPerPass: 1,
      quota: 400,
      perks: 'Front-row ramp access • Backstage soundcheck entry • Official tour merchandise bundle',
      entryGuidelines: 'Priority Gate 1 RFID ingress • Souvenir laminate wristband',
    },
    {
      id: 'tier-con-2',
      name: 'Platinum Premium Reserved Pass (Elevated Bay)',
      category: 'PLATINUM',
      badge: 'PLATINUM PASS',
      tier: 'SOVEREIGN',
      color: '#E2E8F0',
      price: 4499,
      hasMealVoucher: true,
      voucherAmount: 500,
      voucherDescription: 'Gourmet meal box & refreshment voucher included',
      guestsPerPass: 1,
      quota: 800,
      perks: 'Numbered elevated tiered seating • Pristine stage sightlines • Fast-track turnstile',
      entryGuidelines: 'Direct escalator & elevator bay access',
    },
    {
      id: 'tier-con-3',
      name: 'Gold Circle Grandstand Pass (Priority Seated)',
      category: 'GOLD',
      badge: 'GOLD PASS',
      tier: 'DIPLOMATIC',
      color: '#FFD026',
      price: 2999,
      hasMealVoucher: false,
      voucherAmount: 0,
      voucherDescription: 'Food truck court access',
      guestsPerPass: 1,
      quota: 1500,
      perks: 'Reserved lower grandstand seat • Stereo acoustic clarity • Souvenir tour lanyard',
      entryGuidelines: 'Numbered seat allocated upon digital check-in',
    },
  ],
  COLLEGE: [
    {
      id: 'tier-col-1',
      name: 'Diamond All-Access Fest Pass',
      category: 'DIAMOND',
      badge: 'DIAMOND VIP',
      tier: 'SOVEREIGN',
      color: '#00F0FF',
      price: 2999,
      hasMealVoucher: true,
      voucherAmount: 600,
      voucherDescription: 'All-day festival canteen & cafeteria buffet voucher',
      guestsPerPass: 1,
      quota: 300,
      perks: 'Access to all cultural stages, battle of bands, and VIP pro-night front row',
      entryGuidelines: 'Fast-track fest badge issued at registration desk',
    },
    {
      id: 'tier-col-2',
      name: 'Platinum Concert & Pro-Night Pass',
      category: 'PLATINUM',
      badge: 'PLATINUM PASS',
      tier: 'SOVEREIGN',
      color: '#E2E8F0',
      price: 1999,
      hasMealVoucher: false,
      voucherAmount: 0,
      voucherDescription: 'Campus snack coupon included',
      guestsPerPass: 1,
      quota: 600,
      perks: 'Priority enclosure for evening celebrity pro-night and headline band',
      entryGuidelines: 'Open to college attendees and verified guests',
    },
    {
      id: 'tier-col-3',
      name: 'Gold Cultural & Competition Pass',
      category: 'GOLD',
      badge: 'GOLD PASS',
      tier: 'DIPLOMATIC',
      color: '#FFD026',
      price: 1199,
      hasMealVoucher: false,
      voucherAmount: 0,
      voucherDescription: 'Food truck village access',
      guestsPerPass: 1,
      quota: 1000,
      perks: 'Full access to inter-college dance, drama, quiz, and music face-offs',
      entryGuidelines: 'Valid for all 3 festival days',
    },
  ],
  FESTIVAL: [
    {
      id: 'tier-fest-1',
      name: 'Diamond VIP 3-Day Sunset Pass',
      category: 'DIAMOND',
      badge: 'DIAMOND VIP',
      tier: 'SOVEREIGN',
      color: '#00F0FF',
      price: 7999,
      hasMealVoucher: true,
      voucherAmount: 1500,
      voucherDescription: '3-Day food court cashless wristband voucher included',
      guestsPerPass: 1,
      quota: 300,
      perks: 'Elevated VIP sunset viewing deck • Air-conditioned rest lounge • Express lanes',
      entryGuidelines: 'RFID fabric wristband issued at festival box office',
    },
    {
      id: 'tier-fest-2',
      name: 'Platinum 3-Day Multi-Stage Pass',
      category: 'PLATINUM',
      badge: 'PLATINUM PASS',
      tier: 'SOVEREIGN',
      color: '#E2E8F0',
      price: 5499,
      hasMealVoucher: false,
      voucherAmount: 0,
      voucherDescription: 'Festival food village access',
      guestsPerPass: 1,
      quota: 600,
      perks: 'Full 3-day access to all 4 electronic & laser music stages',
      entryGuidelines: 'Priority Gate 2 admission',
    },
    {
      id: 'tier-fest-3',
      name: 'Gold 3-Day General Festival Pass',
      category: 'GOLD',
      badge: 'GOLD PASS',
      tier: 'DIPLOMATIC',
      color: '#FFD026',
      price: 3499,
      hasMealVoucher: false,
      voucherAmount: 0,
      voucherDescription: 'Beachside food court access',
      guestsPerPass: 1,
      quota: 1200,
      perks: '3-Day festival grounds admission and laser light shows',
      entryGuidelines: 'Wristband required for gate re-entry',
    },
  ],
  CONCLAVE: [
    {
      id: 'tier-tech-1',
      name: 'Diamond Founder & Investor VIP Pass',
      category: 'DIAMOND',
      badge: 'DIAMOND VIP',
      tier: 'SOVEREIGN',
      color: '#00F0FF',
      price: 8999,
      hasMealVoucher: true,
      voucherAmount: 2000,
      voucherDescription: 'Executive networking luncheon & high-tea banquet included',
      guestsPerPass: 1,
      quota: 200,
      perks: 'Closed-door investor roundtables, keynote front rows, and VIP speaker salon',
      entryGuidelines: 'Verified Founder or Executive pass credential',
    },
    {
      id: 'tier-tech-2',
      name: 'Platinum Full Conclave Delegate Pass',
      category: 'PLATINUM',
      badge: 'PLATINUM PASS',
      tier: 'SOVEREIGN',
      color: '#E2E8F0',
      price: 5999,
      hasMealVoucher: true,
      voucherAmount: 1000,
      voucherDescription: 'Catered delegate lunch and tea breaks',
      guestsPerPass: 1,
      quota: 400,
      perks: 'Full plenary keynote access, AI research pavilions, and speed-networking salons',
      entryGuidelines: 'Business Formals / Smart Casuals',
    },
    {
      id: 'tier-tech-3',
      name: 'Gold Keynote & Innovation Expo Pass',
      category: 'GOLD',
      badge: 'GOLD PASS',
      tier: 'DIPLOMATIC',
      color: '#FFD026',
      price: 3499,
      hasMealVoucher: false,
      voucherAmount: 0,
      voucherDescription: 'Conclave food court promenade access',
      guestsPerPass: 1,
      quota: 600,
      perks: 'Main auditorium keynote entry and interactive startup demo expo',
      entryGuidelines: 'Fast-track digital badge verification',
    },
  ],
  SYMPHONY: [
    {
      id: 'tier-sym-1',
      name: 'Diamond Royal Philharmonic Patron Pass',
      category: 'DIAMOND',
      badge: 'DIAMOND VIP',
      tier: 'SOVEREIGN',
      color: '#00F0FF',
      price: 7500,
      hasMealVoucher: true,
      voucherAmount: 1200,
      voucherDescription: '5-Star dinner buffet & artisan refreshments during intermission',
      guestsPerPass: 1,
      quota: 150,
      perks: 'Prime center orchestra stalls • Meet & greet with lead maestro • Program booklet',
      entryGuidelines: 'Formal / Traditional Festive Attire',
    },
    {
      id: 'tier-sym-2',
      name: 'Platinum Central Tier Pass',
      category: 'PLATINUM',
      badge: 'PLATINUM PASS',
      tier: 'SOVEREIGN',
      color: '#E2E8F0',
      price: 4500,
      hasMealVoucher: false,
      voucherAmount: 0,
      voucherDescription: 'Intermission refreshment counter access',
      guestsPerPass: 1,
      quota: 300,
      perks: 'Numbered elevated central balcony seats with impeccable acoustic resonance',
      entryGuidelines: 'Direct usher escort to central bay',
    },
    {
      id: 'tier-sym-3',
      name: 'Gold Lower Stalls Seated Pass',
      category: 'GOLD',
      badge: 'GOLD PASS',
      tier: 'DIPLOMATIC',
      color: '#FFD026',
      price: 2800,
      hasMealVoucher: false,
      voucherAmount: 0,
      voucherDescription: 'Grand foyer concession access',
      guestsPerPass: 1,
      quota: 500,
      perks: 'Reserved acoustic stalls seating with complete view of the orchestra',
      entryGuidelines: 'Doors lock 10 minutes prior to first symphony movement',
    },
  ],
  COMEDY: [
    {
      id: 'tier-com-1',
      name: 'Diamond Front Row Laugh Pass',
      category: 'DIAMOND',
      badge: 'DIAMOND VIP',
      tier: 'SOVEREIGN',
      color: '#00F0FF',
      price: 2499,
      hasMealVoucher: true,
      voucherAmount: 400,
      voucherDescription: 'Gourmet snack combo (popcorn + artisan sodas) included',
      guestsPerPass: 1,
      quota: 120,
      perks: 'Rows A-C prime stage proximity • Direct artist interaction zone • Green-room photo-op',
      entryGuidelines: 'Seated strictly 15 minutes before show recording begins',
    },
    {
      id: 'tier-com-2',
      name: 'Platinum Prime Center Seated Pass',
      category: 'PLATINUM',
      badge: 'PLATINUM PASS',
      tier: 'SOVEREIGN',
      color: '#E2E8F0',
      price: 1799,
      hasMealVoucher: false,
      voucherAmount: 0,
      voucherDescription: 'Auditorium snack bar voucher',
      guestsPerPass: 1,
      quota: 250,
      perks: 'Prime center view seats • Balanced auditorium acoustics • Priority entrance',
      entryGuidelines: 'Direct entry via Gate 1',
    },
    {
      id: 'tier-com-3',
      name: 'Gold Grand Balcony Pass',
      category: 'GOLD',
      badge: 'GOLD PASS',
      tier: 'DIPLOMATIC',
      color: '#FFD026',
      price: 1299,
      hasMealVoucher: false,
      voucherAmount: 0,
      voucherDescription: 'Foyer refreshment stall access',
      guestsPerPass: 1,
      quota: 350,
      perks: 'Reserved tiered balcony seating with unobstructed sightline',
      entryGuidelines: 'Numbered seat allocated upon arrival',
    },
  ],
};

export const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [selectedArchetype, setSelectedArchetype] = useState<Archetype>(ARCHETYPES[0]);

  const [selectedTerritory, setSelectedTerritory] = useState(TERRITORIES[0]);

  useEffect(() => {
    const territoryParam = searchParams.get('territory');
    const venueParam = searchParams.get('venue');
    if (territoryParam) {
      const match = TERRITORIES.find(
        (t) =>
          t.id.toLowerCase() === territoryParam.toLowerCase() ||
          t.city.toLowerCase() === territoryParam.toLowerCase()
      );
      if (match) {
        setSelectedTerritory(match);
        setEventTitle(`${selectedArchetype.title} — ${match.name}`);
      }
    } else if (venueParam) {
      const decoded = decodeURIComponent(venueParam).toLowerCase();
      const match = TERRITORIES.find(
        (t) =>
          t.name.toLowerCase().includes(decoded) ||
          decoded.includes(t.name.toLowerCase()) ||
          t.sub.toLowerCase().includes(decoded)
      );
      if (match) {
        setSelectedTerritory(match);
        setEventTitle(`${selectedArchetype.title} — ${match.name}`);
      }
    }
  }, [searchParams]);

  const [passTiers, setPassTiers] = useState<PassTierConfig[]>(PASS_PRESETS.CONCERT);

  const [eventTitle, setEventTitle] = useState('Diljit Dosanjh — Dil-Luminati Arena India Tour');
  const [eventCategory, setEventCategory] = useState('CONCERT');
  const [eventBannerUrl, setEventBannerUrl] = useState(ARCHETYPES[0].image);
  const [timeframe, setTimeframe] = useState('2026-12-18T19:30');
  const [endTimeframe, setEndTimeframe] = useState('2026-12-18T23:30');

  const [organizerTitle, setOrganizerTitle] = useState('Student Affairs & Cultural Secretary');
  const [productionCompany, setProductionCompany] = useState('VENU Youth Entertainment & Arts Council');
  const [contactLine, setContactLine] = useState('+91 98200 12345 // Event Helpdesk');
  const [eventDirectives, setEventDirectives] = useState(
    'Dual-lane RFID turnstiles configured. Student ID verification checkpoint at Gate 4. Food court meal vouchers active across all partner counters.'
  );
  const [licensingApproved, setLicensingApproved] = useState(true);

  const [venueId, setVenueId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePresetKey, setActivePresetKey] = useState<string>('CONCERT');

  useEffect(() => {
    eventApi
      .getVenues()
      .then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          setVenueId(res.data[0].id);
        }
      })
      .catch((err) => {
        console.warn('Venues load silent error', err);
      });
  }, []);

  const handleSelectArchetype = (arch: Archetype) => {
    setSelectedArchetype(arch);
    setEventTitle(`${arch.title} — ${selectedTerritory.name}`);
    setEventCategory(arch.category);
    setEventBannerUrl(arch.image);
    setActivePresetKey(arch.defaultPreset);
    if (PASS_PRESETS[arch.defaultPreset]) {
      setPassTiers(JSON.parse(JSON.stringify(PASS_PRESETS[arch.defaultPreset])));
    }
  };

  const handleApplyPreset = (presetKey: string) => {
    setActivePresetKey(presetKey);
    if (PASS_PRESETS[presetKey]) {
      setPassTiers(JSON.parse(JSON.stringify(PASS_PRESETS[presetKey])));
    }
  };

  const handleAddPassTier = () => {
    const newTier: PassTierConfig = {
      id: `tier-custom-${Date.now()}`,
      name: 'Custom Tier Pass',
      category: 'GOLD',
      badge: 'GOLD PASS',
      tier: 'DIPLOMATIC',
      color: '#FFD026',
      price: 1999,
      hasMealVoucher: false,
      voucherAmount: 0,
      voucherDescription: 'Food court refreshment access',
      guestsPerPass: 1,
      quota: 250,
      perks: 'Priority admission • Digital pass with QR code • Reserved seating',
      entryGuidelines: 'Valid photo ID required at the gate',
    };
    setPassTiers([...passTiers, newTier]);
  };

  const handleDuplicateTier = (tier: PassTierConfig) => {
    const duplicated: PassTierConfig = {
      ...tier,
      id: `tier-custom-${Date.now()}`,
      name: `${tier.name} (Copy)`,
    };
    setPassTiers([...passTiers, duplicated]);
  };

  const handleRemoveTier = (tierId: string) => {
    if (passTiers.length <= 1) {
      alert('At least one Pass Tier is required for event issuance.');
      return;
    }
    setPassTiers(passTiers.filter((t) => t.id !== tierId));
  };

  const handleUpdateTier = (id: string, updates: Partial<PassTierConfig>) => {
    setPassTiers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const totalPassQuota = passTiers.reduce((acc, t) => acc + (Number(t.quota) || 0), 0);
  const totalGrossRevenue = passTiers.reduce(
    (acc, t) => acc + (Number(t.price) || 0) * (Number(t.quota) || 0),
    0
  );
  const minPrice = passTiers.length > 0 ? Math.min(...passTiers.map((t) => t.price)) : 0;
  const maxPrice = passTiers.length > 0 ? Math.max(...passTiers.map((t) => t.price)) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const passTiersPayloadMarker = `\n\n__VENU_PASS_TIERS__:${JSON.stringify(passTiers)}`;
      const fullDescription = `${selectedArchetype.description} Staged at ${selectedTerritory.name}, ${selectedTerritory.city}. Directives: ${eventDirectives}${passTiersPayloadMarker}`;

      const payload = {
        venueId: venueId || null,
        title: eventTitle.trim() || `${selectedArchetype.title} — ${selectedTerritory.name}`,
        description: fullDescription,
        category: eventCategory || selectedArchetype.category,
        bannerUrl: eventBannerUrl || selectedArchetype.image,
        startTime: timeframe.length === 16 ? `${timeframe}:00Z` : timeframe,
        endTime: endTimeframe.length === 16 ? `${endTimeframe}:00Z` : endTimeframe,
        basePrice: minPrice || 1499,
        generateSeats: true,
        rows: Math.max(6, Math.ceil(totalPassQuota / 100)),
        seatsPerRow: 12,
      };

      let newEventId = 1;
      const res = await eventApi.createEvent(payload).catch((err) => {
        console.warn('Backend createEvent caught, using local mock persistence', err);
        return null;
      });

      if (res && res.success && res.data) {
        newEventId = res.data.id;
        try {
          await eventApi.publishEvent(newEventId);
        } catch (e) {}
      } else {
        newEventId = Date.now();
      }

      localStorage.setItem(`venu_custom_event_tiers_${newEventId}`, JSON.stringify(passTiers));
      localStorage.setItem(
        `venu_custom_event_meta_${newEventId}`,
        JSON.stringify({
          id: newEventId,
          title: payload.title,
          description: payload.description,
          category: payload.category,
          bannerUrl: payload.bannerUrl,
          startTime: payload.startTime,
          endTime: payload.endTime,
          basePrice: payload.basePrice,
          venueName: `${selectedTerritory.name}, ${selectedTerritory.city}`,
        })
      );

      broadcastInventoryChange();

      navigate(`/events/${newEventId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to submit event. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0A0A0C] text-[#e5e1e4] min-h-screen px-6 py-12 bg-ambient-radial">
      <div className="mx-auto max-w-7xl">

        <div className="mb-10 pb-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 font-['Plus_Jakarta_Sans'] text-[10px] font-semibold uppercase tracking-[0.18em] text-[#FFD026] mb-3">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#FFD026] animate-ping" />
            <span>ORGANIZER CONSOLE • ISSUE OFFICIAL DIAMOND, PLATINUM & GOLD PASSES • VENU</span>
          </div>

          <h1 className="font-['Outfit'] text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-3">
            Create an{' '}
            <span className="font-normal bg-gradient-to-r from-[#FF5722] via-[#F59E0B] to-[#FFD026] bg-clip-text text-transparent">
              Inspiring
            </span>{' '}
            Event
          </h1>

          <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm font-light text-[#958ea0] max-w-3xl leading-relaxed mb-8">
            Define clear, professional pass tiers including <strong>Diamond VIP</strong>, <strong>Platinum</strong>, and <strong>Gold Passes</strong>. Configure ticket quotas, perks, meal vouchers, and digital turnstile QR admission.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-['Plus_Jakarta_Sans'] text-[10.5px] uppercase font-semibold tracking-wider">
            <div className="glass-card p-3 border-l-2 border-[#FF5722] flex items-center gap-3">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF5722] text-white font-bold text-[9px]">
                01
              </span>
              <div>
                <strong className="text-white block">ARCHETYPE</strong>
                <span className="text-[#958ea0] text-[8.5px] font-normal">Concert / Fest / Tech</span>
              </div>
            </div>

            <div className="glass-card p-3 border-l-2 border-[#FFD026] flex items-center gap-3">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FFD026] text-black font-bold text-[9px]">
                02
              </span>
              <div>
                <strong className="text-white block">ARENA</strong>
                <span className="text-[#958ea0] text-[8.5px] font-normal">Staging Enclave</span>
              </div>
            </div>

            <div className="glass-card p-3 border-l-2 border-[#FF7A00] flex items-center gap-3">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF7A00] text-black font-bold text-[9px]">
                03
              </span>
              <div>
                <strong className="text-white block">PASS TIERS</strong>
                <span className="text-[#958ea0] text-[8.5px] font-normal">Diamond / Platinum / Gold</span>
              </div>
            </div>

            <div className="glass-card p-3 border-l-2 border-white/20 flex items-center gap-3">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[#cbc3d7] font-bold text-[9px]">
                04
              </span>
              <div>
                <strong className="text-white block">PUBLISH</strong>
                <span className="text-[#958ea0] text-[8.5px] font-normal">Issue & Go Live</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 flex items-center gap-3 rounded-[4px] border border-[#FF3366]/40 bg-[#FF3366]/10 p-4 text-xs text-[#ffb2ba]">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#FF3366]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          <div className="lg:col-span-8 space-y-12">

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-['Outfit'] text-sm uppercase tracking-wider font-bold text-[#FFD026]">
                  01
                </h2>
                <span className="font-['Plus_Jakarta_Sans'] text-[10px] font-semibold uppercase text-[#958ea0]">
                  6 PRESETS AVAILABLE
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {ARCHETYPES.map((arch) => {
                  const isSelected = selectedArchetype.id === arch.id;
                  return (
                    <div
                      key={arch.id}
                      onClick={() => handleSelectArchetype(arch)}
                      className={`glass-card p-3.5 cursor-pointer transition-all duration-300 relative border overflow-hidden ${
                        isSelected
                          ? 'border-[#FF5722] bg-[#FF5722]/10 shadow-[0_0_24px_rgba(255,87,34,0.3)] ring-1 ring-[#FF5722]'
                          : 'border-white/[0.08] hover:border-white/20'
                      }`}
                    >
                      <div className="relative h-28 rounded-[3px] overflow-hidden mb-2.5 bg-black/60">
                        <img
                          src={arch.image}
                          alt={arch.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#121118] via-transparent to-black/30" />
                        <span className="absolute top-2 left-2 font-['Plus_Jakarta_Sans'] text-[8.5px] uppercase tracking-wider font-bold text-[#cbc3d7] bg-black/60 px-1.5 py-0.5 rounded-[3px]">
                          {arch.code}
                        </span>
                        <span className="absolute bottom-2 left-2 badge-gold text-[7.5px]">
                          {arch.badge}
                        </span>
                      </div>

                      <h3 className="font-['Outfit'] text-sm font-bold text-white mb-1">
                        {arch.title}
                      </h3>
                      <p className="font-['Plus_Jakarta_Sans'] text-[10.5px] font-light text-[#958ea0] line-clamp-2 leading-relaxed mb-2.5">
                        {arch.description}
                      </p>

                      <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between font-['Plus_Jakarta_Sans'] text-[10px]">
                        <span className="text-[#FFD026] font-['Outfit'] font-bold">FROM ₹{arch.defaultPrice.toLocaleString('en-IN')}</span>
                        <span className={`uppercase font-semibold ${isSelected ? 'text-[#00F0FF]' : 'text-[#958ea0]'}`}>
                          {isSelected ? '✓ ACTIVE' : 'SELECT'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-['Outfit'] text-sm uppercase tracking-wider font-bold text-[#FFD026]">
                  02
                </h2>
                <span className="font-['Plus_Jakarta_Sans'] text-[10px] font-semibold uppercase text-[#958ea0]">
                  5 REGIONAL HUBS
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-['Plus_Jakarta_Sans'] text-[10.5px]">
                {TERRITORIES.map((terr) => {
                  const isSelected = selectedTerritory.id === terr.id;
                  return (
                    <button
                      type="button"
                      key={terr.id}
                      onClick={() => {
                        setSelectedTerritory(terr);
                        setEventTitle(`${selectedArchetype.title} — ${terr.name}`);
                      }}
                      className={`p-3 rounded-[4px] border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#FF5722] bg-[#FF5722]/10 text-white shadow-[0_0_16px_rgba(255,87,34,0.25)]'
                          : 'border-white/10 bg-white/[0.02] text-[#958ea0] hover:text-white hover:border-white/20'
                      }`}
                    >
                      <div>
                        <strong className="text-white block uppercase mb-0.5">{terr.city}</strong>
                        <span className="text-[9px] text-[#958ea0] block line-clamp-1">{terr.name}</span>
                      </div>
                      <span className="badge-subtle text-[8px] mt-2 self-start">{terr.badge}</span>
                    </button>
                  );
                })}
              </div>

              <div className="glass-card p-5 mt-4 border border-white/[0.1] grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                <div className="sm:col-span-3 h-24 rounded-[3px] overflow-hidden relative">
                  <img
                    src={selectedTerritory.image}
                    alt={selectedTerritory.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30" />
                </div>
                <div className="sm:col-span-9 space-y-1.5 font-['Plus_Jakarta_Sans']">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#FFD026] uppercase font-semibold">
                      STAGING VENUE: {selectedTerritory.name} ({selectedTerritory.coords})
                    </span>
                    <span className="badge-rose text-[8.5px]">RFID TURNSTILES ENABLED</span>
                  </div>
                  <h4 className="font-['Outfit'] text-lg font-bold text-white">
                    {selectedTerritory.basin}
                  </h4>
                  <p className="font-['Plus_Jakarta_Sans'] text-xs font-light text-[#958ea0]">
                    {selectedTerritory.details}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-['Plus_Jakarta_Sans'] text-xs uppercase tracking-[0.16em] text-[#FFD026] flex items-center gap-2 font-bold">
                    <Ticket className="h-4 w-4" />
                    03
                  </h2>
                  <p className="font-['Plus_Jakarta_Sans'] text-[11px] text-[#958ea0] mt-0.5">
                    Structure clean tiered pricing, custom quotas, perks, and optional meal voucher inclusions.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 font-['Plus_Jakarta_Sans'] text-[10px]">
                  <span className="text-[#958ea0] uppercase mr-1 font-semibold">LOAD PRESET:</span>
                  {[
                    { key: 'CONCERT', label: 'Concert Tour' },
                    { key: 'COLLEGE', label: 'College Fest' },
                    { key: 'FESTIVAL', label: 'Youth Festival' },
                    { key: 'CONCLAVE', label: 'Tech Conclave' },
                    { key: 'SYMPHONY', label: 'Symphony' },
                    { key: 'COMEDY', label: 'Comedy Special' },
                  ].map((p) => (
                    <button
                      type="button"
                      key={p.key}
                      onClick={() => handleApplyPreset(p.key)}
                      className={`px-2.5 py-1 rounded-[3px] border uppercase transition font-semibold ${
                        activePresetKey === p.key
                          ? 'border-[#FFD026] bg-[#FFD026]/15 text-[#FFD026]'
                          : 'border-white/10 text-[#958ea0] hover:text-white hover:border-white/20'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 font-['Plus_Jakarta_Sans']">
                <div className="glass-card p-3 border border-white/[0.08]">
                  <span className="text-[10px] text-[#958ea0] uppercase block tracking-wider font-semibold">TOTAL PASS CAPACITY</span>
                  <strong className="font-['Outfit'] text-white text-base font-semibold">{totalPassQuota.toLocaleString('en-IN')} Passes</strong>
                </div>
                <div className="glass-card p-3 border border-white/[0.08]">
                  <span className="text-[10px] text-[#958ea0] uppercase block tracking-wider font-semibold">ESTIMATED BOX OFFICE</span>
                  <strong className="font-['Outfit'] text-[#FFD026] text-base font-semibold">₹{totalGrossRevenue.toLocaleString('en-IN')}</strong>
                </div>
                <div className="glass-card p-3 border border-white/[0.08]">
                  <span className="text-[10px] text-[#958ea0] uppercase block tracking-wider font-semibold">ENTRY TIER RANGE</span>
                  <strong className="font-['Outfit'] text-emerald-400 text-base font-semibold">₹{minPrice.toLocaleString('en-IN')} — ₹{maxPrice.toLocaleString('en-IN')}</strong>
                </div>
                <div className="glass-card p-3 border border-white/[0.08]">
                  <span className="text-[10px] text-[#958ea0] uppercase block tracking-wider font-semibold">CONFIGURED TIERS</span>
                  <strong className="font-['Outfit'] text-[#FF7A00] text-base font-semibold">{passTiers.length} Active</strong>
                </div>
              </div>

              <div className="space-y-4">
                {passTiers.map((tier, idx) => {
                  return (
                    <div
                      key={tier.id}
                      className="glass-card p-5 border border-white/[0.1] rounded-[4px] relative transition duration-200 hover:border-white/20"
                      style={{ borderLeftWidth: '4px', borderLeftColor: tier.color || '#FFD026' }}
                    >

                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-white/[0.06]">
                        <div className="flex items-center gap-2">
                          <span className="font-['Plus_Jakarta_Sans'] text-[10px] text-[#958ea0] uppercase font-bold tracking-wider">
                            TIER #{idx + 1}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded-[2px] font-['Plus_Jakarta_Sans'] text-[9.5px] uppercase font-bold tracking-wider"
                            style={{
                              backgroundColor: `${tier.color}20`,
                              color: tier.color,
                              border: `1px solid ${tier.color}40`,
                            }}
                          >
                            {tier.badge}
                          </span>
                          <span className="badge-subtle text-[8.5px] uppercase font-['Plus_Jakarta_Sans']">
                            {tier.category === 'STUDENT' ? 'Student Verification Required' : 'Individual Pass'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDuplicateTier(tier)}
                            className="text-[#958ea0] hover:text-white p-1 rounded hover:bg-white/5 transition"
                            title="Duplicate Tier"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveTier(tier.id)}
                            className="text-[#ffb2ba] hover:text-[#FF3366] p-1 rounded hover:bg-[#FF3366]/10 transition"
                            title="Remove Tier"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                        <div className="md:col-span-6">
                          <label className="block font-['Plus_Jakarta_Sans'] text-[10px] uppercase tracking-wider font-semibold text-[#cbc3d7] mb-1">
                            PASS TIER TITLE
                          </label>
                          <input
                            type="text"
                            value={tier.name}
                            onChange={(e) => handleUpdateTier(tier.id, { name: e.target.value })}
                            placeholder="e.g. Diamond VIP Pass, Platinum Pass, Gold Circle..."
                            className="input-obsidian text-xs font-semibold text-white font-['Plus_Jakarta_Sans']"
                            required
                          />
                        </div>

                        <div className="md:col-span-3">
                          <label className="block font-['Plus_Jakarta_Sans'] text-[10px] uppercase tracking-wider font-semibold text-[#cbc3d7] mb-1">
                            TIER CLASSIFICATION
                          </label>
                          <select
                            value={tier.category}
                            onChange={(e) => {
                              const cat = e.target.value as any;
                              let badge = 'PASS';
                              let color = '#FFD026';
                              let tierLevel: 'SOVEREIGN' | 'DIPLOMATIC' | 'ROYAL' = 'DIPLOMATIC';

                              if (cat === 'DIAMOND') {
                                badge = 'DIAMOND VIP';
                                color = '#00F0FF';
                                tierLevel = 'SOVEREIGN';
                              } else if (cat === 'PLATINUM') {
                                badge = 'PLATINUM PASS';
                                color = '#E2E8F0';
                                tierLevel = 'SOVEREIGN';
                              } else if (cat === 'GOLD') {
                                badge = 'GOLD PASS';
                                color = '#FFD026';
                                tierLevel = 'DIPLOMATIC';
                              } else if (cat === 'SILVER') {
                                badge = 'SILVER PASS';
                                color = '#94A3B8';
                                tierLevel = 'ROYAL';
                              } else if (cat === 'STUDENT') {
                                badge = 'STUDENT PASS';
                                color = '#FF7A00';
                                tierLevel = 'ROYAL';
                              }

                              handleUpdateTier(tier.id, {
                                category: cat,
                                badge,
                                color,
                                tier: tierLevel,
                              });
                            }}
                            className="input-obsidian text-xs font-['Plus_Jakarta_Sans'] font-medium text-white"
                          >
                            <option value="DIAMOND">Diamond VIP Tier</option>
                            <option value="PLATINUM">Platinum Tier</option>
                            <option value="GOLD">Gold Priority Tier</option>
                          </select>
                        </div>

                        <div className="md:col-span-3">
                          <label className="block font-['Plus_Jakarta_Sans'] text-[10px] uppercase tracking-wider font-semibold text-[#cbc3d7] mb-1">
                            PASSES QUOTA
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="50000"
                            value={tier.quota}
                            onChange={(e) =>
                              handleUpdateTier(tier.id, { quota: Math.max(1, Number(e.target.value)) })
                            }
                            className="input-obsidian text-xs font-['Outfit'] font-semibold text-white"
                            required
                          />
                        </div>

                        <div className="md:col-span-4">
                          <label className="block font-['Plus_Jakarta_Sans'] text-[10px] uppercase tracking-wider font-semibold text-[#FFD026] mb-1">
                            ADMISSION PRICE (₹ INR)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 font-['Outfit'] text-xs text-[#FFD026] font-bold">₹</span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={tier.price}
                              onChange={(e) =>
                                handleUpdateTier(tier.id, { price: Math.max(0, Number(e.target.value)) })
                              }
                              className="input-obsidian pl-7 text-xs font-['Outfit'] text-white font-bold"
                              required
                            />
                          </div>
                        </div>

                        <div className="md:col-span-8 bg-white/[0.02] p-3 rounded-[4px] border border-white/[0.06]">
                          <div className="flex items-center justify-between mb-2">
                            <label className="flex items-center gap-2 cursor-pointer font-['Plus_Jakarta_Sans'] text-[10.5px] text-[#e5e1e4] uppercase font-bold">
                              <input
                                type="checkbox"
                                checked={tier.hasMealVoucher}
                                onChange={(e) =>
                                  handleUpdateTier(tier.id, {
                                    hasMealVoucher: e.target.checked,
                                    voucherAmount: e.target.checked ? (tier.voucherAmount || 500) : 0,
                                  })
                                }
                                className="h-3.5 w-3.5 rounded accent-[#FFD026]"
                              />
                              <span className="flex items-center gap-1.5 text-emerald-300">
                                <Utensils className="h-3.5 w-3.5 text-emerald-400" />
                                INCLUDES FOOD & REFRESHMENT MEAL VOUCHER
                              </span>
                            </label>

                            {tier.hasMealVoucher && (
                              <span className="font-['Outfit'] text-xs text-emerald-400 font-bold">
                                ₹{tier.voucherAmount.toLocaleString('en-IN')} MEAL VALUE
                              </span>
                            )}
                          </div>

                          {tier.hasMealVoucher ? (
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-2">
                              <div className="sm:col-span-5">
                                <label className="block font-['Plus_Jakarta_Sans'] text-[9.5px] uppercase font-semibold text-[#958ea0] mb-1">
                                  VOUCHER AMOUNT (₹)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max={tier.price}
                                  step="any"
                                  value={tier.voucherAmount}
                                  onChange={(e) =>
                                    handleUpdateTier(tier.id, {
                                      voucherAmount: Math.min(tier.price, Math.max(0, Number(e.target.value))),
                                    })
                                  }
                                  className="input-obsidian text-xs font-['Outfit'] text-emerald-300 font-bold"
                                />
                              </div>
                              <div className="sm:col-span-7">
                                <label className="block font-['Plus_Jakarta_Sans'] text-[9.5px] uppercase font-semibold text-[#958ea0] mb-1">
                                  REFRESHMENT DESCRIPTION
                                </label>
                                <input
                                  type="text"
                                  value={tier.voucherDescription}
                                  onChange={(e) =>
                                    handleUpdateTier(tier.id, { voucherDescription: e.target.value })
                                  }
                                  placeholder="e.g. Food court meal box and bottled refreshments included"
                                  className="input-obsidian text-[11px] font-['Plus_Jakarta_Sans'] text-[#cbc3d7]"
                                />
                              </div>
                            </div>
                          ) : (
                            <p className="font-['Plus_Jakarta_Sans'] text-[10.5px] text-[#958ea0]">
                              Direct seating/standing pass admission. Optional food items available at stadium concessions.
                            </p>
                          )}
                        </div>

                        <div className="md:col-span-6">
                          <label className="block font-['Plus_Jakarta_Sans'] text-[10px] uppercase tracking-wider font-semibold text-[#cbc3d7] mb-1">
                            PERKS & PRIVILEGES (TAGS)
                          </label>
                          <input
                            type="text"
                            value={tier.perks}
                            onChange={(e) => handleUpdateTier(tier.id, { perks: e.target.value })}
                            placeholder="e.g. Front Row Catwalk, Souvenir Lanyard, Dedicated Turnstile..."
                            className="input-obsidian text-xs font-['Plus_Jakarta_Sans'] text-[#cbc3d7]"
                          />
                        </div>

                        <div className="md:col-span-6">
                          <label className="block font-['Plus_Jakarta_Sans'] text-[10px] uppercase tracking-wider font-semibold text-[#cbc3d7] mb-1">
                            ENTRY GUIDELINES & PROTOCOL
                          </label>
                          <input
                            type="text"
                            value={tier.entryGuidelines}
                            onChange={(e) =>
                              handleUpdateTier(tier.id, { entryGuidelines: e.target.value })
                            }
                            placeholder="e.g. Gate 1 Ingress, Photo ID required, Entry before 7 PM..."
                            className="input-obsidian text-xs font-['Plus_Jakarta_Sans'] text-[#cbc3d7]"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleAddPassTier}
                  className="btn-secondary-ghost w-full py-3 text-xs font-['Plus_Jakarta_Sans'] font-semibold uppercase tracking-wider flex items-center justify-center gap-2 border-dashed border-white/20 hover:border-[#FFD026] hover:text-[#FFD026]"
                >
                  <Plus className="h-4 w-4" />
                  + ADD CUSTOM PASS TIER (DIAMOND / PLATINUM / GOLD)
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-['Plus_Jakarta_Sans'] text-xs uppercase tracking-[0.16em] text-[#FFD026] font-bold">
                  04
                </h2>
                <span className="font-['Plus_Jakarta_Sans'] text-[10px] uppercase text-[#FF7A00] flex items-center gap-1 font-semibold">
                  <ShieldCheck className="h-3 w-3" /> OFFICIAL VENU VERIFIED
                </span>
              </div>

              <div className="glass-card p-6 border border-white/[0.08] space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-['Plus_Jakarta_Sans'] text-[10px] uppercase tracking-wider font-semibold text-[#cbc3d7] mb-1.5">
                      EVENT TITLE
                    </label>
                    <input
                      type="text"
                      required
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="e.g. Diljit Dosanjh — Dil-Luminati Tour"
                      className="input-obsidian font-medium font-['Plus_Jakarta_Sans']"
                    />
                  </div>

                  <div>
                    <label className="block font-['Plus_Jakarta_Sans'] text-[10px] uppercase tracking-wider font-semibold text-[#cbc3d7] mb-1.5">
                      ORGANIZER / PRODUCTION BODY
                    </label>
                    <input
                      type="text"
                      required
                      value={productionCompany}
                      onChange={(e) => setProductionCompany(e.target.value)}
                      placeholder="e.g. Youth Arts & Live Touring Council"
                      className="input-obsidian font-['Plus_Jakarta_Sans']"
                    />
                  </div>

                  <div>
                    <label className="block font-['Plus_Jakarta_Sans'] text-[10px] uppercase tracking-wider font-semibold text-[#cbc3d7] mb-1.5">
                      CURATOR DESIGNATION
                    </label>
                    <input
                      type="text"
                      required
                      value={organizerTitle}
                      onChange={(e) => setOrganizerTitle(e.target.value)}
                      placeholder="e.g. Event Director / Cultural Lead"
                      className="input-obsidian font-['Plus_Jakarta_Sans']"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-['Plus_Jakarta_Sans'] text-[10px] uppercase tracking-wider font-semibold text-[#cbc3d7] mb-1.5">
                      HELPDESK / CONTACT LINE
                    </label>
                    <input
                      type="text"
                      required
                      value={contactLine}
                      onChange={(e) => setContactLine(e.target.value)}
                      placeholder="+91 98200 ••••• / Helpdesk"
                      className="input-obsidian font-['Plus_Jakarta_Sans']"
                    />
                  </div>

                  <div>
                    <label className="block font-['Plus_Jakarta_Sans'] text-[10px] uppercase tracking-wider font-semibold text-[#cbc3d7] mb-1.5">
                      DOORS OPEN (START TIME)
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={timeframe}
                      onChange={(e) => setTimeframe(e.target.value)}
                      className="input-obsidian font-['Plus_Jakarta_Sans'] text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-['Plus_Jakarta_Sans'] text-[10px] uppercase tracking-wider font-semibold text-[#cbc3d7] mb-1.5">
                      CONCLUDE TIME
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={endTimeframe}
                      onChange={(e) => setEndTimeframe(e.target.value)}
                      className="input-obsidian font-['Plus_Jakarta_Sans'] text-xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-['Plus_Jakarta_Sans'] text-[10px] uppercase tracking-wider font-semibold text-[#cbc3d7] mb-1.5">
                    ON-GROUND OPERATIONAL GUIDELINES
                  </label>
                  <textarea
                    rows={3}
                    value={eventDirectives}
                    onChange={(e) => setEventDirectives(e.target.value)}
                    className="input-obsidian font-['Plus_Jakarta_Sans'] text-xs"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="licensing"
                    checked={licensingApproved}
                    onChange={(e) => setLicensingApproved(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#FF5722]"
                  />
                  <label htmlFor="licensing" className="font-['Plus_Jakarta_Sans'] text-[11px] text-[#958ea0] cursor-pointer">
                    Certified compliant with event safety guidelines, RFID turnstile check-in protocol, and anti-scalping digital pass standards.
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 sticky top-24 space-y-4">
            <div className="glass-card p-6 border border-white/[0.12] shadow-[0_0_40px_rgba(255,87,34,0.2)]">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4 font-['Plus_Jakarta_Sans'] text-[10px] font-semibold tracking-wider">
                <span className="flex items-center gap-1.5 text-[#FFD026]">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#FFD026] animate-pulse" />
                  LIVE PASS TELEMETRY
                </span>
                <span className="text-[#958ea0]">READY FOR ISSUANCE</span>
              </div>

              <div className="space-y-4 font-['Plus_Jakarta_Sans'] text-[11px]">
                <div>
                  <span className="text-[10px] text-[#958ea0] uppercase tracking-wider font-semibold block">
                    EVENT TARGET
                  </span>
                  <h3 className="font-['Outfit'] text-xl font-bold text-white mt-0.5 line-clamp-2">
                    {eventTitle || selectedArchetype.title}
                  </h3>
                  <div className="flex items-center gap-1 text-[10.5px] text-[#FFD026] mt-1 font-medium">
                    <MapPin className="h-3 w-3" />
                    <span>{selectedTerritory.name}, {selectedTerritory.city}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.06]">
                  <div>
                    <span className="text-[9.5px] text-[#958ea0] uppercase tracking-wider font-semibold block">ENTRY PASS FROM</span>
                    <strong className="font-['Outfit'] text-white text-base font-semibold">₹{minPrice.toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span className="text-[9.5px] text-[#958ea0] uppercase tracking-wider font-semibold block">TOP DIAMOND PASS</span>
                    <strong className="font-['Outfit'] text-[#00F0FF] text-base font-semibold">₹{maxPrice.toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.06]">
                  <div>
                    <span className="text-[9.5px] text-[#958ea0] uppercase tracking-wider font-semibold block">TOTAL PASSES</span>
                    <strong className="font-['Outfit'] text-white text-sm font-semibold">{totalPassQuota.toLocaleString('en-IN')} Available</strong>
                  </div>
                  <div>
                    <span className="text-[9.5px] text-[#958ea0] uppercase tracking-wider font-semibold block">ESTIMATED REVENUE</span>
                    <strong className="font-['Outfit'] text-emerald-400 text-sm font-semibold">₹{totalGrossRevenue.toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.06] space-y-2">
                  <span className="text-[9.5px] text-[#958ea0] uppercase tracking-wider font-semibold block">
                    CONFIGURED TIERS ({passTiers.length})
                  </span>
                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                    {passTiers.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-2 rounded-[3px] bg-white/[0.02] border border-white/[0.04] text-[10px]"
                      >
                        <div className="truncate pr-2">
                          <span className="text-white font-medium block truncate font-['Plus_Jakarta_Sans']">{t.name}</span>
                          <span className="text-[8.5px] text-[#958ea0] font-['Plus_Jakarta_Sans']">
                            {t.quota} Passes • {t.badge}
                          </span>
                        </div>
                        <span className="font-['Outfit'] text-[#FFD026] font-bold text-xs shrink-0">
                          ₹{t.price.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading || passTiers.length === 0}
                    className="btn-primary-cta w-full py-4 text-xs font-semibold shadow-[0_0_24px_rgba(255,87,34,0.45)] flex items-center justify-center gap-2 font-['Plus_Jakarta_Sans']"
                  >
                    {loading ? (
                      'ISSUING PASS INVENTORY & CREATING EVENT...'
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        PUBLISH EVENT & ISSUE PASSES
                      </>
                    )}
                  </button>
                  <p className="font-['Plus_Jakarta_Sans'] text-[9.5px] text-[#958ea0] text-center mt-2.5">
                    PASSES IMMEDIATELY AVAILABLE ON THE INDIAN EVENTS CATALOGUE & TURNSTILE GATE SCANNERS.
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card p-5 border border-white/[0.08] space-y-3 font-['Plus_Jakarta_Sans'] text-xs text-[#958ea0]">
              <span className="font-['Plus_Jakarta_Sans'] text-[10px] uppercase tracking-wider text-[#FFD026] block font-semibold">
                VENU PASS MANAGEMENT FEATURES
              </span>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#FFD026] shrink-0 mt-0.5" />
                <span>Encrypted Dynamic QR codes to eliminate physical & digital ticket scalping.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <GraduationCap className="h-4 w-4 text-[#FFD026] shrink-0 mt-0.5" />
                <span>Student ID verification protocol integrated for subsidized campus pass tiers.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#FFD026] shrink-0 mt-0.5" />
                <span>Direct real-time synchronisation with venue turnstile gate scanners.</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
