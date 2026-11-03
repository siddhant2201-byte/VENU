import React, { useEffect, useState, useCallback } from 'react';
import {
  Radio,
  Flame,
  Zap,
  Mic2,
  Sparkles
} from 'lucide-react';
import { analyticsApi } from '../api/events';

export const OrganizerAnalytics: React.FC = () => {
  type ShowSimulationMode = 'AUTO' | 'SIMULATE_UPCOMING' | 'SIMULATE_PRESHOW' | 'SIMULATE_MAIN_SHOW' | 'SIMULATE_POSTSHOW';
  const [simMode, setSimMode] = useState<ShowSimulationMode>('AUTO');
  const [nowDate, setNowDate] = useState<Date>(new Date());
  const [ambienceLightingDimmed, setAmbienceLightingDimmed] = useState(false);
  const [serviceProtocolArmed, setServiceProtocolArmed] = useState(false);
  const [fireworksPrimed, setFireworksPrimed] = useState(true);
  const [commsBroadcastActive, setCommsBroadcastActive] = useState(false);

  const [currentTime, setCurrentTime] = useState(() => new Date().toLocaleTimeString('en-GB', { hour12: false }));

  const [realSoldSeats, setRealSoldSeats] = useState<number>(2);
  const [realRevenue, setRealRevenue] = useState<number>(17596);

  const syncTelemetry = useCallback(() => {
    let bookedSeats = 0;
    let revenue = 0;
    let found = false;

    try {
      const raw = localStorage.getItem('venu_user_bookings');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          const activeList = list.filter((b: any) => b.status !== 'CANCELLED');
          const diljitBookings = activeList.filter(
            (b: any) => b.eventId === 1 || b.eventTitle?.toLowerCase().includes('diljit')
          );
          const targetBookings = diljitBookings.length > 0 ? diljitBookings : activeList;

          if (targetBookings.length > 0) {
            found = true;
            targetBookings.forEach((b: any) => {
              if (Array.isArray(b.seats) && b.seats.length > 0) {
                bookedSeats += b.seats.length;
              } else {
                bookedSeats += 1;
              }
              revenue += Number(b.totalAmount) || 0;
            });
          }
        }
      }
    } catch (e) {
      console.warn('Telemetry storage parse error', e);
    }

    if (found) {
      setRealSoldSeats(bookedSeats);
      setRealRevenue(revenue);
    }
  }, []);

  useEffect(() => {
    syncTelemetry();

    analyticsApi.getAnalytics().then((res) => {
      if (res && res.success && res.data && res.data.soldSeats > 0) {
        setRealSoldSeats((prev) => Math.max(prev, res.data.soldSeats));
        if (res.data.totalRevenue) {
          setRealRevenue((prev) => Math.max(prev, Number(res.data.totalRevenue)));
        }
      }
    }).catch(() => {});

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'venu_user_bookings') {
        syncTelemetry();
      }
    };
    const handleCustom = () => syncTelemetry();

    window.addEventListener('storage', handleStorage);
    window.addEventListener('venu_bookings_updated', handleCustom);

    const pollInterval = setInterval(() => {
      syncTelemetry();
    }, 1500);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('venu_bookings_updated', handleCustom);
      clearInterval(pollInterval);
    };
  }, [syncTelemetry]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setNowDate(now);
      setCurrentTime(now.toLocaleTimeString('en-GB', { hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Show Timeline Constants (IST 24-hr format)
  // Phase 1 (19:30): 19 * 3600 + 30 * 60 = 70200
  // Phase 2 (20:30): 20 * 3600 + 30 * 60 = 73800
  // Phase 3 (23:00): 23 * 3600 = 82800
  // Concluded (23:45): 23 * 3600 + 45 * 60 = 85500
  const PRESHOW_SEC = 19 * 3600 + 30 * 60;
  const MAIN_SHOW_SEC = 20 * 3600 + 30 * 60;
  const POSTSHOW_SEC = 23 * 3600;
  const CONCLUDE_SEC = 23 * 3600 + 45 * 60;

  const realClockSeconds = nowDate.getHours() * 3600 + nowDate.getMinutes() * 60 + nowDate.getSeconds();

  let effectiveSeconds = realClockSeconds;
  if (simMode === 'SIMULATE_UPCOMING') {
    effectiveSeconds = 12 * 3600 + 23 * 60 + 56; // 12:23:56 (Upcoming)
  } else if (simMode === 'SIMULATE_PRESHOW') {
    effectiveSeconds = PRESHOW_SEC + 15 * 60; // 19:45 (Gates open)
  } else if (simMode === 'SIMULATE_MAIN_SHOW') {
    effectiveSeconds = MAIN_SHOW_SEC + 14 * 60 + 42; // 20:44:42 (Live show)
  } else if (simMode === 'SIMULATE_POSTSHOW') {
    effectiveSeconds = POSTSHOW_SEC + 10 * 60; // 23:10 (Encore)
  }

  const isUpcoming = effectiveSeconds < PRESHOW_SEC;
  const isPreShow = effectiveSeconds >= PRESHOW_SEC && effectiveSeconds < MAIN_SHOW_SEC;
  const isMainShow = effectiveSeconds >= MAIN_SHOW_SEC && effectiveSeconds < POSTSHOW_SEC;
  const isPostShow = effectiveSeconds >= POSTSHOW_SEC && effectiveSeconds < CONCLUDE_SEC;
  const isConcluded = effectiveSeconds >= CONCLUDE_SEC;

  const formatCountdown = (diffSec: number) => {
    if (diffSec <= 0) return '00:00:00';
    const h = Math.floor(diffSec / 3600);
    const m = Math.floor((diffSec % 3600) / 60);
    const s = diffSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  const totalCapacity = 35000;
  const occupancyPercent = totalCapacity > 0 ? (realSoldSeats / totalCapacity) * 100 : 0;
  const formattedPercent =
    occupancyPercent >= 10
      ? occupancyPercent.toFixed(1)
      : occupancyPercent > 0
      ? occupancyPercent.toFixed(1)
      : '0.0';

  const circumference = 2 * Math.PI * 42;
  const strokeOffset =
    circumference * (1 - Math.min(1, Math.max(0.015, occupancyPercent / 100)));

  const tierColor =
    occupancyPercent >= 70 ? '#FF3366' : occupancyPercent >= 20 ? '#FFD026' : '#00F0FF';

  return (
    <div className="bg-[#0A0A0C] text-[#e5e1e4] min-h-screen px-6 py-10 bg-ambient-radial">
      <div className="mx-auto max-w-7xl space-y-8">

        <div className="glass-card p-6 border border-white/[0.12] shadow-[0_0_40px_rgba(139,92,246,0.15)] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div>
              <span className="font-['Plus_Jakarta_Sans'] text-[10px] uppercase tracking-widest font-semibold text-[#958ea0] block">
                ACTIVE EXECUTIVE ROSTER
              </span>
              <div>
                <h1 className="font-['Outfit'] text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Diljit Dosanjh — Dil-Luminati Tour
                </h1>
              </div>
            </div>

            <div className="border-l border-white/[0.1] pl-4 space-y-0.5">
              <span className="font-['Plus_Jakarta_Sans'] text-sm text-white font-medium block">
                JLN Stadium Arena & Main Bowl, New Delhi
              </span>
              <div className="flex items-center gap-2 font-['Plus_Jakarta_Sans'] text-[10px] font-medium">
                {isUpcoming ? (
                  <>
                    <span className="flex items-center gap-1.5 text-amber-400 font-semibold tracking-wide">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                      PRE-SHOW COUNTDOWN
                    </span>
                    <span className="text-[#958ea0]">
                      • T-{formatCountdown(PRESHOW_SEC - effectiveSeconds)} TO GATES OPEN (19:30 IST)
                    </span>
                  </>
                ) : isPreShow ? (
                  <>
                    <span className="flex items-center gap-1.5 text-amber-400 font-semibold tracking-wide">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                      GATES OPEN & SOUNDCHECK ACTIVE
                    </span>
                    <span className="text-[#958ea0]">
                      • T-{formatCountdown(MAIN_SHOW_SEC - effectiveSeconds)} TO HEADLINE SET
                    </span>
                  </>
                ) : isMainShow ? (
                  <>
                    <span className="flex items-center gap-1.5 text-[#FF3366] font-semibold tracking-wide">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#FF3366] animate-pulse" />
                      TELEMETRY LIVE
                    </span>
                    <span className="text-[#958ea0]">• RUN-OF-SHOW SYNCHRONIZED</span>
                  </>
                ) : isPostShow ? (
                  <>
                    <span className="flex items-center gap-1.5 text-[#FFD026] font-semibold tracking-wide">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#FFD026] animate-pulse" />
                      ENCORE FINALE & DISPERSAL
                    </span>
                    <span className="text-[#958ea0]">• METRO TRANSIT SYNCHRONIZED</span>
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold tracking-wide">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      SHOW CONCLUDED
                    </span>
                    <span className="text-[#958ea0]">• ALL PHASES COMPLETE</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-['Plus_Jakarta_Sans'] text-xs">
            <div className="bg-white/[0.02] px-4 py-2.5 rounded-[6px] border border-white/[0.06]">
              <span className="text-[9px] text-[#958ea0] uppercase tracking-wider block font-semibold mb-0.5">
                MUMBAI / NEW DELHI (IST UTC+05:30)
              </span>
              <strong className="font-['Outfit'] text-white text-lg font-bold tracking-wide">{currentTime}</strong>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] font-['Plus_Jakarta_Sans'] text-xs">
              <strong className="text-white text-base font-['Outfit'] font-bold">
                Show Schedule & Timeline
              </strong>
              <span className="badge-purple text-[9px] font-semibold">3 PHASES</span>
            </div>

            <div className="space-y-3">

              {/* Phase 1 */}
              <div
                className={`glass-card p-5 border transition duration-300 ${
                  isPreShow
                    ? 'border-[#FF7A00] bg-[#FF7A00]/[0.06] shadow-[0_0_25px_rgba(255,122,0,0.25)] ring-1 ring-[#FF7A00]/50'
                    : isUpcoming
                    ? 'border-white/[0.08] opacity-95'
                    : 'border-white/[0.04] opacity-75'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5 font-['Plus_Jakarta_Sans'] text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="font-['Outfit'] text-white font-bold text-sm">19:30</span>
                    <span className="badge-subtle text-[9px] font-semibold">PRE-SHOW</span>
                    {isPreShow && (
                      <span className="badge-rose text-[9px] font-bold flex items-center gap-1.5 bg-[#FF7A00]/20 text-[#FF7A00] border border-[#FF7A00]/40">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        GATES ACTIVE
                      </span>
                    )}
                  </div>
                  {isUpcoming ? (
                    <span className="text-amber-400 text-xs font-['Plus_Jakarta_Sans'] font-medium">
                      OPENS IN {formatCountdown(PRESHOW_SEC - effectiveSeconds)}
                    </span>
                  ) : isPreShow ? (
                    <span className="font-['Outfit'] text-[#FFD026] font-semibold text-xs tracking-wide">
                      ELAPSED: {formatElapsed(effectiveSeconds - PRESHOW_SEC)}
                    </span>
                  ) : (
                    <span className="badge-subtle text-[9px] font-semibold text-emerald-400">✓ COMPLETED</span>
                  )}
                </div>
                <h3 className="font-['Outfit'] text-lg font-bold text-white mb-1">
                  Pre-Show Soundcheck & Gates Open
                </h3>
                <p className="font-['Plus_Jakarta_Sans'] text-xs font-normal text-[#958ea0]">
                  Line-array soundcheck finished. Main stadium gates open for turnstile check-in and food promenade access.
                </p>
              </div>

              {/* Phase 2: Main Show */}
              <div
                className={`glass-card p-6 border transition duration-300 relative overflow-hidden ${
                  isMainShow
                    ? 'border-[#FF3366] bg-[#FF3366]/[0.05] shadow-[0_0_30px_rgba(255,51,102,0.2)] ring-1 ring-[#FF3366]/40'
                    : isUpcoming || isPreShow
                    ? 'border-white/[0.08] hover:border-white/15'
                    : 'border-white/[0.04] opacity-75'
                }`}
              >
                <div className="flex items-center justify-between mb-2 font-['Plus_Jakarta_Sans'] text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className={`font-['Outfit'] font-bold text-base ${isMainShow ? 'text-[#FF3366]' : 'text-white'}`}>
                      20:30
                    </span>
                    {isMainShow ? (
                      <span className="badge-rose text-[9px] font-bold flex items-center gap-1.5">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        LIVE NOW
                      </span>
                    ) : isUpcoming || isPreShow ? (
                      <span className="badge-subtle text-[9px] font-semibold text-[#958ea0]">
                        MAIN ACT
                      </span>
                    ) : (
                      <span className="badge-subtle text-[9px] font-semibold text-emerald-400">
                        ✓ COMPLETED
                      </span>
                    )}
                  </div>
                  {isMainShow ? (
                    <span className="font-['Outfit'] text-[#FFD026] font-semibold text-xs tracking-wide">
                      ELAPSED: {formatElapsed(effectiveSeconds - MAIN_SHOW_SEC)}
                    </span>
                  ) : isUpcoming || isPreShow ? (
                    <span className="text-[#958ea0] font-['Plus_Jakarta_Sans'] text-xs">
                      STARTS IN {formatCountdown(MAIN_SHOW_SEC - effectiveSeconds)}
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-['Plus_Jakarta_Sans'] text-xs font-semibold">
                      SET WRAPPED
                    </span>
                  )}
                </div>

                <h3 className="font-['Outfit'] text-2xl font-bold text-white mb-1.5">
                  Main Show: Diljit Dosanjh Live in Arena
                </h3>
                <p className="font-['Plus_Jakarta_Sans'] text-xs font-normal text-[#e5e1e4] leading-relaxed">
                  Headline arena concert with full live band, 360° runway stage, synchronized laser visuals, and special guest collaborations.
                </p>
              </div>

              {/* Phase 3: Post-Show */}
              <div
                className={`glass-card p-5 border transition duration-300 ${
                  isPostShow
                    ? 'border-[#FFD026] bg-[#FFD026]/[0.05] shadow-[0_0_25px_rgba(255,208,38,0.2)] ring-1 ring-[#FFD026]/40'
                    : isConcluded
                    ? 'border-white/[0.04] opacity-75'
                    : 'border-white/[0.06] opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5 font-['Plus_Jakarta_Sans'] text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="font-['Outfit'] text-[#FFD026] font-bold text-sm">23:00</span>
                    <span className="badge-gold text-[9px] font-semibold">POST-SHOW</span>
                    {isPostShow && (
                      <span className="badge-rose text-[9px] font-bold flex items-center gap-1.5 bg-[#FFD026]/20 text-[#FFD026] border border-[#FFD026]/40">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        ENCORE ACTIVE
                      </span>
                    )}
                  </div>
                  {isPostShow ? (
                    <span className="font-['Outfit'] text-[#FFD026] font-semibold text-xs tracking-wide">
                      ELAPSED: {formatElapsed(effectiveSeconds - POSTSHOW_SEC)}
                    </span>
                  ) : isConcluded ? (
                    <span className="badge-subtle text-[9px] font-semibold text-emerald-400">✓ COMPLETED</span>
                  ) : (
                    <span className="text-[#958ea0] text-xs font-medium">
                      STARTS IN {formatCountdown(POSTSHOW_SEC - effectiveSeconds)}
                    </span>
                  )}
                </div>
                <h3 className="font-['Outfit'] text-lg font-bold text-white mb-1">
                  Encore Finale & Venue Dispersal
                </h3>
                <p className="font-['Plus_Jakarta_Sans'] text-xs font-normal text-[#958ea0]">
                  Grand finale curtain call, crowd exit across all stadium turnstiles, and direct suburban metro transit connections.
                </p>
              </div>
            </div>

            <div className="glass-card p-5 border border-white/[0.06]">
              <div className="flex items-center justify-between pb-2.5 mb-3.5 border-b border-white/[0.04] font-['Plus_Jakarta_Sans'] text-[10px]">
                <span className="text-[#958ea0] uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  VENUE & PRODUCTION VITALS
                </span>
                <span className="text-emerald-400 font-semibold tracking-wide">ALL SYSTEMS NOMINAL</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-['Plus_Jakarta_Sans'] text-center">
                <div className="p-3 rounded-[6px] bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[9px] text-[#958ea0] uppercase font-semibold tracking-wider block">AUDIO LEVEL</span>
                  <strong className="font-['Outfit'] text-white text-base font-bold block mt-1">92 dB</strong>
                  <span className="text-[10px] text-emerald-400 font-medium block mt-0.5">Normal (Max 98)</span>
                </div>

                <div className="p-3 rounded-[6px] bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[9px] text-[#958ea0] uppercase font-semibold tracking-wider block">STAGE POWER</span>
                  <strong className="font-['Outfit'] text-white text-base font-bold block mt-1">100% STABLE</strong>
                  <span className="text-[10px] text-emerald-400 font-medium block mt-0.5">Dual Backup</span>
                </div>

                <div className="p-3 rounded-[6px] bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[9px] text-[#958ea0] uppercase font-semibold tracking-wider block">ARENA TEMP</span>
                  <strong className="font-['Outfit'] text-white text-base font-bold block mt-1">21.5 °C</strong>
                  <span className="text-[10px] text-[#FFD026] font-medium block mt-0.5">HVAC Active</span>
                </div>

                <div className="p-3 rounded-[6px] bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[9px] text-[#958ea0] uppercase font-semibold tracking-wider block">METRO TRANSIT</span>
                  <strong className="font-['Outfit'] text-white text-base font-bold block mt-1">ON SCHEDULE</strong>
                  <span className="text-[10px] text-[#00F0FF] font-medium block mt-0.5">Gates 1–4 Open</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">

            <div className="glass-card p-6 border border-white/[0.08]">
              <div className="flex items-center justify-between mb-4 font-['Plus_Jakarta_Sans'] text-xs">
                <div className="flex items-center gap-2">
                  <strong className="text-white text-base font-['Outfit'] font-bold">
                    Venue Telemetry
                  </strong>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-['Plus_Jakarta_Sans'] text-[9.5px] font-semibold tracking-wider">
                    <span className="inline-block h-1.5 w-1.5 rounded-[1px] bg-emerald-400 animate-pulse" />
                    REALTIME
                  </span>
                </div>
                <span
                  style={{ color: tierColor }}
                  className="font-bold text-xs tracking-wider font-['Outfit'] transition-colors duration-500"
                >
                  {formattedPercent}% OCCUPIED
                </span>
              </div>

              <div className="flex items-center gap-6 my-2">

                <div className="relative h-28 w-28 shrink-0 flex items-center justify-center">
                  <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      className="text-white/[0.08]"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      stroke={tierColor}
                      strokeWidth="8"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeOffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="font-['Outfit'] text-2xl font-bold text-white block">
                      {formattedPercent}%
                    </span>
                    <span className="font-['Plus_Jakarta_Sans'] text-[9px] uppercase tracking-wider font-semibold text-[#958ea0]">
                      FILLED
                    </span>
                  </div>
                </div>

                <div className="space-y-3 font-['Plus_Jakarta_Sans'] flex-1">

                  <div className="p-3.5 rounded-[6px] bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#958ea0] uppercase tracking-wider font-semibold block">
                        SEATS BOOKED
                      </span>
                      <strong className="font-['Outfit'] text-white text-xl font-bold block mt-0.5">
                        {realSoldSeats.toLocaleString('en-IN')}{' '}
                        <span className="text-xs text-[#958ea0] font-normal font-['Plus_Jakarta_Sans']">
                          / {totalCapacity.toLocaleString('en-IN')}
                        </span>
                      </strong>
                    </div>
                    <span className="badge-purple text-[9px] font-semibold">CONFIRMED</span>
                  </div>

                  <div className="p-3.5 rounded-[6px] bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#958ea0] uppercase tracking-wider font-semibold block">
                        TOTAL REVENUE
                      </span>
                      <strong className="font-['Outfit'] text-[#FFD026] text-xl font-bold block mt-0.5">
                        ₹{realRevenue.toLocaleString('en-IN')}
                      </strong>
                    </div>
                    <span className="badge-gold text-[9px] font-semibold">LIVE REVENUE</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-5 border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between font-['Plus_Jakarta_Sans'] text-xs">
                <strong className="text-white text-base font-['Outfit'] font-bold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#FFD026]" />
                  Quick Controls
                </strong>
                <span className="text-[#958ea0] text-[9.5px] font-medium tracking-wider">DIRECTOR OVERRIDES</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 font-['Plus_Jakarta_Sans'] text-xs">

                <button
                  type="button"
                  onClick={() => setAmbienceLightingDimmed(!ambienceLightingDimmed)}
                  className={`p-3 rounded-[6px] border text-left flex items-center justify-between transition ${
                    ambienceLightingDimmed
                      ? 'border-[#FFD026]/50 bg-[#FFD026]/10 text-white'
                      : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] text-[#cbc3d7]'
                  }`}
                >
                  <span className="font-semibold text-white truncate">Stage Lights</span>
                  <span className={`font-['Outfit'] text-xs font-bold ${ambienceLightingDimmed ? 'text-[#FFD026]' : 'text-[#958ea0]'}`}>
                    {ambienceLightingDimmed ? '30% DIM' : '100%'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setServiceProtocolArmed(!serviceProtocolArmed)}
                  className={`p-3 rounded-[6px] border text-left flex items-center justify-between transition ${
                    serviceProtocolArmed
                      ? 'border-[#FF3366]/50 bg-[#FF3366]/10 text-white'
                      : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] text-[#cbc3d7]'
                  }`}
                >
                  <span className="font-semibold text-white truncate">Stage Hold</span>
                  <span className={`font-['Outfit'] text-xs font-bold ${serviceProtocolArmed ? 'text-[#FF3366]' : 'text-emerald-400'}`}>
                    {serviceProtocolArmed ? 'HOLD' : 'ACTIVE'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFireworksPrimed(!fireworksPrimed)}
                  className={`p-3 rounded-[6px] border text-left flex items-center justify-between transition ${
                    fireworksPrimed
                      ? 'border-[#FF5722]/50 bg-[#FF5722]/10 text-white'
                      : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] text-[#cbc3d7]'
                  }`}
                >
                  <span className="font-semibold text-white truncate">Pyrotechnics</span>
                  <Flame className={`h-4 w-4 ${fireworksPrimed ? 'text-[#FF5722]' : 'text-[#958ea0]'}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setCommsBroadcastActive(!commsBroadcastActive)}
                  className={`p-3 rounded-[6px] border text-left flex items-center justify-between transition ${
                    commsBroadcastActive
                      ? 'border-[#8B5CF6]/50 bg-[#8B5CF6]/10 text-white'
                      : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] text-[#cbc3d7]'
                  }`}
                >
                  <span className="font-semibold text-white truncate">Crew Comms</span>
                  <Radio className={`h-4 w-4 ${commsBroadcastActive ? 'text-[#8B5CF6] animate-pulse' : 'text-[#958ea0]'}`} />
                </button>
              </div>

              {/* Director Simulation Mode Overrides */}
              <div className="pt-2 border-t border-white/[0.06] flex flex-col gap-1.5 font-['Plus_Jakarta_Sans']">
                <span className="text-[9.5px] text-[#958ea0] uppercase font-semibold tracking-wider">
                  TIMELINE SIMULATION MODE:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-['Plus_Jakarta_Sans'] text-[10px]">
                  <button
                    type="button"
                    onClick={() => setSimMode('AUTO')}
                    className={`py-1 px-1.5 rounded text-center transition ${
                      simMode === 'AUTO'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                        : 'bg-white/[0.02] border border-white/[0.06] text-[#958ea0] hover:text-white'
                    }`}
                  >
                    ● AUTO (REAL CLOCK)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimMode('SIMULATE_UPCOMING')}
                    className={`py-1 px-1.5 rounded text-center transition ${
                      simMode === 'SIMULATE_UPCOMING'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                        : 'bg-white/[0.02] border border-white/[0.06] text-[#958ea0] hover:text-white'
                    }`}
                  >
                    12:23 PM (UPCOMING)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimMode('SIMULATE_PRESHOW')}
                    className={`py-1 px-1.5 rounded text-center transition ${
                      simMode === 'SIMULATE_PRESHOW'
                        ? 'bg-[#FF7A00]/20 text-[#FF7A00] border border-[#FF7A00]/40 font-bold'
                        : 'bg-white/[0.02] border border-white/[0.06] text-[#958ea0] hover:text-white'
                    }`}
                  >
                    19:45 (GATES)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimMode('SIMULATE_MAIN_SHOW')}
                    className={`py-1 px-1.5 rounded text-center transition ${
                      simMode === 'SIMULATE_MAIN_SHOW'
                        ? 'bg-[#FF3366]/20 text-[#ffb4ab] border border-[#FF3366]/40 font-bold'
                        : 'bg-white/[0.02] border border-white/[0.06] text-[#958ea0] hover:text-white'
                    }`}
                  >
                    20:30 (LIVE SET)
                  </button>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between font-['Plus_Jakarta_Sans'] text-xs">
                <strong className="text-white text-base font-['Outfit'] font-bold flex items-center gap-2">
                  <Mic2 className="h-4 w-4 text-[#FFD026]" />
                  Artist Lineup & Special Guests
                </strong>
                <span className="badge-gold text-[9px] font-semibold tracking-wider">CONFIRMED ROSTER</span>
              </div>

              <div className="space-y-3 font-['Plus_Jakarta_Sans'] text-xs">

                <div className="flex justify-between items-center py-2.5 border-b border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-[4px] bg-[#FF3366]/20 border border-[#FF3366]/50 flex items-center justify-center font-bold text-xs text-[#FF3366]">
                      ★
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="font-['Outfit'] text-white block text-sm font-bold tracking-tight">Diljit Dosanjh</strong>
                        <span className="badge-rose text-[8.5px] font-bold py-0.5 px-2">MAIN ARTIST</span>
                      </div>
                      <span className="text-[11px] text-[#958ea0] font-normal">Lead Headliner • Live Arena Set</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-['Outfit'] font-bold text-xs tracking-wider block ${
                      isMainShow
                        ? 'text-[#FF3366] animate-pulse'
                        : isUpcoming || isPreShow
                        ? 'text-[#958ea0]'
                        : 'text-emerald-400'
                    }`}>
                      {isMainShow ? '★ LIVE ON STAGE' : isUpcoming || isPreShow ? '20:30 SET' : '✓ SET WRAPPED'}
                    </span>
                    <span className="text-[10px] text-[#958ea0] block font-medium">Main Arena Stage</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-2.5 border-b border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-[4px] bg-[#8B5CF6]/20 border border-[#8B5CF6]/50 flex items-center justify-center font-bold text-xs text-[#8B5CF6]">
                      II
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="font-['Outfit'] text-white block text-sm font-bold tracking-tight">Ikky & Live Orchestra</strong>
                        <span className="badge-purple text-[8.5px] font-bold py-0.5 px-2">SECONDARY ARTIST</span>
                      </div>
                      <span className="text-[11px] text-[#958ea0] font-normal">Music Production & Opening Act</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-['Outfit'] font-bold text-xs tracking-wider block ${
                      isPreShow
                        ? 'text-[#FF7A00] animate-pulse'
                        : isUpcoming
                        ? 'text-[#958ea0]'
                        : 'text-emerald-400'
                    }`}>
                      {isPreShow ? '★ LIVE OPENING SET' : isUpcoming ? '19:45 SET' : '✓ SET WRAPPED'}
                    </span>
                    <span className="text-[10px] text-[#958ea0] block font-medium">Stage Active</span>
                  </div>
                </div>

                <div className="py-2.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-[#FFD026] flex items-center gap-1.5 font-bold">
                      <Sparkles className="h-3.5 w-3.5" />
                      SPECIAL GUESTS LISTED
                    </span>
                    <span className="text-[10px] text-[#958ea0] font-semibold">2 CONFIRMED</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-[6px] bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                      <div>
                        <strong className="font-['Outfit'] text-white text-sm font-bold block">Badshah</strong>
                        <span className="text-[10.5px] text-[#958ea0] font-normal">Surprise Collaboration Act</span>
                      </div>
                      <span className="badge-gold text-[8.5px] font-bold">GUEST</span>
                    </div>

                    <div className="p-3 rounded-[6px] bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                      <div>
                        <strong className="font-['Outfit'] text-white text-sm font-bold block">Ed Sheeran</strong>
                        <span className="text-[10.5px] text-[#958ea0] font-normal">Duet Special Appearance</span>
                      </div>
                      <span className="badge-gold text-[8.5px] font-bold">GUEST</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
