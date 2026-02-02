
export const getCoeff = (className, subject) => {
    // Normalize inputs
    const cls = className.toLowerCase();
    const sub = (subject || '').toLowerCase();

    // 6ème & 5ème: All Coeff 1
    if (cls.includes('6ème') || cls.includes('5ème') || cls.includes('6e') || cls.includes('5e')) {
        return 1;
    }

    // 4ème & 3ème
    if (cls.includes('4ème') || cls.includes('3ème') || cls.includes('4e') || cls.includes('3e')) {
        if (sub.includes('math') || sub.includes('pct') || sub.includes('physique')) return 3;
        if (sub.includes('français') || sub.includes('lecture') || sub.includes('histoire') || sub.includes('svt') || sub.includes('espagnol') || sub.includes('allemand') || sub.includes('anglais')) return 2;
        return 1; // Default (EPS, etc.)
    }

    // 2nde D
    if (cls.includes('2nde') || cls.includes('seconde')) {
        if (sub.includes('math') || sub.includes('pct') || sub.includes('physique')) return 4;
        if (sub.includes('svt')) return 3;
        // Assumption for others based on requested "Même chose en seconde D mais..." implying 3rd base for others
        if (sub.includes('français') || sub.includes('lecture') || sub.includes('histoire') || sub.includes('espagnol') || sub.includes('allemand') || sub.includes('anglais') || sub.includes('philo')) return 2;
        return 1;
    }

    // 1ère D & Tle D
    if (cls.includes('1ère') || cls.includes('première') || cls.includes('tle') || cls.includes('terminale')) {
        if (sub.includes('svt')) return 5;
        if (sub.includes('math') || sub.includes('pct') || sub.includes('physique')) return 4;
        if (sub.includes('français') || sub.includes('lecture') || sub.includes('histoire') || sub.includes('espagnol') || sub.includes('allemand') || sub.includes('anglais') || sub.includes('philo')) return 2;
        return 1;
    }

    return 1;
};

const round = (num) => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const calculateAverages = (grades, className, subject) => {
    const i1 = parseFloat(grades.interro1);
    const i2 = parseFloat(grades.interro2);
    const i3 = parseFloat(grades.interro3);
    const d1 = parseFloat(grades.devoir1);
    const d2 = parseFloat(grades.devoir2);

    let iCount = 0;
    let iSum = 0;
    if (!isNaN(i1)) { iSum += i1; iCount++; }
    if (!isNaN(i2)) { iSum += i2; iCount++; }
    if (!isNaN(i3)) { iSum += i3; iCount++; }

    // Moyenne Interro (M.I)
    // "Scientific" often implies rounding intermediate results to standard precision (2 decimals)
    let rawAvgInterro = iCount > 0 ? iSum / iCount : 0;
    const avgInterro = round(rawAvgInterro);

    // Moyenne (M) = (M.I + Devoir1 + Devoir2) / 3
    const valD1 = !isNaN(d1) ? d1 : 0;
    const valD2 = !isNaN(d2) ? d2 : 0;

    // Using the ROUNDED avgInterro for the next step ensures "what you see is what you get"
    const rawAvgSem = (avgInterro + valD1 + valD2) / 3;
    const avgSem = round(rawAvgSem);

    // Coefficient
    const coeff = getCoeff(className, subject);
    const weightedAvg = round(avgSem * coeff);

    return {
        avgInterro: avgInterro.toFixed(2),
        avgSem: avgSem.toFixed(2),
        coeff: coeff,
        weightedAvg: weightedAvg.toFixed(2)
    };
};
