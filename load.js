import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://txpdkefctuxefnitisqp.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4cGRrZWZjdHV4ZWZuaXRpc3FwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDU5MzIyNiwiZXhwIjoyMDYwMTY5MjI2fQ.k9up3RcVWP3MQ9Ktm-kTdlkGhIieL3l3l4F2k1MxMtY"
);

const { data, error } = await supabase.from("athlete").select("*");

console.log(data);
