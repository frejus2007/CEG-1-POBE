import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import { PieChart, FileText, Download, FileSpreadsheet, File as FileIcon, Printer, History, Lock, AlertTriangle } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { useAcademicYear } from '../context/AcademicYearContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { calculateAverages, calculateGeneralAverage, calculateRank } from '../utils/gradeUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reports = () => {
    const { classes, students: allStudents, subjects, coefficients } = useSchool();
    const { isSemester1Locked, isSemester2Locked, activeYear } = useAcademicYear();
    const { showSuccess, showError, showInfo } = useToast();

    const [reportType, setReportType] = useState('individual');
    const [semester, setSemester] = useState('1'); // "1" or "2"
    const [selectedClassId, setSelectedClassId] = useState('');
    const [studentId, setStudentId] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Filter students based on selected class
    // Ensure ID comparison handles string/number mismatch (Select returns string, DB uses int)
    const availableStudents = allStudents.filter(s => s.current_class_id == selectedClassId);

    // Initial Selections
    useEffect(() => {
        if (classes.length > 0 && !selectedClassId) {
            setSelectedClassId(classes[0].id.toString());
        }
    }, [classes]);

    useEffect(() => {
        if (availableStudents.length > 0 && !studentId) {
            setStudentId(availableStudents[0].id);
        } else if (availableStudents.length === 0) {
            setStudentId('');
        }
    }, [availableStudents]);

    // Check Lock Status
    const isLocked = semester === '1' ? isSemester1Locked : isSemester2Locked;

    const handleGenerate = async () => {
        if (!processLockCheck()) return;

        setIsGenerating(true);
        try {
            if (reportType === 'class') {
                await generateClassBulletin();
            } else if (reportType === 'individual') {
                await generateIndividualBulletin();
            } else {
                showInfo("Ce type de rapport n'est pas encore disponible.");
            }
        } catch (err) {
            console.error("Report Generation Error:", err);
            showError("Erreur lors de la génération du bulletin");
        } finally {
            setIsGenerating(false);
        }
    };

    const processLockCheck = () => {
        if (!isLocked) {
            showError(`Le Semestre ${semester} n'est pas encore bouclé. Impossible de générer les bulletins.`);
            return false;
        }
        return true;
    };

    /**
     * Core Data Fetching for Bulletins
     */
    const fetchBulletinData = async (targetClassId, targetStudentIds) => {
        // 1. Fetch Grades (Relational)
        const { data: gradesData, error } = await supabase
            .from('grades')
            .select('*, evaluation:evaluations!inner(*)')
            .in('student_id', targetStudentIds)
            .eq('evaluation.semester', parseInt(semester));

        if (error) throw error;

        // 2. Process Data Per Student
        const studentsData = targetStudentIds.map(sId => {
            const student = allStudents.find(s => s.id === sId);
            const studentGrades = gradesData.filter(g => g.student_id === sId);
            const studentClass = classes.find(c => c.id === targetClassId);

            // Group by Subject
            const processedSubjects = subjects.map(subj => {
                // Filter grades for this subject
                // Note: Evaluation join has subject_id
                const subjGradesList = studentGrades.filter(g => g.evaluation.subject_id === subj.id);

                // Map to structure expected by calculateAverages
                // { interro1: val, devoir1: val ... }
                const gradesMap = {};
                subjGradesList.forEach(g => {
                    const type = g.evaluation.type === 'Interrogation' ? 'interro' : 'devoir';
                    const idx = g.evaluation.type_index;
                    gradesMap[`${type}${idx}`] = g.note;
                });

                // Calculate Averages
                const stats = calculateAverages(gradesMap, studentClass?.name || '', subj.name, coefficients);

                return {
                    subjectId: subj.id,
                    subjectName: subj.name,
                    ...stats // avgInterro, avgSem, coeff, weightedAvg, devoir1, devoir2
                };
            });

            // Calculate General Average
            const mg = calculateGeneralAverage(processedSubjects);

            return {
                studentId: sId,
                firstName: student.prenom,
                lastName: student.nom,
                matricule: student.matricule,
                subjects: processedSubjects,
                mg: parseFloat(mg)
            };
        });

        // 3. Calculate Ranks
        const rankings = calculateRank(studentsData); // { studentId: { rank, total } }

        // Merge Rank into student data
        return studentsData.map(s => ({
            ...s,
            rank: rankings[s.studentId].rank,
            totalStudents: rankings[s.studentId].total
        }));
    };

    const generateClassBulletin = async () => {
        if (!selectedClassId) return;
        const targetIds = availableStudents.map(s => s.id);
        if (targetIds.length === 0) { showError("Aucun élève dans cette classe"); return; }

        const fullData = await fetchBulletinData(selectedClassId, targetIds);

        // Generate PDF
        generatePDF(fullData, `Bulletin_Classe_${classes.find(c => c.id === selectedClassId)?.name}_Sem${semester}`);
        showSuccess("Bulletins de classe générés !");
    };

    const generateIndividualBulletin = async () => {
        if (!studentId) return;
        const fullData = await fetchBulletinData(selectedClassId, [studentId]);

        // Generate PDF
        generatePDF(fullData, `Bulletin_${fullData[0].lastName}_${fullData[0].firstName}_Sem${semester}`);
        showSuccess("Bulletin individuel généré !");
    };

    const generatePDF = (studentsList, fileName) => {
        const doc = new jsPDF();
        const className = classes.find(c => c.id === selectedClassId)?.name || "";

        studentsList.forEach((student, index) => {
            if (index > 0) doc.addPage();

            // Header
            doc.setFontSize(14);
            doc.text("RÉPUBLIQUE DU BÉNIN", 105, 15, { align: "center" });
            doc.setFontSize(10);
            doc.text("MINISTÈRE DES ENSEIGNEMENTS SECONDAIRE, TECHNIQUE ET DE LA FORMATION PROFESSIONNELLE", 105, 20, { align: "center" });
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text("CEG1 POBÈ", 105, 30, { align: "center" });

            // Bulletin Title
            doc.setDrawColor(0);
            doc.setFillColor(230, 230, 230);
            doc.rect(14, 38, 182, 10, "F");
            doc.setFontSize(12);
            doc.text(`BULLETIN DE NOTES - SEMESTRE ${semester} (${activeYear?.name || ""})`, 105, 45, { align: "center" });

            // Student Info Table
            autoTable(doc, {
                startY: 55,
                head: [['Nom et Prénoms', 'Matricule', 'Classe', 'Effectif']],
                body: [[
                    `${student.lastName} ${student.firstName}`,
                    student.matricule,
                    className,
                    student.totalStudents
                ]],
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 2 },
            });

            // Grades Table
            const tableBody = student.subjects.map(subj => [
                subj.subjectName,
                subj.avgInterro,
                subj.devoir1 || '-',
                subj.devoir2 || '-',
                subj.avgSem, // Moyenne Semestrielle (Sur 20)
                subj.coeff,
                subj.weightedAvg, // Points Definitifs (M x Coeff)
                "N/A" // Rang Matiere (TODO if needed) or Appréciation
            ]);

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 5,
                head: [['Matière', 'Moy. Inter.', 'Dev. 1', 'Dev. 2', 'Moy. Sem.', 'Coeff', 'Points', 'Appr.']],
                body: tableBody,
                theme: 'grid',
                headStyles: { fillColor: [66, 133, 244] },
            });

            // Footer / Summary
            const totalPoints = student.subjects.reduce((sum, s) => sum + parseFloat(s.weightedAvg), 0).toFixed(2);
            const totalCoeffs = student.subjects.reduce((sum, s) => sum + s.coeff, 0);

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 5,
                body: [
                    ['Total Points', totalPoints, 'Moyenne Générale', `${student.mg}/20`],
                    ['Total Coefficients', totalCoeffs, 'Rang', `${student.rank} / ${student.totalStudents}`],
                    ['Décision du Conseil', '', 'Signature', '']
                ],
                theme: 'grid',
                columnStyles: {
                    0: { fontStyle: 'bold' },
                    2: { fontStyle: 'bold' }
                }
            });
        });

        doc.save(`${fileName}.pdf`);
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <PieChart className="w-8 h-8 text-blue-600" />
                Bulletins Officiels
            </h1>

            {/* Lock Warning */}
            {!isLocked && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md flex items-start">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-1 mr-3 flex-shrink-0" />
                    <div>
                        <h3 className="text-sm font-medium text-yellow-800">Période en cours</h3>
                        <p className="text-sm text-yellow-700 mt-1">
                            Le semestre {semester} n'est pas encore bouclé.
                            Le téléchargement des bulletins est désactivé jusqu'à la clôture officielle.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h2 className="text-lg font-bold text-gray-800 mb-6 pb-4 border-b border-gray-100 flex items-center">
                        <Printer className="w-5 h-5 mr-2 text-gray-500" />
                        Paramètres d'impression
                    </h2>

                    <div className="space-y-6">
                        {/* Report Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Type de bulletin</label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className={`border rounded-lg p-3 cursor-pointer transition-colors ${reportType === 'individual' ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}>
                                    <input type="radio" name="rtype" className="hidden"
                                        checked={reportType === 'individual'} onChange={() => setReportType('individual')} />
                                    <div className="font-medium">Individuel</div>
                                    <div className="text-xs text-gray-500">Un seul élève</div>
                                </label>
                                <label className={`border rounded-lg p-3 cursor-pointer transition-colors ${reportType === 'class' ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}>
                                    <input type="radio" name="rtype" className="hidden"
                                        checked={reportType === 'class'} onChange={() => setReportType('class')} />
                                    <div className="font-medium">Classe entière</div>
                                    <div className="text-xs text-gray-500">Tous les élèves</div>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Semestre</label>
                                <Select value={semester} onChange={(e) => setSemester(e.target.value)}>
                                    <option value="1">Semestre 1</option>
                                    <option value="2">Semestre 2</option>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
                                <Select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </Select>
                            </div>
                        </div>

                        {reportType === 'individual' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Élève</label>
                                <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                                    {availableStudents.map(s => <option key={s.id} value={s.id}>{s.nom} {s.prenom}</option>)}
                                    {availableStudents.length === 0 && <option value="">Aucun élève</option>}
                                </Select>
                            </div>
                        )}

                        <div className="pt-4">
                            <Button
                                onClick={handleGenerate}
                                disabled={!isLocked || isGenerating}
                                className={`w-full py-3 flex justify-center ${!isLocked ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                            >
                                {isGenerating ? (
                                    <span>Génération en cours...</span>
                                ) : (
                                    <>
                                        {!isLocked ? <Lock className="w-5 h-5 mr-2" /> : <Download className="w-5 h-5 mr-2" />}
                                        {!isLocked ? "Semestre Verrouillé" : "Télécharger les Bulletins"}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* History / Info */}
                <Card>
                    <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                        Information
                    </h2>
                    <div className="text-sm text-gray-600 space-y-2">
                        <p>• Les bulletins ne peuvent être générés que lorsque le semestre est officiellement clôturé par le Censeur.</p>
                        <p>• Le système calcule automatiquement :</p>
                        <ul className="list-disc pl-5">
                            <li>La Moyenne Interrogations (Moyenne des Interros)</li>
                            <li>La Moyenne Semestrielle ((Moy Int + Dev1 + Dev2) / 3)</li>
                            <li>La Moyenne Générale (Pondérée par les coefficients)</li>
                            <li>Le Rang de l'élève</li>
                        </ul>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Reports;
