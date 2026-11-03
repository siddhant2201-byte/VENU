import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  MessageSquare,
  Star,
  Send,
  ThumbsUp,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  ChevronRight,
  Search,
  Pin,
  Share2,
  Check,
  Plus,
  Lock
} from 'lucide-react';

interface AnnouncementItem {
  id: number;
  title: string;
  category: 'GATE ACCESS' | 'LINEUP' | 'TRANSIT' | 'PRODUCTION' | 'SAFETY';
  priority: 'URGENT' | 'FEATURED' | 'NOTICE';
  timestamp: string;
  event: string;
  venue: string;
  content: string;
  pinned: boolean;
  author: string;
}

interface FeedbackItem {
  id: number;
  authorName: string;
  badge: string;
  eventName: string;
  rating: number;
  category: string;
  comment: string;
  helpfulCount: number;
  timestamp: string;
  verified: boolean;
}

const DEFAULT_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 1,
    title: 'Gate 3 & Gate 4 Fast-Track RFID Entry for Diljit Dosanjh Dil-Luminati Arena',
    category: 'GATE ACCESS',
    priority: 'URGENT',
    timestamp: 'Today • 11:30 AM IST',
    event: 'Diljit Dosanjh — Dil-Luminati Arena India Tour',
    venue: 'JLN Stadium Arena, New Delhi',
    content: 'Turnstile capacity at Gate 3 (VIP West) and Gate 4 has been doubled with dedicated high-speed optical QR scanners. Diamond and Platinum pass holders can access direct bypass lanes via Lodhi Road Gate 2A. Gates open strictly at 19:30 IST.',
    pinned: true,
    author: 'JLN Stadium Logistics & Security Directorate',
  },
  {
    id: 2,
    title: 'Surprise Guest Collaboration Confirmed: Badshah & Ed Sheeran Special Appearance',
    category: 'LINEUP',
    priority: 'FEATURED',
    timestamp: 'Today • 09:15 AM IST',
    event: 'Diljit Dosanjh — Dil-Luminati Arena India Tour',
    venue: 'JLN Stadium Arena, New Delhi',
    content: 'Both special guest artists have completed technical soundcheck with Ikky & the live symphony orchestra. Collaborative set scheduled for 21:15 during Phase 2 of the headline act on the 360° runway stage.',
    pinned: true,
    author: 'Executive Tour Directorate & Production Management',
  },
  {
    id: 3,
    title: 'Delhi Metro Special Extended Transit Until 01:00 AM on Violet Line',
    category: 'TRANSIT',
    priority: 'NOTICE',
    timestamp: 'Yesterday • 08:00 PM IST',
    event: 'Diljit Dosanjh — Dil-Luminati Arena India Tour',
    venue: 'JLN Stadium Arena, New Delhi',
    content: 'DMRC has confirmed special extra midnight train departures from JLN Stadium and Jangpura metro stations. Turnstiles will remain open for convenient exit dispersal after the encore finale.',
    pinned: false,
    author: 'City Transit Coordination Directorate',
  },
  {
    id: 4,
    title: 'Royal Symphonic Tour Mumbai: Spatial Acoustic Audio Calibration Complete',
    category: 'PRODUCTION',
    priority: 'NOTICE',
    timestamp: 'Yesterday • 02:30 PM IST',
    event: 'A.R. Rahman Live Symphonic Orchestra World Tour',
    venue: 'DY Patil Grand Arena Stadium, Navi Mumbai',
    content: 'Acoustic engineers have completed multi-point 3D spatial acoustic sound mapping across all Platinum and Diamond tiers. Rehearsals with the 100-piece international orchestra are now concluded.',
    pinned: false,
    author: 'Royal Symphonic Production Desk',
  },
  {
    id: 5,
    title: 'Vagator Oceanfront Security & Hydration Stations Deployed for Sunburn Festival',
    category: 'SAFETY',
    priority: 'NOTICE',
    timestamp: 'Oct 29, 2026 • 05:00 PM IST',
    event: 'Sunburn Youth EDM & Laser Light Festival 2026',
    venue: 'Vagator Beach Arena, Goa',
    content: 'Over 12 free hydration stations and 4 dedicated medical support hubs have been established across Stages 1 through 4. RFID wristband check-in begins at 16:00 on opening day.',
    pinned: false,
    author: 'Percept Live Operations',
  },
];

