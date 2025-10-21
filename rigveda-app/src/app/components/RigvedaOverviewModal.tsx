'use client';

import { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faBook, faCalendar, faLanguage, faScroll, faUsers, faLightbulb, faGlobe, faHistory, faComments, faFire, faBrain, faMusic } from '@fortawesome/free-solid-svg-icons';
import { useMobileModalHeight } from '../hooks/useMobileModalHeight';

type RigvedaOverviewModalProps = {
  open: boolean;
  onClose: () => void;
};

const rigvedaData = {
  "Title": "Rigveda",
  "Alternative Names": ["Ṛgveda", "Rig Veda"],
  "Part Of": "One of the four canonical Vedas (Ṛgveda, Yajurveda, Sāmaveda, Atharvaveda)",

  "Composition Period": "Approximately 1500–1200 BCE (some hymns possibly older or later); reflects early Indo-Aryan culture of the late Bronze Age in northwestern India.",
  "Language": "Vedic Sanskrit (archaic Indo-Aryan; early form of the Indo-European language family).",
  "Script": "Originally transmitted orally with precise phonetic and tonal preservation; later written down in Devanāgarī and other Brahmi-derived scripts.",

  "Total Mandalas": 10,
  "Total Hymns": 1028,
  "Total Verses": 10552,

  "Structure": "Divided into 10 Mandalas (books). Mandalas 2–7 are 'family books' (gotra-based collections) attributed to specific rishi clans — Gṛtsamāda, Viśvāmitra, Vāmadeva, Atri, Bharadvāja, and Vasiṣṭha. Mandalas 1, 8, 9, and 10 are composite compilations, with Mandala 9 entirely devoted to Soma hymns.",

  "Organization": {
    "By Deity": "Hymns dedicated primarily to Agni, Indra, Soma, Varuṇa, Mitra, Uṣas (Dawn), the Aśvins (Divine Horsemen), Savitṛ, Maruts, and others.",
    "By Function": "Includes invocatory hymns (āhvāna), praise hymns (stuti), and supplicatory hymns (prārthanā) requesting protection, wealth, rain, or power; later books contain philosophical and cosmological hymns."
  },

  "Chandas (Meter)": {
    "Definition": "Chandas (metrical structure) governs the rhythmic pattern of each verse, crucial to the oral recitation and sonic precision of Vedic chanting.",
    "Role": "Meter is considered sacred; it embodies rhythm and order (ṛta) in sound form. The Rigvedic poets skillfully varied meters to match tone, deity, and intent.",
    "Seven Most Popular Meters": [
      {
        "Name": "Gāyatrī",
        "Pattern": "3 pādas (lines) × 8 syllables each (24 syllables total)",
        "Usage": "Most sacred and concise meter, used in invocations to Agni, Savitṛ (as in the Gāyatrī Mantra), and deities of light and knowledge.",
        "Tone": "Bright, uplifting, spiritual"
      },
      {
        "Name": "Anuṣṭubh",
        "Pattern": "4 pādas × 8 syllables each (32 syllables total)",
        "Usage": "Widely used in narrative or descriptive hymns; later evolved into the classical Sanskrit śloka meter.",
        "Tone": "Balanced and conversational"
      },
      {
        "Name": "Triṣṭubh",
        "Pattern": "4 pādas × 11 syllables each (44 syllables total)",
        "Usage": "Most common Rigvedic meter (~40% of hymns); used for hymns of power, valor, and devotion to Indra and heroic deities.",
        "Tone": "Majestic, forceful, dynamic"
      },
      {
        "Name": "Jagatī",
        "Pattern": "4 pādas × 12 syllables each (48 syllables total)",
        "Usage": "Used for descriptive and philosophical hymns; conveys grandeur and complexity.",
        "Tone": "Expansive, contemplative"
      },
      {
        "Name": "Pankti",
        "Pattern": "5 pādas × 8 syllables each (40 syllables total)",
        "Usage": "Often used in ritualistic or praise hymns; linked to completeness and abundance.",
        "Tone": "Devotional, abundant"
      },
      {
        "Name": "Bṛhatī",
        "Pattern": "4 pādas × 9 syllables each (36 syllables total)",
        "Usage": "Intermediate meter between Gāyatrī and Jagatī; symbolizes strength and balance.",
        "Tone": "Steady, assertive"
      },
      {
        "Name": "Uṣṇih",
        "Pattern": "3 pādas × 8–8–12 syllables (28 syllables total)",
        "Usage": "One of the oldest meters; used for hymns of protection and energy, often dedicated to Agni and Soma.",
        "Tone": "Warm, protective"
      }
    ]
  },

  "Seers (Rishis)": "Attributed to various Rishis (seers) who 'heard' the hymns through divine revelation (śruti). Major families include the Gṛtsamāda, Viśvāmitra, Vāmadeva, Atri, Bharadvāja, and Vasiṣṭha lineages.",

  "Recitation and Preservation": {
    "Oral Tradition": "Preserved through highly precise oral methods ensuring phonetic accuracy and tonal fidelity over millennia.",
    "Recitation Methods": [
      "Saṃhitāpāṭha (continuous recitation)",
      "Padapāṭha (word-separated form)",
      "Kramapāṭha (pairwise progression)",
      "Jatapāṭha (interwoven recitation)",
      "Ghanapāṭha (complex cyclic chanting)"
    ],
    "Main Recension": "Śākala Śākhā — the only complete surviving recension of the Rigveda.",
    "Lost Recensions": ["Bāṣkala", "Māṇḍūkeya", "Aśvalāyana", "Śaṅkhāyana"]
  },

  "Main Themes": [
    "Praise of deities (devatā-stuti)",
    "Cosmology and creation hymns (e.g., Nāsadīya Sukta, Hiranyagarbha Sukta)",
    "Nature deities — fire, dawn, rain, wind, and celestial phenomena",
    "Concept of Ṛta (cosmic order and moral law)",
    "Sacrifice (Yajña) as a bridge between humans and gods",
    "Philosophical inquiry into existence and consciousness",
    "Social and ethical ideals — truth, generosity, and courage"
  ],

  "Ritual Importance": {
    "Usage": "Integral to Śrauta rituals such as Agnihotra, Soma sacrifices, and various fire offerings.",
    "Adaptations": "Many Rigvedic verses were later musically adapted into the Sāmaveda.",
    "Symbolism": "Agni, the central deity, symbolizes transformation, communication, and divine presence."
  },

  "Philosophical Development": "Contains foundational ideas that evolved into Upanishadic and Vedantic philosophy — unity of being, the origin of the cosmos, and the self as universal consciousness. Key hymns: Nāsadīya Sukta (10.129), Purusha Sukta (10.90), and Vak Sukta (10.125).",

  "Linguistic Style": "Exhibits archaic yet sophisticated Vedic Sanskrit — rich in metaphor, personification, and poetic symbolism. Features complex compounds, flexible syntax, and use of tonal accents (udātta, anudātta, svarita) as prescribed in Vedic phonology.",

  "Transmission": "Maintained through strict oral tradition (śruti) by Brahminical lineages (śākhās). Chanting follows tonal precision with accentual phonetics defined in the Prātiśākhyas.",

  "Commentaries": {
    "Traditional": [
      "Sāyaṇa (14th century CE) — monumental commentary interpreting ritual, linguistic, and symbolic meanings."
    ],
    "Modern": [
      "Swami Dayānanda Saraswati",
      "Ralph T.H. Griffith",
      "Max Müller",
      "H.H. Wilson",
      "Karl Geldner"
    ]
  },

  "Textual Forms": {
    "Saṃhitā": "Collection of hymns — the core Rigvedic text.",
    "Brāhmaṇa": "Prose texts explaining ritual and symbolic significance (e.g., Aitareya Brāhmaṇa).",
    "Āraṇyaka": "Meditative and philosophical treatises for forest-dwellers.",
    "Upaniṣad": "Spiritual dialogues exploring metaphysical truth (e.g., Aitareya Upaniṣad)."
  },

  "Significance": "The Rigveda is the earliest known Indo-European literary composition, foundational to Hindu ritual, philosophy, and theology. Preserved orally for over 3,000 years, it was recognized by UNESCO in the Memory of the World Register (2007).",

  "Linguistic Importance": "Primary source for Indo-European linguistics, Sanskrit grammar evolution, and comparative philology; essential for understanding ancient Indo-Iranian culture and religion.",

  "Cultural Influence": "Cited across Indian philosophy, arts, and law; references appear in the Mahābhārata, Rāmāyaṇa, Purāṇas, and later devotional literature. Continues to inspire Indian music, poetics, and ritual practice.",

  "Modern Scholarship": "Central to the fields of Vedic philology, Indo-European studies, comparative religion, ritual theory, and historical anthropology."
};

