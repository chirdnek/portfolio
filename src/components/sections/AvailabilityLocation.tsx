"use client";

export default function AvailabilityLocation() {
  return (
    <section className="relative py-20 px-8 bg-black border-t border-white/10">
      <div className="container-custom max-w-7xl mx-auto">
        <div className="grid grid-cols-2 gap-12 md:gap-24">
          {/* Availability */}
          <div>
            <p className="text-xs uppercase tracking-widest text-white/50 mb-3">
              Availability
            </p>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
              <p className="text-lg md:text-xl text-white">Available Today</p>
            </div>
          </div>

          {/* Location */}
          <div className="text-right md:text-left">
            <p className="text-xs uppercase tracking-widest text-white/50 mb-3">
              Location
            </p>
            <p className="text-lg md:text-xl text-white">
              Zamboanga City, Philippines
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
