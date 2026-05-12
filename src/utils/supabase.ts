import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vpytaqvrahrjalhwfnaq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_bfA0L9nnQCtMsXc_6wt03Q_2uqUZngB';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
