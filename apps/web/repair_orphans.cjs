
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lnyqpzsrcmcmkngbcyqn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxueXFwenNyY21jbWtuZ2JjeXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDIzOTMsImV4cCI6MjA4NTUxODM5M30.5sWihYcxKL2wOi3LTEMfopFNkTEsRits0siG6N_sX24';
const supabase = createClient(supabaseUrl, supabaseKey);

async function repairOrphans() {
    console.log("Starting Repair...");
    await supabase.auth.signInWithPassword({
        email: 'censeur@ceg1pobe.bj',
        password: 'password123'
    });

    // 1. Get Target Context (2nde C, Français, Sem 1, Interro 1)
    const { data: cls } = await supabase.from('classes').select('id').eq('name', '2nde C').single();
    const { data: subj } = await supabase.from('subjects').select('id').eq('name', 'Français').single();

    if (!cls || !subj) return console.log("Config not found");

    // 2. Ensure Evaluation Exists
    let evalId = null;
    let { data: existingEval } = await supabase
        .from('evaluations')
        .select('id')
        .match({
            class_id: cls.id,
            subject_id: subj.id,
            semester: 1,
            type: 'Interrogation',
            type_index: 1
        })
        .maybeSingle();

    if (existingEval) {
        console.log("Evaluation found:", existingEval.id);
        evalId = existingEval.id;
    } else {
        console.log("Creating new evaluation...");
        const { data: { user } } = await supabase.auth.getUser();
        const { data: newEval, error } = await supabase.from('evaluations').insert({
            title: 'Interro 1 - Semestre 1',
            class_id: cls.id,
            subject_id: subj.id,
            semester: 1,
            type: 'Interrogation',
            type_index: 1,
            created_by: user.id
        }).select().single();

        if (error) return console.error("Create Eval Error:", error.message);
        evalId = newEval.id;
    }

    // 3. Find Orphan Grades for specific students by value (heuristic based on screenshot)
    // Jerry (15), Jesugnon (11), Jola-Adé (17), Marie-Ange (11)
    // We filter by student name pattern AND match value to be sure

    const targets = [
        { name: 'HONFOGBO', note: 15.0 },
        { name: 'DANNON', note: 11.0 },
        { name: 'ADEKOUNLE', note: 17.0 },
        { name: 'AHOUANDJINOU', note: 11.0 }
    ];

    for (const t of targets) {
        // Find student
        const { data: students } = await supabase.from('students').select('id').ilike('last_name', `%${t.name}%`).limit(1);
        if (!students.length) {
            console.log(`Skipping ${t.name} (Not found)`);
            continue;
        }
        const sId = students[0].id;

        // Find grade for this student
        const { data: grades } = await supabase.from('grades').select('id, note, evaluation_id').eq('student_id', sId);

        // Find the one that matches value (heuristic) OR has invalid ID
        // Since we know one is invalid...
        for (const g of grades) {
            // Check if eval exists
            let isOrphan = false;
            if (g.evaluation_id) {
                const { data: e } = await supabase.from('evaluations').select('id').eq('id', g.evaluation_id).maybeSingle();
                if (!e) isOrphan = true;
            } else {
                isOrphan = true;
            }

            if (isOrphan) {
                console.log(`Fixing orphan grade for ${t.name} (Note: ${g.note})...`);
                const { error: upErr } = await supabase.from('grades').update({ evaluation_id: evalId }).eq('id', g.id);
                if (!upErr) console.log("   Fixed!");
                else console.error("   Fix Failed:", upErr.message);
            }
        }
    }
}

repairOrphans();
