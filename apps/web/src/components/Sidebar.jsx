import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSchool } from '../context/SchoolContext';
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    School,
    BookOpen,
    Settings,
    LogOut,
    FileText,
    Archive,
    Bell,
    Smartphone,
    PieChart
} from 'lucide-react';
import clsx from 'clsx';

const Sidebar = () => {
    const navigate = useNavigate();
    const { logout } = useSchool();

    const navItems = [
        { icon: LayoutDashboard, label: 'Tableau de bord', path: '/dashboard' },
        { icon: Users, label: 'Professeurs', path: '/teachers' },
        { icon: GraduationCap, label: 'Élèves', path: '/students' },
        { icon: School, label: 'Classes', path: '/classes' },
        { icon: BookOpen, label: 'Affectations', path: '/assignments' },
        { icon: FileText, label: 'Notes', path: '/grades' },
        { icon: Bell, label: 'Notifications', path: '/notifications' },
        { icon: Smartphone, label: 'App Mobile', path: '/app-versions' },
        { icon: PieChart, label: 'Rapports', path: '/reports' },
        { icon: Archive, label: 'Archives', path: '/archives' },
    ];

    return (
        <aside className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col z-20">
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                        CEG
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-800">CEG1 Pobè</h1>
                        <p className="text-xs text-gray-500">Administration</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            clsx(
                                "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-blue-50 text-blue-600 font-medium shadow-sm"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )
                        }
                    >
                        <item.icon className={clsx("w-5 h-5", ({ isActive }) => isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600")} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-100">
                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        clsx(
                            "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 mb-1",
                            isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"
                        )
                    }
                >
                    <Settings className="w-5 h-5 text-gray-400" />
                    <span>Paramètres</span>
                </NavLink>
                <button
                    onClick={async () => {
                        await logout();
                        navigate('/login');
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Déconnexion</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
