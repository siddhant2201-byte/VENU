import React from 'react';
import { Mail, Phone, Clock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#0A0A0C] text-[#e5e1e4] pt-12 pb-12 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">

          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1">
                <span className="h-4 w-1 bg-white transform -skew-x-[20deg] rounded-[1px]" />
                <span className="h-4 w-1 bg-[#FF7A00] transform -skew-x-[20deg] rounded-[1px]" />
                <span className="h-4 w-1 bg-[#FFD026] transform -skew-x-[20deg] rounded-[1px]" />
              </div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-extrabold tracking-wider text-white">
                VENU
              </h3>
            </div>
            <p className="font-['Plus_Jakarta_Sans'] text-xs text-[#958ea0] leading-relaxed max-w-md">
              India’s premier event infrastructure platform powering high-octane stadium concerts, iconic cultural galas, enterprise summits, and curated live experiences across major metropolitan circuits.
            </p>
          </div>

          <div className="md:col-span-4 space-y-3 font-['Plus_Jakarta_Sans'] text-[11px]">
            <h4 className="text-[10px] uppercase tracking-[0.18em] text-[#FFD026] font-semibold">
              PAN-INDIA REGIONAL HUBS
            </h4>
            <div className="space-y-1.5 text-[#958ea0]">
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-white">Mumbai</span>
                <span>BKC, Bandra Kurla Complex</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-white">New Delhi</span>
                <span>Barakhamba Road, CP</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-white">Bengaluru</span>
                <span>Lavelle Road, MG Road</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-white">Hyderabad</span>
                <span>HITEC City, Gachibowli</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-white">Goa</span>
                <span>Vagator Beach Road</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h4 className="font-['Plus_Jakarta_Sans'] text-[10px] uppercase tracking-[0.18em] text-[#FFD026] font-semibold">
              REACH OUT TO US
            </h4>
            <p className="font-['Plus_Jakarta_Sans'] text-xs text-[#958ea0] leading-relaxed">
              Planning a stadium concert, cultural festival, or private gala? Connect directly with our concierge team.
            </p>
            <div className="space-y-2.5 font-['Plus_Jakarta_Sans'] text-xs">
              <a
                href="mailto:concierge@venu.in"
                className="flex items-center gap-2.5 text-white/90 hover:text-[#FFD026] transition group"
              >
                <div className="h-7 w-7 rounded border border-white/10 bg-[#121118] flex items-center justify-center shrink-0 group-hover:border-[#FFD026]/40 transition">
                  <Mail className="h-3.5 w-3.5 text-[#FFD026]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-['Plus_Jakarta_Sans'] text-[#958ea0] uppercase tracking-wider">Email Us</span>
                  <span className="font-medium text-white group-hover:text-[#FFD026] transition">concierge@venu.in</span>
                </div>
              </a>

              <a
                href="tel:+919820012345"
                className="flex items-center gap-2.5 text-white/90 hover:text-[#4EFA98] transition group"
              >
                <div className="h-7 w-7 rounded border border-white/10 bg-[#121118] flex items-center justify-center shrink-0 group-hover:border-[#4EFA98]/40 transition">
                  <Phone className="h-3.5 w-3.5 text-[#4EFA98]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-['Plus_Jakarta_Sans'] text-[#958ea0] uppercase tracking-wider">Helpline & Concierge</span>
                  <span className="font-medium text-white group-hover:text-[#4EFA98] transition">+91 98200 12345</span>
                </div>
              </a>

              <div className="flex items-center gap-2.5 text-white/90 pt-0.5">
                <div className="h-7 w-7 rounded border border-white/10 bg-[#121118] flex items-center justify-center shrink-0">
                  <Clock className="h-3.5 w-3.5 text-[#FF7A00]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-['Plus_Jakarta_Sans'] text-[#958ea0] uppercase tracking-wider">Support</span>
                  <span className="text-[11px] text-[#cbc3d7]">24/7 Dedicated Indian Support (IST)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
