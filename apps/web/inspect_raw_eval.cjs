
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lnyqpzsrcmcmkngbcyqn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxueXFwenNyY21jbWtuZ2JjeXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDIzOTMsImV4cCI6MjA4NTUxODM5M30.5sWihYcxKL2wOi3LTEMfopFNkTEsRits0siG6N_sX24';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRawID() {
    try {
        await supabase.auth.signInWithPassword({
            email: 'censeur@ceg1pobe.bj',
            password: 'password123'
        });

        // Get Student
        const { data: students } = await supabase.from('students').select('id').ilike('last_name', '%ADEKOUNLE%').limit(1);
        if (!students.length) return;
        const studId = students[0].id;

        // Get Grades RAW
        const { data: grades } = await supabase.from('grades').select('id, note, evaluation_id').eq('student_id', studId);

        console.log(`Raw Grades: ${grades.length}`);
        for (const g of grades) {
            console.log(`Grade ${g.id} -> Note: ${g.note} | Eval_ID: ${g.evaluation_id}`);

            if (g.evaluation_id) {
                // Try fetching eval directly
                const { data: evalData, error } = await supabase.from('evaluations').select('*').eq('id', g.evaluation_id).maybeSingle();
                if (error) console.log("   Fetch Error:", error.message);
                if (evalData) {
                    console.log("   Eval Found: Yes. Type:", evalData.type, "SubjectID:", evalData.subject_id);
                } else {
                    console.log("   Eval Found: NO (Orphan Link)");
                }
            } else {
                console.log("   Eval Found: NULL in DB");
            }
        }

    } catch (err) { console.error(err); }
}

checkRawID();
