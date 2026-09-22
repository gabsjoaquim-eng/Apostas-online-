export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://gabsjoaquim-eng.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt, useSearch } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    const model = "gemini-2.0-flash";

    const tools = useSearch ? [{ googleSearch: {} }] : [];

    const body = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 4000, temperature: 0.7 }
    };
    if (tools.length) body.tools = tools;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await r.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
