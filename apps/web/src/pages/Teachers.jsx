import React, { useState } from 'react';
import { Search, Plus, Phone, Mail, BookOpen, MoreVertical, Edit2, Trash2, User, Check, X } from 'lucide-react';
import Modal from '../components/ui/Modal';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import { useSchool } from '../context/SchoolContext';
import { useAcademicYear } from '../context/AcademicYearContext';

const Teachers = () => {
    const { teachers, setTeachers, subjects, createTeacher, approveTeacher, rejectTeacher, refreshData } = useSchool();
    const { isYearLocked } = useAcademicYear();

    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'pending'
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        subject: '',
        phone: '',
        email: ''
    });
    const [searchQuery, setSearchQuery] = useState('');

    // Filter teachers based on tab
    const approvedTeachers = teachers.filter(t => t.is_approved !== false);
    const pendingTeachers = teachers.filter(t => t.is_approved === false);

    const filtered = (activeTab === 'active' ? approvedTeachers : pendingTeachers).filter(t => {
        const q = searchQuery.toLowerCase();
        return !q ||
            (t.nom && t.nom.toLowerCase().includes(q)) ||
            (t.prenom && t.prenom.toLowerCase().includes(q)) ||
            (t.email && t.email.toLowerCase().includes(q)) ||
            (t.subject && t.subject.toLowerCase().includes(q));
    });

    const displayedTeachers = filtered;



    const handleEditTeacher = (teacher) => {
        setEditingId(teacher.id);
        setFormData({
            nom: teacher.nom,
            prenom: teacher.prenom,
            subject: teacher.subject,
            phone: teacher.phone,
            email: teacher.email
        });
        setIsModalOpen(true);
    };

    const handleDeleteTeacher = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce professeur ?')) {
            // Use rejectTeacher logic as it handles deletion
            const res = await rejectTeacher(id);
            if (res.success) {
                // UI update via refreshData in context
            } else {
                alert("Erreur lors de la suppression: " + res.error);
            }
        }
    };

    const handleApprove = async (id) => {
        if (window.confirm('Confirmer l\'approbation de ce professeur ?')) {
            const res = await approveTeacher(id);
            if (!res.success) alert("Erreur: " + res.error);
        }
    };

    const handleReject = async (id) => {
        if (window.confirm('Rejeter et supprimer cette demande d\'inscription ?')) {
            const res = await rejectTeacher(id);
            if (!res.success) alert("Erreur: " + res.error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (editingId) {
            // Mock Edit Logic for now (Task scope was create/approve)
            setTeachers(teachers.map(t =>
                t.id === editingId
                    ? { ...t, ...formData }
                    : t
            ));
            setLoading(false);
            setIsModalOpen(false);
            setFormData({ nom: '', prenom: '', subject: '', phone: '', email: '' });
            setEditingId(null);
        }
    };


    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Professeurs</h1>
                <p className="text-gray-500 mt-1">Gérez la liste des enseignants et leurs attributions</p>
            </div>


            {/* TABS */}
            <div className="flex space-x-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'active' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Professeurs Actifs
                    <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                        {approvedTeachers.length}
                    </span>
                    {activeTab === 'active' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />}
                </button>
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'pending' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Demandes d'inscription
                    {pendingTeachers.length > 0 && (
                        <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs animate-pulse">
                            {pendingTeachers.length}
                        </span>
                    )}
                    {activeTab === 'pending' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />}
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center space-x-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Rechercher un professeur..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom & Prénoms</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Matière</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {displayedTeachers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-gray-400 italic">
                                        Aucun professeur trouvé dans cette catégorie.
                                    </td>
                                </tr>
                            ) : (
                                displayedTeachers.map((teacher) => (
                                    <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 flex items-center justify-center font-bold text-sm mr-3">
                                                    {teacher.nom ? teacher.nom[0] : ''}{teacher.prenom ? teacher.prenom[0] : ''}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{teacher.nom} {teacher.prenom}</div>
                                                    <div className="text-sm text-gray-500 flex items-center mt-0.5">
                                                        <Mail className="w-3 h-3 mr-1" />
                                                        {teacher.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {teacher.subject.split(', ').map((sub, idx) => (
                                                    <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 whitespace-nowrap">
                                                        <BookOpen className="w-3 h-3 mr-1" />
                                                        {sub}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            <div className="flex items-center">
                                                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                                {teacher.phone}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {teacher.is_approved !== false ? (
                                                <Badge variant="success">Actif</Badge>
                                            ) : (
                                                <Badge variant="warning">En attente</Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {!isYearLocked && (
                                                <div className="flex items-center justify-end space-x-3">
                                                    {activeTab === 'pending' ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(teacher.id)}
                                                                className="text-green-600 hover:text-green-900 transition-colors flex items-center gap-1 bg-green-50 px-2 py-1 rounded"
                                                                title="Approuver"
                                                            >
                                                                <Check className="w-4 h-4" /> Approuver
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(teacher.id)}
                                                                className="text-red-600 hover:text-red-900 transition-colors flex items-center gap-1 bg-red-50 px-2 py-1 rounded"
                                                                title="Rejeter"
                                                            >
                                                                <X className="w-4 h-4" /> Rejeter
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleEditTeacher(teacher)}
                                                                className="text-blue-600 hover:text-blue-900 transition-colors"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteTeacher(teacher.id)}
                                                                className="text-red-400 hover:text-red-600 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <MobilePagination count={displayedTeachers.length} />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Modifier le professeur"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Nom</label>
                            <input
                                type="text"
                                required
                                value={formData.nom}
                                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Nom"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Prénoms</label>
                            <input
                                type="text"
                                required
                                value={formData.prenom}
                                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Prénoms"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Matière</label>
                        <select
                            required
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Sélectionner une matière</option>
                            {subjects && subjects.length > 0 ? (
                                subjects.map((sub) => (
                                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                                ))
                            ) : (
                                <>
                                    <option value="Mathématiques">Mathématiques</option>
                                    <option value="Français">Français</option>
                                    <option value="SVT">SVT</option>
                                    <option value="Physics-Chimie">Physique-Chimie</option>
                                    <option value="Histoire-Géo">Histoire-Géo</option>
                                    <option value="Anglais">Anglais</option>
                                    <option value="EPS">EPS</option>
                                    <option value="Philosophie">Philosophie</option>
                                </>
                            )}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Téléphone</label>
                            <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="+229..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="email@ecole.bj"
                            />
                        </div>
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
                            {editingId ? "Mettre à jour" : (loading ? "Enregistrement..." : "Enregistrer")}
                        </button>
                    </div>
                </form>
            </Modal>
        </div >
    );
};

const MobilePagination = ({ count }) => (
    <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
        <p className="text-sm text-gray-500">Affichage de {count} professeurs</p>
        <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-sm border border-gray-200 rounded-lg bg-white disabled:opacity-50">Précédent</button>
            <button className="px-3 py-1 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50">Suivant</button>
        </div>
    </div>
);

export default Teachers;
