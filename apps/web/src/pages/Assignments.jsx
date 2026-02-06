import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import { useSchool } from '../context/SchoolContext';
import { useToast } from '../context/ToastContext';

const SUBJECTS_CYCLE_1 = [
    "Mathématiques", "SVT", "Physique-Chimie", "Histoire-Géo", "Anglais", "EPS",
    "Communication Écrite", "Lecture"
];

const SUBJECTS_CYCLE_2 = [
    "Mathématiques", "SVT", "Physique-Chimie", "Histoire-Géo", "Anglais", "EPS",
    "Français", "Philosophie"
];

// Helper to map specific subjects for filtering and display
const getFrenchSubjectCluster = (subjectId) => {
    const cluster = [10, 11, 12]; // Français, Communication Écrite, Lecture
    return cluster.includes(parseInt(subjectId)) ? cluster : [parseInt(subjectId)];
};

const getTeacherSubjectMatch = (teacher, filterSubjectName, subjects) => {
    if (!filterSubjectName) return true;

    const filterSubjObj = subjects.find(s => s.name === filterSubjectName);
    if (!filterSubjObj) return false;

    const filterCluster = getFrenchSubjectCluster(filterSubjObj.id);

    // Check if teacher has any of the subjects in the requested cluster
    return (teacher.subjectIds || []).some(id => filterCluster.includes(id));
};

