
import { createClient } from '@supabase/supabase-js';
import { calculateAverages, calculateGeneralAverage, calculateRank } from './src/utils/gradeUtils.js';
import { resolveCoefficient } from './src/utils/coefficients.js';

// Mock browser deps for node
global.localStorage = { getItem: () => null };

const supabaseUrl = 'https://lnyqpzsrcmcmkngbcyqn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxueXFwenNyY21jbWtuZ2JjeXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDIzOTMsImV4cCI6MjA4NTUxODM5M30.5sWihYcxKL2wOi3LTEMfopFNkTEsRits0siG6N_sX24';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testReports() {
    console.log("--- START DEBUG REPORTS ---");

    // 1. Auth
    await supabase.auth.signInWithPassword({
        email: 'censeur@ceg1pobe.bj',
        password: 'password123'
    });

    // 2. Context Setup (2nde C / Français)
    const { data: cls } = await supabase.from('classes').select('*').eq('name', '2nde C').single();
    if (!cls) return console.error("Class 2nde C not found");
    const targetClassId = cls.id;

    const { data: students } = await supabase.from('students').select('*').eq('current_class_id', targetClassId).limit(3);
    if (!students.length) return console.error("No students in 2nde C");
    console.log(`Testing with ${students.length} students...`);

    const { data: subjects } = await supabase.from('subjects').select('*');
    // Mock coefficients (since context loads them usually)
    // We'll fetch from DB manually for checking
    const { data: coeffsDB } = await supabase.from('subject_coefficients').select('*');

    // 3. Fetch Grades (Relational)
    // Reports.jsx: .eq('evaluation.semester', parseInt(semester));
    const semester = 1;
    const { data: gradesData, error } = await supabase
        .from('grades')
        .select('*, evaluation:evaluations!inner(*)')
        .in('student_id', students.map(s => s.id))
        .eq('evaluation.semester', semester);

    if (error) {
        console.error("Fetch Error:", error);
        return;
    }
    console.log(`Fetched ${gradesData.length} grades total.`);

    // 4. Process
    const studentsData = students.map(student => {
        const studentGrades = gradesData.filter(g => g.student_id === student.id);

        const processedSubjects = subjects.map(subj => {
            const subjGradesList = studentGrades.filter(g => g.evaluation.subject_id === subj.id);

            if (subjGradesList.length === 0) return null; // Skip empty subjects for clarity in debug

            const gradesMap = {};
            subjGradesList.forEach(g => {
                const type = g.evaluation.type === 'Interrogation' ? 'interro' : 'devoir';
                const idx = g.evaluation.type_index;
                gradesMap[`${type}${idx}`] = g.note;
            });

            // LOGIC CHECK: calculateAverages
            // NOTE: We need to pass the list of coefficients to calculateAverages now
            // But verify resolveCoefficient works
            const stats = calculateAverages(gradesMap, cls.name, subj.name, coeffsDB);

            return {
                subjectName: subj.name,
                ...stats,
                gradesMap // inspect raw inputs
            };
        }).filter(Boolean);

        const mg = calculateGeneralAverage(processedSubjects);

        return {
            name: `${student.first_name} ${student.last_name}`,
            subjects: processedSubjects,
            mg
        };
    });

    // 5. Output
    studentsData.forEach(s => {
        console.log(`\nStudent: ${s.name} | MG: ${s.mg}`);
        s.subjects.forEach(subj => {
            console.log(`   - ${subj.subjectName}: M.Int=${subj.avgInterro}, MS=${subj.avgSem}, Coeff=${subj.coeff}, Pts=${subj.weightedAvg}`);
            console.log(`     Raw:`, JSON.stringify(subj.gradesMap));
        });
    });
}

testReports();
