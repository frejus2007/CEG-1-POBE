export const initialClasses = [
    // College
    { id: 1, name: "6ème M1", students: 45, mainTeacher: "Non assigné", subjects: 10 },
    { id: 2, name: "6ème M2", students: 42, mainTeacher: "Non assigné", subjects: 10 },
    { id: 3, name: "5ème M1", students: 38, mainTeacher: "Non assigné", subjects: 10 },
    { id: 4, name: "5ème M2", students: 40, mainTeacher: "Non assigné", subjects: 10 },
    { id: 5, name: "4ème M1", students: 35, mainTeacher: "Non assigné", subjects: 10 },
    { id: 6, name: "3ème M1", students: 32, mainTeacher: "Non assigné", subjects: 10 },
    // Lycée
    { id: 7, name: "2nde A", students: 35, mainTeacher: "Non assigné", subjects: 13 },
    { id: 8, name: "1ère D", students: 30, mainTeacher: "Non assigné", subjects: 13 },
    { id: 9, name: "Tle D", students: 25, mainTeacher: "Non assigné", subjects: 13 },
];

export const initialTeachers = [
    { id: 1, nom: "SOSSOU", prenom: "Pierre", subject: "Mathématiques", phone: "+229 97 00 11 22", email: "p.sossou@ceg1pobe.bj", classes: ["3ème M1", "6ème M2"] },
    { id: 2, nom: "AGBOSSA", prenom: "Joelle", subject: "SVT", phone: "+229 96 11 22 33", email: "j.agbossa@ceg1pobe.bj", classes: ["4ème M2", "5ème M3"] },
    { id: 3, nom: "DOSSOU", prenom: "Jean", subject: "Histoire-Géo", phone: "+229 95 22 33 44", email: "j.dossou@ceg1pobe.bj", classes: ["3ème M1", "3ème M2"] },
    { id: 4, nom: "KOUASSI", prenom: "Aline", subject: "Anglais", phone: "+229 66 33 44 55", email: "a.kouassi@ceg1pobe.bj", classes: ["6ème M1", "5ème M1"] },
    { id: 5, nom: "TOSSOU", prenom: "Michel", subject: "Physique-Chimie", phone: "+229 94 44 55 66", email: "m.tossou@ceg1pobe.bj", classes: ["3ème M2", "4ème M1"] },
];

export const initialAssignments = [
    { id: 1, teacher: "SOSSOU Pierre", class: "3ème M1", subject: "Mathématiques", hours: 4 },
    { id: 2, teacher: "SOSSOU Pierre", class: "6ème M2", subject: "Mathématiques", hours: 4 },
    { id: 3, teacher: "AGBOSSA Joelle", class: "4ème M2", subject: "SVT", hours: 2 },
    { id: 4, teacher: "AGBOSSA Joelle", class: "5ème M1", subject: "SVT", hours: 2 },
    { id: 5, teacher: "DOSSOU Jean", class: "3ème M1", subject: "Hist-Géo", hours: 2 },
    { id: 6, teacher: "KOUASSI Aline", class: "6ème M1", subject: "Anglais", hours: 3 },
];

export const initialStudents = [
    // 3ème M1
    {
        id: 1, matricule: "12345", nom: "ADANLAWO", prenom: "Fiacre", class: "3ème M1", dob: "12/05/2009", avg: 15.5,
        grades: {
            "Mathématiques": {
                "Semestre 1": { interro1: 15, interro2: 14, interro3: 16, devoir1: 15, devoir2: 16 }
            }
        }
    },
    { id: 2, matricule: "12346", nom: "BOKO", prenom: "Paul", class: "3ème M1", dob: "23/08/2008", avg: 12.0 },

    // 6ème M1 (Default Load)
    { id: 10, matricule: "12401", nom: "AKPO", prenom: "Marcel", class: "6ème M1", dob: "12/03/2012", avg: 14.5 },
    { id: 11, matricule: "12402", nom: "BOSSOU", prenom: "Justine", class: "6ème M1", dob: "22/07/2012", avg: 16.0 },
    { id: 12, matricule: "12403", nom: "CHADARE", prenom: "Luc", class: "6ème M1", dob: "05/11/2012", avg: 11.2 },

    // 6ème M2
    {
        id: 3, matricule: "12347", nom: "CHABI", prenom: "Aminatou", class: "6ème M2", dob: "10/01/2012", avg: 16.8,
        grades: {
            "Mathématiques": {
                "Semestre 1": { interro1: 18, interro2: 17, interro3: 19, devoir1: 18, devoir2: 18.5 }
            }
        }
    },

    // Others
    { id: 4, matricule: "12348", nom: "DADJO", prenom: "Saturnin", class: "5ème M1", dob: "05/11/2010", avg: 9.5 },
    { id: 5, matricule: "12349", nom: "EGBE", prenom: "Clotilde", class: "4ème M1", dob: "14/02/2010", avg: 14.2 },
];
