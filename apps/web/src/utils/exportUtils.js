import * as XLSX from 'xlsx';

// --- MOCK DATA GENERATORS (Existing) ---
export const generateRandomGrades = () => {
    // ... existing logic can stay if needed, or be removed if purely for real data now
    // For now, I'll keep the generator logic brief or unchanged if it was large, 
    // but based on previous view, it was small.
    // I will rewrite the file to include the NEW export function and keep older helpers if they are small.
    // Actually, I should probably just APPEND or intelligently replace. 
    // Let's rewrite the whole file to be clean.

    const students = [
        { id: 1, matricule: "ARCH-001", nom: "DOSSOU", prenom: "Marc", class: "3ème M1", dob: "12/05/2005", avg: 14.5 },
        { id: 2, matricule: "ARCH-002", nom: "SOSSOU", prenom: "Anna", class: "3ème M1", dob: "23/08/2006", avg: 16.0 },
        { id: 3, matricule: "ARCH-003", nom: "AKPO", prenom: "Jean", class: "6ème M2", dob: "10/01/2007", avg: 11.2 },
        { id: 4, matricule: "ARCH-004", nom: "TOHO", prenom: "Paul", class: "5ème M3", dob: "05/11/2006", avg: 9.8 },
        { id: 5, matricule: "ARCH-005", nom: "MENSAH", prenom: "Sarah", class: "4ème M1", dob: "14/02/2005", avg: 13.5 },
    ];

    return students.map(s => ({
        ...s,
        grades: {
            interro1: Math.floor(Math.random() * 20),
            interro2: Math.floor(Math.random() * 20),
            interro3: Math.floor(Math.random() * 20),
            devoir1: Math.floor(Math.random() * 20),
            devoir2: Math.floor(Math.random() * 20)
        }
    }));
};

export const generateRandomStudents = (_year, count) => {
    // Similar mock generator
    return Array.from({ length: count }, (_, i) => ({
        id: i + 1000,
        matricule: `ARCH-${1000 + i}`,
        nom: `NOM_ARCHIVE_${i}`,
        prenom: `Prenom_${i}`,
        class: "Archive Class",
        dob: "01/01/2000",
        avg: Math.floor(Math.random() * 20)
    }));
};

// --- REAL EXPORT UTILITY ---

export const exportToExcel = (data, fileName, sheetName = 'Sheet1') => {
    // 1. Convert JSON data to Worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // 2. Create Workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // 3. Generate buffer and trigger download
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

export const formatStudentForExport = (student) => {
    return {
        Matricule: student.matricule,
        Nom: student.nom,
        Prénom: student.prenom,
        Classe: student.class,
        "Date Naissance": student.dob
    };
};

export const formatGradesForExport = (student, stats) => {
    return {
        Matricule: student.matricule,
        Nom: student.nom,
        Prénom: student.prenom,
        "Interro 1": student.grades.interro1,
        "Interro 2": student.grades.interro2,
        "Interro 3": student.grades.interro3,
        "Moy Interro": stats.avgInterro,
        "Devoir 1": student.grades.devoir1,
        "Devoir 2": student.grades.devoir2,
        "Moyenne Sem": stats.avgSem,
        "Moyenne Coeff": stats.weightedAvg
    };
};

// CSV Export for Archives
export const downloadCSV = (data, filename) => {
    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    for (const row of data) {
        const values = headers.map(header => {
            const escaped = ('' + row[header]).replace(/"/g, '\\"');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }
    return csvRows.join('\n');
};

export const generateArchiveData = (year) => {
    // Mock archive data generation
    return [
        { Année: year, Classe: "6ème M1", Élèves: 45, Professeurs: 10 },
        { Année: year, Classe: "5ème M1", Élèves: 38, Professeurs: 9 },
        { Année: year, Classe: "4ème M1", Élèves: 35, Professeurs: 8 },
        { Année: year, Classe: "3ème M1", Élèves: 32, Professeurs: 8 }
    ];
};

