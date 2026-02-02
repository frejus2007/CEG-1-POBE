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
    const { assignments, teachers, classes, subjects, setClasses, validateHeadTeacherAssignment, addAssignment, updateAssignment, deleteAssignment, updateClass } = useSchool();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [subjectFilter, setSubjectFilter] = useState('');
    const [formData, setFormData] = useState({
        teacherId: '',
        classId: '',
        subjectId: '',
        hours: '',
        isMainTeacher: false
    });

    const handleAddAssignment = () => {
        setEditingId(null);
        setSubjectFilter('');
        setFormData({ teacherId: '', classId: '', subjectId: '', hours: '', isMainTeacher: false });
        setIsModalOpen(true);
    };

    const handleEditAssignment = (assignment) => {
        setEditingId(assignment.id);

        // Find related objects to populate IDs
        // assignment in table has names (from View/Query), we need to reverse lookup IDs if they are not directly available in 'assignments'
        // Ideally 'assignments' state should carry IDs. 
        // Checking SchoolContext: 'assignments' carries full objects? 
        // formattedAssignments map logic: id: a.id, teacher: name, class: name... NO IDs!
        // We MUST Fix SchoolContext to populate IDs in 'assignments' list first, OR do reverse lookup here.
        // It's safer to reverse lookup here for now to avoid breaking view.

        const teacherObj = teachers.find(t => t.name === assignment.teacher || `${t.nom} ${t.prenom}` === assignment.teacher);
        const classObj = classes.find(c => c.name === assignment.class);
        const subjectObj = subjects.find(s => s.name === assignment.subject);

        // Check PP status
        const isPP = classObj && classObj.mainTeacher === assignment.teacher;

        setSubjectFilter(teacherObj ? teacherObj.subject : '');

        setFormData({
            teacherId: teacherObj ? teacherObj.id : '',
            classId: classObj ? classObj.id : '',
            subjectId: subjectObj ? subjectObj.id : '',
            hours: assignment.hours,
            isMainTeacher: isPP
        });
        setIsModalOpen(true);
    };

    const handleDeleteAssignment = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette affectation ?')) {
            const res = await deleteAssignment(id);
            if (!res.success) alert(res.error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. Handle Head Teacher Assignment (Main Teacher)
        // This updates the CLASS table
        if (formData.classId && formData.teacherId) {
            const targetClass = classes.find(c => c.id == formData.classId); // helper
            // Note: formData.classId might be string or number

            if (formData.isMainTeacher) {
                // Validate
                const validation = validateHeadTeacherAssignment(formData.teacherId, formData.classId);
                if (!validation.valid) {
                    alert(validation.error);
                    return;
                }

                // Call updateClass to set PP
                if (targetClass) {
                    await updateClass(targetClass.id, {
                        name: targetClass.name,
                        level: targetClass.level,
                        mainTeacherId: formData.teacherId
                    });
                }

            } else {
                // Unchecked: Remove PP if they were the one
                if (targetClass && targetClass.mainTeacherId === formData.teacherId) {
                    await updateClass(targetClass.id, {
                        name: targetClass.name,
                        level: targetClass.level,
                        mainTeacherId: null
                    });
                }
            }
        }

        // 2. Handle Subject Assignment (Teacher Assignments Table)
        const assignmentData = {
            teacherId: formData.teacherId,
            classId: formData.classId,
            subjectId: formData.subjectId,
            // hours: formData.hours // Not in DB schema provided? Defaulting in code?
        };

        let res;
        if (editingId) {
            res = await updateAssignment(editingId, assignmentData);
        } else {
            res = await addAssignment(assignmentData);
        }

        if (res.success) {
            setIsModalOpen(false);
            setSubjectFilter('');
            setFormData({ teacherId: '', classId: '', subjectId: '', hours: '', isMainTeacher: false });
            setEditingId(null);
        } else {
            alert("Erreur: " + res.error);
        }
    };

    // --- Derived Logic for UI ---

    // 0. Filtered Teachers List based on ID Step 0 (Subject Filter)
    const filteredTeachers = teachers.filter(t => {
        if (!subjectFilter) return true;
        return t.subject === subjectFilter;
    });

    // 1. Get Selected Teacher Object
    const selectedTeacherObj = teachers.find(t => t.id === formData.teacherId);

    // 2. Get Selected Class
    const selectedClassObj = classes.find(c => c.id == formData.classId);

    // 3. Available Subjects Logic
    const getAvailableSubjects = () => {
        if (!selectedTeacherObj) return [];
        // Cycle 1 vs 2 logic requires Class Level

        let availableSubjs = [];

        // Use teacher's specialty subject as base
        if (selectedTeacherObj.subject) {
            availableSubjs.push(selectedTeacherObj.subject);
            // French teacher expansions
            if (selectedTeacherObj.subject === 'Français') {
                if (selectedClassObj && ['6ème', '5ème', '4ème', '3ème'].some(l => selectedClassObj.name.startsWith(l))) {
                    availableSubjs = ['Communication Écrite', 'Lecture'];
                }
            }
        }

        // Also allow selection from ALL subjects if needed, or stick to strict checking.
        // For flexibility let's add the teacher's subject if not present (unless expanded).

        // Return Subject Objects (finding from 'subjects' list) for the ID match
        // But UI displays Names.

        // Let's just return Strings for now to match against 'subjects' list to get IDs
        return availableSubjs;
    };

    const availableSubjectNames = getAvailableSubjects();

    // Auto-select subject if only one
    React.useEffect(() => {
        if (availableSubjectNames.length === 1) {
            const subjName = availableSubjectNames[0];
            const subjObj = subjects.find(s => s.name === subjName);
            if (subjObj && formData.subjectId !== subjObj.id) {
                setFormData(prev => ({ ...prev, subjectId: subjObj.id }));
            }
        }
    }, [availableSubjectNames, formData.subjectId, subjects]);

    // Unique list for Filter
    const uniqueSubjects = Array.from(new Set((subjects || []).map(s => s.name))).sort();

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

                    {/* 0. FILTER BY SUBJECT */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Filtrer par discipline</label>
                        <select
                            value={subjectFilter}
                            onChange={(e) => {
                                setSubjectFilter(e.target.value);
                                setFormData(prev => ({ ...prev, teacherId: '' }));
                            }}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Toutes les matières</option>
                            {uniqueSubjects.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    {/* 1. SELECT TEACHER */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Professeur</label>
                        <Select
                            required
                            value={formData.teacherId}
                            onChange={(e) => setFormData({ ...formData, teacherId: e.target.value, classId: '', subjectId: '' })}
                        >
                            <option value="">
                                {subjectFilter ? "Sélectionner un professeur" : "Sélectionner un professeur (ou filtrer ci-dessus)"}
                            </option>
                            {filteredTeachers.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.nom} {t.prenom} ({t.subject})
                                </option>
                            ))}
                        </Select>
                    </div>

                    {/* 2. SELECT CLASS */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Classe à assigner</label>
                        <select
                            required
                            disabled={!formData.teacherId}
                            value={formData.classId}
                            onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50 disabled:bg-gray-100"
                        >
                            <option value="">
                                {!formData.teacherId ? "Sélectionnez un professeur d'abord" : "Choisir une classe..."}
                            </option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* 3. SELECT SUBJECT */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Matière Enseignée</label>
                        <select
                            required
                            disabled={!formData.classId}
                            value={formData.subjectId}
                            onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50 disabled:bg-gray-100"
                        >
                            <option value="">
                                {!formData.classId ? "Sélectionnez une classe d'abord" : "Sélectionner la matière"}
                            </option>
                            {/* Display available subjects based on logic, but we need IDs in value */}
                            {subjects
                                .filter(s => availableSubjectNames.includes(s.name) || !selectedTeacherObj?.subject) // Fallback: show all if no teacher subject logic? No, better stick to logic.
                                .map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            {/* If logic returns names not in DB subjects? Handled by initial load */}
                        </select>
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
                        <label className={`flex items-center space-x-3 p-3 rounded-lg border border-gray-200 transition-colors ${(!formData.teacherId || !formData.classId) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}>
                            <input
                                type="checkbox"
                                disabled={!formData.teacherId || !formData.classId}
                                checked={formData.isMainTeacher}
                                onChange={(e) => setFormData({ ...formData, isMainTeacher: e.target.checked })}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div>
                                <span className="font-semibold text-gray-800">Assigner comme Professeur Principal</span>
                                <p className="text-xs text-gray-500">
                                    {formData.teacherId && formData.classId
                                        ? "Nommer ce professeur Professeur Principal"
                                        : "Sélectionnez professeur et classe d'abord"}
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
