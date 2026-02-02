import React, { useState, useEffect } from 'react';
import { supabase } from "./lib/supabase";
import { seedDatabase } from "./lib/seedDatabase";

function ConnectionTest() {
    const [status, setStatus] = useState('Checking...');
    const [logs, setLogs] = useState([]);
    const [seeding, setSeeding] = useState(false);
    const [data, setData] = useState(null);

    useEffect(() => {
        async function check() {
            // ... kept simple check
            try {
                const { data } = await supabase.from('academic_years').select('count', { count: 'exact', head: true });
                setStatus('Connected');
            } catch (e) {
                setStatus('Error');
            }
        }
        check();
    }, []);

    const handleSeed = async () => {
        setSeeding(true);
        const result = await seedDatabase();
        setLogs(result.logs);
        setSeeding(false);
    };

    if (status !== 'Connected' && status !== 'Checking...') return null; // Hide if error or don't annoy

    return (
        <div style={{ padding: 20, border: '2px solid blue', margin: 20, background: '#f0f9ff', color: '#000', zIndex: 9999, position: 'relative' }}>
            <h3>Configuration Système</h3>
            <p>Status DB: <strong>{status}</strong></p>
            <button
                onClick={handleSeed}
                disabled={seeding}
                style={{ padding: '8px 16px', background: '#2563eb', color: 'white', borderRadius: 4 }}
            >
                {seeding ? 'Initialisation...' : 'Initialiser les données de test'}
            </button>
            <div style={{ marginTop: 10, maxHeight: 100, overflow: 'auto', fontSize: '0.8em', fontFamily: 'monospace' }}>
                {logs.map((l, i) => <div key={i}>{l}</div>)}
            </div>

            <div style={{ marginTop: 10, fontSize: '0.9em' }}>
                <strong>Compte Censeur :</strong> censeur@ceg1pobe.bj / password123
            </div>
        </div>
    );
}

export default ConnectionTest;
