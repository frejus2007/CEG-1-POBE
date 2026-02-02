import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Bell, Mail, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';

const Notifications = () => {
    const [recipients, setRecipients] = useState('all');
    const [selectedTeachers, setSelectedTeachers] = useState({
        koudjo: true,
        hounkpe: true,
        assogba: false
    });
    const [reminderType, setReminderType] = useState('missing_grades');
    const [channels, setChannels] = useState({
        app: true,
        email: true,
        sms: false
    });

    const handleSend = () => {
        // Mock send logic
        alert("Rappel envoyé avec succès !");
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Bell className="w-8 h-8 text-blue-600" />
                Notifications & Rappels
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="h-fit">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 pb-4 border-b border-gray-100">Envoyer un rappel</h2>
                    <div className="space-y-6">
                        {/* Destinataires */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Destinataires</h3>
                            <div className="space-y-2">
                                <label className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="recipients"
                                        checked={recipients === 'all'}
                                        onChange={() => setRecipients('all')}
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">Tous les professeurs</span>
                                </label>
                                <label className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="recipients"
                                        checked={recipients === 'missing'}
                                        onChange={() => setRecipients('missing')}
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">Professeurs avec notes manquantes</span>
                                </label>
                                <label className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="recipients"
                                        checked={recipients === 'custom'}
                                        onChange={() => setRecipients('custom')}
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">Sélection personnalisée</span>
                                </label>

                                {recipients === 'custom' && (
                                    <div className="ml-8 mt-2 space-y-2 border-l-2 border-gray-100 pl-4">
                                        <label className="flex items-center space-x-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={selectedTeachers.koudjo}
                                                onChange={(e) => setSelectedTeachers({ ...selectedTeachers, koudjo: e.target.checked })}
                                                className="rounded text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>KOUDJO Paul (Mathématiques)</span>
                                        </label>
                                        <label className="flex items-center space-x-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={selectedTeachers.hounkpe}
                                                onChange={(e) => setSelectedTeachers({ ...selectedTeachers, hounkpe: e.target.checked })}
                                                className="rounded text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>HOUNKPE Serge (SVT)</span>
                                        </label>
                                        <label className="flex items-center space-x-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={selectedTeachers.assogba}
                                                onChange={(e) => setSelectedTeachers({ ...selectedTeachers, assogba: e.target.checked })}
                                                className="rounded text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>ASSOGBA Marie (Lecture + CE)</span>
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Type de rappel */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Type de rappel</h3>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => setReminderType('missing_grades')}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${reminderType === 'missing_grades' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    ◉ Notes manquantes
                                </button>
                                <button
                                    onClick={() => setReminderType('correction')}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${reminderType === 'correction' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    ○ Correction requise
                                </button>
                                <button
                                    onClick={() => setReminderType('custom')}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${reminderType === 'custom' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    ○ Message personnalisé
                                </button>
                            </div>
                        </div>

                        {/* Message */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Message</h3>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <textarea
                                    className="w-full bg-transparent border-none outline-none text-gray-700 resize-none h-32"
                                    defaultValue="Cher(e) collègue,

Veuillez compléter la saisie des notes pour le premier trimestre avant le vendredi 10 février.

Cordialement,
La Direction"
                                />
                            </div>
                        </div>

                        {/* Canal */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Canal d'envoi</h3>
                            <div className="flex space-x-6">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={channels.app}
                                        onChange={(e) => setChannels({ ...channels, app: e.target.checked })}
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <Bell className="w-4 h-4 text-gray-500" />
                                    <span>Notification app</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={channels.email}
                                        onChange={(e) => setChannels({ ...channels, email: e.target.checked })}
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <Mail className="w-4 h-4 text-gray-500" />
                                    <span>Email</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={channels.sms}
                                        onChange={(e) => setChannels({ ...channels, sms: e.target.checked })}
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <MessageSquare className="w-4 h-4 text-gray-500" />
                                    <span>SMS</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                            <Button variant="outline">Annuler</Button>
                            <Button onClick={handleSend} className="bg-blue-600 text-white hover:bg-blue-700">
                                Envoyer le rappel
                            </Button>
                        </div>
                    </div>
                </Card>

                <div className="space-y-6">
                    <Card className="h-fit">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Historique récent</h2>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50 last:border-0">
                                    <div className="mt-1">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">Rappel "Notes manquantes"</p>
                                        <p className="text-sm text-gray-500">Envoyé à 12 professeurs • Hier à 14:30</p>
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">App</span>
                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Email</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100">
                        <h2 className="text-lg font-bold text-indigo-900 mb-4">État du système</h2>
                        <div className="flex items-center space-x-4 mb-4">
                            <AlertCircle className="w-10 h-10 text-indigo-500" />
                            <div>
                                <h3 className="font-bold text-indigo-900">32 Notes en attente</h3>
                                <p className="text-indigo-700 text-sm">Sur un total de 150 saisies prévues</p>
                            </div>
                        </div>
                        <div className="w-full bg-indigo-200 rounded-full h-2.5">
                            <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '78%' }}></div>
                        </div>
                        <p className="text-right text-xs text-indigo-600 mt-1">78% complété</p>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Notifications;
