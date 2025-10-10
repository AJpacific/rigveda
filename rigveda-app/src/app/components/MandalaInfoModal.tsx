'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faInfo, faBook, faUsers, faLanguage, faMusic, faLightbulb } from '@fortawesome/free-solid-svg-icons';
import { useMobileModalHeight } from '../hooks/useMobileModalHeight';

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

type MandalaInfoModalProps = {
  open: boolean;
  onClose: () => void;
  mandalaData: MandalaData | null;
};

const mandalaData: MandalaData[] = [
  {
    "Mandala Number": 1,
    "Total Hymns (Sūktas)": 191,
    "Total Verses (Ṛc)": 2006,
    "Main Deities": ["Agni", "Indra", "Varuna", "Mitra", "Ashvins", "Maruts", "Usas", "Surya", "Rbhus", "Rudra", "Vayu", "Brhaspati", "Visnu", "Heaven and Earth", "All Gods"],
    "Principal Rishis (Seers)": ["Multiple rishis including Madhuchhandas", "Medhatithi Kanva", "Jetri", "others"],
    "Associated Family (Gotra)": "None (not a family mandala)",
    "Meter Distribution (Chandas)": "Similar to overall Rigveda: Triṣṭubh (~40%), Gāyatrī (~25%), Anuṣṭubh (~10%), Jagatī (~10%), others (~15%)",
    "Language/Style Notes": "Later Vedic layer; includes philosophical or speculative questions; unique arrangement not found in other mandalas; early Indo-Aryan language with some obscurity",
    "Theme Summary": "Cosmology, rites to earn favor of gods, praise of gods; includes Riddle Hymn 1.164 inspiring Upanishads; general introduction with themes of creation, nature, rituals, prosperity"
  },
  {
    "Mandala Number": 2,
    "Total Hymns (Sūktas)": 43,
    "Total Verses (Ṛc)": 429,
    "Main Deities": ["Agni", "Indra"],
    "Principal Rishis (Seers)": ["Gṛtsamada Śaunahotra"],
    "Associated Family (Gotra)": "Gṛtsamada clan",
    "Meter Distribution (Chandas)": "Uniform family book format; Triṣṭubh (~40%), Gāyatrī (~25%), Anuṣṭubh (~10%), Jagatī (~10%), others (~15%)",
    "Language/Style Notes": "Earliest composed (family books 2-7); archaic Vedic Sanskrit; orally transmitted with precision; arranged by decreasing length of hymns",
    "Theme Summary": "Praise of gods, cosmology, rites; devotion to Agni and Indra with emphasis on ritual and ceremonial aspects; hymns for fire sacrifices (yajnas)"
  },
  {
    "Mandala Number": 3,
    "Total Hymns (Sūktas)": 62,
    "Total Verses (Ṛc)": 617,
    "Main Deities": ["Agni", "Indra", "Visvedevas", "Soma"],
    "Principal Rishis (Seers)": ["Viśvāmitra Gāthinaḥ"],
    "Associated Family (Gotra)": "Viśvāmitra clan",
    "Meter Distribution (Chandas)": "Uniform family book format; includes Gāyatrī Mantra; Triṣṭubh (~40%), Gāyatrī (~25%), Anuṣṭubh (~10%), Jagatī (~10%), others (~15%)",
    "Language/Style Notes": "Earliest composed (family books 2-7); archaic Vedic Sanskrit; orally transmitted with precision; arranged by decreasing length of hymns",
    "Theme Summary": "Praise of gods, cosmology, rites; famous for Gayatri Mantra; central ideas of ritual fire, divine praise, cosmic order"
  },
  {
    "Mandala Number": 4,
    "Total Hymns (Sūktas)": 58,
    "Total Verses (Ṛc)": 589,
    "Main Deities": ["Agni", "Indra", "Rbhus", "Ashvins", "Brhaspati", "Vayu", "Usas"],
    "Principal Rishis (Seers)": ["Vāmadeva Gautama"],
    "Associated Family (Gotra)": "Vāmadeva clan",
    "Meter Distribution (Chandas)": "Uniform family book format; Triṣṭubh (~40%), Gāyatrī (~25%), Anuṣṭubh (~10%), Jagatī (~10%), others (~15%)",
    "Language/Style Notes": "Earliest composed (family books 2-7); archaic Vedic Sanskrit; orally transmitted with precision; arranged by decreasing length of hymns; notable poetic richness and philosophical depth",
    "Theme Summary": "Praise of gods, cosmology, rites; covers creation of universe, exploits of gods, praises of natural forces"
  },
  {
    "Mandala Number": 5,
    "Total Hymns (Sūktas)": 87,
    "Total Verses (Ṛc)": 727,
    "Main Deities": ["Agni", "Indra", "Visvedevas", "Maruts", "Mitra-Varuna", "Ashvins", "Usas", "Savitr"],
    "Principal Rishis (Seers)": ["Atri clan"],
    "Associated Family (Gotra)": "Atri clan",
    "Meter Distribution (Chandas)": "Uniform family book format; Triṣṭubh (~40%), Gāyatrī (~25%), Anuṣṭubh (~10%), Jagatī (~10%), others (~15%)",
    "Language/Style Notes": "Earliest composed (family books 2-7); archaic Vedic Sanskrit; orally transmitted with precision; arranged by decreasing length of hymns",
    "Theme Summary": "Praise of gods, cosmology, rites; reflects social and moral concerns of ancient rishis"
  },
  {
    "Mandala Number": 6,
    "Total Hymns (Sūktas)": 75,
    "Total Verses (Ṛc)": 765,
    "Main Deities": ["Agni", "Indra", "All Gods", "Pusan", "Ashvins", "Usas"],
    "Principal Rishis (Seers)": ["Bārhaspatya family of Bharadvāja"],
    "Associated Family (Gotra)": "Bharadvāja clan",
    "Meter Distribution (Chandas)": "Uniform family book format; Triṣṭubh (~40%), Gāyatrī (~25%), Anuṣṭubh (~10%), Jagatī (~10%), others (~15%)",
    "Language/Style Notes": "Earliest composed (family books 2-7); archaic Vedic Sanskrit; orally transmitted with precision; arranged by decreasing length of hymns; sober and direct poetic style",
    "Theme Summary": "Praise of gods, cosmology, rites; highlights devotion to Indra and Agni; explores prosperity, war, community blessings"
  },
  {
    "Mandala Number": 7,
    "Total Hymns (Sūktas)": 104,
    "Total Verses (Ṛc)": 841,
    "Main Deities": ["Agni", "Indra", "Visvedevas", "Maruts", "Mitra-Varuna", "Ashvins", "Usas", "Indra-Varuna", "Varuna", "Vayu", "Sarasvati", "Visnu"],
    "Principal Rishis (Seers)": ["Vasiṣṭha Maitrāvaruṇi"],
    "Associated Family (Gotra)": "Vasiṣṭha clan",
    "Meter Distribution (Chandas)": "Uniform family book format; Triṣṭubh (~40%), Gāyatrī (~25%), Anuṣṭubh (~10%), Jagatī (~10%), others (~15%)",
    "Language/Style Notes": "Earliest composed (family books 2-7); archaic Vedic Sanskrit; orally transmitted with precision; arranged by decreasing length of hymns",
    "Theme Summary": "Praise of gods, cosmology, rites; known for hymns to Varuna, prayers for peace and protection; used in rituals; mentions inter-arya war"
  },
  {
    "Mandala Number": 8,
    "Total Hymns (Sūktas)": 103,
    "Total Verses (Ṛc)": 1716,
    "Main Deities": ["Indra", "Agni", "Soma", "Various Gods"],
    "Principal Rishis (Seers)": ["Kaṇva clan", "Āṅgirasa clan poets"],
    "Associated Family (Gotra)": "Kaṇva and Āṅgirasa clans",
    "Meter Distribution (Chandas)": "Mixed; arranged by prosody and length; Triṣṭubh (~40%), Gāyatrī (~25%), Anuṣṭubh (~10%), Jagatī (~10%), others (~15%); includes Valakhilya hymns",
    "Language/Style Notes": "Mixed age; later redaction with additions and orthoepic changes; Vedic Sanskrit; diversity of themes and styles",
    "Theme Summary": "Praise of gods, cosmology, rites; compilation of various styles; largest source for Sama Veda; brings together compositions by various poets"
  },
  {
    "Mandala Number": 9,
    "Total Hymns (Sūktas)": 114,
    "Total Verses (Ṛc)": 1109,
    "Main Deities": ["Soma Pavamana"],
    "Principal Rishis (Seers)": ["Multiple rishis including Kashyapa"],
    "Associated Family (Gotra)": "None (not a family mandala); part associated with Kashyapa",
    "Meter Distribution (Chandas)": "Predominantly Gāyatrī (higher percentage than overall due to Soma focus); Triṣṭubh (~30%), Gāyatrī (~40%), others",
    "Language/Style Notes": "Mixed age; later redaction; Vedic Sanskrit; arranged by prosody and length",
    "Theme Summary": "Entirely devoted to Soma ritual; celebrates preparation and consumption of Soma, its divine effects; praise, cosmology, rites"
  },
  {
    "Mandala Number": 10,
    "Total Hymns (Sūktas)": 191,
    "Total Verses (Ṛc)": 1754,
    "Main Deities": ["Agni", "Indra", "Various Deities"],
    "Principal Rishis (Seers)": ["Multiple rishis including Bhrgu", "Bharata"],
    "Associated Family (Gotra)": "None (not a family mandala)",
    "Meter Distribution (Chandas)": "Similar to overall: Triṣṭubh (~40%), Gāyatrī (~25%), Anuṣṭubh (~10%), Jagatī (~10%), others (~15%); some unique structures",
    "Language/Style Notes": "Later Vedic layer; frequently later language; philosophical tone; added last; authors knew prior books",
    "Theme Summary": "Cosmology, rites, praise; philosophical speculations on universe origin, divine nature, charity; includes Nadistuti (rivers), Purusha Sukta (sociology), Nasadiya Sukta (creation), marriage and death hymns"
  }
];