const DEFAULT_FEEDBACKS: FeedbackItem[] = [
  {
    id: 101,
    authorName: 'Amanpreet Kaur',
    badge: 'VERIFIED VIP ATTENDEE',
    eventName: 'Diljit Dosanjh — Dil-Luminati Tour (Delhi)',
    rating: 5,
    category: 'Sound & Stage 360°',
    comment: 'The 360-degree runway stage and laser synchronization were unreal! Sound quality at Fan Pit Center was crisp with zero echo. Diljit sang non-stop for almost 3 hours.',
    helpfulCount: 184,
    timestamp: '2 hours ago',
    verified: true,
  },
  {
    id: 102,
    authorName: 'Rohan Varma',
    badge: 'VERIFIED PASSHOLDER',
    eventName: 'A.R. Rahman Live Symphonic Orchestra (Mumbai)',
    rating: 5,
    category: 'Acoustics & Orchestration',
    comment: 'Hearing the 100-piece orchestra live with spatial audio was a spiritual experience. Seating in Platinum Reserved gave a breathtaking view of the visual projections.',
    helpfulCount: 96,
    timestamp: '5 hours ago',
    verified: true,
  },
  {
    id: 103,
    authorName: 'Tanvi Deshmukh',
    badge: 'VERIFIED PASSHOLDER',
    eventName: 'Sunburn Youth EDM & Laser Festival (Goa)',
    rating: 4,
    category: 'Turnstiles & Entry',
    comment: 'The QR code scanning was super fast at the gates. Took less than 30 seconds to enter. Pyrotechnics at midnight were mind-blowing. More hydration booths near Stage 3 would be great!',
    helpfulCount: 64,
    timestamp: '1 day ago',
    verified: true,
  },
  {
    id: 104,
    authorName: 'Kabir Mehta',
    badge: 'DELEGATE VIP',
    eventName: 'India Tech & AI Unicorn Founders Conclave (Delhi)',
    rating: 5,
    category: 'Logistics & Networking',
    comment: 'World-class organization at Bharat Mandapam. Keynotes were high-impact and pass check-in through the VENU app was instantaneous.',
    helpfulCount: 42,
    timestamp: '2 days ago',
    verified: true,
  },
  {
    id: 105,
    authorName: 'Sanjana Roy',
    badge: 'VERIFIED ATTENDEE',
    eventName: 'Arijit Singh Soulful Symphony Arena Tour',
    rating: 5,
    category: 'Atmosphere & Production',
    comment: 'The acoustic string arrangements and lighting transitions gave me goosebumps. Easily one of the cleanest, best-managed arena events in Mumbai.',
    helpfulCount: 38,
    timestamp: '3 days ago',
    verified: true,
  },
];

