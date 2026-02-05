
/**
 * Helper to determine if a class name matches a level pattern.
 * Pattern examples: "6|5" (6ème or 5ème), "4|3" (4ème or 3ème), "2N" (2nde), "1E" (1ère), "TERM|TLE" (Terminale).
 */
const isLevelMatch = (pattern, className) => {
  if (!pattern) return false;
  const cls = className.toUpperCase();

  const parts = pattern.split('|');
  for (const part of parts) {
    // Cycle 1
    if (part === '6' && (cls.startsWith('6') || cls.includes('SIX'))) return true;
    if (part === '5' && (cls.startsWith('5') || cls.includes('CINQ'))) return true;
    if (part === '4' && (cls.startsWith('4') || cls.includes('QUAT'))) return true;
    if (part === '3' && (cls.startsWith('3') || cls.includes('TROIS'))) return true;

    // Cycle 2
    if (part === '2N' && (cls.startsWith('2') || cls.startsWith('SECONDE'))) return true;
    if (part === '1E' && (cls.startsWith('1') || cls.startsWith('PREM'))) return true;

    // Terminale
    if ((part === 'TERM' || part === 'TLE') && (cls.startsWith('T') || cls.startsWith('TERM'))) return true;
  }
  return false;
};

const getSeries = (className) => {
  const cls = className.toUpperCase();
  // Check for explicit series at the end or in name like "2nde C"
  // Usually "2nd C", "Tle D", "1ere A1"

  // We look for the series indicator
  if (cls.match(/\bA1\b/)) return 'A1';
  if (cls.match(/\bA2\b/)) return 'A2';
  if (cls.match(/\bB\b/)) return 'B';
  if (cls.match(/\bC\b/)) return 'C';
  if (cls.match(/\bD\b/)) return 'D';

  return null;
};

/**
 * Resolves the coefficient for a given class and subject from the DB list.
 * @param {Array} dbCoefficients - List of coefficients from DB with joined subject: { value, level_pattern, series, subject: { name } }
 * @param {string} className - Name of the class (e.g. "6ème M1", "Tle D")
 * @param {string} subjectName - Name of the subject (e.g. "Mathématiques")
 */
export const resolveCoefficient = (dbCoefficients, className, subjectName) => {
  // 1. Conduite is ALWAYS 1 (Spec: "Toujours affectée d'un coefficient 1")
  if (subjectName.toLowerCase().includes('conduite')) return 1;

  if (!dbCoefficients || dbCoefficients.length === 0) return 1;

  const targetSeries = getSeries(className);

  // Filter candidates by Subject Name matches
  const candidates = dbCoefficients.filter(c =>
    c.subject?.name?.toLowerCase() === subjectName.toLowerCase()
  );

  // Find best match among candidates
  // Logic: 
  // 1. Must match Level Pattern
  // 2. Must match Series (if series is defined in coeff rule) OR rule has no series (generic)
  // 3. Specificity: Series match > Generic match? 
  //    Usually, if a series is specified in DB, it applies only to that series. If null, applies to all series OR cycle 1.

  const match = candidates.find(c => {
    // Check Level
    if (!isLevelMatch(c.level_pattern, className)) return false;

    // Check Series
    // If rule has a series, it MUST match the class series
    if (c.series) {
      return c.series === targetSeries;
    }

    // If rule has NO series, it matches if class has NO series (Cycle 1) 
    // OR it might be a fallback? 
    // In the data provided: Cycle 1 items have series: null. Cycle 2 items often have series.
    // But what if 2nd C and 2nd D share a coeff? Maybe separate rows.
    // Let's assume strict match: A generic rule (series=null) applies to anyone matching level, 
    // UNLESS a more specific rule exists? 
    // Actually, usually the DB setup is explicit. row for "2N" "C" and row for "2N" "D".

    // If class is "Tle D", it has series "D". 
    // If we find a rule with series "D", fits.
    // If we find a rule with series null (e.g. generic Tle?), fits?
    // Let's prefer exact series match if possible.
    return true;
  });

  if (match) return match.value;

  // Fallback: Return 1 if no rule found
  return 1;
};

// Deprecated static data (Keep empty to avoid breakages if imported elsewhere but not used)
export const COEFFICIENTS_DATA = {};
export const getCoefficient = () => 1; // Fallback for old calls

export const getCycleByLevel = (level) => {
  const levelText = level?.toString() || '';
  if (['6ème', '5ème', '4ème', '3ème'].some(l => levelText.startsWith(l))) {
    return 1;
  }
  if (['2nde', '1ère', 'Tle'].some(l => levelText.startsWith(l))) {
    return 2;
  }
  return null;
};
