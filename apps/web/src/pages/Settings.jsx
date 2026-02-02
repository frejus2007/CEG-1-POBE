import React, { useState } from 'react';
import { Save, School, Calendar, Shield, Lock, Unlock, AlertTriangle, Clock } from 'lucide-react';
import { useAcademicYear } from '../context/AcademicYearContext';
import Modal from '../components/ui/Modal';

const SecurityModal = ({ isOpen, onClose, onConfirm, actionName }) => {
    const [answer, setAnswer] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        // Hardcoded security question for demo purposes
        // In a real app, this would validate against a stored hash or backend
        if (answer.toLowerCase() === 'paris') {
            onConfirm();
            onClose();
            setAnswer('');
            setError('');
        } else {
            setError('Réponse incorrecte. Veuillez réessayer.');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Question de Sécurité">
            <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg flex items-start space-x-3 text-red-800">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">
                        Attention : L'action <strong>"{actionName}"</strong> est irréversible.
                        Veuillez répondre à la question de sécurité pour confirmer.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quelle est la capitale de la France ?
                    </label>
                    <input
                        type="text"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                        placeholder="Votre réponse..."
                    />
                    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        Confirmer
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const PERIOD_LABELS = {
    interrogation1: "Interrogation 1",
    interrogation2: "Interrogation 2",
    interrogation3: "Interrogation 3",
    devoir1: "Devoir 1",
    devoir2: "Devoir 2"
};

const Settings = () => {
    const {
        academicYear,
        currentSemester,
        isSemester1Locked,
        isSemester2Locked,
        isYearLocked,
        lockSemester1,
        startSemester2,
        lockSemester2,
        lockYear,
        evaluationPeriods, setEvaluationPeriods,
        calculationPeriod, setCalculationPeriod,
        isGradingOpen,
        addAcademicYear
    } = useAcademicYear();

    const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [isNewYearModalOpen, setIsNewYearModalOpen] = useState(false);
    const [newYearInput, setNewYearInput] = useState('');

    const handleActionClick = (action, name) => {
        setPendingAction({ fn: action, name });
        setIsSecurityModalOpen(true);
    };

    const confirmAction = () => {
        if (pendingAction) {
            pendingAction.fn();
        }
    };

    const handleNewYearSubmit = (e) => {
        e.preventDefault();
        if (newYearInput) {
            addAcademicYear(newYearInput);
            setIsNewYearModalOpen(false);
            setNewYearInput('');
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
                <p className="text-gray-500 mt-1">Configuration générale de l'établissement</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <School className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Information de l'établissement</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Nom de l'établissement</label>
                            <input
                                type="text"
                                defaultValue="CEG1 POBÈ"
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Adresse</label>
                            <input
                                type="text"
                                defaultValue="BP 123, Pobè, Plateau"
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Téléphone Admin</label>
                            <input
                                type="text"
                                defaultValue="+229 20 22 00 00"
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Email Contact</label>
                            <input
                                type="email"
                                defaultValue="contact@ceg1pobe.bj"
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Année Scolaire & Périodes</h2>
                        </div>
                        <button
                            onClick={() => setIsNewYearModalOpen(true)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-blue-100"
                        >
                            + Nouvelle Année
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Année en cours</label>
                            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium">
                                <span>{academicYear}</span>
                                {isYearLocked ? <Lock className="w-4 h-4 text-red-500" /> : <Unlock className="w-4 h-4 text-green-500" />}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Semestre Actuel</label>
                            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium">
                                <span>{currentSemester}</span>
                            </div>
                        </div>
                    </div>

                    {/* NEW SECTION: Périodes et Délais */}
                    {/* NEW SECTION: Périodes et Délais */}
                    <div className="mb-6 p-4 border border-blue-100 bg-blue-50/50 rounded-xl space-y-4">
                        <div className="flex items-center space-x-2 text-blue-800 mb-2">
                            <Clock className="w-5 h-5" />
                            <h3 className="font-semibold text-sm">Périodes de Saisie des Notes</h3>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3">Évaluation</th>
                                        <th className="px-4 py-3">Date de Début</th>
                                        <th className="px-4 py-3">Date de Fin (Date Limite)</th>
                                        <th className="px-4 py-3 text-center">Statut</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {Object.entries(evaluationPeriods).map(([key, dates]) => {
                                        const isOpen = !dates.end || new Date() <= new Date(dates.end).setHours(23, 59, 59);
                                        return (
                                            <tr key={key} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-gray-800">{PERIOD_LABELS[key]}</td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="date"
                                                        value={dates.start}
                                                        onChange={(e) => setEvaluationPeriods({
                                                            ...evaluationPeriods,
                                                            [key]: { ...dates, start: e.target.value }
                                                        })}
                                                        className="w-full bg-transparent border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-500"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="date"
                                                        value={dates.end}
                                                        onChange={(e) => setEvaluationPeriods({
                                                            ...evaluationPeriods,
                                                            [key]: { ...dates, end: e.target.value }
                                                        })}
                                                        className="w-full bg-transparent border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-500"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`text-xs px-2 py-1 rounded-full ${isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {isOpen ? 'Ouverte' : 'Fermée'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-blue-100">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-600 uppercase">Début Calcul Moy.</label>
                                <input
                                    type="date"
                                    value={calculationPeriod.start}
                                    onChange={(e) => setCalculationPeriod({ ...calculationPeriod, start: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-600 uppercase">Fin Calcul Moy.</label>
                                <input
                                    type="date"
                                    value={calculationPeriod.end}
                                    onChange={(e) => setCalculationPeriod({ ...calculationPeriod, end: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                            <Shield className="w-4 h-4 mr-2" />
                            Actions de Fin de Période
                        </h3>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSemester1Locked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                        <span className="font-bold text-sm">S1</span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Semestre 1</p>
                                        <p className="text-xs text-gray-500">{isSemester1Locked ? 'Bouclé' : 'En cours'}</p>
                                    </div>
                                </div>
                                {!isSemester1Locked && (
                                    <button
                                        onClick={() => handleActionClick(lockSemester1, "Boucler le Semestre 1")}
                                        className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                                    >
                                        Boucler
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSemester2Locked ? 'bg-red-100 text-red-600' : currentSemester === 'Semestre 2' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <span className="font-bold text-sm">S2</span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Semestre 2</p>
                                        <p className="text-xs text-gray-500">
                                            {isSemester2Locked ? 'Bouclé' : currentSemester === 'Semestre 2' ? 'En cours' : 'Non démarré'}
                                        </p>
                                    </div>
                                </div>
                                {isSemester1Locked && currentSemester !== 'Semestre 2' && (
                                    <button
                                        onClick={startSemester2}
                                        className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                                    >
                                        Démarrer S2
                                    </button>
                                )}
                                {currentSemester === 'Semestre 2' && !isSemester2Locked && (
                                    <button
                                        onClick={() => handleActionClick(lockSemester2, "Boucler le Semestre 2")}
                                        className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                                    >
                                        Boucler
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isYearLocked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                                        <School className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Année Scolaire</p>
                                        <p className="text-xs text-gray-500">{isYearLocked ? 'Bouclée - Lecture Seule' : 'En cours'}</p>
                                    </div>
                                </div>
                                {isSemester1Locked && isSemester2Locked && !isYearLocked && (
                                    <button
                                        onClick={() => handleActionClick(lockYear, "Boucler l'Année Scolaire")}
                                        className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                                    >
                                        Clôturer l'Année
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 flex justify-end">
                    <button className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-medium">
                        <Save className="w-4 h-4" />
                        <span>Enregistrer les modifications</span>
                    </button>
                </div>
            </div>

            <SecurityModal
                isOpen={isSecurityModalOpen}
                onClose={() => setIsSecurityModalOpen(false)}
                onConfirm={confirmAction}
                actionName={pendingAction?.name}
            />

            <Modal
                isOpen={isNewYearModalOpen}
                onClose={() => setIsNewYearModalOpen(false)}
                title="Nouvelle Année Scolaire"
            >
                <form onSubmit={handleNewYearSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Intitulé (ex: 2026-2027)</label>
                        <input
                            type="text"
                            required
                            placeholder="YYYY-YYYY"
                            value={newYearInput}
                            onChange={(e) => setNewYearInput(e.target.value)}
                            pattern="\d{4}-\d{4}"
                            title="Format attendu: AAAA-AAAA"
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="pt-4 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => setIsNewYearModalOpen(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            Créer
                        </button>
                    </div>
                </form>
            </Modal>
        </div >
    );
};

export default Settings;

