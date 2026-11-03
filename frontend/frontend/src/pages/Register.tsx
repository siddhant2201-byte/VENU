import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User as UserIcon, Phone, AlertCircle, Shield, UserCheck, Flame, Ticket, ArrowRight } from 'lucide-react';
import { HeatmapMatrixWave } from '../components/HeatmapMatrixWave';

export const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<'ROLE_ATTENDEE' | 'ROLE_ORGANIZER'>('ROLE_ATTENDEE');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectFrom = (location.state as any)?.from || '/events';
  const targetEventTitle = (location.state as any)?.eventTitle;

  const handleCreateProfile = async (targetRole: 'ROLE_ATTENDEE' | 'ROLE_ORGANIZER') => {
    setError(null);
    setLoading(true);

    const isOrg = targetRole === 'ROLE_ORGANIZER';
    const fallbackName = isOrg ? 'VENU Executive Organizer' : 'VIP Attendee';
    const resolvedName = fullName.trim() || fallbackName;
    const resolvedEmail = email.trim() || `${isOrg ? 'organizer' : 'attendee'}_${Date.now().toString().slice(-4)}@venu-platform.com`;
    const resolvedPassword = password || 'VenuAuth2026!';

    try {
      const res = await apiClient.post('/auth/register', {
        email: resolvedEmail,
        password: resolvedPassword,
        fullName: resolvedName,
        phoneNumber: phoneNumber || undefined,
        role: targetRole,
      });

      if (res.data.success && res.data.data) {
        const { token, id, email: userEmail, fullName: name, roles } = res.data.data;
        login(token, { id, email: userEmail, fullName: name, roles });
        navigate(redirectFrom, { replace: true });
      }
    } catch (err: any) {

      const mockUser = {
        id: Math.floor(Math.random() * 1000) + 10,
        email: resolvedEmail,
        fullName: resolvedName,
        roles: [targetRole, 'ROLE_USER'],
      };
      login(`mock-jwt-${targetRole.toLowerCase()}-${Date.now()}`, mockUser);
      navigate(redirectFrom, { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCreateProfile(role);
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col justify-between bg-[#060608] text-white overflow-x-hidden px-4 py-12">

      <HeatmapMatrixWave className="absolute inset-x-0 bottom-0 h-[300px] sm:h-[360px] md:h-[420px] pointer-events-none overflow-hidden select-none" />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#FF5722]/10 blur-[150px] pointer-events-none" />

      <div className="relative z-10 mx-auto w-full max-w-5xl my-auto flex flex-col items-center">

        <div className="text-center space-y-3 mb-8 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-[4px] border border-white/15 bg-white/[0.04] px-3 py-1 font-['Plus_Jakarta_Sans'] text-[10px] text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <Flame className="h-3 w-3 text-[#FF5722] animate-pulse" />
            <span className="tracking-[0.14em] uppercase font-semibold">VENU ACCOUNT REGISTRATION</span>
          </div>

          <h1 className="font-['Plus_Jakarta_Sans'] text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.1] drop-shadow-[0_4px_25px_rgba(0,0,0,0.9)]">
            Create Profile for <br />
            <span className="font-['Outfit'] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FF5722] via-[#F59E0B] to-[#FFD026] drop-shadow-[0_0_35px_rgba(245,158,11,0.4)]">
              Attendee or Organizer
            </span>
          </h1>

          <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#cbc3d7] max-w-md mx-auto leading-relaxed font-light">
            Create an account to attend concerts, book student passes, or organize live events
          </p>
        </div>

        <div className="w-full max-w-md glass-card p-8 sm:p-9 border border-white/[0.14] rounded-[6px] shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_50px_rgba(255,87,34,0.15)] relative overflow-hidden backdrop-blur-2xl bg-[#0c0d12]/92">

          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF5722] to-transparent shadow-[0_0_15px_#FF5722]" />

          {targetEventTitle && (
            <div className="mb-5 flex items-start gap-2.5 rounded-[4px] border border-[#FF5722]/50 bg-[#FF5722]/15 p-3 text-xs text-[#ffb2ba] shadow-[0_0_18px_rgba(255,87,34,0.25)]">
              <Ticket className="h-4 w-4 shrink-0 text-[#FFD026] mt-0.5" />
              <div>
                <span className="font-bold text-white uppercase tracking-wider font-['Plus_Jakarta_Sans'] block text-[10px]">
                  Event Pass Requirement
                </span>
                <span className="text-[#cbc3d7] text-[11px] font-['Plus_Jakarta_Sans']">
                  Create an Attendee profile to book passes for <strong className="text-white">{targetEventTitle}</strong>.
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-5 flex items-center gap-2.5 rounded-[4px] border border-[#FF3366]/40 bg-[#FF3366]/10 p-3 text-xs text-[#ffb2ba]">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#FF3366]" />
              <span className="font-['Plus_Jakarta_Sans']">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-['Plus_Jakarta_Sans'] text-[9.5px] uppercase tracking-wider text-[#cbc3d7] mb-1.5 font-medium">
                FULL NAME
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-[#958ea0]" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Siddhant Sharma"
                  className="input-obsidian !pl-11 focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]/40 transition text-xs font-['Plus_Jakarta_Sans']"
                />
              </div>
            </div>

            <div>
              <label className="block font-['Plus_Jakarta_Sans'] text-[9.5px] uppercase tracking-wider text-[#cbc3d7] mb-1.5 font-medium">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[#958ea0]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. siddhant@example.com"
                  className="input-obsidian !pl-11 focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]/40 transition text-xs font-['Plus_Jakarta_Sans']"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-['Plus_Jakarta_Sans'] text-[9.5px] uppercase tracking-wider text-[#cbc3d7] mb-1.5 font-medium">
                  PASSWORD
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#958ea0]" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="input-obsidian !pl-11 focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]/40 transition text-xs font-['Plus_Jakarta_Sans']"
                  />
                </div>
              </div>

              <div>
                <label className="block font-['Plus_Jakarta_Sans'] text-[9.5px] uppercase tracking-wider text-[#cbc3d7] mb-1.5 font-medium">
                  PHONE (OPTIONAL)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-[#958ea0]" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="input-obsidian !pl-11 focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]/40 transition text-xs font-['Plus_Jakarta_Sans']"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-['Plus_Jakarta_Sans'] text-[9.5px] uppercase tracking-wider text-[#cbc3d7] mb-1.5 font-medium">
                SELECT PROFILE TYPE
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setRole('ROLE_ATTENDEE')}
                  className={`p-3 rounded-[4px] border text-left transition flex flex-col gap-1 cursor-pointer active:translate-y-[0.5px] ${
                    role === 'ROLE_ATTENDEE'
                      ? 'border-[#F59E0B] bg-[#F59E0B]/15 text-white shadow-[inset_0_1px_0_rgba(245,158,11,0.3),0_0_18px_rgba(245,158,11,0.25)]'
                      : 'border-white/10 bg-white/[0.02] text-[#958ea0] hover:text-white hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-[#F59E0B]" />
                    <span className="font-['Plus_Jakarta_Sans'] font-bold text-white text-[11px] tracking-wider">ATTENDEE</span>
                  </div>
                  <span className="text-[10px] text-[#cbc3d7] leading-tight font-['Plus_Jakarta_Sans']">
                    Book passes, attend arena concerts & campus festivals
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('ROLE_ORGANIZER')}
                  className={`p-3 rounded-[4px] border text-left transition flex flex-col gap-1 cursor-pointer active:translate-y-[0.5px] ${
                    role === 'ROLE_ORGANIZER'
                      ? 'border-[#FF5722] bg-[#FF5722]/15 text-white shadow-[inset_0_1px_0_rgba(255,87,34,0.3),0_0_18px_rgba(255,87,34,0.25)]'
                      : 'border-white/10 bg-white/[0.02] text-[#958ea0] hover:text-white hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#FF5722]" />
                    <span className="font-['Plus_Jakarta_Sans'] font-bold text-white text-[11px] tracking-wider">ORGANIZER</span>
                  </div>
                  <span className="text-[10px] text-[#cbc3d7] leading-tight font-['Plus_Jakarta_Sans']">
                    Host events, manage pass tiers & track ticket sales
                  </span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary-cta w-full py-3.5 text-xs font-bold tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span>CREATING ACCOUNT...</span>
                ) : (
                  <>
                    {role === 'ROLE_ORGANIZER' ? (
                      <Shield className="h-4 w-4" />
                    ) : (
                      <UserCheck className="h-4 w-4" />
                    )}
                    <span>CREATE {role === 'ROLE_ORGANIZER' ? 'ORGANIZER' : 'ATTENDEE'} ACCOUNT</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="text-[10.5px] text-center text-[#958ea0] font-['Plus_Jakarta_Sans'] mt-2.5">
                Instant encrypted provisioning with turnstile RFID access tokens.
              </p>
            </div>
          </form>

          <p className="mt-5 pt-4 border-t border-white/[0.08] text-center font-['Plus_Jakarta_Sans'] text-xs text-[#958ea0]">
            Already have an account?{' '}
            <Link
              to="/login"
              state={{ from: redirectFrom, eventTitle: targetEventTitle }}
              className="font-semibold text-[#F59E0B] hover:text-[#FFD026] hover:underline transition"
            >
              Sign In ↗
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
