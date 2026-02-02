import React from 'react';
import { useAcademicYear } from '../context/AcademicYearContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { downloadCSV, generateArchiveData } from '../utils/exportUtils';
import { Archive, FileDown, Eye, ArrowLeft, Search } from 'lucide-react';

const Archives = () => {
    const { availableYears, selectedYear, academicYear, changeYear, isArchiveView } = useAcademicYear();
    const [searchQuery, setSearchQuery] = React.useState('');

    const handleViewYear = (year) => {
        changeYear(year);
    };

    const handleExportYear = (year) => {
        const data = generateArchiveData(year);
        downloadCSV(data, `Export_CEG1_Pobe_${year}.csv`);
    };

    const handleResetToCurrent = () => {
        changeYear(academicYear);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Archive className="h-6 w-6" />
                    Archives Académiques
                </h1>
                {isArchiveView && (
                    <Button onClick={handleResetToCurrent} variant="secondary" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Retour à l'année en cours ({academicYear})
                    </Button>
                )}
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Rechercher une année scolaire..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
            </div>

            {isArchiveView && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <Eye className="h-5 w-5 text-amber-500" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-amber-700">
                                Vous consultez actuellement les archives de l'année <strong>{selectedYear}</strong>.
                                <br />Modification impossible (Lecture Seule).
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableYears.filter(y => !searchQuery || y.includes(searchQuery)).map((year) => (
                    <Card key={year} className={`relative overflow-hidden transition-all hover:shadow-lg ${selectedYear === year ? 'ring-2 ring-blue-500' : ''}`}>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">{year}</h3>
                                {year === academicYear ? (
                                    <Badge variant="success">En cours</Badge>
                                ) : (
                                    <Badge variant="secondary">Clôturé</Badge>
                                )}
                            </div>

                            <p className="text-gray-500 text-sm mb-6">
                                {year === academicYear
                                    ? "Données actives et modifiables."
                                    : "Données archivées en lecture seule."}
                            </p>

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => handleViewYear(year)}
                                    variant={selectedYear === year ? "primary" : "secondary"}
                                    className="flex-1 flex items-center justify-center gap-2"
                                    disabled={selectedYear === year}
                                >
                                    <Eye className="h-4 w-4" />
                                    {selectedYear === year ? 'Consulté' : 'Consulter'}
                                </Button>
                                <Button
                                    onClick={() => handleExportYear(year)}
                                    variant="secondary"
                                    className="flex items-center justify-center gap-2"
                                    title="Exporter les données"
                                >
                                    <FileDown className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default Archives;