export default function RigvedaOverviewModal({ open, onClose }: RigvedaOverviewModalProps) {
  // Dynamic height for mobile devices with audio bar consideration
  const { style: modalStyle } = useMobileModalHeight({
    defaultHeight: '75vh',
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
      className={`fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 sm:pt-12 md:pt-16 lg:pt-20 ${open ? 'block' : 'hidden'}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300 flex flex-col" style={modalStyle}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(138, 75, 45, 0.15)' }}>
              <FontAwesomeIcon icon={faBook} className="text-xl" style={{ color: 'var(--primary)' }} />
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
              <div className="rounded-xl p-3 sm:p-4" style={{ backgroundColor: 'rgba(138, 75, 45, 0.1)' }}>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faBook} style={{ color: 'var(--primary)' }} />
                  Basic Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-600 font-medium">Alternative Names:</span>
                    <p className="mt-1" style={{ color: 'var(--primary)' }}>{rigvedaData["Alternative Names"].join(", ")}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Part Of:</span>
                    <p className="mt-1" style={{ color: 'var(--primary)' }}>{rigvedaData["Part Of"]}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Language:</span>
                    <p className="mt-1" style={{ color: 'var(--primary)' }}>{rigvedaData["Language"]}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Script:</span>
                    <p className="mt-1" style={{ color: 'var(--primary)' }}>{rigvedaData["Script"]}</p>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="rounded-xl p-3 sm:p-4" style={{ backgroundColor: 'rgba(138, 75, 45, 0.1)' }}>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faScroll} style={{ color: 'var(--primary)' }} />
                  Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{rigvedaData["Total Mandalas"]}</div>
                    <div className="text-sm text-gray-600">Mandalas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{rigvedaData["Total Hymns"]}</div>
                    <div className="text-sm text-gray-600">Hymns</div>
                  </div>
                  <div className="text-center col-span-2">
                    <div className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{rigvedaData["Total Verses"]}</div>
                    <div className="text-sm text-gray-600">Total Verses</div>
                  </div>
                </div>
              </div>

              {/* Composition Period */}
              <div className="rounded-xl p-3 sm:p-4" style={{ backgroundColor: 'rgba(138, 75, 45, 0.1)' }}>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faCalendar} style={{ color: 'var(--primary)' }} />
                  Composition Period
                </h3>
                <p className="text-gray-700">{rigvedaData["Composition Period"]}</p>
              </div>

              {/* Structure */}
              <div className="rounded-xl p-3 sm:p-4" style={{ backgroundColor: 'rgba(138, 75, 45, 0.1)' }}>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faUsers} style={{ color: 'var(--primary)' }} />
                  Structure
                </h3>
                <p className="text-gray-700 text-sm">{rigvedaData["Structure"]}</p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-3 sm:space-y-4">
              {/* Organization */}
              <div className="rounded-xl p-3 sm:p-4" style={{ backgroundColor: 'rgba(138, 75, 45, 0.1)' }}>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faLightbulb} style={{ color: 'var(--primary)' }} />
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
              <div className="rounded-xl p-3 sm:p-4" style={{ backgroundColor: 'rgba(138, 75, 45, 0.1)' }}>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faLightbulb} style={{ color: 'var(--accent)' }} />
                  Main Themes
                </h3>
                <ul className="text-gray-700 text-sm space-y-1">
                  {rigvedaData["Main Themes"].map((theme, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-1" style={{ color: 'var(--accent)' }}>•</span>
                      <span>{theme}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Significance */}
              <div className="rounded-xl p-3 sm:p-4" style={{ backgroundColor: 'rgba(138, 75, 45, 0.1)' }}>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faGlobe} style={{ color: 'var(--primary)' }} />
                  Significance
                </h3>
                <p className="text-gray-700 text-sm">{rigvedaData["Significance"]}</p>
              </div>

              {/* Transmission */}
              <div className="rounded-xl p-3 sm:p-4" style={{ backgroundColor: 'rgba(138, 75, 45, 0.1)' }}>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faHistory} style={{ color: 'var(--primary)' }} />
                  Transmission
                </h3>
                <p className="text-gray-700 text-sm">{rigvedaData["Transmission"]}</p>
              </div>
            </div>
          </div>

          {/* Full Width Sections */}
          <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
            {/* Commentaries */}
            <div className="rounded-xl p-3 sm:p-4" style={{ backgroundColor: 'rgba(138, 75, 45, 0.1)' }}>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faComments} style={{ color: 'var(--primary)' }} />
                Commentaries
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Traditional</h4>
                  <div className="flex flex-wrap gap-2">
                    {rigvedaData["Commentaries"]["Traditional"].map((commentator, index) => (
                      <span key={index} className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: 'rgba(138, 75, 45, 0.15)', color: 'var(--primary)' }}>
                        {commentator}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Modern</h4>
                  <div className="flex flex-wrap gap-2">
                    {rigvedaData["Commentaries"]["Modern"].map((commentator, index) => (
                      <span key={index} className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: 'rgba(138, 75, 45, 0.15)', color: 'var(--primary)' }}>
                        {commentator}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>


            {/* Academic Importance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded-xl p-3 sm:p-4" style={{ backgroundColor: 'rgba(138, 75, 45, 0.1)' }}>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faBrain} style={{ color: 'var(--primary)' }} />
                  Philosophical Development
                </h3>
                <p className="text-gray-700 text-sm">{rigvedaData["Philosophical Development"]}</p>
              </div>

              <div className="rounded-xl p-3 sm:p-4" style={{ backgroundColor: 'rgba(138, 75, 45, 0.1)' }}>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faLanguage} style={{ color: 'var(--primary)' }} />
                  Linguistic Importance
                </h3>
                <p className="text-gray-700 text-sm">{rigvedaData["Linguistic Importance"]}</p>
              </div>

              <div className="rounded-xl p-3 sm:p-4" style={{ backgroundColor: 'rgba(138, 75, 45, 0.1)' }}>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faGlobe} style={{ color: 'var(--primary)' }} />
                  Cultural Influence
                </h3>
                <p className="text-gray-700 text-sm">{rigvedaData["Cultural Influence"]}</p>
              </div>
            </div>

            {/* Modern Scholarship */}
            <div className="rounded-xl p-3 sm:p-4" style={{ backgroundColor: 'rgba(138, 75, 45, 0.1)' }}>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faBook} style={{ color: 'var(--primary)' }} />
                Modern Scholarship
              </h3>
              <p className="text-gray-700 text-sm">{rigvedaData["Modern Scholarship"]}</p>
            </div>

            {/* Chandas (Meter) */}
            <div className="rounded-xl p-3 sm:p-4" style={{ backgroundColor: 'rgba(138, 75, 45, 0.1)' }}>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faMusic} style={{ color: 'var(--primary)' }} />
                Chandas (Meter)
              </h3>
              <div className="space-y-3">
                <p className="text-gray-700 text-sm">{rigvedaData["Chandas (Meter)"]["Definition"]}</p>
                <p className="text-gray-700 text-sm">{rigvedaData["Chandas (Meter)"]["Role"]}</p>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Seven Most Popular Meters:</h4>
                  <div className="space-y-2">
                    {rigvedaData["Chandas (Meter)"]["Seven Most Popular Meters"].map((meter, index) => (
                      <div key={index} className="bg-white rounded-lg p-3" style={{ borderColor: 'rgba(138, 75, 45, 0.2)' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold" style={{ color: 'var(--primary)' }}>{meter["Name"]}</span>
                          <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(138, 75, 45, 0.15)', color: 'var(--primary)' }}>{meter["Tone"]}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1"><strong>Pattern:</strong> {meter["Pattern"]}</p>
                        <p className="text-sm text-gray-600">{meter["Usage"]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Seers (Rishis) */}
            <div className="rounded-xl p-3 sm:p-4" style={{ backgroundColor: 'rgba(138, 75, 45, 0.1)' }}>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faUsers} style={{ color: 'var(--primary)' }} />
                Seers (Rishis)
              </h3>
              <p className="text-gray-700 text-sm">{rigvedaData["Seers (Rishis)"]}</p>
            </div>

            {/* Recitation and Preservation */}
            <div className="rounded-xl p-3 sm:p-4" style={{ backgroundColor: 'rgba(138, 75, 45, 0.1)' }}>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faHistory} style={{ color: 'var(--primary)' }} />
                Recitation and Preservation
              </h3>
              <div className="space-y-3">
                <p className="text-gray-700 text-sm">{rigvedaData["Recitation and Preservation"]["Oral Tradition"]}</p>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Recitation Methods:</h4>
                  <div className="flex flex-wrap gap-2">
                    {rigvedaData["Recitation and Preservation"]["Recitation Methods"].map((method, index) => (
                      <span key={index} className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: 'rgba(138, 75, 45, 0.15)', color: 'var(--primary)' }}>
                        {method}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Main Recension:</h4>
                    <p className="text-sm text-gray-600">{rigvedaData["Recitation and Preservation"]["Main Recension"]}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Lost Recensions:</h4>
                    <div className="flex flex-wrap gap-1">
                      {rigvedaData["Recitation and Preservation"]["Lost Recensions"].map((recension, index) => (
                        <span key={index} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'rgba(138, 75, 45, 0.15)', color: 'var(--primary)' }}>
                          {recension}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ritual Importance */}
            <div className="rounded-xl p-3 sm:p-4" style={{ backgroundColor: 'rgba(138, 75, 45, 0.1)' }}>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faFire} style={{ color: 'var(--accent)' }} />
                Ritual Importance
              </h3>
              <div className="space-y-2">
                <p className="text-gray-700 text-sm"><strong>Usage:</strong> {rigvedaData["Ritual Importance"]["Usage"]}</p>
                <p className="text-gray-700 text-sm"><strong>Adaptations:</strong> {rigvedaData["Ritual Importance"]["Adaptations"]}</p>
                <p className="text-gray-700 text-sm"><strong>Symbolism:</strong> {rigvedaData["Ritual Importance"]["Symbolism"]}</p>
              </div>
            </div>

            {/* Textual Forms */}
            <div className="rounded-xl p-3 sm:p-4" style={{ backgroundColor: 'rgba(138, 75, 45, 0.1)' }}>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faBook} style={{ color: 'var(--primary)' }} />
                Textual Forms
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(rigvedaData["Textual Forms"]).map(([key, value]) => (
                  <div key={key} className="bg-white rounded-lg p-3" style={{ borderColor: 'rgba(138, 75, 45, 0.2)' }}>
                    <h4 className="font-medium mb-1" style={{ color: 'var(--primary)' }}>{key}:</h4>
                    <p className="text-sm text-gray-600">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
