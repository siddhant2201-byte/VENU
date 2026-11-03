import { CURATED_DOSSIERS } from '../pages/Events';
import type { EventItem, BookingItem } from '../api/events';
import { useState, useEffect, useCallback } from 'react';

const REALTIME_CHANNEL_NAME = 'venu_realtime_inventory_bus';

// Clean up any stale unmanaged depletions from previous sessions
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('venu_realtime_pass_depletions');
  } catch (e) {
    // ignore
  }
}

let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(REALTIME_CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel not available', e);
  }
}

export const EVENT_BASELINE_SEATS: Record<number, { totalSeats: number; availableSeats: number }> = {
  1: { totalSeats: 25000, availableSeats: 480 },
  2: { totalSeats: 22000, availableSeats: 350 },
  3: { totalSeats: 15000, availableSeats: 320 },
  4: { totalSeats: 18000, availableSeats: 210 },
  5: { totalSeats: 12000, availableSeats: 180 },
  6: { totalSeats: 1200, availableSeats: 94 },
};

export const getCustomCreatedEvents = (): EventItem[] => {
  if (typeof window === 'undefined') return [];
  const list: EventItem[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('venu_custom_event_meta_')) {
        const val = localStorage.getItem(key);
        if (val) {
          const parsed = JSON.parse(val);
          if (parsed && parsed.id) {
            list.push(parsed);
          }
        }
      }
    }
  } catch (e) {
    console.warn('Failed retrieving custom created events', e);
  }
  return list;
};

export const getBookedPassCountForEvent = (eventId: number | string): number => {
  if (typeof window === 'undefined') return 0;
  const numId = Number(eventId);
  let totalBooked = 0;

  try {
    const localBookingsStr = localStorage.getItem('venu_user_bookings');
    if (localBookingsStr) {
      const bookings: BookingItem[] = JSON.parse(localBookingsStr);
      for (const b of bookings) {
        if (Number(b.eventId) === numId && b.status !== 'CANCELLED') {
          const count = Array.isArray(b.seats) && b.seats.length > 0 ? b.seats.length : 1;
          totalBooked += count;
        }
      }
    }
  } catch (e) {
    console.warn('Error reading user bookings for event count', e);
  }

  return totalBooked;
};

export const computeRealtimeEvent = (evt: EventItem): EventItem & { soldSeats: number; soldPct: number } => {
  const numId = Number(evt.id);
  const baseline = EVENT_BASELINE_SEATS[numId] || {
    totalSeats: evt.totalSeats || 15000,
    availableSeats: evt.availableSeats !== undefined ? evt.availableSeats : 250,
  };

  const bookedCount = getBookedPassCountForEvent(numId);
  const totalSeats = baseline.totalSeats;
  const originalAvailable = baseline.availableSeats;

  const realAvailable = Math.max(0, originalAvailable - bookedCount);
  const baseSold = totalSeats - originalAvailable;
  const currentSold = Math.min(totalSeats, baseSold + bookedCount);
  const soldPct = Math.min(100, Math.max(1, Math.round((currentSold / totalSeats) * 100)));

  return {
    ...evt,
    totalSeats,
    availableSeats: realAvailable,
    soldSeats: currentSold,
    soldPct,
  };
};

export const broadcastInventoryChange = () => {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(new CustomEvent('venu_inventory_updated', { detail: { timestamp: Date.now() } }));
  window.dispatchEvent(new Event('venu_bookings_updated'));

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'INVENTORY_CHANGED', timestamp: Date.now() });
    } catch (e) {
      console.warn('Failed posting to BroadcastChannel', e);
    }
  }
};

export const recordPassBooking = (_eventId: number | string, _passCount = 1) => {
  broadcastInventoryChange();
};

export const useRealtimeEvents = (backendEvents: EventItem[] = []) => {
  const computeAll = useCallback(() => {

    const combined: EventItem[] = [...backendEvents];

    const customEvents = getCustomCreatedEvents();
    for (const ce of customEvents) {
      if (!combined.some(e => e.id === ce.id || e.title === ce.title)) {
        combined.push(ce);
      }
    }

    for (const dossier of CURATED_DOSSIERS) {
      if (!combined.some(e => e.id === dossier.id || e.title === dossier.title)) {
        combined.push(dossier);
      }
    }

    return combined.slice(0, 6).map(computeRealtimeEvent);
  }, [backendEvents]);

  const [realtimeEvents, setRealtimeEvents] = useState<(EventItem & { soldSeats: number; soldPct: number })[]>(() => computeAll());

  useEffect(() => {
    setRealtimeEvents(computeAll());
  }, [computeAll]);

  useEffect(() => {
    const handleUpdate = () => {
      setRealtimeEvents(computeAll());
    };

    window.addEventListener('venu_inventory_updated', handleUpdate);
    window.addEventListener('venu_bookings_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    if (broadcastChannel) {
      broadcastChannel.onmessage = () => {
        handleUpdate();
      };
    }

    const interval = setInterval(handleUpdate, 2500);

    return () => {
      window.removeEventListener('venu_inventory_updated', handleUpdate);
      window.removeEventListener('venu_bookings_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, [computeAll]);

  return realtimeEvents;
};

export const useRealtimeEvent = (eventId: number | string | undefined, initialEvent?: EventItem | null) => {
  const [currentEvent, setCurrentEvent] = useState<EventItem | null>(initialEvent || null);

  const refresh = useCallback(() => {
    if (!eventId) return;
    const numId = Number(eventId);

    const custom = getCustomCreatedEvents().find(e => e.id === numId);
    if (custom) {
      setCurrentEvent(computeRealtimeEvent(custom));
      return;
    }

    const dossier = CURATED_DOSSIERS.find(d => d.id === numId);
    if (dossier) {
      setCurrentEvent(computeRealtimeEvent(dossier));
      return;
    }

    if (initialEvent) {
      setCurrentEvent(computeRealtimeEvent(initialEvent));
    }
  }, [eventId, initialEvent]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handleUpdate = () => refresh();

    window.addEventListener('venu_inventory_updated', handleUpdate);
    window.addEventListener('venu_bookings_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    if (broadcastChannel) {
      broadcastChannel.onmessage = () => handleUpdate();
    }

    const interval = setInterval(handleUpdate, 2500);

    return () => {
      window.removeEventListener('venu_inventory_updated', handleUpdate);
      window.removeEventListener('venu_bookings_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, [refresh]);

  return currentEvent;
};
