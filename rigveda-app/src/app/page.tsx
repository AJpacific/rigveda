'use client';

import Link from 'next/link';
import UniversalSearch from './components/UniversalSearch';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfo } from '@fortawesome/free-solid-svg-icons';
import MandalaInfoModal, { mandalaData } from './components/MandalaInfoModal';
import RigvedaOverviewModal from './components/RigvedaOverviewModal';

type MandalaData = {
  "Mandala Number": number;
  "Total Hymns (Sūktas)": number;
  "Total Verses (Ṛc)": number;
  "Main Deities": string[];
  "Principal Rishis (Seers)": string[];
  "Associated Family (Gotra)": string;
  "Meter Distribution (Chandas)": string;
  "Language/Style Notes": string;
  "Theme Summary": string;
};

const RandomVerseCard = dynamic(() => import('./components/RandomVerseCard'), { ssr: false });

export default function Home() {
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedMandalaData, setSelectedMandalaData] = useState<MandalaData | null>(null);
  const [rigvedaOverviewOpen, setRigvedaOverviewOpen] = useState(false);

  const openInfoModal = (mandalaNumber: number) => {
    const data = mandalaData.find(m => m["Mandala Number"] === mandalaNumber);
    setSelectedMandalaData(data || null);
    setInfoModalOpen(true);
  };

  return (
    <div className="space-y-10">
      <section className="text-center space-y-4">
        <div className="relative inline-block">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">ऋग्वेद</h1>
          <button
            onClick={() => setRigvedaOverviewOpen(true)}
            className="absolute -top-2 -right-8 sm:-right-10 w-7 h-7 sm:w-8 sm:h-8 bg-[#ececec] hover:bg-[#ececec]/80 text-gray-600 hover:text-gray-800 rounded-full flex items-center justify-center transition-all duration-200"
            title="Learn about the Rigveda"
          >
            <FontAwesomeIcon icon={faInfo} className="text-xs sm:text-sm" />
          </button>
        </div>
        <p className="text-xl sm:text-2xl text-muted">THE RIGVEDA</p>
        <div className="max-w-2xl mx-auto">
          <UniversalSearch />
        </div>
      </section>

      <section>
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Mandalas</h2>
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((mandala) => (
            <div key={mandala} className="group relative">
              <Link href={`/${mandala}`} className="block">
                <div className="m-card m-elevation-1 p-4 sm:p-3 md:p-4 hover:m-elevation-2 transition-shadow">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-12 h-12 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg grid place-items-center bg-[color:var(--primary)]/15 text-[color:var(--primary)] text-lg sm:text-base">{mandala}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-base sm:text-sm">Mandala {mandala}</div>
                      <div className="text-sm sm:text-xs text-muted">Explore hymns</div>
                    </div>
                  </div>
                </div>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openInfoModal(mandala);
                }}
                className="absolute top-2 right-2 sm:top-2 sm:right-2 w-6 h-6 bg-[#ececec] hover:bg-[#ececec]/80 text-gray-600 hover:text-gray-800 rounded-full flex items-center justify-center transition-all duration-200 opacity-100 z-10"
                title="View Mandala Information"
              >
                <FontAwesomeIcon icon={faInfo} className="text-xs" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <RandomVerseCard />
      </section>

      {/* Mandala Info Modal */}
      <MandalaInfoModal
        open={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        mandalaData={selectedMandalaData}
      />

      {/* Rigveda Overview Modal */}
      <RigvedaOverviewModal
        open={rigvedaOverviewOpen}
        onClose={() => setRigvedaOverviewOpen(false)}
      />
    </div>
  );
}
