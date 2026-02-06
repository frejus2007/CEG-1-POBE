import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import { useSchool } from '../context/SchoolContext';
import { ChevronLeft, Plus } from 'lucide-react';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import LevelCard from '../components/LevelCard';
import ClassCard from '../components/ClassCard';

const LEVELS = ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Tle'];

const Classes = () => {
    const { classes, addClass, updateClass, deleteClass, getTeachersForClass, validateHeadTeacherAssignment } = useSchool();
    const { showSuccess, showError } = useToast();
    const [selectedLevel, setSelectedLevel] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        level: '6ème',
        suffix: '',
        mainTeacherId: ''
    });

    // Derived Data
    const levelCounts = classes.reduce((acc, cls) => {
        acc[cls.level] = (acc[cls.level] || 0) + 1;
        return acc;
    }, {});

    const handleAddClass = () => {
        setEditingId(null);
        setFormData({ level: '6ème', suffix: '', mainTeacherId: '' });
        setIsModalOpen(true);
    };

    const handleEditClass = (cls) => {
        setEditingId(cls.id);
        // Parse suffix from name (e.g. "6ème M1" -> suffix "M1")
        // Handle cases where name might just be the level or different format if needed, 
        // but assuming "Level Suffix" format based on existing code.
        const suffix = cls.name.replace(cls.level + ' ', '');
        setFormData({
            level: cls.level,
            suffix: suffix,
            mainTeacherId: cls.mainTeacher ? cls.mainTeacher.id : ''
        });
        setIsModalOpen(true);
    };

    const handleDeleteClass = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette classe ?')) {
            const res = await deleteClass(id);
            if (!res.success) showError(res.error);
            else showSuccess("Classe supprimée avec succès");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const className = `${formData.level} ${formData.suffix}`;

        try {
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
                showSuccess(editingId ? "Classe mise à jour" : "Classe ajoutée");
                setIsModalOpen(false);
                setFormData({ level: '6ème', suffix: '', mainTeacherId: '' });
                setEditingId(null);
            } else {
                showError("Erreur: " + res.error);
            }
        } catch (err) {
            showError("Une erreur est survenue");
        } finally {
            setIsSubmitting(false);
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
                                studentCount={cls.students}
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
                            disabled={isSubmitting}
                            className="flex items-center gap-2"
                        >
                            {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                            {editingId ? "Mettre à jour" : "Enregistrer"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Classes;
