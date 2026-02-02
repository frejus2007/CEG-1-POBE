import React, { createContext, useContext, useState, useEffect } from 'react';

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
    const [availableYears, setAvailableYears] = useState(() => {
        const stored = localStorage.getItem('availableYears');
        return stored ? JSON.parse(stored) : ['2023-2024', '2024-2025', '2025-2026'];
    });
    const [selectedYear, setSelectedYear] = useState(() => localStorage.getItem('selectedYear') || '2025-2026');

    // Basic State
    const [academicYear, setAcademicYear] = useState(() => localStorage.getItem('academicYear') || '2025-2026');
    const [currentSemester, setCurrentSemester] = useState(() => localStorage.getItem('currentSemester') || 'Semestre 1');

    // Locking State
    const [isSemester1Locked, setIsSemester1Locked] = useState(() => localStorage.getItem('isSemester1Locked') === 'true');
    const [isSemester2Locked, setIsSemester2Locked] = useState(() => localStorage.getItem('isSemester2Locked') === 'true');
    const [isYearLocked, setIsYearLocked] = useState(() => localStorage.getItem('isYearLocked') === 'true');

    // Deadline State
    const [evaluationPeriods, setEvaluationPeriods] = useState(() => {
        const stored = localStorage.getItem('evaluationPeriods');
        return stored ? JSON.parse(stored) : {
            interrogation1: { start: '', end: '' },
            interrogation2: { start: '', end: '' },
            interrogation3: { start: '', end: '' },
            devoir1: { start: '', end: '' },
            devoir2: { start: '', end: '' },
        };
    });

    const [calculationPeriod, setCalculationPeriod] = useState(() => {
        const stored = localStorage.getItem('calculationPeriod');
        return stored ? JSON.parse(stored) : { start: '', end: '' };
    });

    // Derived state
    const isArchiveView = academicYear !== selectedYear;

    // Check if grading is open for a specific type
    const isGradingOpenFor = (type) => {
        if (isArchiveView || isYearLocked) return false;

        const period = evaluationPeriods[type];
        if (!period || !period.end) return true; // Open if no deadline set

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
        localStorage.setItem('evaluationPeriods', JSON.stringify(evaluationPeriods));
        localStorage.setItem('calculationPeriod', JSON.stringify(calculationPeriod));
    }, [academicYear, currentSemester, isSemester1Locked, isSemester2Locked, isYearLocked, availableYears, selectedYear, evaluationPeriods, calculationPeriod]);


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
    };

    const lockYear = () => {
        if (isArchiveView) return;
        if (isSemester1Locked && isSemester2Locked) {
            if (!checkAllGradesEntered('Annee')) { // Optional redundant check
                alert("Impossible de boucler l'année : Vérifications manquantes.");
                return;
            }
            setIsYearLocked(true);
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
                interrogation1: { start: '', end: '' },
                interrogation2: { start: '', end: '' },
                interrogation3: { start: '', end: '' },
                devoir1: { start: '', end: '' },
                devoir2: { start: '', end: '' },
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
        evaluationPeriods, setEvaluationPeriods,
        isGradingOpenFor,
        calculationPeriod, setCalculationPeriod,
        isGradingOpen,
        addAcademicYear
    };

    return (
        <AcademicYearContext.Provider value={value}>
            {children}
        </AcademicYearContext.Provider>
    );
};
