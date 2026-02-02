import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Create Supabase Client with Service Role Key (Admin)
        // The browser passes the Anon Key, but we need Admin rights to create users.
        // We expect SUPABASE_SERVICE_ROLE_KEY to be set in the Function Secrets.
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SERVICE_ROLE_KEY') ?? ''
        )

        // 2. Parse Request Body
        const { email, password, userData } = await req.json()

        if (!email || !password) {
            throw new Error('Email and Password are required')
        }

        // 3. Create Auth User
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Auto-confirm for admin-created users
            user_metadata: {
                full_name: `${userData.nom} ${userData.prenom}`
            }
        })

        if (authError) throw authError

        const userId = authData.user.id

        // 4. Create Profile Record
        // We explicitly insert into 'profiles' using the new User ID
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: userId,
                full_name: `${userData.nom} ${userData.prenom}`,
                email: email,
                phone: userData.phone,
                specialty_subject_id: userData.subjectId, // Expecting ID here
                role: 'TEACHER'
            })

        if (profileError) {
            // Rollback: Delete the user if profile creation fails (optional but good practice)
            await supabaseAdmin.auth.admin.deleteUser(userId)
            throw profileError
        }

        return new Response(
            JSON.stringify({ success: true, user: authData.user }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    }
})
