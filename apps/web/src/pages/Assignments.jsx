import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';
import { useSchool } from '../context/SchoolContext';

const SUBJECTS_CYCLE_1 = [
    "Mathématiques", "SVT", "Physique-Chimie", "Histoire-Géo", "Anglais", "EPS",
    "Communication Écrite", "Lecture"
];

const SUBJECTS_CYCLE_2 = [
    "Mathématiques", "SVT", "Physique-Chimie", "Histoire-Géo", "Anglais", "EPS",
    "Français", "Philosophie"
];

// Helper to map specific subjects back to teacher's generic expertise
const getTeacherSubjectMatch = (teacherSubject, formSubject) => {
    if (!teacherSubject) return false;
    if (teacherSubject === formSubject) return true;
    // Map French teachers to new sub-subjects for Cycle 1
    if (teacherSubject === 'Français' && ['Communication Écrite', 'Lecture'].includes(formSubject)) return true;
    return false;
};

const Assignments = () => {
    const { assignments, setAssignments, teachers, classes, setClasses, validateHeadTeacherAssignment } = useSchool();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        teacher: '',
        class: '',
        subject: '',
        hours: '',
        isMainTeacher: false
    });

    const handleAddAssignment = () => {
        setEditingId(null);
        setFormData({ teacher: '', class: '', subject: '', hours: '', isMainTeacher: false });
        setIsModalOpen(true);
    };

    const handleEditAssignment = (assignment) => {
        setEditingId(assignment.id);
        // Check if this teacher is the PP of the class
        const relatedClass = classes.find(c => c.name === assignment.class);
        const isPP = relatedClass && relatedClass.mainTeacher === assignment.teacher;

        setFormData({
            teacher: assignment.teacher,
            class: assignment.class,
            subject: assignment.subject,
            hours: assignment.hours,
            isMainTeacher: isPP
        });
        setIsModalOpen(true);
    };

    const handleDeleteAssignment = (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette affectation ?')) {
            setAssignments(assignments.filter(a => a.id !== id));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // 1. Handle Head Teacher Assignment
        if (formData.class && formData.teacher) {
            const targetClass = classes.find(c => c.name === formData.class);

            if (formData.isMainTeacher) {
                // User wants to make this teacher the PP
                // Validate first
                const validation = validateHeadTeacherAssignment(formData.teacher, targetClass?.id);
                if (!validation.valid) {
                    alert(validation.error);
                    return;
                }

                // Update class if valid
                if (targetClass) {
                    setClasses(classes.map(c =>
                        c.id === targetClass.id ? { ...c, mainTeacher: formData.teacher } : c
                    ));
                }

            } else {
                // User unchecked the box. Remove if they were PP.
                if (targetClass && targetClass.mainTeacher === formData.teacher) {
                    setClasses(classes.map(c =>
                        c.id === targetClass.id ? { ...c, mainTeacher: 'Non assigné' } : c
                    ));
                }
            }
        }

        if (editingId) {
            setAssignments(assignments.map(a =>
                a.id === editingId
                    ? { ...a, ...formData, hours: parseInt(formData.hours) }
                    : a
            ));
        } else {
            const newAssignment = {
                id: Date.now(),
                ...formData,
                hours: parseInt(formData.hours)
            };
            setAssignments([...assignments, newAssignment]);
        }

        setIsModalOpen(false);
        setFormData({ teacher: '', class: '', subject: '', hours: '', isMainTeacher: false });
        setEditingId(null);
    };

    // --- Derived Logic for UI ---

    // 1. Detect Cycle based on selected Class
    const getCycleSubjects = (className) => {
        if (!className) return [];
        const level = className.split(' ')[0]; // "6ème", "2nde", etc.
        if (['6ème', '5ème', '4ème', '3ème'].includes(level)) {
            return SUBJECTS_CYCLE_1;
        } else {
            return SUBJECTS_CYCLE_2;
        }
    };

    const currentSubjects = getCycleSubjects(formData.class);

    // 2. Filter Teachers based on selected Subject
    const availableTeachers = teachers.filter(t => {
        if (!formData.subject) return false;
        return getTeacherSubjectMatch(t.subject, formData.subject);
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Affectations</h1>
                    <p className="text-gray-500 mt-1">Gestion des attributions de cours par classe</p>
                </div>
                <button
                    onClick={handleAddAssignment}
                    className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    <span>Nouvelle Affectation</span>
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 max-w-md w-full">
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Rechercher professeur ou matière..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    {/* Optional: Add Class Filter here if needed later */}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Professeur</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Classe</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Matière</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Volume Horaire</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {assignments.map((assignment) => (
                                <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                        {assignment.teacher}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                            {assignment.class}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                        {assignment.subject}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                        {assignment.hours}H / semaine
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-3">
                                            <button
                                                onClick={() => handleEditAssignment(assignment)}
                                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAssignment(assignment.id)}
                                                className="text-red-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "Modifier l'affectation" : "Nouvelle affectation"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* 1. SELECT CLASS */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Classe</label>
                        <select
                            required
                            value={formData.class}
                            onChange={(e) => setFormData({ ...formData, class: e.target.value, subject: '', teacher: '' })}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Choisir une classe...</option>
                            {/* NOTE: ideally populate from classes context, but for now hardcoded as per previous file */}
                            <option value="6ème M1">6ème M1</option>
                            <option value="6ème M2">6ème M2</option>
                            <option value="6ème M3">6ème M3</option>
                            <option value="5ème M1">5ème M1</option>
                            <option value="5ème M2">5ème M2</option>
                            <option value="4ème M1">4ème M1</option>
                            <option value="4ème M2">4ème M2</option>
                            <option value="3ème M1">3ème M1</option>
                            <option value="3ème M2">3ème M2</option>
                            <option value="2nde C">2nde C</option>
                            <option value="1ère C">1ère C</option>
                            <option value="Tle C">Tle C</option>
                        </select>
                    </div>

                    {/* 2. SELECT SUBJECT (Dependent on Class Cycle) */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Matière</label>
                        <select
                            required
                            disabled={!formData.class}
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value, teacher: '' })}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                        >
                            <option value="">
                                {!formData.class ? "Sélectionnez une classe d'abord" : "Sélectionner une matière"}
                            </option>
                            {currentSubjects.map(subj => (
                                <option key={subj} value={subj}>{subj}</option>
                            ))}
                        </select>
                    </div>

                    {/* 3. SELECT TEACHER (Filtered by Subject) */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Professeur</label>
                        <Select
                            required
                            disabled={!formData.subject}
                            value={formData.teacher}
                            onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                        >
                            <option value="">
                                {!formData.subject ? "Sélectionnez une matière d'abord" : "Sélectionner un professeur"}
                            </option>
                            {availableTeachers.map(t => (
                                <option key={t.id} value={`${t.nom} ${t.prenom}`}>
                                    {t.nom} {t.prenom} ({t.subject})
                                </option>
                            ))}
                        </Select>
                        {formData.subject && availableTeachers.length === 0 && (
                            <p className="text-xs text-orange-500 mt-1">Aucun professeur trouvé pour cette matière.</p>
                        )}
                    </div>

                    {/* 4. HOURS */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Volume Horaire</label>
                        <input
                            type="number"
                            required
                            value={formData.hours}
                            onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Heures / sem"
                        />
                    </div>

                    {/* HEAD TEACHER CHECKBOX */}
                    <div className="pt-2">
                        <label className={`flex items-center space-x-3 p-3 rounded-lg border border-gray-200 transition-colors ${!formData.teacher ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}>
                            <input
                                type="checkbox"
                                disabled={!formData.teacher}
                                checked={formData.isMainTeacher}
                                onChange={(e) => setFormData({ ...formData, isMainTeacher: e.target.checked })}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div>
                                <span className="font-semibold text-gray-800">Assigner comme Professeur Principal</span>
                                <p className="text-xs text-gray-500">
                                    {formData.teacher ? `Ce professeur (${formData.teacher}) sera PP de ${formData.class}` : "Sélectionnez un professeur d'abord"}
                                </p>
                            </div>
                        </label>
                    </div>

                    <div className="pt-4 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            {editingId ? "Mettre à jour" : "Affecter"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Assignments;
