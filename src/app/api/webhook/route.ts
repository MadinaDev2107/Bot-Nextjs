import { NextRequest, NextResponse } from "next/server";
import { Markup, Telegraf } from "telegraf";
import { supabase } from "../supabaseClient";

const bot = new Telegraf(process.env.BOT_TOKEN!);

// Studentlar holatini saqlovchi
const userStates = new Map<string, { step: string; data: any }>();

// Start
bot.start((ctx) => {
  ctx.reply(
    `Assalomu aleykum ${ctx.from.first_name}, xush kelibsiz!`,
    Markup.keyboard([
      ["Add student", "All students"],
      ["Delete student", "Update student"],
    ]).resize()
  );
});

// Add student
bot.hears("Add student", (ctx) => {
  userStates.set(String(ctx.from.id), { step: "awaiting_name", data: {} });
  ctx.reply("Iltimos, student ismini kiriting:");
});

// All students
bot.hears("All students", async (ctx) => {
  const { data, error } = await supabase.from("users").select("*");

  if (error || !data || data.length === 0) {
    return ctx.reply("Studentlar topilmadi.");
  }

  const buttons = [];
  for (let i = 0; i < data.length; i += 2) {
    const row = [];
    row.push({ text: data[i].name, callback_data: `view_${data[i].id}` });
    if (data[i + 1]) {
      row.push({
        text: data[i + 1].name,
        callback_data: `view_${data[i + 1].id}`,
      });
    }
    buttons.push(row);
  }

  ctx.reply("Studentlar ro'yxati:", {
    reply_markup: { inline_keyboard: buttons },
  });
});

// View
bot.action(/^view_\d+$/, async (ctx) => {
  const id = ctx.callbackQuery.data.split("_")[1];
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return ctx.reply("❌ Student topilmadi.");

  const info = `👤 Ism: ${data.name}\n📧 Email: ${
    data.email || "-"
  }\n📞 Telefon: ${data.phone || "-"}`;
});

// Delete student
bot.hears("Delete student", async (ctx) => {
  const { data, error } = await supabase.from("users").select("*");
  if (error || !data || data.length === 0)
    return ctx.reply("Studentlar topilmadi.");

  const buttons = data.map((user) => [
    {
      text: user.name,
      callback_data: `del_${user.id}`,
    },
  ]);

  ctx.reply("Qaysi studentni o'chirmoqchisiz?", {
    reply_markup: { inline_keyboard: buttons },
  });
});

bot.action(/^del_\d+$/, async (ctx) => {
  const id = ctx.callbackQuery.data.split("_")[1];
  await supabase.from("users").delete().eq("id", id);
  ctx.reply("✅ Student o‘chirildi.");
});

// Update student
bot.hears("Update student", async (ctx) => {
  const { data, error } = await supabase.from("users").select("*");
  if (error || !data || data.length === 0)
    return ctx.reply("Studentlar topilmadi.");

  const buttons = data.map((user) => [
    {
      text: user.name,
      callback_data: `upd_${user.id}`,
    },
  ]);

  ctx.reply("Qaysi studentni tahrirlamoqchisiz?", {
    reply_markup: { inline_keyboard: buttons },
  });
});

bot.action(/^upd_\d+$/, async (ctx) => {
  const id = ctx.callbackQuery.data.split("_")[1];
  userStates.set(String(ctx.from.id), { step: "edit_name", data: { id } });
  ctx.reply("✏️ Yangi ismini kiriting:");
});

// Text handler for Add and Edit
bot.on("text", async (ctx) => {
  const userId = String(ctx.from.id);
  const state = userStates.get(userId);
  const message = ctx.message.text;

  if (!state) return;

  if (state.step === "awaiting_name") {
    state.data.name = message;
    state.step = "awaiting_age";
    return ctx.reply("Ageini kiriting:");
  }

  if (state.step === "awaiting_age") {
    state.data.age = message;
    state.step = "awaiting_email";
    return ctx.reply("Emailini kiriting:");
  }
  if (state.step === "awaiting_email") {
    state.data.email = message;
    state.step = "awaiting_phone";
    return ctx.reply("Telefon raqamini kiriting:");
  }

  if (state.step === "awaiting_phone") {
    state.data.phone = message;
    await supabase.from("users").insert([state.data]);
    userStates.delete(userId);
    return ctx.reply("✅ Student muvaffaqiyatli qo‘shildi.");
  }

  if (state.step === "edit_name") {
    state.data.name = message;
    state.step = "edit_age";
    return ctx.reply("✏️ Yangi ageini kiriting:");
  }

  if (state.step === "edit_age") {
    state.data.age = message;
    state.step = "edit_email";
    return ctx.reply("✏️ Yangi emailini  raqamini kiriting:");
  }
  if (state.step === "edit_email") {
    state.data.email = message;
    state.step = "edit_phone";
    return ctx.reply("✏️ Yangi telefon raqamini kiriting:");
  }

  if (state.step === "edit_phone") {
    state.data.phone = message;
    await supabase
      .from("users")
      .update({
        name: state.data.name,
        age: state.data.age,
        email: state.data.email,
        phone: state.data.phone,
      })
      .eq("id", state.data.id);
    userStates.delete(userId);
    return ctx.reply("✅ Student ma'lumotlari yangilandi.");
  }
});

// Webhook
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await bot.handleUpdate(body);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
