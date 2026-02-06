import React from 'react';
import Card from './ui/Card';
import { Users, BookOpen, User, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import Badge from './ui/Badge';

const ClassCard = ({
    id,
    className,
    studentCount,
    students, // For Classes page
    mainTeacher,
    subjects,
    onClick,
    onEdit,
    onDelete
}) => {
    // Handle student count from either prop
    const count = studentCount !== undefined ? studentCount : (students?.length || 0);

    return (
        <Card
            className={`group hover:border-blue-200 ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">{className}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Users className="w-4 h-4 mr-1.5" />
                        {count} Élèves
                    </div>
                </div>
                {(onEdit || onDelete) && (
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onEdit && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit({ id, name: className, mainTeacher, subjects }); }}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(id); }}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {mainTeacher ? (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs mr-3">
                        {mainTeacher.nom?.[0]}{mainTeacher.prenom?.[0]}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-xs text-gray-500 font-medium uppercase">Prof. Principal</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">
                            {mainTeacher.nom} {mainTeacher.prenom}
                        </p>
                    </div>
                </div>
            ) : mainTeacher === undefined && !onClick ? (
                <div className="flex items-center p-3 bg-red-50 rounded-lg mb-3 border border-red-100 text-red-600">
                    <User className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Pas de PP assigné</span>
                </div>
            ) : null}

            {subjects && subjects.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                    {subjects.slice(0, 3).map((sub, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                            {sub.name}
                        </Badge>
                    ))}
                    {subjects.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                            +{subjects.length - 3}
                        </Badge>
                    )}
                </div>
            )}
        </Card>
    );
};

export default ClassCard;