export default function MandalaInfoModal({ open, onClose, mandalaData }: MandalaInfoModalProps) {
  // Dynamic height for mobile devices with audio bar consideration
  const { style: modalStyle } = useMobileModalHeight({
    defaultHeight: '90vh',
    mobileHeight: '75vh',
    audioBarHeight: 100, // Account for audio bar
    minHeight: '50vh'
  });

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [open]);

  if (!open || !mandalaData) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${open ? 'block' : 'hidden'}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300 flex flex-col" style={modalStyle}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faBook} className="text-blue-600 text-xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Mandala {mandalaData["Mandala Number"]}</h2>
              <p className="text-sm text-gray-500">Detailed Information</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors duration-200" 
            aria-label="Close"
          >
            <FontAwesomeIcon icon={faTimes} className="text-lg" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Statistics */}
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faBook} className="text-blue-600" />
                  Statistics
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Hymns:</span>
                    <span className="font-semibold text-blue-600">{mandalaData["Total Hymns (Sūktas)"]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Verses:</span>
                    <span className="font-semibold text-blue-600">{mandalaData["Total Verses (Ṛc)"]}</span>
                  </div>
                </div>
              </div>

              {/* Main Deities */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faLightbulb} className="text-purple-600" />
                  Main Deities
                </h3>
                <div className="flex flex-wrap gap-2">
                  {mandalaData["Main Deities"].map((deity, index) => (
                    <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      {deity}
                    </span>
                  ))}
                </div>
              </div>

              {/* Principal Rishis */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faUsers} className="text-green-600" />
                  Principal Rishis
                </h3>
                <div className="space-y-1">
                  {mandalaData["Principal Rishis (Seers)"].map((rishi, index) => (
                    <div key={index} className="text-sm text-gray-700 bg-white rounded-lg p-2 border border-green-200">
                      {rishi}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 sm:space-y-4">
              {/* Associated Family */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Associated Family (Gotra)</h3>
                <p className="text-gray-700">{mandalaData["Associated Family (Gotra)"]}</p>
              </div>

              {/* Meter Distribution */}
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faMusic} className="text-cyan-600" />
                  Meter Distribution (Chandas)
                </h3>
                <p className="text-gray-700 text-sm">{mandalaData["Meter Distribution (Chandas)"]}</p>
              </div>

              {/* Language/Style Notes */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faLanguage} className="text-indigo-600" />
                  Language/Style Notes
                </h3>
                <p className="text-gray-700 text-sm">{mandalaData["Language/Style Notes"]}</p>
              </div>

              {/* Theme Summary */}
              <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faInfo} className="text-rose-600" />
                  Theme Summary
                </h3>
                <p className="text-gray-700 text-sm">{mandalaData["Theme Summary"]}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { mandalaData };
