import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { initialClasses, initialTeachers, initialAssignments, initialStudents } from '../utils/mockData';

const SchoolContext = createContext();

export const useSchool = () => {
    const context = useContext(SchoolContext);
    if (!context) {
        throw new Error('useSchool must be used within a SchoolProvider');
    }
    return context;
};

export const SchoolProvider = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(true); // Specific for Auth check
    const [error, setError] = useState(null);

    // Auth State
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [userRole, setUserRole] = useState(null); // 'TEACHER', 'CENSEUR', etc.

    // Data State
    const [classes, setClasses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [students, setStudents] = useState([]);

    const [subjects, setSubjects] = useState([]); // [NEW] Subjects list
    const [activeYear, setActiveYear] = useState(null);

    // Auth Methods
    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        // Reset state
        setUser(null);
        setSession(null);
        setUserRole(null);
        setClasses([]);
        setTeachers([]);
        setAssignments([]);
        setStudents([]);
    };

    // Initialize Auth & Data
    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setAuthLoading(false);
            }
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setAuthLoading(false);
                setLoading(false); // Stop loading data if no user
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Fetch Profile separately to set Role
    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
            } else {
                setUserRole(data?.role);
            }
        } finally {
            setAuthLoading(false);
        }
    };

    // Fetch Data from Supabase (Only if authenticated)
    const refreshData = async () => {
        if (!user) return; // Don't fetch if not logged in

        setLoading(true);
        setError(null);
        try {
            console.log("Fetching Supabase data...");

            // 1. Academic Years
            const { data: yearData, error: yearError } = await supabase
                .from('academic_years')
                .select('*')
                .eq('is_active', true)
                .maybeSingle();

            if (yearError) throw yearError;
            setActiveYear(yearData);

            // 2. Classes (with main teacher name)
            const { data: classesData, error: classError } = await supabase
                .from('classes')
                .select(`
                    *,
                    main_teacher:profiles!main_teacher_id (full_name)
                `);
            if (classError) throw classError;

            // 3. Teachers (Profiles)
            const { data: teachersData, error: teacherError } = await supabase
                .from('profiles')
                .select(`
                    *,
                    subject:subjects (name)
                `)
                .in('role', ['TEACHER', 'PRINCIPAL_TEACHER', 'CENSEUR']);
            if (teacherError) throw teacherError;

            console.log("Teachers fetched:", teachersData?.length);

            // 4. Assignments
            const { data: assignmentsData, error: assignError } = await supabase
                .from('teacher_assignments')
                .select(`
                    *,
                    class:classes (name),
                    teacher:profiles (full_name),
                    subject:subjects (name)
                `);
            if (assignError) throw assignError;

            // 5. Students
            const { data: studentsData, error: studentError } = await supabase
                .from('students')
                .select(`
                    *,
                    class:classes (name)
                `)
                .eq('is_active', true);
            if (studentError) throw studentError;

            if (studentError) throw studentError;

            // 6. Subjects (NEW)
            const { data: subjectsData, error: subjectsError } = await supabase
                .from('subjects')
                .select('*')
                .order('name');
            if (subjectsError) throw subjectsError;

            // --- ALL DATA FETCHED, NOW TRANSFORM ---

            // Transform Classes
            // Need to count students per class manually since we don't have a count aggregate view easily
            const formattedClasses = classesData.map(c => {
                const studentCount = studentsData.filter(s => s.current_class_id === c.id).length;
                return {
                    id: c.id,
                    name: c.name,
                    level: c.level,
                    series: c.series || '', // checking if series exists in new schema, maybe not
                    students: studentCount,
                    mainTeacher: c.main_teacher?.full_name || 'Non assigné',
                    subjects: 10 // TODO: Fetch real subject count per class
                };
            });

            // Transform Teachers
            const formattedTeachers = teachersData.map(t => {
                // Find classes where this teacher is assigned
                const teacherAssignments = assignmentsData.filter(a => a.teacher_id === t.id);
                const classNames = [...new Set(teacherAssignments.map(a => a.class?.name).filter(Boolean))];

                return {
                    id: t.id,
                    nom: t.full_name?.split(' ')[0] || 'Nom', // Simple split heuristic
                    prenom: t.full_name?.split(' ').slice(1).join(' ') || 'Prénom',
                    name: t.full_name, // Keep full name access
                    subject: t.subject?.name || 'Général',
                    phone: t.phone || '',
                    email: t.email || '',
                    classes: classNames
                };
            });

            // Transform Assignments
            const formattedAssignments = assignmentsData.map(a => ({
                id: a.id,
                teacher: a.teacher?.full_name || 'Inconnu',
                class: a.class?.name || 'Inconnue',
                subject: a.subject?.name || 'Matière',
                hours: 2 // Default or fetch if available
            }));

            // Transform Students
            const formattedStudents = studentsData.map(s => ({
                id: s.id,
                matricule: s.matricule,
                nom: s.last_name || s.first_name, // Fallback
                prenom: s.first_name,
                class: s.class?.name || 'Non assigné',
                dob: s.date_of_birth || '', // Check SQL field name (date_of_birth vs dob)
                avg: 0, // Calculate from grades later
                grades: {} // Populate with grades later
            }));

            // Use Setters
            setClasses(formattedClasses);
            setTeachers(formattedTeachers);
            setAssignments(formattedAssignments);
            setAssignments(formattedAssignments);
            setStudents(formattedStudents);
            setSubjects(subjectsData || []); // [NEW] Set subjects

            console.log("Supabase data loaded successfully");

        } catch (err) {
            console.error("Error loading data from Supabase:", err);
            setError(err.message);
            // Debug alert to help user identify why it's failing
            // alert("Erreur de chargement: " + err.message); 
            // setClasses(initialClasses);
        } finally {
            setLoading(false);
        }
    };

    // Trigger data fetch when user is ready
    useEffect(() => {
        if (user) {
            refreshData();
        }
    }, [user]);

    // Helper: Get teachers assigned to a specific class
    const getTeachersForClass = (className) => {
        const classAssignments = assignments.filter(a => a.class === className);
        const teacherNames = [...new Set(classAssignments.map(a => a.teacher))];
        return teachers.filter(t => teacherNames.includes(t.name) || teacherNames.includes(`${t.nom} ${t.prenom}`));
    };

    // Validation for Head Teacher
    const validateHeadTeacherAssignment = (teacherName, targetClassId) => {
        if (!teacherName || teacherName === 'Non assigné') return { valid: true };
        const existingClass = classes.find(c => c.mainTeacher === teacherName && c.id !== targetClassId);
        if (existingClass) {
            return {
                valid: false,
                error: `Ce professeur est déjà le Professeur Principal de la classe ${existingClass.name}.`
            };
        }
        return { valid: true };
    };

    // [NEW] Create Teacher (Real DB Insert)
    const createTeacher = async (teacherData) => {
        try {
            // 1. Generate UUID (we'll let Supabase do it if we passed gen_random_uuid(), but client needs to pass ID if we want to bypass Auth for now)
            // Ideally we use a random UUID.
            const newId = crypto.randomUUID();

            // 2. Prepare Insert Payload
            // Check if subject comes as ID or Name (from form)
            // We need to find the subject ID if a name is passed, or use it directly
            let subjectId = null;
            if (teacherData.subject) {
                const foundSub = subjects.find(s => s.name === teacherData.subject || s.id == teacherData.subject);
                if (foundSub) subjectId = foundSub.id;
            }

            // [MODIFIED] Call Edge Function 'create-user'
            // logic: The admin creates the user (Auth + Profile) via the secure server function.

            // Default password for new teachers
            const defaultPassword = "password123";

            const { data, error } = await supabase.functions.invoke('create-user', {
                body: {
                    email: teacherData.email,
                    password: defaultPassword,
                    userData: {
                        nom: teacherData.nom,
                        prenom: teacherData.prenom,
                        phone: teacherData.phone,
                        subjectId: subjectId
                    }
                }
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.error);

            // const { error } = await supabase
            //     .from('profiles')
            //     .insert({ ... }); // REMOVED direct insert

            if (error) throw error;

            // 3. Refresh Data to update UI
            await refreshData();
            return { success: true };

        } catch (err) {
            console.error("Error creating teacher:", err);
            return { success: false, error: err.message };
        }
    };


    const value = {
        classes, setClasses,
        teachers, setTeachers,
        assignments, setAssignments,

        students, setStudents,
        subjects, // [NEW] Export subjects
        getTeachersForClass,
        createTeacher, // [NEW] Export function
        validateHeadTeacherAssignment,
        // Data State
        loading,
        error,
        refreshData,
        activeYear,
        // Auth State
        user,
        session,
        userRole,
        authLoading,
        login,
        logout
    };

    return (
        <SchoolContext.Provider value={value}>
            {children}
        </SchoolContext.Provider>
    );
};
