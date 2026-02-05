
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lnyqpzsrcmcmkngbcyqn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxueXFwenNyY21jbWtuZ2JjeXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDIzOTMsImV4cCI6MjA4NTUxODM5M30.5sWihYcxKL2wOi3LTEMfopFNkTEsRits0siG6N_sX24';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- INLINED UTILS FOR DEBUG ---

const round = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

function resolveCoefficient(coefficientsList, classNameRaw, subjectName) {
    if (!coefficientsList || coefficientsList.length === 0) return 1;

    // Normalize
    const className = classNameRaw.trim().toUpperCase();
    const subName = subjectName.trim().toLowerCase();

    // 1. Determine Level & Cycle
    let levelPattern = "";
    let cycle = 1;

    if (className.includes("6")) { levelPattern = "6"; cycle = 1; }
    else if (className.includes("5")) { levelPattern = "5"; cycle = 1; }
    else if (className.includes("4")) { levelPattern = "4"; cycle = 1; }
    else if (className.includes("3")) { levelPattern = "3"; cycle = 1; }
    else if (className.includes("2NDE")) { levelPattern = "2nde"; cycle = 2; }
    else if (className.includes("1ERE") || className.includes("1ÈRE")) { levelPattern = "1ere"; cycle = 2; }
    else if (className.includes("TLE") || className.includes("TERMINALE")) { levelPattern = "Tle"; cycle = 2; }

    // 2. Determine Series (For Cycle 2)
    let series = null;
    if (cycle === 2) {
        if (className.includes(" A")) series = "A";
        else if (className.includes(" B")) series = "B";
        else if (className.includes(" C")) series = "C";
        else if (className.includes(" D")) series = "D";
    }

    // 3. Find Match
    const match = coefficientsList.find(c => {
        // Safe check for subject relation if populated, or plain name check if not? 
        // In this script we fetch text only, assume names match or handle IDs?
        // Actually the `subject_coefficients` table usually has `subject_id`.
        // We will assume `subjectName` matching relies on the app logic, 
        // BUT for this test Script, lets fetch coeffs with Subject NAMES joined or just ignore naming matching strictness.
        // Wait, context logic: 
        // const subject = subjects.find(s => s.id === c.subject_id);
        // return subject.name === subjectName AND ...
        return false; // Placeholder, see logic below in testReports
    });

    // In this script we will rewrite matching logic relative to Raw Data
    return 1; // Fallback to 1 if complex logic skipped, but we want to TEST coeff
}

// REAL RESOLVER using passed ID map
function resolveCoeffReal(coeffRow, targetClassId, targetSubjId, level, series) {
    // Check subject
    if (coeffRow.subject_id !== targetSubjId) return false;

    // Check Level
    const p = coeffRow.level_pattern.toLowerCase();
    const l = level.toLowerCase();
    if (!l.includes(p)) return false;

    // Check Series (if C2)
    if (coeffRow.cycle === 2) {
        if (coeffRow.series && series) {
            if (coeffRow.series !== series) return false;
        }
    }
    return true;
}


// --- MAIN TEST ---

async function testReports() {
    console.log("--- START DEBUG REPORTS (Self-Contained) ---");

    await supabase.auth.signInWithPassword({
        email: 'censeur@ceg1pobe.bj',
        password: 'password123'
    });

    const { data: cls } = await supabase.from('classes').select('*').eq('name', '2nde C').single();
    if (!cls) return console.error("Class 2nde C not found");

    const { data: students } = await supabase.from('students').select('*').eq('current_class_id', cls.id).limit(3);
    console.log(`Students: ${students.length}`);

    const { data: subjects } = await supabase.from('subjects').select('*');
    const { data: coeffs } = await supabase.from('subject_coefficients').select('*');

    const semester = 1;
    const { data: gradesData, error } = await supabase
        .from('grades')
        .select('*, evaluation:evaluations!inner(*)')
        .in('student_id', students.map(s => s.id))
        .eq('evaluation.semester', semester);

    if (error) return console.error("Grade Fetch Error:", error.message);
    console.log(`Fetched ${gradesData.length} grades.`);

    // --- PROCESS ---
    const student = students[0]; // Test 1 student
    if (!student) return;

    console.log(`\n=== DETAIL GRADES FOR: ${student.first_name} ${student.last_name} (${student.id}) ===`);
    const sGrades = gradesData.filter(g => g.student_id === student.id);

    console.log(`Total Linked Grades Found: ${sGrades.length}`);
    sGrades.forEach(g => {
        // Find subject name
        const sub = subjects.find(s => s.id === g.evaluation.subject_id);
        console.log(`[RAW] Subject: ${sub?.name} | Type: ${g.evaluation.type} ${g.evaluation.type_index} | Note: ${g.note} | Sem: ${g.evaluation.semester}`);
    });

    console.log("\n--- CALCULATIONS ---");

    let totalPts = 0;
    let totalCoeff = 0;

    subjects.forEach(subj => {
        // Filter grades
        const gList = sGrades.filter(g => g.evaluation.subject_id === subj.id);
        if (gList.length === 0) return;

        // Calc Avg
        let iSum = 0, iCount = 0;
        let d1 = 0, d2 = 0;

        gList.forEach(g => {
            // Handle potentially null/undefined notes
            const val = (g.note !== null && g.note !== undefined) ? parseFloat(g.note) : 0;

            if (isNaN(val)) {
                console.log(`   WARN: Note is NaN for grade ${g.id}`);
                return;
            }

            if (g.evaluation.type === 'Interrogation') {
                iSum += val; iCount++;
            } else if (g.evaluation.type === 'Devoir') {
                if (g.evaluation.type_index === 1) d1 = val;
                if (g.evaluation.type_index === 2) d2 = val;
            }
        });

        const avgInterro = iCount > 0 ? iSum / iCount : 0;
        const avgSem = round((round(avgInterro) + d1 + d2) / 3);

        // Resolve Coeff
        // 2nde C -> Level "2nde", Series "C", Cycle 2
        let coeffVal = 1;
        const foundC = coeffs.find(c => {
            return c.subject_id === subj.id && c.level_pattern === '2nde' && c.series === 'C';
        });
        if (foundC) coeffVal = foundC.value;

        const weighted = round(avgSem * coeffVal);
        totalCoeff += coeffVal;
        totalPts += weighted;

        console.log(`Subject: ${subj.name.padEnd(15)} | Int:${avgInterro.toFixed(2)} | D1:${d1} | MS:${avgSem.toFixed(2)} | Coeff:${coeffVal} | Pts:${weighted}`);
    });

    if (totalCoeff > 0) {
        const mg = round(totalPts / totalCoeff);
        console.log(`\nTOTAL -> Pts: ${totalPts.toFixed(2)} / Coeffs: ${totalCoeff}  => MG: ${mg}`);
    } else {
        console.log("\nTOTAL -> No coefficients processed (or 0). MG: 0.00");
    }
}

testReports();
