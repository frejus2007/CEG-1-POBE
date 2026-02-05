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

    // Active Year Data (Full Object from DB)
    const [activeYearData, setActiveYearData] = useState(null);

    // Basic State (Legacy compatibility, but driven by activeYearData for logic)
    const [academicYear, setAcademicYear] = useState(() => localStorage.getItem('academicYear') || '2025-2026');
    const [currentSemester, setCurrentSemester] = useState(() => localStorage.getItem('currentSemester') || 'Semestre 1');

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
            const { data, error } = await supabase.from('academic_years').select('*');
            if (error) throw error;
            if (data && data.length > 0) {
                const years = data.map(y => y.name).sort();
                setAvailableYears(years);

                // Sync current active year if found
                const active = data.find(y => y.is_active);
                if (active) {
                    setActiveYearData(active);
                    setAcademicYear(active.name);

                    // Sync semester from DB
                    const semesterName = active.current_semester === 2 ? 'Semestre 2' : 'Semestre 1';
                    setCurrentSemester(semesterName);

                    if (!selectedYear) setSelectedYear(active.name);
                } else {
                    // Fallback if no active year? Just pick the last one or something?
                    // If we are just viewing archives, that is fine.
                    setActiveYearData(null);
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
            const { data: existing } = await supabase.from('censor_unlocks').select('id').eq('type', type).eq('index', index).single();
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
        setCalculationPeriod(prev => ({ ...prev, ...updates }));

        try {
            const { data: existing } = await supabase.from('censor_unlocks').select('id').eq('type', 'CALCULATION').eq('index', 1).single();

            const payload = {
                type: 'CALCULATION',
                index: 1,
                start_date: updates.start !== undefined ? updates.start : calculationPeriod.start,
                end_date: updates.end !== undefined ? updates.end : calculationPeriod.end,
                updated_at: new Date()
            };

            // Clean payload
            if (payload.start_date === '') payload.start_date = null;
            if (payload.end_date === '') payload.end_date = null;

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

    // --- LOCKING & SEMESTER LOGIC ---

    // Derived Locks based on Active Year Data
    // User Requirement: "c'est quand on cloture l'année que les deux semestres seront considérés comme bouclés"

    // If year is NOT active (closed), everything is locked.
    // If we are viewing an archive, it is locked.
    const isYearLocked = isArchiveView || (activeYearData && !activeYearData.is_active);

    // Semesters are locked ONLY if the year is locked OR individual lock is active
    const isSemester1Locked = isYearLocked || (activeYearData && activeYearData.is_semester1_locked);
    const isSemester2Locked = isYearLocked || (activeYearData && activeYearData.is_semester2_locked);

    // Actions involving DB updates

    const setSemester = async (semesterNum) => {
        if (!activeYearData) return;

        try {
            const { error } = await supabase
                .from('academic_years')
                .update({ current_semester: semesterNum })
                .eq('id', activeYearData.id);

            if (error) throw error;

            // Update local state
            setActiveYearData(prev => ({ ...prev, current_semester: semesterNum }));
            setCurrentSemester(semesterNum === 2 ? 'Semestre 2' : 'Semestre 1');
            showSuccess(`Passage au Semestre ${semesterNum} effectué`);
        } catch (err) {
            console.error("Error setting semester:", err);
            showError("Erreur lors du changement de semestre");
        }
    };

    const toggleYearStatus = async () => {
        if (!activeYearData) return;

        const newStatus = !activeYearData.is_active; // Toggle

        try {
            const { error } = await supabase
                .from('academic_years')
                .update({
                    is_active: newStatus,
                    // Note: We do NOT toggle individual semester locks here anymore,
                    // we keep their independent state. The 'isYearLocked' will override them anyway.
                })
                .eq('id', activeYearData.id);

            if (error) throw error;

            setActiveYearData(prev => ({
                ...prev,
                is_active: newStatus
            }));

            showSuccess(newStatus ? "Année réouverte avec succès" : "Année clôturée avec succès");
        } catch (err) {
            console.error("Error toggling year status:", err);
            showError("Erreur lors de la modification du statut de l'année");
        }
    };

    const toggleSemesterLock = async (semesterNum) => {
        if (!activeYearData) return;
        if (isYearLocked) {
            showError("Impossible de modifier les semestres quand l'année est clôturée.");
            return;
        }

        const field = semesterNum === 1 ? 'is_semester1_locked' : 'is_semester2_locked';
        const currentVal = activeYearData[field];
        const newVal = !currentVal;

        try {
            const { error } = await supabase
                .from('academic_years')
                .update({ [field]: newVal })
                .eq('id', activeYearData.id);

            if (error) throw error;

            setActiveYearData(prev => ({
                ...prev,
                [field]: newVal
            }));

            showSuccess(`Semestre ${semesterNum} ${newVal ? 'verrouillé' : 'déverrouillé'}`);
        } catch (err) {
            console.error(`Error toggling semester ${semesterNum}:`, err);
            showError("Erreur lors de la modification du semestre");
        }
    };

    // Check if grading is open for a specific type
    const isGradingOpenFor = (type) => {
        if (isYearLocked) return false;

        const period = evaluationPeriods[type];
        if (!period) return false;

        if (!period.is_unlocked) return false;

        if (!period.end) return true;

        const deadline = new Date(period.end);
        const now = new Date();
        deadline.setHours(23, 59, 59, 999);
        return now <= deadline;
    };

    const isGradingOpen = () => !isYearLocked;

    const changeYear = (year) => {
        setSelectedYear(year);
    };

    const addAcademicYear = async (newYearName) => {
        // Enforce constraint: Current year must be locked (cloturée)
        if (!isYearLocked && !isArchiveView) {
            showError("Veuillez clôturer l'année en cours avant d'en créer une nouvelle.");
            return;
        }

        try {
            // 1. Deactivate all years (just to be safe, though strict toggle above handles current)
            await supabase.from('academic_years').update({ is_active: false }).neq('id', -1);

            // 2. Insert new year
            const { data, error } = await supabase
                .from('academic_years')
                .insert([{
                    name: newYearName,
                    is_active: true,
                    current_semester: 1,
                    is_semester1_locked: false,
                    is_semester2_locked: false
                }])
                .select()
                .single();

            if (error) throw error;

            // 3. Update State
            setAvailableYears(prev => [...prev, newYearName].sort());
            setAcademicYear(newYearName);
            setSelectedYear(newYearName);
            setActiveYearData(data);
            setCurrentSemester('Semestre 1');

            showSuccess(`Nouvelle année ${newYearName} activée`);

        } catch (err) {
            console.error("Error adding academic year:", err);
            showError("Erreur lors de la création de la nouvelle année");
        }
    };

    const value = {
        academicYear,
        setAcademicYear,
        availableYears,
        selectedYear,
        changeYear,
        isArchiveView,
        currentSemester,

        // Exposed Locking State
        isSemester1Locked, // Derived
        isSemester2Locked, // Derived
        isYearLocked,      // Derived

        // New Methods
        setSemester,
        toggleYearStatus,
        toggleSemesterLock,

        evaluationPeriods, setEvaluationPeriods,
        updateEvaluationPeriod,
        isGradingOpenFor,
        calculationPeriod, setCalculationPeriod,
        updateCalculationPeriod,
        isGradingOpen,
        addAcademicYear,
        loadingPeriods,

        activeYearData // Exposed for UI to know if active
    };

    return (
        <AcademicYearContext.Provider value={value}>
            {children}
        </AcademicYearContext.Provider>
    );
};
