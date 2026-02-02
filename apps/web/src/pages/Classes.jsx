import React, { useState } from 'react';
import { Users, BookOpen, Plus, Edit2, Trash2, ChevronLeft, Folder, Search } from 'lucide-react';
import Modal from '../components/ui/Modal';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useSchool } from '../context/SchoolContext';

const LEVELS = ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Tle'];

const LevelCard = ({ level, classCount, onClick }) => (
    <div
        onClick={onClick}
        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group flex flex-col items-center justify-center text-center space-y-3 h-48"
    >
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Folder className="w-8 h-8" />
        </div>
        <div>
            <h3 className="text-xl font-bold text-gray-900">{level}</h3>
            <p className="text-sm text-gray-500 font-medium">{classCount} Classes</p>
        </div>
    </div>
);

const ClassCard = ({ id, className, students, mainTeacher, subjects, onEdit, onDelete }) => (
    <Card className="relative group">
        <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); onEdit(id); }}
                className="!p-1 h-auto"
            >
                <Edit2 className="w-4 h-4 text-blue-400" />
            </Button>
            <Button
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); onDelete(id); }}
                className="!p-1 h-auto"
            >
                <Trash2 className="w-4 h-4 text-red-400" />
            </Button>
        </div>
        <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center font-bold text-lg mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            {className.split(' ').slice(1).join(' ').substring(0, 2) || (className.length > 3 ? className[0] : className)}
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">{className}</h3>
        <p className="text-sm text-gray-500 mb-4">PP: {mainTeacher}</p>

        <div className="flex items-center justify-between text-sm text-gray-600 border-t border-gray-50 pt-4">
            <div className="flex items-center">
                <Users className="w-4 h-4 mr-1.5 text-gray-400" />
                {students}
            </div>
            <div className="flex items-center">
                <BookOpen className="w-4 h-4 mr-1.5 text-gray-400" />
                {subjects} Mat.
            </div>
        </div>
    </Card>
);

const Classes = () => {
    const { classes, addClass, updateClass, deleteClass, getTeachersForClass, validateHeadTeacherAssignment } = useSchool();
    const [selectedLevel, setSelectedLevel] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        level: '6ème',
        suffix: '',
        mainTeacherId: ''
    });



    // Determine counts per level
    const levelCounts = LEVELS.reduce((acc, level) => {
        acc[level] = classes.filter(c => c.name.startsWith(level + ' ')).length;
        return acc;
    }, {});

    const handleAddClass = () => {
        setEditingId(null);
        setFormData({
            level: selectedLevel || '6ème',
            suffix: '',
            mainTeacherId: ''
        });
        setIsModalOpen(true);
    };

    const handleEditClass = (id) => {
        const cls = classes.find(c => c.id === id);
        if (!cls) return;

        let foundLevel = LEVELS.find(l => cls.name.startsWith(l)) || '6ème';
        let suffix = cls.name.replace(foundLevel, '').trim();

        setEditingId(id);
        setFormData({
            level: foundLevel,
            suffix: suffix,
            mainTeacherId: cls.mainTeacherId || ''
        });
        setIsModalOpen(true);
    };

    const handleDeleteClass = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette classe ?')) {
            const res = await deleteClass(id);
            if (!res.success) alert(res.error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const className = `${formData.level} ${formData.suffix}`;

        // Validate Head Teacher Constraint (Optional/TODO: Update validation for IDs)
        /*
        if (formData.mainTeacherId) {
            const validation = validateHeadTeacherAssignment(formData.mainTeacherId, editingId);
            if (!validation.valid) {
                alert(validation.error);
                return;
            }
        }
        */

        const classData = {
            name: className,
            level: formData.level,
            mainTeacherId: formData.mainTeacherId
        };

        let res;
        if (editingId) {
            res = await updateClass(editingId, classData);
        } else {
            res = await addClass(classData);
        }

        if (res.success) {
            setIsModalOpen(false);
            setFormData({ level: '6ème', suffix: '', mainTeacherId: '' });
            setEditingId(null);
        } else {
            alert("Erreur: " + res.error);
        }
    };

    // Filter classes for the current view
    const displayedClasses = selectedLevel
        ? classes.filter(c => c.name.startsWith(selectedLevel + ' '))
        : [];

    // Get candidate teachers for the current form class
    const currentFormClassName = `${formData.level} ${formData.suffix}`;
    const availablePPs = getTeachersForClass(currentFormClassName.trim());

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    {selectedLevel && (
                        <Button
                            variant="ghost"
                            onClick={() => setSelectedLevel(null)}
                            className="!p-2"
                        >
                            <ChevronLeft className="w-6 h-6 text-gray-600" />
                        </Button>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {selectedLevel ? `Classes de ${selectedLevel}` : 'Niveaux'}
                        </h1>
                        <p className="text-gray-500 mt-1">
                            {selectedLevel
                                ? "Gestion des classes de ce niveau"
                                : "Sélectionnez un niveau pour voir les classes"}
                        </p>
                    </div>
                </div>
                <Button
                    onClick={handleAddClass}
                    icon={Plus}
                >
                    {selectedLevel ? "Ajouter une classe" : "Nouvelle Classe"}
                </Button>
            </div>

            {!selectedLevel ? (
                /* Level Overview */
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {LEVELS.map(level => (
                        <LevelCard
                            key={level}
                            level={level}
                            classCount={levelCounts[level] || 0}
                            onClick={() => setSelectedLevel(level)}
                        />
                    ))}
                </div>
            ) : (
                /* Specific Level View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {displayedClasses.length > 0 ? (
                        displayedClasses.map((cls) => (
                            <ClassCard
                                key={cls.id}
                                id={cls.id}
                                className={cls.name}
                                students={cls.students}
                                mainTeacher={cls.mainTeacher}
                                subjects={cls.subjects}
                                onEdit={handleEditClass}
                                onDelete={handleDeleteClass}
                            />
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <p className="text-gray-500">Aucune classe créée pour ce niveau.</p>
                        </div>
                    )}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "Modifier la classe" : "Ajouter une nouvelle classe"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Niveau</label>
                            <Select
                                value={formData.level}
                                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                            >
                                {LEVELS.map(lvl => (
                                    <option key={lvl} value={lvl}>{lvl}</option>
                                ))}
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Nom / Suffixe</label>
                            <div className="flex items-center gap-2">
                                <span className="bg-gray-100 border border-gray-200 px-3 py-2 rounded-lg text-gray-500 text-sm whitespace-nowrap">
                                    {formData.level}
                                </span>
                                <Input
                                    type="text"
                                    required
                                    placeholder="ex: M1 ou D1"
                                    value={formData.suffix}
                                    onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Professeur Principal</label>
                        <Select
                            value={formData.mainTeacherId}
                            onChange={(e) => setFormData({ ...formData, mainTeacherId: e.target.value })}
                        >
                            <option value="">Sélectionner un PP</option>
                            <option value="">Non assigné</option>
                            {availablePPs.map(teacher => (
                                <option key={teacher.id} value={teacher.id}>
                                    {teacher.nom} {teacher.prenom} ({teacher.subject})
                                </option>
                            ))}
                        </Select>
                        {availablePPs.length === 0 && (
                            <p className="text-xs text-orange-500">
                                Aucun professeur n'est affecté à cette classe ({currentFormClassName}).
                                Veuillez d'abord ajouter des affectations.
                            </p>
                        )}
                    </div>

                    <div className="pt-4 flex justify-end space-x-3">
                        <Button
                            variant="secondary"
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                        >
                            {editingId ? "Mettre à jour" : "Enregistrer"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Classes;
