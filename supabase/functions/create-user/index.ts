import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    // 1. Gérer le CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // CORRECTION IMPORTANTE: On utilise npm: pour plus de stabilité si esm.sh flanche
        const supabaseUrl = 'https://lnyqpzsrcmcmkngbcyqn.supabase.co'
        const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxueXFwenNyY21jbWtuZ2JjeXFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk0MjM5MywiZXhwIjoyMDg1NTE4MzkzfQ.bP6V_97hBHyhgl-aCF2bVvk_QOvLphSrvW3pN2bGtNI'

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        // 2. Lire le body (avec gestion cas vide)
        let body
        try {
            body = await req.json()
        } catch (e) {
            throw new Error("Body invalide ou vide")
        }

        const { email, password, userData } = body

        if (!email || !password) throw new Error('Email et mot de passe requis')

        console.log("Creating user:", email)

        // 3. Créer l'utilisateur (Auth)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: { full_name: `${userData.nom} ${userData.prenom}` }
        })

        if (authError) {
            console.error("Auth Error:", authError)
            throw authError
        }

        const userId = authData.user.id

        // 4. Créer ou Mettre à jour le profil (car le Trigger peut l'avoir déjà créé)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                full_name: `${userData.nom} ${userData.prenom}`,
                email: email,
                phone: userData.phone,
                specialty_subject_id: userData.subjectId,
                role: 'TEACHER',
                is_approved: true // Censeur creates it, so it's approved by default
            })

        if (profileError) {
            console.error("Profile Error:", profileError)
            // Rollback
            await supabaseAdmin.auth.admin.deleteUser(userId)
            throw profileError
        }

        return new Response(
            JSON.stringify({ success: true, user: authData.user }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error("Global Error:", error)
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 } // On renvoie 200 pour que le client lise l'erreur JSON
        )
    }
})