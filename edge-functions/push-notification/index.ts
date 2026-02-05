import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import admin from "npm:firebase-admin@^12.0.0";

const serviceAccountStr = Deno.env.get("FIREBASE_SERVICE_ACCOUNT") ?? "{}";
const serviceAccount = JSON.parse(serviceAccountStr);

if (Object.keys(serviceAccount).length > 0) {
    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
} else {
    console.error("FIREBASE_SERVICE_ACCOUNT is empty or invalid.");
}

serve(async (req) => {
    try {
        if (!Deno.env.get("FIREBASE_SERVICE_ACCOUNT")) {
            console.error("Missing FIREBASE_SERVICE_ACCOUNT secret");
            return new Response(JSON.stringify({ error: "Configuration missing" }), { status: 500 });
        }

        const payload = await req.json()
        const { record } = payload

        if (!record) {
            return new Response("No record found in payload", { status: 400 });
        }

        if (!record.receiver_id) {
            console.log("No receiver_id, skipping push.");
            return new Response("No receiver_id", { status: 200 });
        }

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const { data: profile } = await supabase
            .from('profiles')
            .select('fcm_token')
            .eq('id', record.receiver_id)
            .single();

        if (!profile?.fcm_token) {
            console.log(`No FCM token for user ${record.receiver_id}`);
            return new Response("User has no device token", { status: 200 });
        }

        const message = {
            notification: {
                title: record.title,
                body: record.content,
            },
            token: profile.fcm_token,
        };

        const response = await admin.messaging().send(message);
        console.log("Successfully sent message:", response);

        return new Response(JSON.stringify({ success: true, response }), {
            headers: { "Content-Type": "application/json" },
        })

    } catch (error: any) {
        console.error("Error:", error?.message || error);
        return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        })
    }
})
