import type { Trip } from '../types';
import { IconFish } from './Icons';
import { PhotoTripCard } from './PhotoTripCard';
import { CompactTrip } from './CompactTrip';

export interface MonthSectionProps {
  month: string;
  trips: Trip[];
  onPhoto: (data: { photos: string[]; idx: number }) => void;
  sectionRef: (el: HTMLElement | null) => void;
}

export function MonthSection({ month, trips: monthTrips, onPhoto, sectionRef }: MonthSectionProps) {
  const monthCatch = monthTrips.reduce((s, t) => s + t.totalCatch, 0);
  const photoTrips = monthTrips.filter(t => t.photos.length > 0);
  const noPhotoTrips = monthTrips.filter(t => t.photos.length === 0);

  return (
    <section ref={sectionRef} className="mt-6">
      <div className="flex items-baseline justify-between mb-4 sticky top-0 bg-slate-50/95 backdrop-blur-sm py-3 z-10">
        <h2 className="text-xl font-extrabold text-slate-800">{month}</h2>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-400">{monthTrips.length} ture</span>
          {monthCatch > 0 && (
            <span className="flex items-center gap-1 font-bold text-teal-600">
              <IconFish className="w-3.5 h-3.5" />{monthCatch}
            </span>
          )}
        </div>
      </div>

      {photoTrips.length > 0 && (
        <div className={`grid gap-4 ${
          photoTrips.length === 1 ? 'grid-cols-1 max-w-2xl' :
          photoTrips.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}>
          {photoTrips.map(t => <PhotoTripCard key={t.date + t.spot} trip={t} onPhoto={onPhoto} />)}
        </div>
      )}

      {noPhotoTrips.length > 0 && (
        <div className={`bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-1 ${photoTrips.length > 0 ? 'mt-3' : ''}`}>
          {noPhotoTrips.map(t => <CompactTrip key={t.date + t.spot} trip={t} />)}
        </div>
      )}
    </section>
  );
}
