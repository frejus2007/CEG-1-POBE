import React, { useState, useEffect } from 'react';
import { Save, Calculator, Lock, ChevronDown, Download, RefreshCw } from 'lucide-react';
import { useAcademicYear } from '../context/AcademicYearContext';
import { useSchool } from '../context/SchoolContext';
import { calculateAverages } from '../utils/gradeUtils';
import { exportToExcel, formatGradesForExport } from '../utils/exportUtils';
import { supabase } from '../lib/supabase';

// Mock subjects removed, using context


const Grades = () => {
    const { currentSemester, isSemester1Locked, isSemester2Locked, isYearLocked, isGradingOpen } = useAcademicYear();
    const { classes, students: globalStudents, saveGrade, coefficients, subjects } = useSchool(); // Get subjects from context

    // Default to first class if available
    const [selectedClass, setSelectedClass] = useState(classes.length > 0 ? classes[0].name : "");

    // Default subject - handle if subjects array is empty initially
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedViewSemester, setSelectedViewSemester] = useState("Semestre 1");

    // Update selected subject when subjects load
    useEffect(() => {
        if (subjects.length > 0 && !selectedSubject) {
            setSelectedSubject(subjects[0].name);
        }
    }, [subjects, selectedSubject]);

    // Local state for the table (filtered students)
    const [localStudents, setLocalStudents] = useState([]);
    const [isLoadingGrades, setIsLoadingGrades] = useState(false);

    // Ensure we have a default class when data loads
    useEffect(() => {
        if (!selectedClass && classes.length > 0) {
            setSelectedClass(classes[0].name);
        }
    }, [classes, selectedClass]);

    // Sync local state when filters or global data change
    useEffect(() => {
        if (!selectedClass) return;

        // Filter students for the selected class from context
        const classStudents = globalStudents.filter(s => s.class === selectedClass);

        // Sort alphabetically by Name
        const sortedStudents = [...classStudents].sort((a, b) => a.nom.localeCompare(b.nom));

        // Initialize local students (will be enriched by fetch below)
        setLocalStudents(sortedStudents);
    }, [selectedClass, globalStudents]);

    // FETCH GRADES from Database
    useEffect(() => {
        const fetchGradesForSelection = async () => {
            // Need students to be loaded first
            if (!selectedClass || !selectedSubject || localStudents.length === 0) return;

            // Avoid infinite loop if we are just updating localStudents from this effect?
            // No, localStudents.length check might be dangerous if empty class.
            // Better: Depend on selectedClass/Subject and execute.
        };
        // We handle this logic below to avoid conflicts with the previous effect
    }, []);

    // Combined Effect: When [selectedClass, selectedSubject, globalStudents] changes
    useEffect(() => {
        const loadData = async () => {
            if (!selectedClass || !selectedSubject) return;

            const classStudents = globalStudents.filter(s => s.class === selectedClass);
            if (classStudents.length === 0) {
                setLocalStudents([]);
                return;
            }

            // Find subject ID
            const subjectObj = subjects.find(s => s.name === selectedSubject);
            if (!subjectObj) { console.warn("Subject not found"); return; }

            // Find Class ID (needed for fetch filter)
            const classObj = classes.find(c => c.name === selectedClass);
            if (!classObj) { console.warn("Class not found"); return; }

            setIsLoadingGrades(true);
            try {
                const studentIds = classStudents.map(s => s.id);

                // Fetch grades RELATIONAL
                // Join evaluations to check subject, class, semester
                const { data: gradesData, error } = await supabase
                    .from('grades')
                    .select('*, evaluation:evaluations!inner(*)')
                    .in('student_id', studentIds)
                    .eq('evaluation.subject_id', subjectObj.id)
                    .eq('evaluation.class_id', classObj.id);

                if (error) throw error;

                // Merge
                const mergedStudents = classStudents.map(student => {
                    const sGrades = gradesData.filter(g => g.student_id === student.id);
                    const currentGrades = { ...student.grades };

                    if (!currentGrades[selectedSubject]) currentGrades[selectedSubject] = {};

                    sGrades.forEach(g => {
                        // g.evaluation has info
                        const evalInfo = g.evaluation; // { semester, type, type_index ... }
                        const semStr = evalInfo.semester === 1 ? 'Semestre 1' : 'Semestre 2';

                        // Map DB type/index to UI keys 
                        // Interrogation + 1 -> "interro1"
                        let gradeKey = '';
                        if (evalInfo.type === 'Interrogation') gradeKey = `interro${evalInfo.type_index}`;
                        else if (evalInfo.type === 'Devoir') gradeKey = `devoir${evalInfo.type_index}`;

                        if (gradeKey) {
                            if (!currentGrades[selectedSubject][semStr]) currentGrades[selectedSubject][semStr] = {};
                            currentGrades[selectedSubject][semStr][gradeKey] = g.note; // 'note' is the column
                        }
                    });

                    return { ...student, grades: currentGrades };
                });

                setLocalStudents(mergedStudents.sort((a, b) => a.nom.localeCompare(b.nom)));

            } catch (err) {
                console.error("Error loading grades:", err);
            } finally {
                setIsLoadingGrades(false);
            }
        };

        loadData();
    }, [selectedClass, selectedSubject, globalStudents, subjects, classes]); // Depend on subjects and classes too


    // Helpers to safely get/set deep grade values
    const getStudentGrades = (student) => {
        const bySubject = student.grades?.[selectedSubject] || {};
        const bySemester = bySubject[selectedViewSemester] || {};
        return {
            interro1: bySemester.interro1 ?? "",
            interro2: bySemester.interro2 ?? "",
            interro3: bySemester.interro3 ?? "",
            devoir1: bySemester.devoir1 ?? "",
            devoir2: bySemester.devoir2 ?? ""
        };
    };

    const handleGradeChange = (studentId, field, value) => {
        if (isLocked) return;

        setLocalStudents(prev => prev.map(student => {
            if (student.id !== studentId) return student;

            // Deep clone or spread to ensure immutability
            const newGrades = { ...student.grades };
            if (!newGrades[selectedSubject]) newGrades[selectedSubject] = {};
            if (!newGrades[selectedSubject][selectedViewSemester]) newGrades[selectedSubject][selectedViewSemester] = {};

            newGrades[selectedSubject][selectedViewSemester][field] = value;

            return { ...student, grades: newGrades };
        }));
    };

    // --- SAVE LOGIC ---
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        const promises = [];

        // Resolve subject ID & Class ID
        const subjectObj = subjects.find(s => s.name === selectedSubject);
        const classObj = classes.find(c => c.name === selectedClass);

        if (!subjectObj || !classObj) {
            alert("Erreur: Matière ou Classe introuvable");
            setIsSaving(false);
            return;
        }

        for (const student of localStudents) {
            const subjectGrades = student.grades?.[selectedSubject]?.[selectedViewSemester];
            if (!subjectGrades) continue;

            // --- AUTO-FILL CONDUITE LOGIC ---
            // If Subject is Conduite, replicate Interro 1 to Devoir 1 & 2
            const isConduite = selectedSubject.toLowerCase().includes('conduite');
            if (isConduite) {
                const baseNote = subjectGrades['interro1'];
                if (baseNote !== undefined && baseNote !== "") {
                    // Force the other slots to match in memory for the save loop
                    // Note: This doesn't update UI immediately unless we reload, but saves correctly
                    subjectGrades['devoir1'] = baseNote;
                    subjectGrades['devoir2'] = baseNote;
                }
            }
            // --------------------------------

            for (const [type, value] of Object.entries(subjectGrades)) {
                let numValue = value === "" ? null : parseFloat(value);

                promises.push(saveGrade({
                    classId: classObj.id, // Needed for evaluation check
                    studentId: student.id,
                    subjectId: subjectObj.id,
                    semester: selectedViewSemester, // "Semestre 1"
                    type: type, // "interro1", "devoir1"
                    value: numValue
                }));
            }
        }

        try {
            const results = await Promise.all(promises);
            const failures = results.filter(r => !r.success);
            if (failures.length > 0) {
                alert(`Erreur lors de la sauvegarde de ${failures.length} notes.`);
            } else {
                alert("Notes enregistrées avec succès !");
            }
        } catch (err) {
            console.error(err);
            alert("Erreur critique lors de la sauvegarde.");
        } finally {
            setIsSaving(false);
        }
    };

    // Calculate averages (wrapper around utils)
    // Note: calculateAverages expects a simple object { interro1: ..., ... }
    const getCalculatedStats = (student) => {
        const grades = getStudentGrades(student);
        return calculateAverages(grades, selectedClass, selectedSubject, coefficients);
    };

    const handleExport = () => {
        if (localStudents.length === 0) {
            alert("Aucune donnée à exporter.");
            return;
        }

        const dataToExport = localStudents.map(student => {
            const grades = getStudentGrades(student);
            const stats = getCalculatedStats(student);
            return formatGradesForExport(student, grades, stats);
        });

        const fileName = `Notes_${selectedClass}_${selectedSubject}_${selectedViewSemester}`;
        exportToExcel(dataToExport, fileName);
    };

    const isHistGeo = selectedSubject === "Histoire-Géo";

    // Locking Logic
    const isLocked = isYearLocked ||
        (selectedViewSemester === 'Semestre 1' && isSemester1Locked) ||
        (selectedViewSemester === 'Semestre 2' && isSemester2Locked) ||
        !isGradingOpen();

    return (
        <div className="space-y-6 max-w-full">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Saisie des Notes</h1>
                    <p className="text-gray-500 mt-1">Gérez les évaluations et les moyennes de classe</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => window.location.reload()} // Placeholder for strict recalc if needed, but React handles it reactive
                        className="flex items-center justify-center space-x-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <Calculator className="w-4 h-4 ml-1" />
                        <span className="hidden sm:inline">Recalculer</span>
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors shadow-sm"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Exporter</span>
                    </button>
                    {!isLocked ? (
                        <button
                            onClick={handleSave}
                            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-md"
                        >
                            <Save className="w-4 h-4" />
                            <span>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
                        </button>
                    ) : (
                        <div className="flex items-center justify-center space-x-2 bg-gray-100 text-gray-500 px-5 py-2 rounded-xl border border-gray-200 cursor-not-allowed">
                            <Lock className="w-4 h-4" />
                            <span>Verrouillé</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-4 w-full md:w-auto flex-1">
                    {/* Class Selector */}
                    <div className="relative min-w-[140px] flex-1 md:flex-none">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Classe</label>
                        <div className="relative">
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="w-full appearance-none pl-3 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:border-blue-300 transition-colors"
                            >
                                {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                            <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>

                    {/* Subject Selector */}
                    <div className="relative min-w-[180px] flex-1 md:flex-none">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Matière</label>
                        <div className="relative">
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="w-full appearance-none pl-3 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:border-blue-300 transition-colors"
                            >
                                {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                            <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>

                    {/* Semester Selector */}
                    <div className="relative min-w-[140px] flex-1 md:flex-none">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Période</label>
                        <div className="relative">
                            <select
                                value={selectedViewSemester}
                                onChange={(e) => setSelectedViewSemester(e.target.value)}
                                className="w-full appearance-none pl-3 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:border-blue-300 transition-colors"
                            >
                                <option value="Semestre 1">Semestre 1</option>
                                {(currentSemester === 'Semestre 2' || isSemester2Locked) && (
                                    <option value="Semestre 2">Semestre 2</option>
                                )}
                            </select>
                            <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Grades Table */}
            <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col ${isLocked ? 'opacity-95' : ''}`}>

                {isLoadingGrades && (
                    <div className="p-4 bg-blue-50 text-blue-600 flex items-center justify-center">
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Chargement des notes...
                    </div>
                )}

                {isLocked && (
                    <div className="bg-orange-50 text-orange-800 px-6 py-3 text-sm font-medium border-b border-orange-100 flex items-center justify-center">
                        <Lock className="w-4 h-4 mr-2" />
                        Lecture Seule : {!isGradingOpen() ? "La période de saisie est close." : "Période verrouillée."}
                    </div>
                )}

                <div className="flex-1 overflow-x-auto relative">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                {/* Sticky Student Name Column */}
                                <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] w-56 border-r border-gray-200">
                                    Élève
                                </th>
                                {/* Evaluation Columns */}
                                <th className="px-2 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-20">Int 1</th>
                                <th className="px-2 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-20">Int 2</th>
                                <th className="px-2 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-20">Int 3</th>
                                <th className="px-2 py-4 text-xs font-bold text-blue-600 uppercase tracking-wider text-center w-20 bg-blue-50 border-l border-r border-blue-100">Moy Int</th>
                                <th className="px-2 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-20">Dev 1</th>
                                <th className="px-2 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-20">Dev 2</th>

                                {/* Summary Columns */}
                                <th className="px-4 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider text-center w-24 border-l border-gray-200">Moyenne</th>
                                <th className="px-4 py-4 text-xs font-bold text-white uppercase tracking-wider text-center w-24 bg-blue-600">Moy Coeff</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {localStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="px-6 py-8 text-center text-gray-500 italic">
                                        {isLoadingGrades ? "Chargement..." : "Aucun élève trouvé dans cette classe."}
                                    </td>
                                </tr>
                            ) : (
                                localStudents.map((student, index) => {
                                    // Extract grades for current view
                                    const grades = getStudentGrades(student);
                                    const stats = getCalculatedStats(student);

                                    return (
                                        <tr key={student.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors group`}>

                                            {/* Student Name Cell */}
                                            <td className={`px-4 py-3 whitespace-nowrap sticky left-0 z-10 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} group-hover:bg-blue-50`}>
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                                                            {student.nom.charAt(0)}{student.prenom.charAt(0)}
                                                        </div>
                                                    </div>
                                                    {/* Student Name Display */}
                                                    <div>
                                                        <div className="font-bold text-gray-900 text-sm leading-tight">{student.nom} {student.prenom}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Inputs */}
                                            <td className="px-1 py-3 text-center">
                                                <input
                                                    type="number" min="0" max="20" placeholder="-"
                                                    value={grades.interro1} disabled={isLocked}
                                                    onChange={(e) => handleGradeChange(student.id, 'interro1', e.target.value)}
                                                    className="w-14 h-9 text-center bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-shadow shadow-sm disabled:bg-gray-100 disabled:text-gray-400"
                                                />
                                            </td>
                                            <td className="px-1 py-3 text-center">
                                                <input
                                                    type="number" min="0" max="20" placeholder="-"
                                                    value={grades.interro2} disabled={isLocked}
                                                    onChange={(e) => handleGradeChange(student.id, 'interro2', e.target.value)}
                                                    className="w-14 h-9 text-center bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-shadow shadow-sm disabled:bg-gray-100 disabled:text-gray-400"
                                                />
                                            </td>
                                            <td className="px-1 py-3 text-center">
                                                <input
                                                    type="number" min="0" max="20" placeholder="-"
                                                    value={grades.interro3} disabled={isLocked}
                                                    onChange={(e) => handleGradeChange(student.id, 'interro3', e.target.value)}
                                                    className="w-14 h-9 text-center bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-shadow shadow-sm disabled:bg-gray-100 disabled:text-gray-400"
                                                />
                                            </td>

                                            {/* Avg Interro Calculation */}
                                            <td className="px-2 py-3 text-center bg-blue-50 border-l border-r border-blue-100">
                                                <span className="text-sm font-semibold text-blue-800">{stats.avgInterro}</span>
                                            </td>

                                            <td className="px-1 py-3 text-center">
                                                <input
                                                    type="number" min="0" max="20" placeholder="-"
                                                    value={grades.devoir1} disabled={isLocked}
                                                    onChange={(e) => handleGradeChange(student.id, 'devoir1', e.target.value)}
                                                    className="w-14 h-9 text-center bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-shadow shadow-sm disabled:bg-gray-100 disabled:text-gray-400"
                                                />
                                            </td>
                                            <td className="px-1 py-3 text-center">
                                                <input
                                                    type="number" min="0" max="20" placeholder="-"
                                                    value={grades.devoir2} disabled={isLocked}
                                                    onChange={(e) => handleGradeChange(student.id, 'devoir2', e.target.value)}
                                                    className="w-14 h-9 text-center bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-shadow shadow-sm disabled:bg-gray-100 disabled:text-gray-400"
                                                />
                                            </td>

                                            {/* Final Averages */}
                                            <td className="px-4 py-3 text-center border-l border-gray-200">
                                                <span className={`text-sm font-bold ${parseFloat(stats.avgSem) < 10 ? 'text-red-500' : 'text-gray-800'}`}>
                                                    {stats.avgSem}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center bg-blue-600 text-white">
                                                <span className="text-sm font-bold">{stats.weightedAvg}</span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Legend */}
                <div className="bg-gray-50 border-t border-gray-200 p-4 flex flex-col sm:flex-row justify-between text-xs text-gray-500">
                    <div className="flex flex-col gap-1">
                        <p>• Les moyennes sont calculées automatiquement dès la saisie.</p>
                        <p>• <span className="font-semibold text-red-500">Rouge</span> : Moyenne inférieure à 10.</p>
                    </div>
                    {isHistGeo && <div className="mt-2 sm:mt-0 px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-medium inline-self-start">Mode Histoire-Géo (Coef Moyenne)</div>}
                </div>
            </div>
        </div>
    );
};

export default Grades;