const Assignments = () => {
    const { showSuccess } = useToast();
    const { assignments, teachers, classes, subjects, setClasses, validateHeadTeacherAssignment, addAssignment, updateAssignment, deleteAssignment, updateClass } = useSchool();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [subjectFilter, setSubjectFilter] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
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

        const teacherObj = teachers.find(t => t.name === assignment.teacher || t.full_name === assignment.teacher);
        const classObj = classes.find(c => c.name === assignment.class);
        const subjectObj = subjects.find(s => s.name === assignment.subject);

        const isPP = classObj && classObj.mainTeacherId === teacherObj?.id;

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
        setIsSubmitting(true);

        try {
            // 1. Handle Head Teacher Assignment (Main Teacher)
            if (formData.classId && formData.teacherId) {
                const targetClass = classes.find(c => c.id == formData.classId);

                if (formData.isMainTeacher) {
                    const validation = validateHeadTeacherAssignment(formData.teacherId, formData.classId);
                    if (!validation.valid) {
                        alert(validation.error);
                        setIsSubmitting(false);
                        return;
                    }

                    if (targetClass) {
                        await updateClass(targetClass.id, {
                            ...targetClass,
                            mainTeacherId: formData.teacherId
                        }, { skipRefresh: true });
                    }
                } else {
                    if (targetClass && targetClass.mainTeacherId === formData.teacherId) {
                        await updateClass(targetClass.id, {
                            ...targetClass,
                            mainTeacherId: null
                        });
                    }
                }
            }

            // 2. Handle Subject Assignment
            const assignmentData = {
                teacherId: formData.teacherId,
                classId: formData.classId,
                subject_id: formData.subjectId,
                hours: formData.hours
            };

            let res;
            if (editingId) {
                res = await updateAssignment(editingId, assignmentData);
            } else {
                res = await addAssignment(assignmentData);
            }

            if (res.success) {
                showSuccess("Affectation enregistrée avec succès");
                setIsModalOpen(false);
                setSubjectFilter('');
                setFormData({ teacherId: '', classId: '', subjectId: '', hours: '', isMainTeacher: false });
                setEditingId(null);
            } else {
                alert("Erreur: " + res.error);
            }
        } catch (error) {
            console.error("Error submitting assignment:", error);
            alert("Une erreur est survenue lors de l'enregistrement.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredTeachers = teachers.filter(t => getTeacherSubjectMatch(t, subjectFilter, subjects));
    const selectedTeacherObj = teachers.find(t => t.id === formData.teacherId);
    const selectedClassObj = classes.find(c => c.id == formData.classId);

    const getAvailableSubjects = () => {
        if (!selectedTeacherObj) return [];

        let availableSubjs = [];
        const isCycle1 = selectedClassObj && ['6ème', '5ème', '4ème', '3ème'].some(l => selectedClassObj.name.startsWith(l));

        const teacherSubjects = subjects.filter(s => selectedTeacherObj.subjectIds?.includes(s.id));

        teacherSubjects.forEach(s => {
            const cluster = getFrenchSubjectCluster(s.id);
            if (cluster.length > 1) {
                if (isCycle1) {
                    if (s.name !== 'Français') availableSubjs.push({ id: s.id, name: s.name });
                } else {
                    if (s.name === 'Français') availableSubjs.push({ id: s.id, name: s.name });
                }
            } else {
                availableSubjs.push({ id: s.id, name: s.name });
            }
        });

        // ALWAYS ADD CONDUITE IF IT EXISTS
        const conduite = subjects.find(s => s.name.toLowerCase().includes('conduite'));
        if (conduite) {
            availableSubjs.push({ id: conduite.id, name: conduite.name });
        }

        const unique = [];
        const map = new Map();
        for (const item of availableSubjs) {
            if (!map.has(item.id)) {
                map.set(item.id, true);
                unique.push(item);
            }
        }
        return unique;
    };

    const availableSubjectsList = getAvailableSubjects();

    React.useEffect(() => {
        if (availableSubjectsList.length === 1) {
            const subj = availableSubjectsList[0];
            if (formData.subjectId !== subj.id) {
                setFormData(prev => ({ ...prev, subjectId: subj.id }));
            }
        }
    }, [availableSubjectsList, formData.subjectId]);

    const uniqueSubjects = Array.from(new Set((subjects || []).map(s => s.name))).sort();

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Affectations</h1>
                    <p className="text-gray-500 mt-1">Gestion des attributions de cours par classe</p>
                </div>
                <Button onClick={handleAddAssignment} icon={Plus}>
                    Nouvelle Affectation
                </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 max-w-md w-full">
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input type="text" placeholder="Rechercher professeur ou matière..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
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
                            {(() => {
                                // Group assignments by teacher and class
                                const groups = {};
                                assignments.forEach(a => {
                                    const groupKey = `${a.teacher}-${a.class}`;
                                    if (!groups[groupKey]) {
                                        groups[groupKey] = { ...a, groupKey, subjects: [a.subject], ids: [a.id], allHours: [a.hours] };
                                    } else {
                                        groups[groupKey].subjects.push(a.subject);
                                        groups[groupKey].ids.push(a.id);
                                        groups[groupKey].allHours.push(a.hours);
                                    }
                                });

                                return Object.values(groups).map((group) => (
                                    <tr key={group.groupKey} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{group.teacher}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">{group.class}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                            <div className="flex flex-wrap gap-1">
                                                {group.subjects.map((s, idx) => (
                                                    <span key={idx} className={`${idx > 0 ? 'border-l pl-2' : ''} border-gray-200`}>
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                            {group.allHours ? group.allHours.join('H, ') + 'H' : group.hours + 'H'} / sem.
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-3">
                                                {group.ids.map((id, idx) => (
                                                    <div key={id} className={`flex items-center gap-1 ${idx > 0 ? 'border-l pl-2 border-gray-100' : ''}`}>
                                                        <button
                                                            onClick={() => handleEditAssignment(assignments.find(a => a.id === id))}
                                                            className="text-blue-600 hover:text-blue-800 transition-colors"
                                                            title={`Modifier ${group.subjects[idx]}`}
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteAssignment(id)}
                                                            className="text-red-400 hover:text-red-600 transition-colors"
                                                            title={`Supprimer ${group.subjects[idx]}`}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ));
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Modifier l'affectation" : "Nouvelle affectation"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Filtrer par discipline</label>
                        <select
                            value={subjectFilter}
                            onChange={(e) => { setSubjectFilter(e.target.value); setFormData(prev => ({ ...prev, teacherId: '' })); }}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Toutes les matières</option>
                            {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Professeur</label>
                        <Select required value={formData.teacherId} onChange={(e) => setFormData({ ...formData, teacherId: e.target.value, classId: '', subjectId: '' })}>
                            <option value="">{subjectFilter ? "Sélectionner un professeur" : "Sélectionner un professeur (ou filtrer ci-dessus)"}</option>
                            {filteredTeachers.map(t => <option key={t.id} value={t.id}>{t.nom} {t.prenom} ({t.subject})</option>)}
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Classe à assigner</label>
                        <select required disabled={!formData.teacherId} value={formData.classId} onChange={(e) => setFormData({ ...formData, classId: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50 disabled:bg-gray-100">
                            <option value="">{!formData.teacherId ? "Sélectionnez un professeur d'abord" : "Choisir une classe..."}</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Matière Enseignée</label>
                        <select required disabled={!formData.classId} value={formData.subjectId} onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50 disabled:bg-gray-100">
                            <option value="">{!formData.classId ? "Sélectionnez une classe d'abord" : "Sélectionner la matière"}</option>
                            {availableSubjectsList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Volume Horaire</label>
                        <input type="number" required value={formData.hours} onChange={(e) => setFormData({ ...formData, hours: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Heures / sem" />
                    </div>

                    <div className="pt-2">
                        <label className={`flex items-center space-x-3 p-3 rounded-lg border border-gray-200 transition-colors ${(!formData.teacherId || !formData.classId) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}>
                            <input type="checkbox" disabled={!formData.teacherId || !formData.classId} checked={formData.isMainTeacher} onChange={(e) => setFormData({ ...formData, isMainTeacher: e.target.checked })} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                            <div>
                                <span className="font-semibold text-gray-800">Assigner comme Professeur Principal</span>
                                <p className="text-xs text-gray-500">{formData.teacherId && formData.classId ? "Nommer ce professeur Professeur Principal" : "Sélectionnez professeur et classe d'abord"}</p>
                            </div>
                        </label>
                    </div>

                    <div className="pt-4 flex justify-end space-x-3">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                            Annuler
                        </Button>
                        <Button type="submit" isLoading={isSubmitting}>
                            {editingId ? "Mettre à jour" : "Affecter"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Assignments;
