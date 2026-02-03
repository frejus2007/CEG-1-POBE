import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './ToastContext';

const AcademicYearContext = createContext();

export const useAcademicYear = () => {
    const context = useContext(AcademicYearContext);
    if (!context) {
        throw new Error('useAcademicYear must be used within an AcademicYearProvider');
    }
    return context;
};

export const AcademicYearProvider = ({ children }) => {
    // State for Archives
    const [availableYears, setAvailableYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState(() => localStorage.getItem('selectedYear') || '2025-2026');

    // Basic State
    const [academicYear, setAcademicYear] = useState(() => localStorage.getItem('academicYear') || '2025-2026');
    const [currentSemester, setCurrentSemester] = useState(() => localStorage.getItem('currentSemester') || 'Semestre 1');

    // Locking State
    const [isSemester1Locked, setIsSemester1Locked] = useState(() => localStorage.getItem('isSemester1Locked') === 'true');
    const [isSemester2Locked, setIsSemester2Locked] = useState(() => localStorage.getItem('isSemester2Locked') === 'true');
    const [isYearLocked, setIsYearLocked] = useState(() => localStorage.getItem('isYearLocked') === 'true');

    // Deadline State - Synced with DB 'censor_unlocks'
    const [evaluationPeriods, setEvaluationPeriods] = useState({
        interrogation1: { start: '', end: '', is_unlocked: false },
        interrogation2: { start: '', end: '', is_unlocked: false },
        interrogation3: { start: '', end: '', is_unlocked: false },
        devoir1: { start: '', end: '', is_unlocked: false },
        devoir2: { start: '', end: '', is_unlocked: false },
    });
    const [loadingPeriods, setLoadingPeriods] = useState(true);

    const [calculationPeriod, setCalculationPeriod] = useState({ start: '', end: '' });

    // Toast notifications
    const { showSuccess, showError } = useToast();

    // Derived state
    const isArchiveView = academicYear !== selectedYear;

    // --- FETCH PERIODS FROM DB ---
    const fetchPeriods = async () => {
        setLoadingPeriods(true);
        try {
            const { data, error } = await supabase
                .from('censor_unlocks')
                .select('*');

            if (error) throw error;

            if (data && data.length > 0) {
                const newPeriods = { ...evaluationPeriods };

                // Map DB rows to state keys
                data.forEach(row => {
                    if (row.type === 'CALCULATION') {
                        setCalculationPeriod({
                            start: row.start_date || '',
                            end: row.end_date || ''
                        });
                    } else {
                        const key = `${row.type.toLowerCase()}${row.index}`; // e.g., interrogation1
                        if (newPeriods[key] !== undefined) {
                            newPeriods[key] = {
                                start: row.start_date || '',
                                end: row.end_date || '',
                                is_unlocked: row.is_unlocked
                            };
                        }
                    }
                });
                setEvaluationPeriods(newPeriods);
            }
        } catch (err) {
            console.error("Error fetching evaluation periods:", err);
        } finally {
            setLoadingPeriods(false);
        }
    };

    const fetchAcademicYears = async () => {
        try {
            const { data, error } = await supabase.from('academic_years').select('name, is_active');
            if (error) throw error;
            if (data && data.length > 0) {
                const years = data.map(y => y.name).sort();
                setAvailableYears(years);

                // Sync current active year if found
                const active = data.find(y => y.is_active);
                if (active) {
                    setAcademicYear(active.name);
                    if (!selectedYear) setSelectedYear(active.name);
                }
            }
        } catch (err) {
            console.error("Error fetching academic years:", err);
        }
    };

    useEffect(() => {
        fetchAcademicYears();
        fetchPeriods();
    }, []);

    // --- UPDATE DB WHEN STATE CHANGES ---
    // Instead of auto-saving on effect (which risks loops), we'll Expose an update function
    const updateEvaluationPeriod = async (key, updates) => {
        // updates: { start, end, is_unlocked }
        // 1. Update Local State
        setEvaluationPeriods(prev => ({
            ...prev,
            [key]: { ...prev[key], ...updates }
        }));

        // 2. Parse key to type + index
        let type, index;
        if (key.startsWith('interrogation')) {
            type = 'Interrogation';
            index = parseInt(key.replace('interrogation', ''));
        } else if (key.startsWith('devoir')) {
            type = 'Devoir';
            index = parseInt(key.replace('devoir', ''));
        } else {
            return;
        }

        try {
            // Upsert into DB
            // Check if exists first or use upsert constraint if we had unique (type, index)
            // Assuming (type, index) is unique or we can query ID.
            // Let's look up ID first? Or use single upsert if we defined unique constraint.
            // Safe bet: Select, then Update or Insert.

            const { data: existing } = await supabase.from('censor_unlocks').select('id').eq('type', type).eq('index', index).single();

            // Get current state values to ensure we don't overwrite with nulls
            const current = evaluationPeriods[key] || {};

            const payload = {
                type,
                index,
                is_unlocked: updates.is_unlocked !== undefined ? updates.is_unlocked : (current.is_unlocked || false),
                start_date: updates.start !== undefined ? (updates.start || null) : (current.start || null),
                end_date: updates.end !== undefined ? (updates.end || null) : (current.end || null),
                updated_at: new Date()
            };

            if (existing) {
                await supabase.from('censor_unlocks').update(payload).eq('id', existing.id);
            } else {
                await supabase.from('censor_unlocks').insert(payload);
            }
            showSuccess("Période mise à jour avec succès");
        } catch (err) {
            console.error("Error updating period in DB:", err);
            showError("Erreur lors de la mise à jour de la période");
        }
    };

    const updateCalculationPeriod = async (updates) => {
        // updates: { start, end }
        setCalculationPeriod(prev => ({ ...prev, ...updates }));

        try {
            const { data: existing } = await supabase
                .from('censor_unlocks')
                .select('id')
                .eq('type', 'CALCULATION')
                .eq('index', 1)
                .single();

            const payload = {
                type: 'CALCULATION',
                index: 1,
                start_date: updates.start !== undefined ? updates.start : calculationPeriod.start, // Handle partial updates carefully
                end_date: updates.end !== undefined ? updates.end : calculationPeriod.end,
                updated_at: new Date()
            };

            // Fix: ensure we use the merged state for payload or pass full object
            // Better: use the 'updates' merged with current state
            const newStart = updates.start !== undefined ? updates.start : calculationPeriod.start;
            const newEnd = updates.end !== undefined ? updates.end : calculationPeriod.end;

            payload.start_date = newStart || null;
            payload.end_date = newEnd || null;


            if (existing) {
                await supabase.from('censor_unlocks').update(payload).eq('id', existing.id);
            } else {
                await supabase.from('censor_unlocks').insert(payload);
            }
            showSuccess("Période de calcul mise à jour");
        } catch (err) {
            console.error("Error updating calculation period:", err);
            showError("Erreur lors de la mise à jour de la période de calcul");
        }
    };


    // Check if grading is open for a specific type
    const isGradingOpenFor = (type) => {
        if (isArchiveView || isYearLocked) return false;

        const period = evaluationPeriods[type];
        if (!period) return false;

        // Logic Change: is_unlocked is the MASTER switch.
        // If LOCKED (false) -> Closed immediately.
        // If UNLOCKED (true) -> Open, UNLESS dates restrict it?
        // Usually 'locked' means 'force closed'.
        // So:
        if (!period.is_unlocked) return false;

        // If unlocked, check dates
        if (!period.end) return true; // Unlocked and no end date = Open forever

        const deadline = new Date(period.end);
        const now = new Date();
        deadline.setHours(23, 59, 59, 999);
        return now <= deadline;
    };

    // Generic check for overall openness (legacy support if needed)
    const isGradingOpen = () => true;

    // Mock Validation: Check if all grades are entered for a semester
    const checkAllGradesEntered = (semester) => {
        // In a real app, this would query the database/state.
        // For now, we mock it.
        // Let's assume grades are missing unless a specific debug flag is set or we just randomness?
        // Better: let's assume valid for now to make it testing easier, 
        // OR add a "Simulate Missing Grades" toggle in settings?
        // Let's just return true for now, but logical place for the check.
        console.log(`Checking grades for ${semester}...`);

        // MOCK: Return false randomly or based on a hardcoded check to demonstrate the feature?
        // Let's return TRUE so the user can lock by default, 
        // but adding a comment that this is where the query goes.
        return true;
    };

    // Persistence
    useEffect(() => {
        localStorage.setItem('academicYear', academicYear);
        localStorage.setItem('currentSemester', currentSemester);
        localStorage.setItem('isSemester1Locked', isSemester1Locked);
        localStorage.setItem('isSemester2Locked', isSemester2Locked);
        localStorage.setItem('isYearLocked', isYearLocked);
        localStorage.setItem('availableYears', JSON.stringify(availableYears));
        localStorage.setItem('selectedYear', selectedYear);
        // localStorage.setItem('calculationPeriod', JSON.stringify(calculationPeriod)); // Removed persistence
        // Removed evaluationPeriods from local storage persistence
    }, [academicYear, currentSemester, isSemester1Locked, isSemester2Locked, isYearLocked, availableYears, selectedYear]);


    // Actions
    const changeYear = (year) => {
        setSelectedYear(year);
        // Reset current semester view or keep it generic? 
        // For now, staying on the semester view but with data from that year makes sense if we architecture it well.
        // However, if we just want to VIEW archives, likely we reset to 'Semestre 1' or keep it as is.
    };

    const lockSemester1 = () => {
        if (isArchiveView) return;

        if (!checkAllGradesEntered('Semestre 1')) {
            alert("Impossible de boucler le semestre : Toutes les notes n'ont pas encore été saisies.");
            return;
        }

        setIsSemester1Locked(true);
        showSuccess("Semestre 1 verrouillé avec succès");
    };

    const startSemester2 = () => {
        if (isArchiveView) return;
        if (!isSemester1Locked) return;
        setCurrentSemester('Semestre 2');
    };

    const lockSemester2 = () => {
        if (isArchiveView) return;
        if (currentSemester !== 'Semestre 2') return;

        if (!checkAllGradesEntered('Semestre 2')) {
            alert("Impossible de boucler le semestre : Toutes les notes n'ont pas encore été saisies.");
            return;
        }

        setIsSemester2Locked(true);
        showSuccess("Semestre 2 verrouillé avec succès");
    };

    const lockYear = () => {
        if (isArchiveView) return;
        if (isSemester1Locked && isSemester2Locked) {
            if (!checkAllGradesEntered('Annee')) { // Optional redundant check
                alert("Impossible de boucler l'année : Vérifications manquantes.");
                return;
            }
            setIsYearLocked(true);
            showSuccess("Année académique verrouillée avec succès");
        }
    };

    const resetYear = () => { };

    const addAcademicYear = (newYear) => {
        // Enforce constraint: Current year must be locked
        if (!isYearLocked && !isArchiveView) {
            alert("Impossible de créer une nouvelle année tant que l'année en cours n'est pas clôturée.");
            return;
        }

        if (!availableYears.includes(newYear)) {
            const updatedYears = [...availableYears, newYear].sort();
            setAvailableYears(updatedYears);

            // Switch to the new year and RESET everything
            setAcademicYear(newYear);
            setSelectedYear(newYear);
            setCurrentSemester('Semestre 1');

            setIsSemester1Locked(false);
            setIsSemester2Locked(false);
            setIsYearLocked(false);

            setEvaluationPeriods({
                interrogation1: { start: '', end: '', is_unlocked: false },
                interrogation2: { start: '', end: '', is_unlocked: false },
                interrogation3: { start: '', end: '', is_unlocked: false },
                devoir1: { start: '', end: '', is_unlocked: false },
                devoir2: { start: '', end: '', is_unlocked: false },
            });
            setCalculationPeriod({ start: '', end: '' });

            // Optional: You might want to clear or archive data here in a real app
        }
    };

    const value = {
        academicYear, // The *Active* current year for writing
        setAcademicYear,
        availableYears,
        selectedYear, // The year being *Viewed*
        changeYear,
        isArchiveView, // Flag to disable edits
        currentSemester,
        isSemester1Locked,
        isSemester2Locked,
        isYearLocked: isYearLocked || isArchiveView, // Treat archives as locked years
        lockSemester1,
        startSemester2,
        lockSemester2,
        lockYear,
        evaluationPeriods, setEvaluationPeriods, // NOTE: setEvaluationPeriods is now unsafe to call directly for DB sync. Use updateEvaluationPeriod.
        updateEvaluationPeriod, // New exposed function
        isGradingOpenFor,
        calculationPeriod, setCalculationPeriod, // Keep set for local, but prefer update
        updateCalculationPeriod,
        isGradingOpen,
        addAcademicYear,
        loadingPeriods
    };

    return (
        <AcademicYearContext.Provider value={value}>
            {children}
        </AcademicYearContext.Provider>
    );
};
