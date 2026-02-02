
import { supabase } from './src/lib/supabase.js';

async function testConnection() {
    console.log('Testing Supabase connection...');

    // Try to fetch academic years, which should be public/readable or at least exist
    const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Connection failed:', error.message);
    } else {
        console.log('Connection successful!');
        console.log('Data retrieved:', data);
    }
}

testConnection();
