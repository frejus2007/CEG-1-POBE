import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { normalizeString } from '../../utils/searchUtils';

const SearchableSelect = ({
    options,
    value,
    onChange,
    placeholder = "Sélectionner...",
    labelKey = "label",
    valueKey = "value",
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => String(opt[valueKey]) === String(value));

    const filteredOptions = options.filter(opt => {
        if (!searchTerm) return true;
        const label = opt[labelKey] || "";
        return normalizeString(label).includes(normalizeString(searchTerm));
    });

    const handleSelect = (option) => {
        onChange(option[valueKey]);
        setIsOpen(false);
        setSearchTerm('');
    };

    const clearSelection = (e) => {
        e.stopPropagation();
        onChange('');
    };

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            {/* Trigger Button */}
            <div
                className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={`block truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-700'}`}>
                    {selectedOption ? selectedOption[labelKey] : placeholder}
                </span>

                <div className="flex items-center gap-1">
                    {selectedOption && (
                        <div
                            role="button"
                            onClick={clearSelection}
                            className="p-0.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </div>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 flex flex-col animate-in fade-in zoom-in-95 duration-100 origin-top">
                    <div className="p-2 border-b border-gray-100 sticky top-0 bg-white rounded-t-lg">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Rechercher..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1 p-1 custom-scrollbar">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <div
                                    key={opt[valueKey]}
                                    className={`px-3 py-2 text-sm rounded cursor-pointer transition-colors ${String(opt[valueKey]) === String(value) ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}
                                    onClick={() => handleSelect(opt)}
                                >
                                    {opt[labelKey]}
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-center text-xs text-gray-500 italic">
                                Aucun résultat trouvé
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
