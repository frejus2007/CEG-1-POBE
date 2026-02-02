import React, { useState } from 'react';
import { Mail, Lock, LogIn, AlertCircle, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSchool } from '../context/SchoolContext';
import { motion } from 'framer-motion';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, user } = useSchool();
    const [error, setError] = useState('');

    React.useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError('Identifiants incorrects. Veuillez réessayer.');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Card */}
                <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-10 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                        >
                            <GraduationCap className="w-10 h-10 text-blue-600" />
                        </motion.div>
                        <h1 className="text-3xl font-bold text-white mb-2">CEG1 Pobè</h1>
                        <p className="text-blue-100 text-sm">Système de Gestion des Notes</p>
                    </div>

                    {/* Form */}
                    <div className="p-8">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connexion</h2>
                            <p className="text-gray-500 text-sm">Accédez à votre espace d'administration</p>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3"
                            >
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-red-800">{error}</p>
                                </div>
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Adresse email
                                </label>
                                <div className="relative">
                                    <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="censeur@ceg1pobe.bj"
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400"
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Mot de passe
                                </label>
                                <div className="relative">
                                    <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900"
                                        required
                                        autoComplete="current-password"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>Se connecter</span>
                                        <LogIn className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <p className="text-center text-xs text-gray-500">
                                © 2026 CEG1 Pobè - Tous droits réservés
                            </p>
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl"
                >
                    <p className="text-sm text-blue-800 text-center">
                        <span className="font-semibold">Besoin d'aide ?</span> Contactez l'administrateur système
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Login;
