import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const orderSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(20),
  email: z.string().trim().email().max(120).optional().or(z.literal("")),
  tests: z.array(z.string().trim().min(1).max(120)).min(1).max(30),
  date: z.string().trim().min(1).max(20),
  time: z.string().trim().max(20).optional(),
  pickup: z.boolean().optional(),
  anonymous: z.boolean().optional(),
  address: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(500).optional(),
});

// Public: website visitors place lab test orders that land in the staff dashboard as Pending forms.
export const submitOnlineLabOrder = createServerFn({ method: "POST" })
  .inputValidator((d) => orderSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const year = new Date().getFullYear();
    const notes = [
      "Online website order",
      `Preferred: ${data.date}${data.time ? ` ${data.time}` : ""}`,
      data.pickup ? `Home pickup${data.address ? `: ${data.address}` : ""}` : null,
      data.anonymous ? "Anonymous drop-off requested" : null,
      data.notes ? `Notes: ${data.notes}` : null,
    ].filter(Boolean).join("\n");

    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: last } = await supabaseAdmin
        .from("test_forms").select("serial").like("serial", `GM-${year}-%`)
        .order("serial", { ascending: false }).limit(1);
      const m = last?.[0]?.serial.match(/GM-\d{4}-(\d+)/);
      const serial = `GM-${year}-${String((m ? parseInt(m[1], 10) : 0) + 1 + attempt).padStart(5, "0")}`;
      const { error } = await supabaseAdmin.from("test_forms").insert({
        serial,
        patient_name: data.name,
        phone: data.phone,
        email: data.email || null,
        referred_by: "Website Order",
        nature_of_specimen: "Pending Collection",
        examination_required: data.tests.join(", "),
        tests_requested: data.tests,
        clinical_notes: notes,
        status: "Pending",
      });
      if (!error) return { serial };
      if (error.code !== "23505") {
        console.error("online order insert failed", error.message);
        throw new Error("Could not place your order. Please try again.");
      }
    }
    throw new Error("Could not place your order. Please try again.");
  });
