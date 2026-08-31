// =========================================================
// Supabase Client Initialization
// =========================================================

const SUPABASE_URL = 'https://apervbqsqxtzbcdiqdjz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwZXJ2YnFzcXh0emJjZGlxZGp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNzMwNzMsImV4cCI6MjA5ODY0OTA3M30.zVh_IiyWRh9lqA-fZvtWNKZgrSBgKneBRS4C2Rw9X4w';

// The CDN declares `var supabase` as a non-configurable global, so
// we cannot re-declare it with const/let. Instead, we create the
// client under a new global name that all other scripts reference.
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
