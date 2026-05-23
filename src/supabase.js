import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xnqdkqosssgzasbdzhzm.supabase.co";
const supabaseKey = "sb_publishable_0BpVns8iwgqSf8qlKb3ZEg_Bgkiufpq";

export const supabase = createClient(supabaseUrl, supabaseKey);