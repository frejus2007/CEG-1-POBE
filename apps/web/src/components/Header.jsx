import React from 'react';
import { Bell, Search } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';

const Header = () => {
    const { notifications } = useSchool();

    // Count unread notifications (assuming all are unread or just total for now)
    // ideally we would filter by !n.is_read
    const unreadCount = notifications.length;

    return (
        <header className="h-16 bg-white border-b border-gray-200 fixed top-0 right-0 left-64 z-10 flex items-center justify-between px-6 backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 dark:border-gray-700 transition-colors duration-300">
            <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 w-96 dark:bg-gray-700 transition-colors duration-300">
                <Search className="w-5 h-5 text-gray-400 mr-2" />
                <input
                    type="text"
                    placeholder="Rechercher (ex: Nom prof, classe...)"
                    className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-500"
                />
            </div>

            <div className="flex items-center space-x-4">
                <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                </button>

                <div className="flex items-center space-x-3 border-l border-gray-200 pl-4">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Directeur / Censeur</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Administrateur</p>
                    </div>
                    <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-sm">
                        <img
                            src="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff"
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
