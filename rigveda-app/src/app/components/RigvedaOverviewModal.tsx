'use client';

import { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faBook, faCalendar, faLanguage, faScroll, faUsers, faLightbulb, faGlobe, faHistory, faComments, faFire, faShield, faBrain, faBookOpen, faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import { useMobileModalHeight } from '../hooks/useMobileModalHeight';

type RigvedaOverviewModalProps = {
  open: boolean;
  onClose: () => void;
};

const rigvedaData = {
  "Title": "Rigveda",
  "Alternative Names": ["Ṛgveda", "Rig Veda"],
  "Part Of": "One of the four Vedas (Rigveda, Yajurveda, Samaveda, Atharvaveda)",
  "Composition Period": "Approximately 1500–1200 BCE (some hymns possibly older or later)",
  "Language": "Vedic Sanskrit (archaic Indo-Aryan language)",
  "Script": "Originally oral; later written in Devanagari script",
  "Total Mandalas": 10,
  "Total Hymns": 1028,
  "Total Verses": 10552,
  "Structure": "Divided into 10 mandalas (books). Mandalas 2–7 are 'family books' attributed to specific rishi clans. Mandalas 1, 8, 9, and 10 are composite collections.",
  "Organization": {
    "By Deity": "Hymns dedicated primarily to Agni, Indra, Soma, Varuna, Mitra, Uṣas, Aśvins, and others",
    "By Function": "Invocation, praise, and request hymns; some philosophical and cosmological hymns"
  },
  "Main Themes": "Praise of deities (devatas), cosmology, creation, nature, rituals (yajñas), philosophical inquiry, ethics, and early social order",
  "Significance": "Oldest known Indo-European text; foundation of Hindu religious and philosophical thought; preserved orally for millennia; included in UNESCO's Memory of the World Register (2007)",
  "Transmission": "Maintained through oral tradition by Brahminical schools (shākhās). The Śākala shakha is the main surviving recension, with Padapatha (word-separated) and Saṃhitāpāṭha (continuous) versions.",
  "Commentaries": {
    "Traditional": ["Sāyaṇa (14th century CE)"],
    "Modern": ["Dayānanda Saraswati", "Ralph T.H. Griffith", "Max Müller", "Wilson", "Geldner"]
  },
  "Associated Rituals": "Used in Śrauta rituals, Agnihotra, and Soma sacrifices; verses adapted into the Sāmaveda for musical chanting.",
  "Preservation and Recensions": {
    "Main Shakha": "Śākala",
    "Lost Shakhas": ["Bāṣkala", "Māṇḍūkeya", "Aśvalāyana"],
    "Textual Forms": ["Saṃhitā", "Brāhmaṇa", "Āraṇyaka", "Upaniṣad (Aitareya Upaniṣad)"]
  },
  "Philosophical Development": "Contains early ideas that evolved into Upanishadic and Vedantic thought (e.g., Nasadiya Sukta, Hiranyagarbha Sukta)",
  "Linguistic Importance": "Crucial for historical linguistics of Indo-European languages and comparative philology",
  "Cultural Influence": "Cited in Indian law, arts, and literature; references found in Mahābhārata and later epics",
  "Modern Scholarship": "Studied in Vedic philology, Indo-European linguistics, comparative religion, and historical anthropology"
};

export default function RigvedaOverviewModal({ open, onClose }: RigvedaOverviewModalProps) {
  // Dynamic height for mobile devices with audio bar consideration
  const { style: modalStyle } = useMobileModalHeight({
    defaultHeight: '90vh',
    mobileHeight: '70vh',
    audioBarHeight: 120, // Account for audio bar and mobile UI
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

  if (!open) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${open ? 'block' : 'hidden'}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300 flex flex-col" style={modalStyle}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faBook} className="text-purple-600 text-xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">ऋग्वेद (Rigveda)</h2>
              <p className="text-sm text-gray-500">The Sacred Knowledge of Hymns</p>
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
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Left Column */}
            <div className="space-y-3 sm:space-y-4">
              {/* Basic Information */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-3 sm:p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faBook} className="text-blue-600" />
                  Basic Information
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Alternative Names:</span>
                    <span className="font-medium text-blue-700">{rigvedaData["Alternative Names"].join(", ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Part Of:</span>
                    <span className="font-medium text-blue-700">{rigvedaData["Part Of"]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Language:</span>
                    <span className="font-medium text-blue-700">{rigvedaData["Language"]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Script:</span>
                    <span className="font-medium text-blue-700">{rigvedaData["Script"]}</span>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 sm:p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faScroll} className="text-green-600" />
                  Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{rigvedaData["Total Mandalas"]}</div>
                    <div className="text-sm text-gray-600">Mandalas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{rigvedaData["Total Hymns"]}</div>
                    <div className="text-sm text-gray-600">Hymns</div>
                  </div>
                  <div className="text-center col-span-2">
                    <div className="text-2xl font-bold text-green-600">{rigvedaData["Total Verses"]}</div>
                    <div className="text-sm text-gray-600">Total Verses</div>
                  </div>
                </div>
              </div>

              {/* Composition Period */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-3 sm:p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faCalendar} className="text-orange-600" />
                  Composition Period
                </h3>
                <p className="text-gray-700">{rigvedaData["Composition Period"]}</p>
              </div>

              {/* Structure */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 sm:p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faUsers} className="text-purple-600" />
                  Structure
                </h3>
                <p className="text-gray-700 text-sm">{rigvedaData["Structure"]}</p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-3 sm:space-y-4">
              {/* Organization */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-3 sm:p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faLightbulb} className="text-indigo-600" />
                  Organization
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-gray-700">By Deity:</span>
                    <p className="text-sm text-gray-600 mt-1">{rigvedaData["Organization"]["By Deity"]}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">By Function:</span>
                    <p className="text-sm text-gray-600 mt-1">{rigvedaData["Organization"]["By Function"]}</p>
                  </div>
                </div>
              </div>

              {/* Main Themes */}
              <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-3 sm:p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faLightbulb} className="text-rose-600" />
                  Main Themes
                </h3>
                <p className="text-gray-700 text-sm">{rigvedaData["Main Themes"]}</p>
              </div>

              {/* Significance */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-3 sm:p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faGlobe} className="text-yellow-600" />
                  Significance
                </h3>
                <p className="text-gray-700 text-sm">{rigvedaData["Significance"]}</p>
              </div>

              {/* Transmission */}
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-3 sm:p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faHistory} className="text-teal-600" />
                  Transmission
                </h3>
                <p className="text-gray-700 text-sm">{rigvedaData["Transmission"]}</p>
              </div>
            </div>
          </div>

          {/* Full Width Sections */}
          <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
            {/* Commentaries */}
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-3 sm:p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faComments} className="text-violet-600" />
                Commentaries
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Traditional</h4>
                  <div className="flex flex-wrap gap-2">
                    {rigvedaData["Commentaries"]["Traditional"].map((commentator, index) => (
                      <span key={index} className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm">
                        {commentator}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Modern</h4>
                  <div className="flex flex-wrap gap-2">
                    {rigvedaData["Commentaries"]["Modern"].map((commentator, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                        {commentator}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Associated Rituals */}
            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-3 sm:p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faFire} className="text-red-600" />
                Associated Rituals
              </h3>
              <p className="text-gray-700 text-sm">{rigvedaData["Associated Rituals"]}</p>
            </div>

            {/* Preservation and Recensions */}
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-3 sm:p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faShield} className="text-emerald-600" />
                Preservation and Recensions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Main Shakha</h4>
                  <p className="text-sm text-gray-600">{rigvedaData["Preservation and Recensions"]["Main Shakha"]}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Lost Shakhas</h4>
                  <div className="flex flex-wrap gap-1">
                    {rigvedaData["Preservation and Recensions"]["Lost Shakhas"].map((shakha, index) => (
                      <span key={index} className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">
                        {shakha}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Textual Forms</h4>
                  <div className="flex flex-wrap gap-1">
                    {rigvedaData["Preservation and Recensions"]["Textual Forms"].map((form, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        {form}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Importance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-3 sm:p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faBrain} className="text-slate-600" />
                  Philosophical Development
                </h3>
                <p className="text-gray-700 text-sm">{rigvedaData["Philosophical Development"]}</p>
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-3 sm:p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faLanguage} className="text-amber-600" />
                  Linguistic Importance
                </h3>
                <p className="text-gray-700 text-sm">{rigvedaData["Linguistic Importance"]}</p>
              </div>

              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-3 sm:p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faGlobe} className="text-cyan-600" />
                  Cultural Influence
                </h3>
                <p className="text-gray-700 text-sm">{rigvedaData["Cultural Influence"]}</p>
              </div>
            </div>

            {/* Modern Scholarship */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-3 sm:p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faGraduationCap} className="text-indigo-600" />
                Modern Scholarship
              </h3>
              <p className="text-gray-700 text-sm">{rigvedaData["Modern Scholarship"]}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
