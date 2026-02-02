import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Bell, CheckCircle, AlertCircle, Users, Send, Search } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';

const Notifications = () => {
    const { teachers, notifications, sendNotification, systemStats } = useSchool();
    const [recipients, setRecipients] = useState('all'); // 'all' | 'missing' | 'custom'
    const [teacherSearch, setTeacherSearch] = useState('');
    const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
    const [reminderType, setReminderType] = useState('missing_grades');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    // List of teachers who are approved and have assignments (simulated or real)
    const activeTeachers = teachers.filter(t => t.is_approved);

    // Default messages based on type
    const templates = {
        missing_grades: "Cher(e) collègue,\n\nVeuillez compléter la saisie des notes pour le semestre en cours dès que possible.\n\nCordialement,\nLa Direction",
        correction: "Cher(e) collègue,\n\nUne correction est requise sur certaines notes que vous avez saisies. Merci de vérifier votre espace.\n\nCordialement,\nLe Censeur",
        custom: ""
    };

    useEffect(() => {
        setMessage(templates[reminderType] || '');
    }, [reminderType]);

    const handleSend = async () => {
        let receiverIds = [];

        if (recipients === 'all') {
            receiverIds = activeTeachers.map(t => t.id);
        } else if (recipients === 'custom') {
            receiverIds = selectedTeacherIds;
        } else if (recipients === 'missing') {
            // Simplified: logic for "missing" could be more complex, 
            // but for now let's assume all if no specific filter is ready
            receiverIds = activeTeachers.map(t => t.id);
        }

        if (receiverIds.length === 0) {
            alert("Veuillez sélectionner au moins un destinataire.");
            return;
        }

        if (!message.trim()) {
            alert("Veuillez saisir un message.");
            return;
        }

        setIsSending(true);
        const res = await sendNotification({
            title: reminderType === 'missing_grades' ? "Notes manquantes" :
                reminderType === 'correction' ? "Correction requise" : "Message de la Direction",
            body: message,
            type: reminderType.toUpperCase(),
            receiverIds
        });

        setIsSending(false);

        if (res.success) {
            alert("Rappel envoyé avec succès à " + receiverIds.length + " destinataire(s) !");
            setSelectedTeacherIds([]);
            if (reminderType === 'custom') setMessage('');
        } else {
            alert("Erreur lors de l'envoi : " + res.error);
        }
    };

    const toggleTeacher = (id) => {
        setSelectedTeacherIds(prev =>
            prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
        );
    };

    // Use refined system stats
    const missingGradesCount = systemStats?.missingGrades || 0;
    const totalExpected = systemStats?.totalExpected || 0;
    const progress = systemStats?.progress || 0;

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                    <Bell className="w-6 h-6 text-blue-600" />
                </div>
                Notifications & Rappels
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="h-fit">
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100 font-bold text-gray-800">
                        <Send className="w-5 h-5 text-blue-500" />
                        <h2>Envoyer un rappel</h2>
                    </div>

                    <div className="space-y-6">
                        {/* Destinataires */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider flex items-center gap-2">
                                <Users className="w-4 h-4" /> Destinataires
                            </h3>
                            <div className="space-y-2">
                                <label className="flex items-center space-x-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 cursor-pointer transition-all">
                                    <input
                                        type="radio"
                                        name="recipients"
                                        checked={recipients === 'all'}
                                        onChange={() => setRecipients('all')}
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700 font-medium">Tous les professeurs ({activeTeachers.length})</span>
                                </label>
                                <label className="flex items-center space-x-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 cursor-pointer transition-all">
                                    <input
                                        type="radio"
                                        name="recipients"
                                        checked={recipients === 'missing'}
                                        onChange={() => setRecipients('missing')}
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700 font-medium">Professeurs avec notes manquantes</span>
                                </label>
                                <label className="flex items-center space-x-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 cursor-pointer transition-all">
                                    <input
                                        type="radio"
                                        name="recipients"
                                        checked={recipients === 'custom'}
                                        onChange={() => setRecipients('custom')}
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700 font-medium">Sélection personnalisée</span>
                                </label>

                                {recipients === 'custom' && (
                                    <div className="ml-8 mt-2 max-h-60 flex flex-col border-l-2 border-blue-100 pl-4 space-y-3">
                                        <div className="relative">
                                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                            <input
                                                type="text"
                                                placeholder="Rechercher un prof..."
                                                value={teacherSearch}
                                                onChange={(e) => setTeacherSearch(e.target.value)}
                                                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="overflow-y-auto space-y-1 custom-scrollbar pr-2">
                                            {activeTeachers
                                                .filter(t =>
                                                    !teacherSearch ||
                                                    (t.name || "").toLowerCase().includes(teacherSearch.toLowerCase()) ||
                                                    (t.subject || "").toLowerCase().includes(teacherSearch.toLowerCase())
                                                )
                                                .map(t => (
                                                    <label key={t.id} className="flex items-center space-x-2 text-sm p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedTeacherIds.includes(t.id)}
                                                            onChange={() => toggleTeacher(t.id)}
                                                            className="rounded text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span className="text-gray-600">
                                                            {t.name} <span className="text-xs text-gray-400">({t.subject})</span>
                                                        </span>
                                                    </label>
                                                ))}
                                            {activeTeachers.filter(t =>
                                                !teacherSearch ||
                                                (t.name || "").toLowerCase().includes(teacherSearch.toLowerCase()) ||
                                                (t.subject || "").toLowerCase().includes(teacherSearch.toLowerCase())
                                            ).length === 0 && (
                                                    <p className="text-xs text-center py-4 text-gray-400 italic">Aucun professeur trouvé</p>
                                                )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Type de rappel */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Type de rappel</h3>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setReminderType('missing_grades')}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${reminderType === 'missing_grades' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    Rappel Notes
                                </button>
                                <button
                                    onClick={() => setReminderType('correction')}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${reminderType === 'correction' ? 'bg-amber-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    Correction
                                </button>
                                <button
                                    onClick={() => setReminderType('custom')}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${reminderType === 'custom' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    Personnalisé
                                </button>
                            </div>
                        </div>

                        {/* Message */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Message</h3>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Saisissez votre message ici..."
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[160px] transition-all"
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                            <Button variant="outline" className="rounded-xl px-6">Annuler</Button>
                            <Button
                                onClick={handleSend}
                                disabled={isSending}
                                className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl px-6 flex items-center gap-2"
                            >
                                {isSending ? "Envoi..." : "Envoyer le rappel"}
                                {!isSending && <Send className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>
                </Card>

                <div className="space-y-6">
                    <Card className="h-fit">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">Historique récent</h2>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 italic">
                                    Aucun rappel envoyé pour le moment.
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div key={n.id} className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100 group">
                                        <div className={`mt-1 p-2 rounded-lg ${n.type === 'MISSING_GRADES' ? 'bg-blue-50 text-blue-500' :
                                            n.type === 'CORRECTION' ? 'bg-amber-50 text-amber-500' : 'bg-gray-50 text-gray-500'
                                            }`}>
                                            <CheckCircle className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <p className="font-bold text-gray-800">{n.title}</p>
                                                <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{n.body}</p>
                                            <div className="flex items-center gap-3 mt-3">
                                                <span className="text-[10px] items-center gap-1 font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-tighter flex">
                                                    APP NOTIF
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white border-none shadow-lg shadow-blue-200 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-500 opacity-20">
                            <Bell className="w-40 h-40" />
                        </div>

                        <div className="relative z-10">
                            <h2 className="text-xl font-bold mb-6">État du système</h2>
                            <div className="flex items-center space-x-4 mb-6">
                                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                                    <AlertCircle className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black">{missingGradesCount} Notes en attente</h3>
                                    <p className="text-blue-100 text-sm">Sur un total de {totalExpected} saisies prévues</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="w-full bg-white/20 rounded-full h-3">
                                    <div className="bg-white h-3 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-blue-100">
                                    <span>Progression globale</span>
                                    <span>{progress}% complété</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Notifications;
