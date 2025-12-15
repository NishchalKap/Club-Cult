import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logFile = path.resolve(__dirname, 'verification_output.txt');

// Initialize log file
fs.writeFileSync(logFile, 'Starting verify_concurrency_and_realtime.js\n');

function log(msg) {
    console.log(msg);
    try {
        fs.appendFileSync(logFile, msg + '\n');
    } catch (e) { console.error("Log failed to write"); }
}

function logError(msg) {
    console.error(msg);
    let str = msg;
    if (typeof msg === 'object') str = JSON.stringify(msg, null, 2);
    try {
        fs.appendFileSync(logFile, '[ERROR] ' + str + '\n');
    } catch (e) { }
}

// Hardcoded for verification reliability
const SUPABASE_URL = "https://smnsvbpxkggphitzosyn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbnN2YnB4a2dncGhpdHpvc3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NTAyMTUsImV4cCI6MjA3ODMyNjIxNX0.v_eIVzluNNIFOI9pf4UVKKwCCcVx15Gs5zYRtmkdPBg";

log(`Config loaded: URL=${SUPABASE_URL}`);

if (!SUPABASE_URL || !SUPABASE_KEY) {
    logError('Missing credentials');
    process.exit(1);
}

// Connectivity check
log(`Checking connectivity to ${SUPABASE_URL}...`);
try {
    // We can't await at top level easily without IIFE or module support. Package.json says type: module, so top level await is OK.
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, { method: 'HEAD', headers: { apikey: SUPABASE_KEY } });
    log(`Connectivity check status: ${res.status} ${res.statusText}`);
} catch (e) {
    logError(`Connectivity check FAILED: ${e.message}`);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
});

async function verifyConcurrency() {
    log('Starting concurrency verification...');

    // 1. Create a test user
    const email = `stress_test_${Date.now()}@example.com`;
    const password = 'password123';

    log(`Creating test user: ${email}`);
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (authError) {
        logError('Error creating user:');
        logError(authError);
        return;
    }

    const userId = authData.user?.id;
    if (!userId) {
        log("User created but no ID returned?!");
    }

    let session = authData.session;
    if (!session) {
        log("No session returned (confirm email?), attempting SignIn...");
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (signInError) {
            logError("Could not sign in: " + signInError.message);
        } else {
            session = signInData.session;
        }
    }

    // 2. Create a test event
    const eventId = `test-event-${Date.now()}`;
    log(`Creating test event: ${eventId}`);

    // Insert event
    const { error: eventError } = await supabase.from('events').insert({
        id: eventId,
        title: 'Concurrency Test Event',
        description: 'Testing concurrency',
        banner_url: 'https://example.com/image.jpg',
        venue: 'Test Venue',
        event_starts: new Date().toISOString(),
        event_ends: new Date(Date.now() + 86400000).toISOString(),
        price: 0,
        is_paid: false,
        capacity: 100,
        registration_closes: new Date(Date.now() + 86400000).toISOString(),
        registered_count: 0
    }).select();

    if (eventError) {
        logError('Error creating event: ' + eventError.message);
        log("Attempting with found club...");

        const { data: clubs } = await supabase.from('clubs').select('id').limit(1);
        if (clubs && clubs.length > 0) {
            const clubId = clubs[0].id;
            const { error: eventRetryError } = await supabase.from('events').insert({
                id: eventId,
                title: 'Concurrency Test Event',
                description: 'Testing concurrency',
                banner_url: 'https://example.com/image.jpg',
                venue: 'Test Venue',
                event_starts: new Date().toISOString(),
                event_ends: new Date(Date.now() + 86400000).toISOString(),
                price: 0,
                is_paid: false,
                capacity: 100,
                registration_closes: new Date(Date.now() + 86400000).toISOString(),
                registered_count: 0,
                club_id: clubId
            });
            if (eventRetryError) {
                logError("Failed to create event: " + eventRetryError.message);
                return;
            }
        } else {
            logError("No clubs found or query failed.");
            return;
        }
    }

    // 3. Simulate concurrent registrations
    const CONCURRENT_REQUESTS = 5;
    log(`Simulating ${CONCURRENT_REQUESTS} concurrent registrations...`);

    const registerUser = async (i) => {
        const uEmail = `stress_test_${Date.now()}_${i}@example.com`;
        const { data: uAuth, error: uErr } = await supabase.auth.signUp({ email: uEmail, password: 'password123' });

        const uId = uAuth.user?.id;
        if (!uId) {
            return { success: false, error: "No user id (" + (uErr?.message || "unknown") + ")" };
        }

        const ticketId = `TKT-${Date.now()}-${i}`;

        const { error: regError } = await supabase.from('event_registrations').insert({
            event_id: eventId,
            user_id: uId,
            ticket_id: ticketId,
            name: uEmail,
            email: uEmail,
            phone: "1234567890",
            payment_status: "completed"
        });

        if (regError) return { success: false, error: regError.message };
        return { success: true };
    };

    const promises = [];
    for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
        promises.push(registerUser(i));
    }

    const results = await Promise.all(promises);
    const successes = results.filter(r => r.success).length;
    log(`Registrations attempted: ${CONCURRENT_REQUESTS}, successful: ${successes}`);

    if (successes === 0) {
        log("No successful registrations. check errors: " + results.find(r => !r.success)?.error);
    }

    // 4. Verify count
    await new Promise(r => setTimeout(r, 2000)); // Wait 2s for trigger

    const { data: eventData, error: fetchError } = await supabase
        .from('events')
        .select('registered_count')
        .eq('id', eventId)
        .single();

    if (fetchError) {
        logError(fetchError);
    } else {
        log(`Event registered_count: ${eventData.registered_count}`);
        if (eventData.registered_count === successes) {
            log("✅ VERIFICATION SUCCESS: Count matches successful registrations.");
        } else {
            logError(`❌ VERIFICATION FAILED: Count ${eventData.registered_count} != Successes ${successes}`);
        }
    }

    // 5. Cleanup
    log("Cleaning up event...");
    await supabase.from('events').delete().eq('id', eventId);
}

verifyConcurrency()
    .catch(err => {
        logError(err);
    })
    .finally(() => process.exit(0));
