import React, { useState, useEffect } from 'react';
import { Save, School, Calendar, Shield, Lock, Unlock, AlertTriangle, Clock, RefreshCw, Smartphone } from 'lucide-react';
import { useAcademicYear } from '../context/AcademicYearContext';
import { useSchool } from '../context/SchoolContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import { supabase } from '../lib/supabase';

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
                        Attention : L'action <strong>"{actionName}"</strong> est sensible.
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
        isYearLocked,
        toggleYearStatus,
        setSemester,
        evaluationPeriods,
        updateEvaluationPeriod,
        calculationPeriod,
        updateCalculationPeriod,
        addAcademicYear,
        activeYearData,
        toggleSemesterLock,
        isSemester1Locked,
        isSemester2Locked
    } = useAcademicYear();

    const { appConfig, updateAppConfig } = useSchool();
    const { showSuccess, showError } = useToast();

    const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [isNewYearModalOpen, setIsNewYearModalOpen] = useState(false);
    const [newYearInput, setNewYearInput] = useState('');

    // School Info State
    const [schoolInfo, setSchoolInfo] = useState({
        name: 'CEG1 POBÈ',
        address: 'BP 123, Pobè, Plateau',
        phone: '+229 20 22 00 00',
        email: 'contact@ceg1pobe.bj'
    });

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

    // Fetch school info on mount
    useEffect(() => {
        const fetchSchoolInfo = async () => {
            try {
                const { data, error } = await supabase
                    .from('school_info')
                    .select('*')
                    .single();

                if (error) throw error;
                if (data) {
                    setSchoolInfo({
                        name: data.name || 'CEG1 POBÈ',
                        address: data.address || '',
                        phone: data.phone || '',
                        email: data.email || ''
                    });
                }
            } catch (err) {
                console.error('Error fetching school info:', err);
            }
        };
        fetchSchoolInfo();
    }, []);

    const handleSaveSchoolInfo = async () => {
        try {
            // Update the single row in school_info table (id = 1)
            const { error } = await supabase
                .from('school_info')
                .update({
                    name: schoolInfo.name,
                    address: schoolInfo.address,
                    phone: schoolInfo.phone,
                    email: schoolInfo.email,
                    updated_at: new Date()
                })
                .eq('id', 1);

            if (error) throw error;

            showSuccess('Informations de l\'établissement enregistrées');
        } catch (err) {
            console.error('Error saving school info:', err);
            showError('Erreur lors de l\'enregistrement');
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
                                value={schoolInfo.name}
                                onChange={(e) => setSchoolInfo({ ...schoolInfo, name: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Adresse</label>
                            <input
                                type="text"
                                value={schoolInfo.address}
                                onChange={(e) => setSchoolInfo({ ...schoolInfo, address: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Téléphone Admin</label>
                            <input
                                type="text"
                                value={schoolInfo.phone}
                                onChange={(e) => setSchoolInfo({ ...schoolInfo, phone: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Email Contact</label>
                            <input
                                type="email"
                                value={schoolInfo.email}
                                onChange={(e) => setSchoolInfo({ ...schoolInfo, email: e.target.value })}
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

                    {/* Périodes et Délais */}
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
                                        const isWithinDates = !dates.end || new Date() <= new Date(dates.end).setHours(23, 59, 59);
                                        const isOpen = dates.is_unlocked && isWithinDates;

                                        return (
                                            <tr key={key} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-gray-800">{PERIOD_LABELS[key]}</td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="date"
                                                        value={dates.start}
                                                        onChange={(e) => updateEvaluationPeriod(key, { start: e.target.value })}
                                                        className="w-full bg-transparent border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-500"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="date"
                                                        value={dates.end}
                                                        onChange={(e) => updateEvaluationPeriod(key, { end: e.target.value })}
                                                        className="w-full bg-transparent border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-500"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => updateEvaluationPeriod(key, { is_unlocked: !dates.is_unlocked })}
                                                        className={`text-xs px-2 py-1 rounded-full border transition-colors cursor-pointer ${isOpen ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}
                                                        title="Cliquez pour verrouiller/déverrouiller"
                                                    >
                                                        {isOpen ? 'Ouverte' : 'Fermée'}
                                                    </button>
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
                                    onChange={(e) => updateCalculationPeriod({ start: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-600 uppercase">Fin Calcul Moy.</label>
                                <input
                                    type="date"
                                    value={calculationPeriod.end}
                                    onChange={(e) => updateCalculationPeriod({ end: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Gestion de l'Année et Semestres */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                            <Shield className="w-4 h-4 mr-2" />
                            Gestion de l'Année Scolaire
                        </h3>

                        <div className="space-y-3">
                            {/* Year Status & Toggle */}
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isYearLocked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                        <School className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Statut de l'Année</p>
                                        <p className="text-xs text-gray-500">{isYearLocked ? 'Clôturée (Lecture seule)' : 'Ouverte (En cours)'}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleActionClick(toggleYearStatus, isYearLocked ? "Réouvrir l'Année Scolaire" : "Clôturer l'Année Scolaire")}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border ${isYearLocked
                                        ? 'text-green-600 bg-green-50 hover:bg-green-100 border-green-200'
                                        : 'text-red-600 bg-red-50 hover:bg-red-100 border-red-200'
                                        }`}
                                >
                                    {isYearLocked ? 'Réouvrir' : 'Clôturer'}
                                </button>
                            </div>

                            {/* Semester Locking Toggles */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-900 text-sm">Semestre 1</span>
                                        <span className={`text-xs ${isSemester1Locked ? 'text-red-500' : 'text-green-500'}`}>
                                            {isSemester1Locked ? 'Verrouillé' : 'Ouvert'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => toggleSemesterLock(1)}
                                        disabled={isYearLocked}
                                        className={`p-1.5 rounded-md transition-colors ${isSemester1Locked
                                                ? 'text-red-600 bg-red-50 hover:bg-red-100'
                                                : 'text-green-600 bg-green-50 hover:bg-green-100'
                                            } ${isYearLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title={isSemester1Locked ? "Déverrouiller S1" : "Verrouiller S1"}
                                    >
                                        {isSemester1Locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-900 text-sm">Semestre 2</span>
                                        <span className={`text-xs ${isSemester2Locked ? 'text-red-500' : 'text-green-500'}`}>
                                            {isSemester2Locked ? 'Verrouillé' : 'Ouvert'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => toggleSemesterLock(2)}
                                        disabled={isYearLocked}
                                        className={`p-1.5 rounded-md transition-colors ${isSemester2Locked
                                                ? 'text-red-600 bg-red-50 hover:bg-red-100'
                                                : 'text-green-600 bg-green-50 hover:bg-green-100'
                                            } ${isYearLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title={isSemester2Locked ? "Déverrouiller S2" : "Verrouiller S2"}
                                    >
                                        {isSemester2Locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Semester Switcher */}
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 text-blue-600`}>
                                        <RefreshCw className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Changer de Semestre Actuel</p>
                                        <p className="text-xs text-gray-500">Détermine la période active pour les saisies</p>
                                    </div>
                                </div>
                                <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
                                    <button
                                        onClick={() => !isYearLocked && setSemester(1)}
                                        disabled={isYearLocked}
                                        className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${currentSemester === 'Semestre 1'
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            } ${isYearLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        Semestre 1
                                    </button>
                                    <button
                                        onClick={() => !isYearLocked && setSemester(2)}
                                        disabled={isYearLocked}
                                        className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${currentSemester === 'Semestre 2'
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            } ${isYearLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        Semestre 2
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <Smartphone className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Application Mobile</h2>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-900">Session de Calcul MG</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Détermine si 'Session de calcul MG' est accessible (déverrouillée) ou masquée (cadenas) sur l'application mobile.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-sm font-medium ${appConfig?.enable_mg_session ? 'text-green-600' : 'text-gray-500'}`}>
                                    {appConfig?.enable_mg_session ? 'Déverrouillé' : 'Verrouillé'}
                                </span>
                                <button
                                    onClick={() => updateAppConfig({ enable_mg_session: !appConfig?.enable_mg_session })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${appConfig?.enable_mg_session ? 'bg-green-500' : 'bg-gray-200'
                                        }`}
                                >
                                    <span
                                        className={`${appConfig?.enable_mg_session ? 'translate-x-6' : 'translate-x-1'
                                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 flex justify-end">
                    <button
                        onClick={handleSaveSchoolInfo}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-medium"
                    >
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
        </div>
    );
};

export default Settings;
