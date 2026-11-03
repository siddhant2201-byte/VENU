import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Shield, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isOrganizer = user?.roles?.some(
    (r) => r === 'ROLE_ORGANIZER' || r === 'ROLE_ADMIN' || r === 'ORGANIZER' || r === 'ADMIN'
  ) || false;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = isOrganizer
    ? [
        { label: 'EVENTS', path: '/events' },
        { label: 'BULLETIN & FEEDBACK', path: '/announcements' },
        { label: 'DASHBOARD', path: '/dashboard' },
        { label: 'ANALYTICS & ROSTER', path: '/analytics' },
      ]
    : [
        { label: 'EVENTS', path: '/events' },
        { label: 'BULLETIN & FEEDBACK', path: '/announcements' },
        { label: 'DASHBOARD', path: '/dashboard' },
        { label: 'MY PASSES', path: '/bookings' },
      ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#060608]/90 backdrop-blur-md px-6 py-3.5">
      <div className="mx-auto flex max-w-7xl items-center justify-between">

        <Link to="/" className="group flex items-center gap-2.5 transition">

          <div className="flex items-center gap-1">
            <span className="h-4 w-1 bg-white transform -skew-x-[20deg] rounded-[1px]" />
            <span className="h-4 w-1 bg-[#FF7A00] transform -skew-x-[20deg] rounded-[1px]" />
            <span className="h-4 w-1 bg-[#FFD026] transform -skew-x-[20deg] rounded-[1px]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-['Plus_Jakarta_Sans'] text-lg font-extrabold tracking-wider text-white">
              VENU
            </span>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-6 font-['Plus_Jakarta_Sans'] text-[11px] uppercase tracking-wider">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="text-[#958ea0] hover:text-white transition duration-200"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">

              <div className="flex items-center gap-2.5 rounded-[4px] border border-white/10 bg-[#121118]/80 px-3 py-1.5 backdrop-blur text-xs">
                <UserIcon className="h-3.5 w-3.5 text-[#958ea0]" />
                <span className="font-['Plus_Jakarta_Sans'] font-medium text-[#e5e1e4]">
                  {user.fullName}
                </span>
                <span className="badge-gold text-[9px] py-0.5 px-1.5">
                  <Shield className="h-2.5 w-2.5" />
                  {user.roles[0]?.replace('ROLE_', '') || 'DELEGATE'}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="btn-secondary-ghost text-xs border-white/20 text-[#cbc3d7] hover:border-[#FF5722] hover:text-[#FF5722] hover:bg-[#FF5722]/10 py-1.5 px-2.5"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/register"
                className="font-['Plus_Jakarta_Sans'] text-xs text-[#958ea0] hover:text-white transition px-2"
              >
                Sign Up
              </Link>

              <Link
                to="/login"
                className="btn-solid-white !py-1.5 !px-4 text-xs font-semibold"
              >
                Login
              </Link>
            </div>
          )}
        </div>

        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white hover:text-[#FF7A00]"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-white/[0.08] space-y-3 font-['Plus_Jakarta_Sans'] text-xs uppercase tracking-wider">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[#958ea0] hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="block py-2 text-[#FF5722] hover:text-[#FF7A00]"
            >
              SIGN OUT
            </button>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-secondary-ghost flex-1 text-center py-2 text-xs"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary-cta flex-1 text-center py-2 text-xs"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
