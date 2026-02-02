import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const DebugData = () => {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const check = async () => {
            // 1. Check User
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || 'No User');

            // 2. Fetch Profiles RAW
            const { data: profiles, error: err } = await supabase
                .from('profiles')
                .select('*'); // NO FILTERS

            if (err) setError(err);
            setData(profiles);
        };
        check();
    }, []);

    if (process.env.NODE_ENV === 'production') return null;

    return (
        <div className="fixed bottom-4 right-4 bg-black text-green-400 p-4 rounded-lg shadow-xl z-50 max-w-lg max-h-96 overflow-auto text-xs font-mono border-2 border-green-500">
            <h3 className="font-bold border-b border-green-500 mb-2">DEBUG DATABASE</h3>
            <div>User: {user?.id || 'None'}</div>
            {error && <div className="text-red-500">ERROR: {error.message}</div>}
            <div>Profiles Found: {data?.length ?? 0}</div>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
};

export default DebugData;
