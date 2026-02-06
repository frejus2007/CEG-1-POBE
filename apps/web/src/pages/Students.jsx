import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import { useSchool } from '../context/SchoolContext';
import { useAcademicYear } from '../context/AcademicYearContext';
import { CheckCircle, XCircle, Trash2, Edit2, Plus, Search, ChevronLeft, Download, Upload } from 'lucide-react';
import Modal from '../components/ui/Modal';
import LevelCard from '../components/LevelCard';
import ClassCard from '../components/ClassCard';
import { exportToExcel, formatStudentForExport } from '../utils/exportUtils';
import { searchItems } from '../utils/searchUtils';

const LEVELS = ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Tle'];

const Students = () => {
    const { isYearLocked, isArchiveView, selectedYear } = useAcademicYear();
    const { students, classes, addStudent, updateStudent, deleteStudent } = useSchool();
    const { showSuccess, showError } = useToast();

    const [selectedLevel, setSelectedLevel] = useState(null);
    const [selectedClass, setSelectedClass] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        matricule: '',
        class: '',
        dob: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Derived Data
    const levelCounts = students.reduce((acc, student) => {
        const level = student.class ? student.class.split(' ')[0] : 'Unknown';
        acc[level] = (acc[level] || 0) + 1;
        return acc;
    }, {});

    const classCounts = students.reduce((acc, student) => {
        if (student.class) {
            acc[student.class] = (acc[student.class] || 0) + 1;
        }
        return acc;
    }, {});

    const viewStudents = searchItems(students, searchQuery, ['nom', 'prenom', 'matricule'])
        .filter(student => {
            if (selectedClass) return student.class === selectedClass;
            if (selectedLevel) return student.class && student.class.startsWith(selectedLevel);
            // If no class/level selected but search query exists, show global results
            // (The searchItems call above already filtered by query, so here we just return true if query exists)
            // But wait, the original logic had specific behavior. Let's replicate exact behavior but improved matching.
            if (searchQuery) return true;
            return false;
        });

    const handleAddStudent = () => {
        setEditingId(null);
        setFormData({ nom: '', prenom: '', matricule: '', class: '', dob: '' });
        setIsModalOpen(true);
    };

    const handleEditStudent = (student) => {
        setEditingId(student.id);
        setFormData({
            nom: student.nom,
            prenom: student.prenom,
            matricule: student.matricule,
            class: student.class,
            dob: student.dob
        });
        setIsModalOpen(true);
    };

    const handleDeleteStudent = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet élève ?')) {
            const res = await deleteStudent(id);
            if (res.error) {
                showError("Erreur lors de la suppression: " + res.error);
            } else {
                showSuccess("Élève supprimé avec succès");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const studentPayload = {
            nom: formData.nom,
            prenom: formData.prenom,
            matricule: formData.matricule,
            className: formData.class,
            dob: formData.dob
        };

        try {
            let res;
            if (editingId) {
                res = await updateStudent(editingId, studentPayload);
            } else {
                res = await addStudent(studentPayload);
            }

            if (res.success) {
                showSuccess(editingId ? "Élève mis à jour avec succès" : "Élève ajouté avec succès");
                setIsModalOpen(false);
                setEditingId(null);
            } else {
                showError("Erreur: " + res.error);
            }
        } catch (err) {
            console.error(err);
            showError("Une erreur inattendue est survenue");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExport = () => {
        const dataToExport = viewStudents.map(formatStudentForExport);
        const fileName = selectedClass ? `Liste_Eleves_${selectedClass}` :
            selectedLevel ? `Liste_Eleves_${selectedLevel}` : `Liste_Globale_Eleves`;
        exportToExcel(dataToExport, fileName);
    };

    const filteredClasses = classes.filter(c => c.name.startsWith(selectedLevel + ' '));

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    {(selectedLevel || selectedClass) && (
                        <button
                            onClick={() => {
                                if (selectedClass) setSelectedClass(null);
                                else setSelectedLevel(null);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6 text-gray-600" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {selectedClass ? `Élèves de ${selectedClass}` :
                                selectedLevel ? `Classes de ${selectedLevel}` : 'Élèves'}
                        </h1>
                        <p className="text-gray-500 mt-1">
                            {selectedClass ? `Gestion des ${viewStudents.length} élèves` :
                                selectedLevel ? "Choisissez une classe pour voir les élèves" :
                                    "Sélectionnez un niveau pour commencer"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    {viewStudents.length > 0 && (
                        <button
                            onClick={handleExport}
                            className="flex items-center justify-center space-x-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            <span>Exporter</span>
                        </button>
                    )}
                    {!isYearLocked && (
                        <Button
                            onClick={handleAddStudent}
                            icon={Plus}
                        >
                            Nouvel Élève
                        </Button>
                    )}
                </div>
            </div>

            {!selectedLevel && !searchQuery ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
                    {LEVELS.map(level => (
                        <LevelCard
                            key={level}
                            level={level}
                            studentCount={levelCounts[level] || 0}
                            onClick={() => setSelectedLevel(level)}
                        />
                    ))}
                </div>
            ) : selectedLevel && !selectedClass && !searchQuery ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-in slide-in-from-bottom-4 duration-500">
                    {filteredClasses.map(cls => (
                        <ClassCard
                            key={cls.id}
                            className={cls.name}
                            studentCount={classCounts[cls.name] || 0}
                            onClick={() => setSelectedClass(cls.name)}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
                    <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative flex-1 max-w-md w-full">
                            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Rechercher (Nom, Matricule...)"
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Élève</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Matricule</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Classe</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Moyenne</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {viewStudents.length > 0 ? (
                                    viewStudents.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-xs mr-3">
                                                        {student.nom ? student.nom[0] : ''}{student.prenom ? student.prenom[0] : ''}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{student.nom} {student.prenom}</div>
                                                        <div className="text-xs text-gray-500">Né(e) le {student.dob}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-600">
                                                {student.matricule}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                    {student.class}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`font-bold ${student.avg >= 14 ? 'text-green-600' :
                                                    student.avg >= 10 ? 'text-blue-600' : 'text-red-500'
                                                    }`}>
                                                    {student.avg === 0 ? '-' : student.avg + '/20'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {!isYearLocked && (
                                                    <div className="flex items-center justify-end space-x-3">
                                                        <button
                                                            onClick={() => handleEditStudent(student)}
                                                            className="text-blue-600 hover:text-blue-900 transition-colors"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteStudent(student.id)}
                                                            className="text-red-400 hover:text-red-600 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                            Aucun élève trouvé.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "Modifier l'élève" : "Ajouter un nouvel élève"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Nom</label>
                            <input type="text" required value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nom" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Prénom</label>
                            <input type="text" required value={formData.prenom} onChange={(e) => setFormData({ ...formData, prenom: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Prénom" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Matricule</label>
                            <input type="text" required value={formData.matricule} onChange={(e) => setFormData({ ...formData, matricule: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Classe</label>
                            <select
                                value={formData.class}
                                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="">Sélectionner une classe</option>
                                {classes && classes.map(c => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Date de naissance</label>
                            <input type="date" required value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end space-x-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            isLoading={isSubmitting}
                        >
                            {editingId ? "Mettre à jour" : "Enregistrer"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Students;
