import React from 'react';
import { Users, GraduationCap, School, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useSchool } from '../context/SchoolContext';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <motion.div variants={item} whileHover={{ y: -5 }} className={`bg-white p-6 rounded-2xl shadow-sm border border-${color}-100 relative overflow-hidden group`}>
        <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 opacity-50`}></div>
        <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-${color}-50 rounded-xl text-${color}-600`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <Badge variant="success" className="flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>{trend}</span>
                    </Badge>
                )}
            </div>
            <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1 font-sans">{value}</p>
        </div>
    </motion.div>
);

const ActivityItem = ({ title, time, type }) => (
    <motion.div variants={item} className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-gray-100">
        <div className={`w-2.5 h-2.5 mt-2 rounded-full flex-shrink-0 ring-4 ring-opacity-20 ${type === 'warning' ? 'bg-orange-400 ring-orange-400' :
            type === 'success' ? 'bg-green-400 ring-green-400' : 'bg-blue-400 ring-blue-400'
            }`}></div>
        <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">{title}</p>
            <p className="text-xs text-gray-500 mt-1 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {time}
            </p>
        </div>
    </motion.div>
);

const Dashboard = () => {
    const { students, teachers, classes } = useSchool();

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            <motion.div variants={item}>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Tableau de bord</h1>
                <p className="text-gray-500 mt-2 text-lg">Bienvenue sur l'espace d'administration du CEG1 Pobè</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Professeurs"
                    value={teachers.length}
                    icon={Users}
                    color="blue"
                    trend="+2 cette semaine"
                />
                <StatCard
                    title="Total Élèves"
                    value={students.length}
                    icon={GraduationCap}
                    color="purple"
                    trend="+15 inscriptions"
                />
                <StatCard
                    title="Classes Actives"
                    value={classes.length}
                    icon={School}
                    color="green"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card title="Activités Récentes" className="h-full">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Activités Récentes</h2>
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline">Voir tout</button>
                    </div>
                    <div className="space-y-1">
                        <ActivityItem
                            title="Nouveau professeur ajouté: M. SOSSOU"
                            time="Il y a 10 min"
                            type="info"
                        />
                        <ActivityItem
                            title="Saisie de notes: 3ème M1 - Mathématiques"
                            time="Il y a 45 min"
                            type="success"
                        />
                        <ActivityItem
                            title="Conseil de classe programmé: 6ème M2"
                            time="Il y a 2h"
                            type="warning"
                        />
                        <ActivityItem
                            title="Mise à jour emploi du temps: Prof. AGBOSSA"
                            time="Il y a 4h"
                            type="info"
                        />
                    </div>
                </Card>

                <Card className="h-full">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Alertes Rapides</h2>
                        <Badge variant="danger">3 Actions requises</Badge>
                    </div>
                    <div className="space-y-4">
                        <motion.div variants={item} className="p-4 bg-orange-50/50 rounded-xl border border-orange-100 flex items-start space-x-3 hover:shadow-sm transition-shadow">
                            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-bold text-orange-800">Bulletin trimestriel manquant</h3>
                                <p className="text-sm text-orange-700 mt-1 leading-relaxed">La classe de 5ème M2 n'a pas encore finalisé les bulletins.</p>
                            </div>
                        </motion.div>
                        <motion.div variants={item} className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start space-x-3 hover:shadow-sm transition-shadow">
                            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-bold text-blue-800">Réunion des professeurs</h3>
                                <p className="text-sm text-blue-700 mt-1 leading-relaxed">Prévue pour le vendredi 10 Février à 16h.</p>
                            </div>
                        </motion.div>
                    </div>
                </Card>
            </div>
        </motion.div>
    );
};

export default Dashboard;
