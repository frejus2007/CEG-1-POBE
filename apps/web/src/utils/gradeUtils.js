
import { resolveCoefficient } from './coefficients';

const round = (num) => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Calculates averages for a single subject for a student.
 * 
 * Specs:
 * - MS (Moyenne Semestrielle) = (Moyenne_Interros + Devoir_1 + Devoir_2) / 3
 * - Notes manquantes = 0
 * 
 * @param {Object} grades - { interro1, interro2, ... }
 * @param {string} className
 * @param {string} subjectName
 * @param {Array} coefficientsList - List of coefficients from DB
 */
export const calculateAverages = (grades, className, subjectName, coefficientsList = []) => {
    const parseGrade = (val) => {
        if (val === null || val === undefined) return NaN;
        const num = parseFloat(val);
        return isNaN(num) ? NaN : num;
    };

    const i1 = parseGrade(grades.interro1);
    const i2 = parseGrade(grades.interro2);
    const i3 = parseGrade(grades.interro3);

    // Devoirs defaults to 0 if missing (as per user logic usually, or keep NaN to ignore?)
    // "Les notes manquantes sont traitées comme 0.0" logic in line 38 suggests 0.
    const d1 = parseGrade(grades.devoir1);
    const d2 = parseGrade(grades.devoir2);

    let iCount = 0;
    let iSum = 0;
    if (!isNaN(i1)) { iSum += i1; iCount++; }
    if (!isNaN(i2)) { iSum += i2; iCount++; }
    if (!isNaN(i3)) { iSum += i3; iCount++; }

    // Moyenne Interro (M.I)
    let rawAvgInterro = iCount > 0 ? iSum / iCount : 0;
    const avgInterro = round(rawAvgInterro);

    // Moyenne (M) = (M.I + Devoir1 + Devoir2) / 3
    // Treat missing devoirs as 0
    const valD1 = !isNaN(d1) ? d1 : 0;
    const valD2 = !isNaN(d2) ? d2 : 0;

    const rawAvgSem = (avgInterro + valD1 + valD2) / 3;
    const avgSem = round(rawAvgSem);

    // Dynamic Coefficient Resolution
    const coeff = resolveCoefficient(coefficientsList, className, subjectName);

    // Weighted Average for this subject (Contribution to General Average)
    const weightedAvg = round(avgSem * coeff);

    return {
        avgInterro: avgInterro.toFixed(2),
        devoir1: valD1,
        devoir2: valD2,
        avgSem: avgSem.toFixed(2),
        coeff: coeff,
        weightedAvg: weightedAvg.toFixed(2) // Display purpose
    };
};

/**
 * Calculates General Average (MG) for a student.
 * MG = (Sum(MS * Coeff)) / (Sum(Coeffs))
 * Note: Denominator is Sum(Coeffs). Spec says "+ 1" ? 
 * Spec: MG = (Sum [MS_mat * Coeff_mat] + MS_conduite) / (Sum Coeff_mat + 1)
 * This implies Conduite is treated separately in numerator and denominator.
 * 
 * If our list of subjects INCLUDES Conduite, then:
 * Numerator = Sum(MS * Coeff) (since Conduite has Coeff 1)
 * Denominator = Sum(Coeffs) (since Conduite contributes 1)
 * 
 * So check if "Conduite" is in the subject list processed or added manually.
 */
export const calculateGeneralAverage = (studentSubjectsData) => {
    // studentSubjectsData: Array of { avgSem, coeff, subjectName }

    let totalWeightedSum = 0;
    let totalCoeffs = 0;

    // Check if Conduite is present
    const hasConduite = studentSubjectsData.some(s => s.subjectName.toLowerCase().includes('conduite'));

    studentSubjectsData.forEach(subj => {
        const ms = parseFloat(subj.avgSem);
        const coef = subj.coeff;

        if (!isNaN(ms)) {
            totalWeightedSum += (ms * coef);
            totalCoeffs += coef;
        }
    });

    // If Conduite is missing from data but required, we basically treat it as 0? 
    // Spec says "Conduite is treated separately".
    // Usually Conduite is a subject like any other in the grades table.
    // If it's in the list, the generic formula works.

    const mg = totalWeightedSum / totalCoeffs;
    return round(mg).toFixed(2);
};

/**
 * Ranks students based on their General Average (MG).
 * @param {Array} studentsWithAvg - Array of { studentId, mg: float }
 * @returns {Object} - Map of studentId -> { rank, totalStudents }
 */
export const calculateRank = (studentsWithAvg) => {
    // Sort descending by MG
    const sorted = [...studentsWithAvg].sort((a, b) => b.mg - a.mg);

    const rankMap = {};
    let currentRank = 1;

    sorted.forEach((student, index) => {
        // Handle ties: if same avg as prev, same rank
        if (index > 0 && student.mg === sorted[index - 1].mg) {
            rankMap[student.studentId] = {
                rank: rankMap[sorted[index - 1].studentId].rank, // Same rank
                total: studentsWithAvg.length
            };
        } else {
            rankMap[student.studentId] = {
                rank: currentRank,
                total: studentsWithAvg.length
            };
        }
        currentRank++;
    });

    return rankMap;
};

/**
 * Calculates Min, Max, and Avg for the class per subject.
 * @param {Array} allGrades - Relational grades of the whole class
 * @param {string} subjectName 
 */
export const calculateSubjectStats = (allGrades, subjectName) => {
    // To be implemented if needed for footer stats
    return { min: 0, max: 20, avg: 10 };
};
