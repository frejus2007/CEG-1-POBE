import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import admin from "npm:firebase-admin@12.0.0"

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Cache the initialized app to reuse across invocations if possible
if (!admin.apps.length) {
    const serviceAccountStr = Deno.env.get('FIREBASE_SERVICE_ACCOUNT')
    if (serviceAccountStr) {
        try {
            const serviceAccount = JSON.parse(serviceAccountStr)
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            })
            console.log("🔥 Firebase Admin Initialized")
        } catch (e) {
            console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT:", e.message)
        }
    } else {
        console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT secret is missing. Push functionality will fail.")
    }
}

serve(async (req) => {
    // Handle CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { record } = await req.json()

        console.log("------------------------------------------");
        console.log("📨 PUSH NOTIFICATION REQUEST (V1)");
        console.log(`To User ID: ${record.receiver_id}`);

        // 1. Initialize Supabase Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 2. Fetch FCM Token
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('fcm_token')
            .eq('id', record.receiver_id)
            .single()

        if (profileError) {
            throw new Error(`Profile fetch error: ${profileError.message}`)
        }

        const fcmToken = profile?.fcm_token

        if (!fcmToken) {
            console.log(`⚠️ No FCM token found for user ${record.receiver_id}. Skipping push.`)
            return new Response(
                JSON.stringify({ success: true, message: "No FCM token, skipped." }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } },
            )
        }

        // 3. Send to FCM via Admin SDK (V1)
        if (!admin.apps.length) {
            throw new Error("Firebase Admin not initialized. Check FIREBASE_SERVICE_ACCOUNT secret.")
        }

        const message = {
            token: fcmToken,
            notification: {
                title: record.title,
                body: record.body,
            },
            data: {
                notification_id: String(record.id || ''),
                type: record.type || 'INFO'
            }
        }

        console.log(`🚀 Sending V1 Push to: ${fcmToken.substring(0, 10)}...`)

        // Send
        const response = await admin.messaging().send(message)
        console.log("✅ FCM V1 Success:", response)

        return new Response(
            JSON.stringify({ success: true, fcmMessageId: response }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    } catch (error) {
        console.error("❌ Error:", error.message)
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    }
})
