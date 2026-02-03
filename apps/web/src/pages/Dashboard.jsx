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
    const { students, teachers, classes, notifications } = useSchool();

    // Map real notifications to activities
    const activities = notifications.length > 0 ? notifications.map(n => ({
        id: n.id,
        title: n.title,
        time: new Date(n.created_at).toLocaleString('fr-FR', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        }),
        type: n.type?.toLowerCase() || 'info'
    })) : [];

    // Derive alerts from data (e.g. classes without main teacher)
    const alerts = [];
    classes.forEach(c => {
        if (!c.mainTeacher || c.mainTeacher === 'Non assigné') {
            alerts.push({
                id: `pp-${c.id}`,
                title: `Professeur Principal manquant`,
                desc: `La classe ${c.name} n'a pas encore de PP assigné.`,
                variant: 'warning'
            });
        }
    });

    // Check for pending teacher approvals
    const pendingTeachers = teachers.filter(t => !t.is_approved);
    if (pendingTeachers.length > 0) {
        alerts.push({
            id: 'pending-teachers',
            title: `${pendingTeachers.length} Profil(s) en attente`,
            desc: `Des nouveaux professeurs attendent votre validation.`,
            variant: 'info'
        });
    }

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
                />
                <StatCard
                    title="Total Élèves"
                    value={students.length}
                    icon={GraduationCap}
                    color="purple"
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
                        {activities.length > 0 ? activities.map(act => (
                            <ActivityItem
                                key={act.id}
                                title={act.title}
                                time={act.time}
                                type={act.type}
                            />
                        )) : (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                Aucune activité récente
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="h-full">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Alertes Rapides</h2>
                        {alerts.length > 0 && <Badge variant="danger">{alerts.length} Action{alerts.length > 1 ? 's' : ''} requise{alerts.length > 1 ? 's' : ''}</Badge>}
                    </div>
                    <div className="space-y-4">
                        {alerts.length > 0 ? alerts.map(alert => (
                            <motion.div key={alert.id} variants={item} className={`p-4 ${alert.variant === 'warning' ? 'bg-orange-50/50 border-orange-100' : 'bg-blue-50/50 border-blue-100'} rounded-xl border flex items-start space-x-3 hover:shadow-sm transition-shadow`}>
                                <AlertCircle className={`w-5 h-5 ${alert.variant === 'warning' ? 'text-orange-500' : 'text-blue-500'} flex-shrink-0 mt-0.5`} />
                                <div>
                                    <h3 className={`text-sm font-bold ${alert.variant === 'warning' ? 'text-orange-800' : 'text-blue-800'}`}>{alert.title}</h3>
                                    <p className={`text-sm ${alert.variant === 'warning' ? 'text-orange-700' : 'text-blue-700'} mt-1 leading-relaxed`}>{alert.desc}</p>
                                </div>
                            </motion.div>
                        )) : (
                            <div className="text-center py-8 text-green-500 text-sm font-medium">
                                ✨ Tout est à jour !
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </motion.div>
    );
};

export default Dashboard;
