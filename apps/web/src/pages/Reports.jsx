import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import { PieChart, FileText, Download, FileSpreadsheet, File as FileIcon, Printer, History } from 'lucide-react';

const Reports = () => {
    const [reportType, setReportType] = useState('individual');
    const [trimester, setTrimester] = useState('1');
    const [selectedClass, setSelectedClass] = useState('6emeA');
    const [student, setStudent] = useState('adjobi');
    const [formats, setFormats] = useState({
        pdf: true,
        excel: true,
        csv: false
    });

    const handleGenerate = () => {
        // Mock generation logic
        alert("Rapport généré avec succès !");
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <PieChart className="w-8 h-8 text-blue-600" />
                Génération de Rapports
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="h-fit">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 pb-4 border-b border-gray-100 flex items-center">
                        <Printer className="w-5 h-5 mr-2 text-gray-500" />
                        Nouveau Rapport
                    </h2>

                    <div className="space-y-6">
                        {/* Type de rapport */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Type de rapport</h3>
                            <div className="space-y-2">
                                <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all">
                                    <input
                                        type="radio"
                                        name="reportType"
                                        checked={reportType === 'individual'}
                                        onChange={() => setReportType('individual')}
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div className="flex-1">
                                        <span className="font-medium text-gray-800 block">Bulletin individuel</span>
                                        <span className="text-xs text-gray-500">Relevé de notes détaillé pour un élève</span>
                                    </div>
                                </label>
                                <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all">
                                    <input
                                        type="radio"
                                        name="reportType"
                                        checked={reportType === 'class'}
                                        onChange={() => setReportType('class')}
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div className="flex-1">
                                        <span className="font-medium text-gray-800 block">Bulletin de classe</span>
                                        <span className="text-xs text-gray-500">Récapitulatif des moyennes de toute la classe</span>
                                    </div>
                                </label>
                                <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all">
                                    <input
                                        type="radio"
                                        name="reportType"
                                        checked={reportType === 'stats'}
                                        onChange={() => setReportType('stats')}
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div className="flex-1">
                                        <span className="font-medium text-gray-800 block">Statistiques générales</span>
                                        <span className="text-xs text-gray-500">Taux de réussite, moyennes par matière...</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Paramètres */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Trimestre</label>
                                <Select value={trimester} onChange={(e) => setTrimester(e.target.value)}>
                                    <option value="1">1er Trimestre</option>
                                    <option value="2">2ème Trimestre</option>
                                    <option value="3">3ème Trimestre</option>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
                                <Select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                                    <option value="6emeA">6ème A</option>
                                    <option value="6emeB">6ème B</option>
                                    <option value="5emeA">5ème A</option>
                                </Select>
                            </div>
                            {reportType === 'individual' && (
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Élève</label>
                                    <Select value={student} onChange={(e) => setStudent(e.target.value)}>
                                        <option value="adjobi">ADJOBI Jean</option>
                                        <option value="sossou">SOSSOU Pierre</option>
                                        <option value="tossou">TOSSOU Alice</option>
                                    </Select>
                                </div>
                            )}
                        </div>

                        {/* Format de sortie */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Format de sortie</h3>
                            <div className="flex gap-4">
                                <label className={`flex items-center space-x-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${formats.pdf ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                                    <input
                                        type="checkbox"
                                        checked={formats.pdf}
                                        onChange={(e) => setFormats({ ...formats, pdf: e.target.checked })}
                                        className="rounded text-red-600 focus:ring-red-500"
                                    />
                                    <FileIcon className="w-4 h-4" />
                                    <span>PDF</span>
                                </label>
                                <label className={`flex items-center space-x-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${formats.excel ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                                    <input
                                        type="checkbox"
                                        checked={formats.excel}
                                        onChange={(e) => setFormats({ ...formats, excel: e.target.checked })}
                                        className="rounded text-green-600 focus:ring-green-500"
                                    />
                                    <FileSpreadsheet className="w-4 h-4" />
                                    <span>Excel</span>
                                </label>
                                <label className={`flex items-center space-x-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${formats.csv ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                                    <input
                                        type="checkbox"
                                        checked={formats.csv}
                                        onChange={(e) => setFormats({ ...formats, csv: e.target.checked })}
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <FileText className="w-4 h-4" />
                                    <span>CSV</span>
                                </label>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <Button onClick={handleGenerate} className="w-full bg-blue-600 hover:bg-blue-700 text-white flex justify-center py-3">
                                <Download className="w-5 h-5 mr-2" />
                                Générer le rapport
                            </Button>
                        </div>
                    </div>
                </Card>

                <div className="space-y-6">
                    <Card className="h-full">
                        <h2 className="text-lg font-bold text-gray-800 mb-6 pb-4 border-b border-gray-100 flex items-center">
                            <History className="w-5 h-5 mr-2 text-gray-500" />
                            Derniers rapports générés
                        </h2>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group cursor-pointer">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                                        <FileIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">Bulletin_6emeA_Trimestre1.pdf</p>
                                        <p className="text-xs text-gray-500">01/02/2026 • 2.4 MB</p>
                                    </div>
                                </div>
                                <Button variant="ghost" className="opacity-0 group-hover:opacity-100 p-2">
                                    <Download className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group cursor-pointer">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                                        <FileSpreadsheet className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">Stats_Generales_T1.xlsx</p>
                                        <p className="text-xs text-gray-500">30/01/2026 • 45 KB</p>
                                    </div>
                                </div>
                                <Button variant="ghost" className="opacity-0 group-hover:opacity-100 p-2">
                                    <Download className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group cursor-pointer">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                                        <FileIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">Liste_Profs_Principaux.pdf</p>
                                        <p className="text-xs text-gray-500">28/01/2026 • 1.2 MB</p>
                                    </div>
                                </div>
                                <Button variant="ghost" className="opacity-0 group-hover:opacity-100 p-2">
                                    <Download className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Reports;
