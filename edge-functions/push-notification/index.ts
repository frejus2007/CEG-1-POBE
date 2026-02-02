
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Types pour le payload FCM v1
interface FcmMessage {
    message: {
        notification: {
            title: string;
            body: string;
        };
        topic?: string;
        token?: string;
    };
}

serve(async (req) => {
    try {
        const payload = await req.json()
        const { record } = payload // La nouvelle ligne insérée dans 'notifications'

        if (!record) {
            return new Response("No record found in payload", { status: 400 });
        }

        console.log("Processing notification:", record.title);

        // 1. Préparer le message pour Firebase
        const message: FcmMessage = {
            message: {
                notification: {
                    title: record.title,
                    body: record.content,
                },
                // Logique de ciblage : Si target_role est 'ALL', on vise un topic global
                // Sinon, on pourrait viser un topic spécifique 'teachers', etc.
                topic: "all_teachers",
            }
        };

        // 2. Appel à l'API Firebase (v1) via Google Auth
        // Note : Pour simplifier l'auth Google dans Deno, on suppose ici que
        // vous utilisez un Service Account. L'obtention du Bearer Token peut être complexe
        // en pur Deno sans librairie externe lourde.
        // Une alternative courante est d'utiliser la REST API avec la clé serveur (Legacy)
        // ou d'utiliser une librairie `npm:google-auth-library` via esm.sh.

        // Pour cet exemple, nous utilisons la méthode décrite par le développeur
        // en supposant que FIREBASE_ACCESS_TOKEN est géré/rafraîchi ailleurs ou est une clé serveur valide.

        const projectId = Deno.env.get("FIREBASE_PROJECT_ID");
        const accessToken = Deno.env.get("FIREBASE_ACCESS_TOKEN");

        if (!projectId || !accessToken) {
            throw new Error("Missing Firebase configuration");
        }

        const res = await fetch(
            `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
                body: JSON.stringify(message),
            }
        )

        const responseText = await res.text();
        console.log("Firebase response:", responseText);

        return new Response(responseText, {
            headers: { "Content-Type": "application/json" },
        })

    } catch (error) {
        console.error("Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        })
    }
})
