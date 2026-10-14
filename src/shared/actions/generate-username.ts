"use server";

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "", // set in .env.local
});

export async function generateUsername(fullName: string, email: string) {
  const prompt = `Generate a short, reddit style funky, unique username for a person with:
  - Full Name: ${fullName}
  - Email: ${email}
  The username should be lowercase, 8-12 characters, and avoid spaces. just return one username`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content?.trim() || "new_user123";
}
