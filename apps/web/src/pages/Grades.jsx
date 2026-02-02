import React, { useState, useEffect } from 'react';
import { Save, Calculator, Lock, ChevronDown } from 'lucide-react';
import { useAcademicYear } from '../context/AcademicYearContext';
import { useSchool } from '../context/SchoolContext';
import { calculateAverages } from '../utils/gradeUtils';

// Mock subjects can be moved to a constants file or context later if dynamic
const subjects = [
    "Mathématiques", "Français", "Anglais", "SVT", "Physique-Chimie",
    "Histoire-Géo", "EPS", "Allemand", "Espagnol", "Philosophie",
    "Communication Écrite", "Lecture"
];

const Grades = () => {
    const { currentSemester, isSemester1Locked, isSemester2Locked, isYearLocked, isGradingOpen } = useAcademicYear();
    const { classes, students: globalStudents, setStudents: setGlobalStudents } = useSchool();

    // Default to first class if available
    const [selectedClass, setSelectedClass] = useState(classes.length > 0 ? classes[0].name : "");
    const [selectedSubject, setSelectedSubject] = useState(subjects[0]);
    const [selectedViewSemester, setSelectedViewSemester] = useState("Semestre 1");

    // Local state for the table (filtered students)
    const [localStudents, setLocalStudents] = useState([]);

    // Sync local state when filters or global data change
    useEffect(() => {
        if (!selectedClass) return;

        // Filter students for the selected class
        const classStudents = globalStudents.filter(s => s.class === selectedClass);

        // Sort alphabetically by Name
        const sortedStudents = [...classStudents].sort((a, b) => a.nom.localeCompare(b.nom));
        setLocalStudents(sortedStudents);
    }, [selectedClass, globalStudents]); // Depend on globalStudents to refresh if saved

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

    const handleSave = () => {
        // Merge local changes back to global state
        const updatedGlobalStudents = globalStudents.map(globalStudent => {
            const localMatch = localStudents.find(l => l.id === globalStudent.id);
            if (localMatch) {
                return localMatch;
            }
            return globalStudent;
        });

        setGlobalStudents(updatedGlobalStudents);
        // Optional: Show a toast or notification here
        alert("Notes enregistrées avec succès !");
    };

    // Calculate averages (wrapper around utils)
    // Note: calculateAverages expects a simple object { interro1: ..., ... }
    const getCalculatedStats = (student) => {
        const grades = getStudentGrades(student);
        return calculateAverages(grades, selectedClass, selectedSubject);
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
                    {!isLocked ? (
                        <button
                            onClick={handleSave}
                            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-md"
                        >
                            <Save className="w-4 h-4" />
                            <span>Enregistrer</span>
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
                                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
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
                                        Aucun élève trouvé dans cette classe.
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
