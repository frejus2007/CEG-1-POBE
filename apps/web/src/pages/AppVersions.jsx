import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Smartphone, Upload, Link, Check, AlertTriangle, FileText } from 'lucide-react';

import { useSchool } from '../context/SchoolContext';

const AppVersions = () => {
    const { appConfig } = useSchool();
    const [version, setVersion] = useState('');
    const [file, setFile] = useState(null);
    const [changelog, setChangelog] = useState('');
    const [minVersion, setMinVersion] = useState('');

    useEffect(() => {
        if (appConfig) {
            setVersion(appConfig.version || '1.0.0');
            setMinVersion(appConfig.min_version || '1.0.0');
            setChangelog(appConfig.release_notes || '');
        }
    }, [appConfig]);

    // Mock steps state
    const [steps, setSteps] = useState({
        upload: false,
        link: false,
        publish: false
    });

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            // Mock auto-progress through steps
            setTimeout(() => setSteps(s => ({ ...s, upload: true })), 1500);
            setTimeout(() => setSteps(s => ({ ...s, link: true })), 3000);
        }
    };

    const handlePublish = () => {
        setSteps(s => ({ ...s, publish: true }));
        // Mock publish logic
        setTimeout(() => {
            alert("Version 1.1.0 publiée avec succès !");
            setSteps({ upload: false, link: false, publish: false });
            setFile(null);
        }, 1000);
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Smartphone className="w-8 h-8 text-blue-600" />
                Gestion de l'application mobile
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Current Version info */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none">
                        <h2 className="text-lg font-bold mb-1 opacity-90">Version en production</h2>
                        <div className="text-4xl font-extrabold mb-4">{appConfig?.version || '---'}</div>
                        <div className="space-y-2 text-sm opacity-90">
                            <p>Dernière mise à jour: {appConfig?.updated_at ? new Date(appConfig.updated_at).toLocaleDateString() : '---'}</p>
                            <p>Version min. requise: {appConfig?.min_version || '---'}</p>
                        </div>
                        <div className="mt-6 pt-6 border-t border-white/20">
                            <Button
                                variant="secondary"
                                className="w-full bg-white/10 text-white hover:bg-white/20 border-white/30 truncate"
                                onClick={() => appConfig?.download_url && window.open(appConfig.download_url, '_blank')}
                            >
                                <Link className="w-4 h-4 mr-2" />
                                Ouvrir le lien APK
                            </Button>
                        </div>
                    </Card>

                    <Card>
                        <h2 className="text-md font-bold text-gray-800 mb-4">Dernières versions</h2>
                        <div className="space-y-4">
                            <div className="text-center py-6 text-gray-500 italic text-sm">
                                Historique des versions non disponible
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Publish new version */}
                <div className="lg:col-span-2">
                    <Card>
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800">Publier une nouvelle version</h2>
                            <div className="text-sm px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                                Étape {file ? (steps.link ? 3 : 2) : 1} / 3
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de version</label>
                                    <Input
                                        type="text"
                                        value={version}
                                        onChange={(e) => setVersion(e.target.value)}
                                        placeholder="ex: 1.1.0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Version min. requise</label>
                                    <Input
                                        type="text"
                                        value={minVersion}
                                        onChange={(e) => setMinVersion(e.target.value)}
                                        placeholder="ex: 1.0.0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fichier APK</label>
                                <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-colors ${file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}>
                                    <input
                                        type="file"
                                        accept=".apk"
                                        className="hidden"
                                        id="apk-upload"
                                        onChange={handleFileChange}
                                    />
                                    {file ? (
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                                <Check className="w-6 h-6" />
                                            </div>
                                            <p className="font-medium text-green-800">{file.name}</p>
                                            <p className="text-sm text-green-600">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                            <button
                                                onClick={() => setFile(null)}
                                                className="mt-2 text-xs text-red-500 hover:underline"
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    ) : (
                                        <label htmlFor="apk-upload" className="cursor-pointer text-center">
                                            <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-2">
                                                <Upload className="w-6 h-6" />
                                            </div>
                                            <p className="font-medium text-gray-700">Cliquez pour choisir un fichier</p>
                                            <p className="text-xs text-gray-500 mt-1">Format .apk uniquement</p>
                                        </label>
                                    )}
                                </div>
                            </div>

                            {file && (
                                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-center text-sm">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 ${steps.upload ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                            {steps.upload && <Check className="w-3 h-3" />}
                                        </div>
                                        <span className={steps.upload ? 'text-gray-800' : 'text-gray-500'}>Upload de l'APK sur Google Drive</span>
                                    </div>
                                    <div className="flex items-center text-sm">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 ${steps.link ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                            {steps.link && <Check className="w-3 h-3" />}
                                        </div>
                                        <span className={steps.link ? 'text-gray-800' : 'text-gray-500'}>Génération du lien partageable</span>
                                        {steps.link && <span className="ml-2 text-xs text-blue-600 overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]">https://drive.google.com/file...</span>}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes de version (changelog)</label>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                                    <textarea
                                        value={changelog}
                                        onChange={(e) => setChangelog(e.target.value)}
                                        className="w-full bg-transparent border-none outline-none text-gray-700 resize-none h-24 text-sm font-mono"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                <div className="flex items-center text-amber-600 bg-amber-50 px-3 py-2 rounded-lg text-sm">
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Tous les professeurs seront notifiés
                                </div>
                                <div className="flex space-x-3">
                                    <Button variant="outline">Annuler</Button>
                                    <Button
                                        onClick={handlePublish}
                                        disabled={!steps.link}
                                        className={!steps.link ? "opacity-50 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}
                                    >
                                        Publier la version {version}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AppVersions;
