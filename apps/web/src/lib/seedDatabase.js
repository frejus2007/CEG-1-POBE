
import { supabase } from './supabase';

export const seedDatabase = async () => {
    const logs = [];
    const log = (msg) => {
        console.log(msg);
        logs.push(msg);
    };

    try {
        log("Démarrage de l'initialisation...");

        // 1. Create User (Censeur)
        const email = 'censeur@ceg1pobe.bj';
        const password = 'password123';

        log(`Création du compte ${email}...`);
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            log(`Note: ${authError.message} (L'utilisateur existe peut-être déjà)`);
        }

        const userId = authData.user?.id || (await supabase.auth.getUser()).data.user?.id;

        if (!userId) {
            throw new Error("Impossible de récupérer l'ID utilisateur.");
        }

        // 2. Create Profile
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                full_name: 'Admin Censeur',
                email: email,
                role: 'CENSEUR'
            });

        if (profileError) log('Erreur profil: ' + profileError.message);
        else log('Profil Censeur créé/mis à jour.');

        // 3. Academic Year
        const { data: yearData, error: yearError } = await supabase
            .from('academic_years')
            .upsert({ name: '2025-2026', is_active: true, current_semester: 1 }, { onConflict: 'name' })
            .select()
            .single();

        if (yearError) throw yearError;
        const yearId = yearData.id;
        log('Année scolaire 2025-2026 prête.');

        // 4. Subjects
        const subjects = [
            { name: 'Mathématiques', code: 'MATH' },
            { name: 'Français', code: 'FR' },
            { name: 'Anglais', code: 'ANG' },
            { name: 'SVT', code: 'SVT' },
            { name: 'Physique-Chimie', code: 'PCT' },
            { name: 'Histoire-Géo', code: 'HG' }
        ];

        const { error: subjError } = await supabase
            .from('subjects')
            .upsert(subjects, { onConflict: 'code' });

        if (subjError) throw subjError;
        log('Matières créées.');

        // 5. Classes
        const classes = [
            { name: '6ème M1', level: '6eme', academic_year_id: yearId },
            { name: '3ème M1', level: '3eme', academic_year_id: yearId }
        ];

        const { data: classesData, error: classError } = await supabase
            .from('classes')
            .upsert(classes, { onConflict: 'name' })
            .select();

        if (classError) throw classError;
        log(`${classesData.length} classes créées.`);

        // 6. Students
        // Need class IDs
        const class6 = classesData.find(c => c.name === '6ème M1');

        if (class6) {
            const students = [
                { matricule: '1001', first_name: 'Jean', last_name: 'DUPONT', gender: 'M', current_class_id: class6.id },
                { matricule: '1002', first_name: 'Marie', last_name: 'CURIE', gender: 'F', current_class_id: class6.id }
            ];

            const { error: studError } = await supabase
                .from('students')
                .upsert(students, { onConflict: 'matricule' });

            if (studError) throw studError;
            log('Élèves de test créés.');
        }

        log("✅ Initialisation terminée avec succès !");
        return { success: true, logs };

    } catch (err) {
        log("❌ Erreur critique : " + err.message);
        console.error(err);
        return { success: false, logs };
    }
};
