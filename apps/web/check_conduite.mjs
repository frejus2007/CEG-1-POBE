
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lnyqpzsrcmcmkngbcyqn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxueXFwenNyY21jbWtuZ2JjeXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDIzOTMsImV4cCI6MjA4NTUxODM5M30.5sWihYcxKL2wOi3LTEMfopFNkTEsRits0siG6N_sX24';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConduite() {
    console.log("Checking Conduite Grades...");

    // 1. Get Conduite Subject ID
    const { data: subjects } = await supabase.from('subjects').select('id, name');
    const conduiteSubj = subjects.find(s => s.name.toLowerCase().includes('conduite'));

    if (!conduiteSubj) return console.log("No subject 'Conduite' found.");
    console.log(`Conduite Subject ID: ${conduiteSubj.id}`);

    // 2. Get Evaluations for Conduite
    const { data: evals } = await supabase
        .from('evaluations')
        .select('*')
        .eq('subject_id', conduiteSubj.id);

    console.log(`Found ${evals.length} evaluation records for Conduite.`);

    // 3. Get Grades
    const { data: grades } = await supabase
        .from('grades')
        .select('*, evaluation:evaluations!inner(*)')
        .eq('evaluation.subject_id', conduiteSubj.id);

    console.log(`Found ${grades.length} grades for Conduite.`);

    // 4. Group by Student to check for Triplé
    const studentGrades = {};
    grades.forEach(g => {
        if (!studentGrades[g.student_id]) studentGrades[g.student_id] = [];
        studentGrades[g.student_id].push(g);
    });

    Object.keys(studentGrades).forEach(sId => {
        const gs = studentGrades[sId];
        const semester = gs[0].evaluation.semester; // assume same info for simplicity check

        const hasI1 = gs.some(g => g.evaluation.type === 'Interrogation');
        const hasD1 = gs.some(g => g.evaluation.type === 'Devoir' && g.evaluation.type_index === 1);
        const hasD2 = gs.some(g => g.evaluation.type === 'Devoir' && g.evaluation.type_index === 2);

        if (hasI1 && (!hasD1 || !hasD2)) {
            console.log(`[ALERT] Student ${sId} (Sem ${semester}): Incomplete Conduite. I1: ${hasI1}, D1: ${hasD1}, D2: ${hasD2}`);
        } else if (hasI1 && hasD1 && hasD2) {
            console.log(`[OK] Student ${sId} (Sem ${semester}): Complete Triplé.`);
        }
    });
}

checkConduite();
