export class AuthService {
    constructor(config) {
        this.supabaseUrl = config.supabaseUrl;
        this.supabaseKey = config.supabaseKey;
        this.googleClientId = config.googleClientId;
        this.supabase = null;
        this.currentUser = null;
        this.accessToken = null; // Google Access Token
    }

    // --- SUPABASE HELPERS ---
    getSupabaseClient() {
        if (this.supabase) return this.supabase;

        // Access safely using bracket notation to avoid any lexical scope collision
        const globalSupabase = window['supabase'];

        if (globalSupabase) {
            try {
                this.supabase = globalSupabase.createClient(this.supabaseUrl, this.supabaseKey);
            } catch (err) {
                console.error("Failed to create Supabase client:", err);
            }
        } else {
            console.error("Supabase library not found on window object.");
        }
        return this.supabase;
    }

    async fetchFacilitators() {
        try {
            const client = this.getSupabaseClient();
            if (!client) return [];
            const { data } = await client.from("facilitators").select("nama, perusahaan").order("nama");
            return data || [];
        } catch (e) {
            console.warn("Supabase Error:", e);
            return [];
        }
    }

    async fetchUsers() {
        try {
            const client = this.getSupabaseClient();
            if (!client) return [];
            const { data } = await client.from("users").select("*").order("username");
            return data || [];
        } catch (e) {
            console.warn("Supabase Error:", e);
            return [];
        }
    }

    async login(username, password) {
        const client = this.getSupabaseClient();
        if (!client) throw new Error("Koneksi Supabase gagal.");

        // DEBUG: Check what is in the DB
        console.log(`[AUTH] Checking user: ${username}`);

        const { data: debugData } = await client.from("users").select("username, password").ilike("username", username).maybeSingle();
        if (debugData) {
            console.log(`[AUTH] DB Pass: '${debugData.password}'`);
            console.log(`[AUTH] Input Pass: '${password}'`);
        } else {
            console.log(`[AUTH] User not found.`);
        }

        const { data, error } = await client
            .from("users")
            .select("*")
            .ilike("username", username)
            .eq("password", password)
            .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error("Username atau password tidak sesuai data sistem.");

        this.currentUser = data;
        return data;
    }

    async sendResetLink(input) {
        // Since we are simulating strict validation first by fetching *all* users?
        // Or better, query the DB to see if user exists.
        const client = this.getSupabaseClient();
        if (!client) throw new Error("Koneksi Supabase gagal.");

        // Check if user exists with this email OR phone
        // .or(`email.eq.${input},phone_number.eq.${input}`) can be tricky with ilike/contains logic.
        // Simple approach: fetch users who match either.

        // Note: Supabase 'or' query syntax: .or('id.eq.20,id.eq.21')
        // We want: email ILIKE input OR phone_number ILIKE input
        // But ilike in OR string is tricky in JS client V2.

        // Let's iterate: fetch single matching email? fetch single matching phone?
        // Actually, just fetching *all* users to check (like original) is inefficient but acceptable for small DB.
        // Better: let's query.

        const { data, error } = await client
            .from("users")
            .select("email, phone_number")
            .or(`email.ilike.${input},phone_number.ilike.%${input}%`) // fuzzy phone?
            .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
            // Found
            return true;
        } else {
            // Not found
            // Fallback: check exact phone match if above query failed due to syntax
            const { data: phoneData } = await client.from("users").select("id").eq("phone_number", input).limit(1);
            if (phoneData && phoneData.length > 0) return true;

            throw new Error("Data tidak ditemukan dalam sistem kami.");
        }
    }

    // --- GOOGLE AUTH ---
    initGoogleAuth(scope, callback) {
        if (window.google) {
            try {
                return google.accounts.oauth2.initTokenClient({
                    client_id: this.googleClientId,
                    scope: scope,
                    callback: (tokenResponse) => {
                        if (tokenResponse && tokenResponse.access_token) {
                            this.accessToken = tokenResponse.access_token;
                            if (callback) callback(this.accessToken);
                        }
                    },
                });
            } catch (e) {
                console.error("GSI Error:", e);
                return null;
            }
        } else {
            console.error("GSI script not loaded");
            return null;
        }
    }

    getAccessToken() {
        return this.accessToken;
    }

    getCurrentUser() {
        return this.currentUser;
    }
}
