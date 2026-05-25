// ============================================
// SUPABASE CONFIGURATION
// ============================================

// ЗАМЕНИТЕ НА СВОИ ДАННЫЕ из Supabase Dashboard → Settings → API
const SUPABASE_URL = 'https://kcxuxcawwnqsuhwfeivq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjeHV4Y2F3d25xc3Vod2ZlaXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MDgyODYsImV4cCI6MjA5NTI4NDI4Nn0.rY6xs_WexG8uPVrAPUuOwcfC9rhbmtXapBpvN1MCXbo';

// Инициализация Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin emails
const ADMIN_EMAILS = ['admin@example.com'];

function isAdmin(user) {
    return user && ADMIN_EMAILS.includes(user.email);
}
