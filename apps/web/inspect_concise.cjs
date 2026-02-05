
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lnyqpzsrcmcmkngbcyqn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxueXFwenNyY21jbWtuZ2JjeXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDIzOTMsImV4cCI6MjA4NTUxODM5M30.5sWihYcxKL2wOi3LTEMfopFNkTEsRits0siG6N_sX24';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectConcise() {
    try {
        const { error: authError } = await supabase.auth.signInWithPassword({
            email: 'censeur@ceg1pobe.bj',
            password: 'password123'
        });
        if (authError) throw authError;

        // 1. Target Data
        const { data: cls } = await supabase.from('classes').select('id').eq('name', '2nde C').single();
        const { data: subj } = await supabase.from('subjects').select('id').eq('name', 'Français').single();

        if (!cls || !subj) return console.log("!! Config Missing: Class/Subj not found");
        const targetClassId = cls.id;
        const targetSubjId = subj.id;

        console.log(`WEB TARGETS -> ClassID: ${targetClassId} | SubjID: ${targetSubjId}`);

        // 2. Student Data
        const { data: students } = await supabase.from('students').select('id').ilike('last_name', '%ADEKOUNLE%').limit(1);
        if (!students.length) return console.log("!! Student not found");
        const studId = students[0].id;

        // 3. Grades
        const { data: grades, error: gErr } = await supabase.from('grades').select('note, evaluation:evaluations(subject_id, class_id)').eq('student_id', studId);
        if (gErr) throw gErr;

        console.log(`Found ${grades.length} grades for student.`);
        grades.forEach((g, i) => {
            if (!g.evaluation) {
                console.log(`[${i}] ORPHAN`);
                return;
            }
            const eSubj = g.evaluation.subject_id;
            const eClass = g.evaluation.class_id;

            const subjMatch = eSubj == targetSubjId ? "MATCH" : "DIFF";
            const classMatch = eClass == targetClassId ? "MATCH" : "DIFF";

            console.log(`[${i}] Note:${g.note} | SubjID:${eSubj} (${subjMatch}) | ClassID:${eClass} (${classMatch})`);
        });
    } catch (err) {
        console.error("SCRIPT ERROR:", err.message);
    }
}

inspectConcise();
