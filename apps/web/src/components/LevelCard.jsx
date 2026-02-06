import React from 'react';
import Card from './ui/Card';
import { Users, GraduationCap, ChevronRight } from 'lucide-react';

const LevelCard = ({ level, studentCount, classCount, onClick }) => {
    return (
        <Card
            className="cursor-pointer group hover:border-blue-200"
            onClick={onClick}
            noPadding
        >
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                        <GraduationCap className="w-6 h-6" />
                    </div>
                    <div className="bg-gray-50 p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                    </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1">{level}</h3>

                <div className="space-y-1">
                    {studentCount !== undefined && (
                        <div className="flex items-center text-sm text-gray-500">
                            <Users className="w-4 h-4 mr-2" />
                            {studentCount} Élèves
                        </div>
                    )}
                    {classCount !== undefined && (
                        <div className="flex items-center text-sm text-gray-500">
                            <GraduationCap className="w-4 h-4 mr-2" />
                            {classCount} Classes
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
                <p className="text-xs font-medium text-blue-600 group-hover:translate-x-1 transition-transform inline-flex items-center">
                    Voir les détails
                </p>
            </div>
        </Card>
    );
};

export default LevelCard;
