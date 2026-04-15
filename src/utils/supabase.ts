
// Extend ImportMetaEnv and ImportMeta for TypeScript
interface ImportMetaEnv {
	VITE_SUPABASE_URL: string;
	VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY: string;
}

declare global {
	interface ImportMeta {
		readonly env: ImportMetaEnv;
	}
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase
        