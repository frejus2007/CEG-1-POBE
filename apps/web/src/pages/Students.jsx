import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Download, Edit2, Trash2, X } from 'lucide-react';
import Modal from '../components/ui/Modal';
import { useAcademicYear } from '../context/AcademicYearContext';
import { useSchool } from '../context/SchoolContext';
import { generateRandomStudents, exportToExcel, formatStudentForExport } from '../utils/exportUtils';

const Students = () => {
    const { isYearLocked, isArchiveView, selectedYear } = useAcademicYear();
    const { students, setStudents } = useSchool();
    
    const [viewStudents, setViewStudents] = useState([]);
    const [filterClass, setFilterClass] = useState(''); // State for filtering
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        let data = [];
        if (isArchiveView) {
            const randomData = generateRandomStudents(selectedYear, 12);
            data = randomData.map(s => ({
                ...s,
                nom: s.name ? s.name.split(' ')[0] : s.nom,
                prenom: s.name ? s.name.split(' ').slice(1).join(' ') : s.prenom
            }));
        } else {
            data = students;
        }
        
        // Apply Filters (Class & Search)
        let filtered = data;
        if (filterClass) {
            filtered = filtered.filter(s => s.class === filterClass);
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(s => 
                (s.nom && s.nom.toLowerCase().includes(q)) || 
                (s.prenom && s.prenom.toLowerCase().includes(q)) || 
                (s.matricule && s.matricule.toLowerCase().includes(q))
            );
        }

        setViewStudents(filtered);
    }, [isArchiveView, selectedYear, students, filterClass, searchQuery]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        matricule: '',
        class: '6ème M1',
        dob: ''
    });

    const handleAddStudent = () => {
        setEditingId(null);
        setFormData({
            nom: '',
            prenom: '',
            matricule: '',
            class: '6ème M1',
            dob: ''
        });
        setIsModalOpen(true);
    };

    const handleEditStudent = (student) => {
        setEditingId(student.id);
        
        let formattedDob = student.dob;
        if (student.dob && student.dob.includes('/')) {
            const [day, month, year] = student.dob.split('/');
            formattedDob = `${year}-${month}-${day}`;
        }

        setFormData({
            nom: student.nom,
            prenom: student.prenom,
            matricule: student.matricule,
            class: student.class,
            dob: formattedDob
        });
        setIsModalOpen(true);
    };

    const handleDeleteStudent = (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet élève ?')) {
            setStudents(students.filter(s => s.id !== id));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        let dobFormatted = formData.dob;
        if (formData.dob.includes('-')) {
            const [y, m, d] = formData.dob.split('-');
            dobFormatted = `${d}/${m}/${y}`;
        }

        if (editingId) {
            setStudents(students.map(s =>
                s.id === editingId
                    ? { ...s, ...formData, dob: dobFormatted }
                    : s
            ));
        } else {
            const newStudent = {
                id: Date.now(),
                ...formData,
                dob: dobFormatted,
                avg: 0 
            };
            setStudents([...students, newStudent]);
        }

        setIsModalOpen(false);
        setFormData({
            nom: '',
            prenom: '',
            matricule: '',
            class: '6ème M1',
            dob: ''
        });
        setEditingId(null);
    };

    // EXPORT FUNCTION
    const handleExport = () => {
        const dataToExport = viewStudents.map(formatStudentForExport);
        const fileName = filterClass ? `Liste_Eleves_${filterClass}` : `Liste_Globale_Eleves`;
        exportToExcel(dataToExport, fileName);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Élèves</h1>
                    <p className="text-gray-500 mt-1">Liste complète des élèves inscrits cette année</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button 
                        onClick={handleExport}
                        className="flex items-center justify-center space-x-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        <span>Exporter</span>
                    </button>
                    {!isYearLocked && (
                        <button
                            onClick={handleAddStudent}
                            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Nouvel Élève</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                    {/* Filter by class UI */}
                     <div className="relative">
                        <select
                            value={filterClass}
                            onChange={(e) => setFilterClass(e.target.value)}
                            className="appearance-none pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 outline-none hover:bg-gray-100 cursor-pointer"
                        >
                            <option value="">Toutes les classes</option>
                            <option value="6ème M1">6ème M1</option>
                            <option value="6ème M2">6ème M2</option>
                            <option value="5ème M1">5ème M1</option>
                            <option value="5ème M2">5ème M2</option>
                            <option value="4ème M1">4ème M1</option>
                            <option value="4ème M2">4ème M2</option>
                            <option value="3ème M1">3ème M1</option>
                            <option value="3ème M2">3ème M2</option>
                        </select>
                        <Filter className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none" />
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

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "Modifier l'élève" : "Ajouter un nouvel élève"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Form fields same as before... re-including for completeness */}
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
                            <select value={formData.class} onChange={(e) => setFormData({ ...formData, class: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="6ème M1">6ème M1</option>
                                <option value="6ème M2">6ème M2</option>
                                <option value="5ème M1">5ème M1</option>
                                <option value="5ème M2">5ème M2</option>
                                <option value="4ème M1">4ème M1</option>
                                <option value="4ème M2">4ème M2</option>
                                <option value="3ème M1">3ème M1</option>
                                <option value="3ème M2">3ème M2</option>
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
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Annuler</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">{editingId ? "Mettre à jour" : "Enregistrer"}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Students;
