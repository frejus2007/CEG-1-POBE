
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lnyqpzsrcmcmkngbcyqn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxueXFwenNyY21jbWtuZ2JjeXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDIzOTMsImV4cCI6MjA4NTUxODM5M30.5sWihYcxKL2wOi3LTEMfopFNkTEsRits0siG6N_sX24';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectMobileData() {
    console.log("Authenticating...");
    await supabase.auth.signInWithPassword({
        email: 'censeur@ceg1pobe.bj',
        password: 'password123'
    });

    console.log("1. Searching for student 'ADEKOUNLE'...");
    const { data: students, error: sErr } = await supabase
        .from('students')
        .select('*')
        .ilike('last_name', '%ADEKOUNLE%');

    if (sErr || !students.length) return console.log("❌ Student not found");
    const student = students[0];
    console.log(`✅ Found Student: ${student.first_name} ${student.last_name} (${student.id})`);

    console.log("2. Fetching Grades for this student...");
    const { data: grades, error: gErr } = await supabase
        .from('grades')
        .select('*, evaluation:evaluations(*)')
        .eq('student_id', student.id);

    if (gErr) return console.log("❌ Error fetching grades:", gErr);
    console.log(`✅ Found ${grades.length} grades.`);

    if (grades.length > 0) {
        grades.forEach(g => {
            console.log("--- Grade ---");
            console.log(`Value: ${g.note}`);
            console.log(`Eval ID: ${g.evaluation_id}`);
            if (g.evaluation) {
                console.log(`Eval Type: '${g.evaluation.type}'`);
                console.log(`Eval Index: ${g.evaluation.type_index}`);
                console.log(`Eval Semester: ${g.evaluation.semester}`);
                console.log(`Eval Subject ID: ${g.evaluation.subject_id}`);
                console.log(`Eval Class ID: ${g.evaluation.class_id}`);
            } else {
                console.log("❌ ORPHAN GRADE (No Evaluation found)");
            }
        });
    }

    console.log("3. Checking Class '2nde C'...");
    const { data: cls } = await supabase.from('classes').select('id, name').eq('name', '2nde C').single();
    if (cls) {
        console.log(`✅ Class '2nde C' ID: ${cls.id}`);
        // Check if matches eval
    } else {
        console.log("❌ Class '2nde C' not found in DB by name '2nde C'");
    }

    console.log("4. Checking Subject 'Français'...");
    const { data: subj } = await supabase.from('subjects').select('id, name').eq('name', 'Français').single();
    if (subj) {
        console.log(`✅ Subject 'Français' ID: ${subj.id}`);
    } else {
        console.log("❌ Subject 'Français' not found in DB");
    }
}

inspectMobileData();