export const AnnouncementsFeedback: React.FC = () => {
  const { user } = useAuth();
  
  // Real authentication check from logged in user profile
  const isOrganizer = user?.roles?.some(
    (r) => r === 'ROLE_ORGANIZER' || r === 'ROLE_ADMIN' || r === 'ORGANIZER' || r === 'ADMIN'
  ) || false;

  const [activeTab, setActiveTab] = useState<'ALL' | 'ANNOUNCEMENTS' | 'FEEDBACKS' | 'SUBMIT' | 'POST_NOTICE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(() => {
    try {
      const saved = localStorage.getItem('venu_official_announcements');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [...parsed, ...DEFAULT_ANNOUNCEMENTS];
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved announcements', e);
    }
    return DEFAULT_ANNOUNCEMENTS;
  });

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(() => {
    try {
      const saved = localStorage.getItem('venu_public_feedbacks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [...parsed, ...DEFAULT_FEEDBACKS];
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved feedbacks', e);
    }
    return DEFAULT_FEEDBACKS;
  });

  const [upvotedIds, setUpvotedIds] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem('venu_feedback_upvotes');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Attendee Review Form State
  const [formData, setFormData] = useState({
    authorName: user?.fullName || '',
    eventName: 'Diljit Dosanjh — Dil-Luminati Arena India Tour',
    passCategory: 'Diamond VIP Apex',
    category: 'Sound & Stage 360°',
    rating: 5,
    comment: '',
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [copiedNoticeId, setCopiedNoticeId] = useState<number | null>(null);

  // Organizer Notice Form State
  const [noticeFormData, setNoticeFormData] = useState({
    title: '',
    category: 'GATE ACCESS' as AnnouncementItem['category'],
    priority: 'NOTICE' as AnnouncementItem['priority'],
    event: 'Diljit Dosanjh — Dil-Luminati Arena India Tour',
    venue: 'JLN Stadium Arena, New Delhi',
    content: '',
    pinned: false,
    author: user?.fullName ? `${user.fullName} (Event Operations)` : 'Venue Operations Directorate',
  });
  const [noticeSubmitSuccess, setNoticeSubmitSuccess] = useState(false);

  useEffect(() => {
    if (user?.fullName && !formData.authorName) {
      setFormData((prev) => ({ ...prev, authorName: user.fullName }));
    }
    if (user?.fullName && !noticeFormData.author) {
      setNoticeFormData((prev) => ({ ...prev, author: `${user.fullName} (Directorate)` }));
    }
  }, [user]);

  const handleUpvote = (id: number) => {
    const nextUpvoted = new Set(upvotedIds);
    let delta = 1;
    if (nextUpvoted.has(id)) {
      nextUpvoted.delete(id);
      delta = -1;
    } else {
      nextUpvoted.add(id);
    }
    setUpvotedIds(nextUpvoted);
    try {
      localStorage.setItem('venu_feedback_upvotes', JSON.stringify(Array.from(nextUpvoted)));
    } catch (e) {
      console.warn(e);
    }

    setFeedbacks((prev) =>
      prev.map((f) => (f.id === id ? { ...f, helpfulCount: f.helpfulCount + delta } : f))
    );
  };

  const handleCopyNotice = (notice: AnnouncementItem) => {
    const text = `[VENU OFFICIAL ANNOUNCEMENT]\n${notice.title}\nEvent: ${notice.event}\nVenue: ${notice.venue}\n${notice.content}`;
    navigator.clipboard.writeText(text);
    setCopiedNoticeId(notice.id);
    setTimeout(() => setCopiedNoticeId(null), 2000);
  };

  // Organizer: Publish Official Notice
  const handlePostNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOrganizer) {
      alert('Only organizers can broadcast official production notices.');
      return;
    }
    if (!noticeFormData.title.trim() || !noticeFormData.content.trim()) return;

    const newNotice: AnnouncementItem = {
      id: Date.now(),
      title: noticeFormData.title.trim(),
      category: noticeFormData.category,
      priority: noticeFormData.priority,
      timestamp: 'Today • ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      event: noticeFormData.event,
      venue: noticeFormData.venue,
      content: noticeFormData.content.trim(),
      pinned: noticeFormData.pinned,
      author: noticeFormData.author.trim() || 'Event Operations Directorate',
    };

    const updated = [newNotice, ...announcements];
    setAnnouncements(updated);

    try {
      const customNotices = updated.filter((n) => n.id > 100);
      localStorage.setItem('venu_official_announcements', JSON.stringify(customNotices));
    } catch (err) {
      console.warn('Failed to save notice to storage', err);
    }

    setNoticeSubmitSuccess(true);
    setNoticeFormData({
      title: '',
      category: 'GATE ACCESS',
      priority: 'NOTICE',
      event: 'Diljit Dosanjh — Dil-Luminati Arena India Tour',
      venue: 'JLN Stadium Arena, New Delhi',
      content: '',
      pinned: false,
      author: user?.fullName ? `${user.fullName} (Event Operations)` : 'Venue Operations Directorate',
    });

    setTimeout(() => {
      setNoticeSubmitSuccess(false);
      setActiveTab('ANNOUNCEMENTS');
    }, 1800);
  };

  // Attendee: Submit Review (Organizers are prohibited)
  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOrganizer) {
      alert('Review submissions are restricted to verified ticket holders & attendees. As an event organizer, use the Post Official Notice tool.');
      return;
    }
    if (!formData.comment.trim() || !formData.authorName.trim()) return;
    e.preventDefault();
    if (!formData.comment.trim() || !formData.authorName.trim()) return;

    const newFeedback: FeedbackItem = {
      id: Date.now(),
      authorName: formData.authorName.trim(),
      badge: formData.passCategory.toUpperCase() + ' HOLDER',
      eventName: formData.eventName,
      rating: formData.rating,
      category: formData.category,
      comment: formData.comment.trim(),
      helpfulCount: 1,
      timestamp: 'Just now',
      verified: true,
    };

    const updated = [newFeedback, ...feedbacks];
    setFeedbacks(updated);

    try {
      const userCustom = updated.filter((f) => f.id > 1000);
      localStorage.setItem('venu_public_feedbacks', JSON.stringify(userCustom));
    } catch (err) {
      console.warn('Failed to save feedback to storage', err);
    }

    setSubmitSuccess(true);
    setFormData((prev) => ({ ...prev, comment: '' }));
    setTimeout(() => {
      setSubmitSuccess(false);
      setActiveTab('FEEDBACKS');
    }, 1800);
  };

  // Filter logic
  const filteredAnnouncements = announcements.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.event.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'ALL' || a.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredFeedbacks = feedbacks.filter((f) => {
    const matchesSearch =
      f.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="bg-[#0A0A0C] text-[#e5e1e4] bg-ambient-radial min-h-screen px-4 sm:px-6 py-10 font-sans">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-[4px] glass-card p-6 sm:p-10 border border-white/10 shadow-[0_0_50px_rgba(255,87,34,0.12)]">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 badge-gold text-[10px]">
                <span>OFFICIAL PRODUCTION & COMMUNITY DISPATCH • REALTIME AUDIENCE SENTIMENT</span>
              </div>
              <h1 className="font-['Outfit'] text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Announcements & Public Feedback
              </h1>
              <p className="text-sm sm:text-base text-[#cbc3d7] leading-relaxed max-w-2xl">
                Stay updated with verified gate schedules, production advisories, and authentic crowd reviews across all premier stadium concerts & festivals.
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
              <div className="p-3.5 rounded-[4px] bg-white/[0.03] border border-white/10">
                <span className="font-['Plus_Jakarta_Sans'] text-[10px] text-[#958ea0] uppercase tracking-wider block font-semibold">Active Notices</span>
                <strong className="font-['Outfit'] text-white text-xl sm:text-2xl font-bold block mt-0.5">
                  {announcements.length} Dispatches
                </strong>
                <span className="font-['Plus_Jakarta_Sans'] text-[10px] text-emerald-400 font-medium">All gates verified</span>
              </div>

              <div className="p-3.5 rounded-[4px] bg-white/[0.03] border border-white/10">
                <span className="font-['Plus_Jakarta_Sans'] text-[10px] text-[#958ea0] uppercase tracking-wider block font-semibold">Crowd Rating</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <strong className="font-['Outfit'] text-[#FFD026] text-xl sm:text-2xl font-bold">4.9</strong>
                  <div className="flex text-[#FFD026]">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <Star className="h-3.5 w-3.5 fill-current" />
                  </div>
                </div>
                <span className="font-['Plus_Jakarta_Sans'] text-[10px] text-[#958ea0]">From 1,420+ reviews</span>
              </div>

              <div className="col-span-2 sm:col-span-1 p-3.5 rounded-[4px] bg-white/[0.03] border border-white/10 flex sm:flex-col justify-between sm:justify-start">
                <div>
                  <span className="font-['Plus_Jakarta_Sans'] text-[10px] text-[#958ea0] uppercase tracking-wider block font-semibold">
                    {isOrganizer ? 'Organizer Action' : 'Public Feedback'}
                  </span>
                  <strong className="font-['Outfit'] text-white text-xl sm:text-2xl font-bold block mt-0.5">
                    {isOrganizer ? 'Production Hub' : `${feedbacks.length} Live`}
                  </strong>
                </div>
                {isOrganizer ? (
                  <button
                    onClick={() => setActiveTab('POST_NOTICE')}
                    className="mt-1 font-['Plus_Jakarta_Sans'] text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer uppercase"
                  >
                    + Post Notice <ChevronRight className="h-3 w-3" />
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab('SUBMIT')}
                    className="mt-1 font-['Plus_Jakarta_Sans'] text-[11px] text-[#FF5722] hover:text-[#FF7A00] font-semibold flex items-center gap-1 cursor-pointer uppercase"
                  >
                    Write Review <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div className="flex flex-wrap items-center gap-2 font-['Plus_Jakarta_Sans'] text-[11px] tracking-wider uppercase">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-2 rounded-[4px] font-bold transition ${
                activeTab === 'ALL'
                  ? 'bg-white text-black shadow-lg shadow-white/10'
                  : 'bg-white/5 text-[#958ea0] hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              All Updates ({announcements.length + feedbacks.length})
            </button>
            <button
              onClick={() => setActiveTab('ANNOUNCEMENTS')}
              className={`px-3.5 py-2 rounded-[4px] font-bold transition flex items-center gap-1.5 ${
                activeTab === 'ANNOUNCEMENTS'
                  ? 'bg-[#FF5722] text-white shadow-lg shadow-orange-500/20'
                  : 'bg-white/5 text-[#958ea0] hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              <Bell className="h-3.5 w-3.5" />
              Notices ({announcements.length})
            </button>
            <button
              onClick={() => setActiveTab('FEEDBACKS')}
              className={`px-3.5 py-2 rounded-[4px] font-bold transition flex items-center gap-1.5 ${
                activeTab === 'FEEDBACKS'
                  ? 'bg-[#FFD026] text-black shadow-lg shadow-yellow-500/20'
                  : 'bg-white/5 text-[#958ea0] hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Reviews ({feedbacks.length})
            </button>
            {isOrganizer ? (
              <button
                onClick={() => setActiveTab('POST_NOTICE')}
                className={`px-3.5 py-2 rounded-[4px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'POST_NOTICE'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-purple-500/10 text-purple-300 hover:text-white hover:bg-purple-500/20 border border-purple-500/30'
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                + Post Notice
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('SUBMIT')}
                className={`px-3.5 py-2 rounded-[4px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'SUBMIT'
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                    : 'bg-white/5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20'
                }`}
              >
                <Send className="h-3.5 w-3.5" />
                + Submit Review
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#958ea0]" />
            <input
              type="text"
              placeholder="Search notices, artists, reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white placeholder-[#958ea0] focus:outline-none focus:border-[#FF5722] transition"
            />
          </div>
        </div>

        {/* Category Pills for Announcements */}
        {(activeTab === 'ALL' || activeTab === 'ANNOUNCEMENTS') && (
          <div className="flex flex-wrap items-center gap-2 font-['Plus_Jakarta_Sans'] text-xs">
            <span className="text-[#958ea0] text-[11px] font-semibold mr-1">TOPIC FILTER:</span>
            {['ALL', 'GATE ACCESS', 'LINEUP', 'TRANSIT', 'PRODUCTION', 'SAFETY'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-wider transition ${
                  selectedCategory === cat
                    ? 'bg-[#FF5722]/20 border border-[#FF5722] text-[#FF7A00]'
                    : 'bg-white/[0.03] border border-white/10 text-[#958ea0] hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Content Section */}
        {activeTab === 'POST_NOTICE' ? (
          /* ================= POST OFFICIAL NOTICE FORM (ORGANIZERS ONLY) ================= */
          !isOrganizer ? (
            <div className="max-w-xl mx-auto glass-card p-8 rounded-2xl border border-red-500/30 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
                <Lock className="h-6 w-6" />
              </div>
              <h2 className="font-['Outfit'] text-2xl font-bold text-white">Organizer Clearance Required</h2>
              <p className="text-xs text-[#cbc3d7] leading-relaxed max-w-md mx-auto">
                Official production notices and gate advisories can only be published by authorized event organizers and venue directors. Attendees have read-only access to official updates.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => setActiveTab('ALL')}
                  className="btn-secondary-ghost text-xs !py-2 !px-4"
                >
                  Back to All Updates
                </button>
                <button
                  onClick={() => setActiveTab('SUBMIT')}
                  className="btn-primary-cta text-xs !py-2 !px-4"
                >
                  Submit Attendee Review
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto glass-card p-6 sm:p-8 rounded-2xl border border-purple-500/30 space-y-6">
              <div className="border-b border-white/[0.08] pb-4">
                <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider block mb-1">
                  ORGANIZER DIRECTORATE DISPATCH
                </span>
                <h2 className="font-['Outfit'] text-2xl font-bold text-white">Broadcast Official Production Notice</h2>
                <p className="text-xs text-[#958ea0] mt-1">
                  Publish immediate gate notices, schedule changes, soundcheck alerts, and safety advisories directly to all ticket holders.
                </p>
              </div>

              {noticeSubmitSuccess && (
                <div className="p-4 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center gap-3 text-xs">
                  <CheckCircle2 className="h-5 w-5 text-purple-400 shrink-0" />
                  <div>
                    <strong className="block text-purple-300 font-bold">Official Notice Broadcast Live!</strong>
                    <span>Your dispatch has been published to all event attendees and marked with directorate clearance.</span>
                  </div>
                </div>
              )}

              <form onSubmit={handlePostNotice} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1.5">Notice Headline / Title</label>
                  <input
                    type="text"
                    required
                    value={noticeFormData.title}
                    onChange={(e) => setNoticeFormData({ ...noticeFormData, title: e.target.value })}
                    placeholder="e.g. Turnstile Gate 3 Express Lane Open for Dil-Luminati Pit"
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1.5">Category</label>
                    <select
                      value={noticeFormData.category}
                      onChange={(e) =>
                        setNoticeFormData({
                          ...noticeFormData,
                          category: e.target.value as AnnouncementItem['category'],
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="GATE ACCESS">Gate Access & Turnstiles</option>
                      <option value="LINEUP">Artist Lineup & Sets</option>
                      <option value="TRANSIT">Suburban Metro & Parking</option>
                      <option value="PRODUCTION">Production, Stage & SFX</option>
                      <option value="SAFETY">Safety, Medical & Protocol</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white mb-1.5">Priority Level</label>
                    <select
                      value={noticeFormData.priority}
                      onChange={(e) =>
                        setNoticeFormData({
                          ...noticeFormData,
                          priority: e.target.value as AnnouncementItem['priority'],
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="NOTICE">Standard Advisory (Gray)</option>
                      <option value="FEATURED">Featured Alert (Gold Amber)</option>
                      <option value="URGENT">Urgent Red Bulletin (High Priority)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1.5">Target Event</label>
                    <select
                      value={noticeFormData.event}
                      onChange={(e) => setNoticeFormData({ ...noticeFormData, event: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="Diljit Dosanjh — Dil-Luminati Arena India Tour">Diljit Dosanjh — Dil-Luminati Arena India Tour</option>
                      <option value="A.R. Rahman Live Symphonic Orchestra World Tour">A.R. Rahman Live Symphonic Orchestra World Tour</option>
                      <option value="Sunburn Youth EDM & Laser Light Festival 2026">Sunburn Youth EDM & Laser Light Festival 2026</option>
                      <option value="Arijit Singh Soulful Symphony Arena Tour">Arijit Singh Soulful Symphony Arena Tour</option>
                      <option value="Karan Aujla — It Was All A Dream Arena Tour">Karan Aujla — It Was All A Dream Arena Tour</option>
                      <option value="India Tech & AI Unicorn Founders Conclave 2026">India Tech & AI Unicorn Founders Conclave 2026</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white mb-1.5">Venue Enclosure / Sector</label>
                    <input
                      type="text"
                      required
                      value={noticeFormData.venue}
                      onChange={(e) => setNoticeFormData({ ...noticeFormData, venue: e.target.value })}
                      placeholder="e.g. JLN Stadium Arena, Gates 3 & 4"
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1.5">Official Notice Body & Instructions</label>
                  <textarea
                    rows={4}
                    required
                    value={noticeFormData.content}
                    onChange={(e) => setNoticeFormData({ ...noticeFormData, content: e.target.value })}
                    placeholder="Specify clear instructions for ticket holders, e.g. entry queue guidelines, wristband collections, bag policy, or metro dispersal updates..."
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-[#958ea0] focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={noticeFormData.pinned}
                      onChange={(e) => setNoticeFormData({ ...noticeFormData, pinned: e.target.checked })}
                      className="w-4 h-4 rounded border-white/20 bg-black/40 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-xs text-white font-medium flex items-center gap-1.5">
                      <Pin className="h-3 w-3 text-amber-400" /> Pin Notice to Top of Bulletin
                    </span>
                  </label>

                  <span className="text-[11px] text-[#958ea0] font-['Plus_Jakarta_Sans']">
                    Signed: <span className="text-purple-300 font-semibold">{noticeFormData.author}</span>
                  </span>
                </div>

                <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('ANNOUNCEMENTS')}
                    className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-medium text-[#958ea0] hover:text-white hover:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/30 transition"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Broadcast Official Notice
                  </button>
                </div>
              </form>
            </div>
          )
        ) : activeTab === 'SUBMIT' ? (
          /* ================= SUBMIT FEEDBACK FORM (ATTENDEES ONLY) ================= */
          isOrganizer ? (
            <div className="max-w-xl mx-auto glass-card p-8 rounded-2xl border border-amber-500/30 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <Lock className="h-6 w-6" />
              </div>
              <h2 className="font-['Outfit'] text-2xl font-bold text-white">Review Submissions Restricted for Organizers</h2>
              <p className="text-xs text-[#cbc3d7] leading-relaxed max-w-md mx-auto">
                To preserve authentic audience sentiment, event organizers are prohibited from submitting reviews on events. As an organizer, you can broadcast official production notices to inform attendees.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => setActiveTab('ALL')}
                  className="btn-secondary-ghost text-xs !py-2 !px-4"
                >
                  Back to All Updates
                </button>
                <button
                  onClick={() => setActiveTab('POST_NOTICE')}
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 transition"
                >
                  + Post Official Notice
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto glass-card p-6 sm:p-8 rounded-2xl border border-white/10 space-y-6">
              <div className="border-b border-white/[0.08] pb-4">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                  PUBLIC COMMUNITY REVIEW
                </span>
                <h2 className="font-['Outfit'] text-2xl font-bold text-white">Share Your Concert & Pass Experience</h2>
                <p className="text-xs text-[#958ea0] mt-1">
                  Your feedback helps thousands of fellow attendees and assists production teams in optimizing acoustics, gates, and crowd flow.
                </p>
              </div>

              {submitSuccess && (
                <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-3 text-xs">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  <div>
                    <strong className="block text-emerald-300 font-bold">Feedback Submitted Successfully!</strong>
                    <span>Your review has been published to the verified public community board.</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1.5">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.authorName}
                      onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                      placeholder="e.g. Siddhant Sharma"
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF5722]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white mb-1.5">Pass Enclosure</label>
                    <select
                      value={formData.passCategory}
                      onChange={(e) => setFormData({ ...formData, passCategory: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF5722]"
                    >
                      <option value="Diamond VIP Apex">Diamond VIP Apex (Fan Pit)</option>
                      <option value="Platinum Reserved">Platinum Reserved (Grandstand)</option>
                      <option value="Gold Pass Tier">Gold Pass Tier</option>
                      <option value="Silver General Pass">Silver General Pass</option>
                      <option value="Delegate Pass">Delegate Pass</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1.5">Select Event</label>
                  <select
                    value={formData.eventName}
                    onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF5722]"
                  >
                    <option value="Diljit Dosanjh — Dil-Luminati Arena India Tour">Diljit Dosanjh — Dil-Luminati Arena India Tour</option>
                    <option value="A.R. Rahman Live Symphonic Orchestra World Tour">A.R. Rahman Live Symphonic Orchestra World Tour</option>
                    <option value="Sunburn Youth EDM & Laser Light Festival 2026">Sunburn Youth EDM & Laser Light Festival 2026</option>
                    <option value="Arijit Singh Soulful Symphony Arena Tour">Arijit Singh Soulful Symphony Arena Tour</option>
                    <option value="Karan Aujla — It Was All A Dream Arena Tour">Karan Aujla — It Was All A Dream Arena Tour</option>
                    <option value="India Tech & AI Unicorn Founders Conclave 2026">India Tech & AI Unicorn Founders Conclave 2026</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1.5">Feedback Focus</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF5722]"
                    >
                      <option value="Sound & Stage 360°">Sound & Stage 360°</option>
                      <option value="Turnstiles & Gate Entry">Turnstiles & Gate Entry</option>
                      <option value="Acoustics & Orchestration">Acoustics & Orchestration</option>
                      <option value="Fan Pit & Seating Sightline">Fan Pit & Seating Sightline</option>
                      <option value="Food & Amenities">Food & Amenities</option>
                      <option value="Overall Experience">Overall Experience</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white mb-1.5">Experience Rating</label>
                    <div className="flex items-center gap-2 py-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setFormData({ ...formData, rating: star })}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 hover:scale-110 transition cursor-pointer"
                        >
                          <Star
                            className={`h-5 w-5 ${
                              (hoverRating || formData.rating) >= star
                                ? 'text-[#FFD026] fill-[#FFD026]'
                                : 'text-neutral-600'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-['Plus_Jakarta_Sans'] font-bold text-white ml-2">
                        {hoverRating || formData.rating} / 5 Stars
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1.5">Detailed Review & Commentary</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    placeholder="Share details about the sound quality, queue times at turnstiles, crowd energy, or suggestions for the tour director..."
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-[#958ea0] focus:outline-none focus:border-[#FF5722]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('FEEDBACKS')}
                    className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-medium text-[#958ea0] hover:text-white hover:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary-cta !text-xs !py-2.5 !px-6 font-semibold rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Publish Public Review
                  </button>
                </div>
              </form>
            </div>
          )
        ) : (
          /* ================= MAIN SPLIT OR FILTERED VIEW ================= */
          <div className="space-y-10">

            {/* SECTION 1: OFFICIAL ANNOUNCEMENTS */}
            {(activeTab === 'ALL' || activeTab === 'ANNOUNCEMENTS') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-[#FF5722]/15 border border-[#FF5722]/30 flex items-center justify-center text-[#FF5722]">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="font-['Outfit'] text-xl font-bold text-white">
                        Official Production Notices & Dispatches
                      </h2>
                      <span className="text-[11px] text-[#958ea0]">
                        Verified alerts from event organizers and venue directors
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isOrganizer ? (
                      <span className="text-[10px] text-[#958ea0] font-['Plus_Jakarta_Sans'] border border-white/10 px-2 py-0.5 rounded hidden sm:inline">
                        READ-ONLY DISPATCHES
                      </span>
                    ) : (
                      <button
                        onClick={() => setActiveTab('POST_NOTICE')}
                        className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" /> Post Notice
                      </button>
                    )}
                    <span className="badge-purple text-[10px] font-semibold">
                      {filteredAnnouncements.length} NOTICES
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredAnnouncements.map((notice) => {
                    const isUrgent = notice.priority === 'URGENT';
                    const isFeatured = notice.priority === 'FEATURED';

                    return (
                      <div
                        key={notice.id}
                        className={`glass-card p-5 sm:p-6 rounded-2xl border transition duration-300 relative flex flex-col justify-between ${
                          isUrgent
                            ? 'border-[#FF3366]/40 bg-[#FF3366]/[0.03] hover:border-[#FF3366]'
                            : isFeatured
                            ? 'border-[#FFD026]/40 bg-[#FFD026]/[0.03] hover:border-[#FFD026]'
                            : 'border-white/[0.08] hover:border-white/20'
                        }`}
                      >
                        <div>
                          {/* Badges & Meta */}
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              {notice.pinned && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                                  <Pin className="h-3 w-3" /> PINNED
                                </span>
                              )}
                              <span
                                className={`text-[10px] font-['Plus_Jakarta_Sans'] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                  isUrgent
                                    ? 'bg-[#FF3366]/20 text-[#ffb4ab] border border-[#FF3366]/40'
                                    : isFeatured
                                    ? 'bg-[#FFD026]/20 text-[#FFD026] border border-[#FFD026]/40'
                                    : 'bg-white/5 text-[#958ea0] border border-white/10'
                                }`}
                              >
                                {notice.category}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 text-xs text-[#958ea0]">
                              <Clock className="h-3.5 w-3.5" />
                              <span className="font-['Plus_Jakarta_Sans'] text-[11px]">{notice.timestamp}</span>
                            </div>
                          </div>

                          <h3 className="font-['Outfit'] text-lg font-bold text-white mb-2 leading-snug">
                            {notice.title}
                          </h3>

                          <p className="text-xs text-[#cbc3d7] leading-relaxed mb-4">
                            {notice.content}
                          </p>
                        </div>

                        {/* Footer Info */}
                        <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-white text-[11px] block">{notice.event}</span>
                            <span className="text-[10px] text-[#958ea0] flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-[#FF5722]" /> {notice.venue}
                            </span>
                          </div>

                          <button
                            onClick={() => handleCopyNotice(notice)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#958ea0] hover:text-white transition flex items-center gap-1 text-[11px]"
                            title="Copy Announcement Link"
                          >
                            {copiedNoticeId === notice.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Share2 className="h-3.5 w-3.5" />
                            )}
                            <span>{copiedNoticeId === notice.id ? 'Copied' : 'Share'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION 2: ATTENDEE REVIEWS & PUBLIC FEEDBACK */}
            {(activeTab === 'ALL' || activeTab === 'FEEDBACKS') && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-[#FFD026]/15 border border-[#FFD026]/30 flex items-center justify-center text-[#FFD026]">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="font-['Outfit'] text-xl font-bold text-white">
                        Public Community Reviews & Feedback
                      </h2>
                      <span className="text-[11px] text-[#958ea0]">
                        Real voices from verified passholders and concert delegates
                      </span>
                    </div>
                  </div>

                  {!isOrganizer ? (
                    <button
                      onClick={() => setActiveTab('SUBMIT')}
                      className="btn-secondary-ghost !text-xs !py-1.5 !px-3 font-semibold flex items-center gap-1.5 border-white/20 text-[#e5e1e4] hover:border-[#FF5722] hover:text-[#FFD026] cursor-pointer"
                    >
                      <Send className="h-3 w-3 text-[#FFD026]" />
                      Write a Review
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/[0.03] border border-white/10 text-[11px] text-[#958ea0]">
                      <Lock className="h-3 w-3 text-amber-400" />
                      <span className="hidden sm:inline">Attendee Reviews Only (Organizers Cannot Post)</span>
                      <span className="sm:hidden">Attendees Only</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredFeedbacks.map((item) => {
                    const isUpvoted = upvotedIds.has(item.id);

                    return (
                      <div
                        key={item.id}
                        className="glass-card p-5 rounded-2xl border border-white/[0.08] hover:border-white/20 transition flex flex-col justify-between"
                      >
                        <div>
                          {/* Author Header */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#FF5722] to-[#FFD026] text-black font-bold text-xs flex items-center justify-center font-['Plus_Jakarta_Sans']">
                                {item.authorName.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <strong className="text-white text-xs font-semibold">{item.authorName}</strong>
                                  {item.verified && (
                                    <span title="Verified Ticket Holder">
                                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-[#958ea0] font-['Plus_Jakarta_Sans']">{item.badge}</span>
                              </div>
                            </div>

                            {/* Stars */}
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3.5 w-3.5 ${
                                    i < item.rating
                                      ? 'text-[#FFD026] fill-[#FFD026]'
                                      : 'text-neutral-700'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Event & Category Tag */}
                          <div className="flex flex-wrap items-center gap-2 mb-2.5">
                            <span className="badge-purple text-[9px] font-semibold">{item.category}</span>
                            <span className="text-[11px] text-[#958ea0] truncate max-w-[240px]">
                              {item.eventName}
                            </span>
                          </div>

                          {/* Comment Body */}
                          <p className="text-xs text-[#e5e1e4] leading-relaxed mb-4">
                            "{item.comment}"
                          </p>
                        </div>

                        {/* Bottom Bar with Upvote */}
                        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#958ea0]">
                          <span className="font-['Plus_Jakarta_Sans'] text-[10px]">{item.timestamp}</span>

                          <button
                            onClick={() => handleUpvote(item.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition ${
                              isUpvoted
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-semibold'
                                : 'bg-white/5 border-white/10 text-[#958ea0] hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <ThumbsUp className={`h-3 w-3 ${isUpvoted ? 'text-amber-300' : ''}`} />
                            <span>Helpful ({item.helpfulCount})</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
