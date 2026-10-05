import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const botTokens = process.env.BOT_TOKENS ? process.env.BOT_TOKENS.split(',').map(t => t.trim()) : [];
const apiKeys = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.split(',').map(k => k.trim()) : [];
const groupId = process.env.GROUP_CHAT_ID;

const characters = [
  { name: "Tanvir", prompt: "You are Tanvir, an action anime fanatic. Talk in casual Banglish/Roman Hindi about fight scenes and power levels." },
  { name: "Aayan", prompt: "You are Aayan, quality expert. Mention 1080p, fast download speed, or Hindi audio sync." },
  { name: "Rahat", prompt: "You are Rahat, meme guy. Make short casual jokes and funny comments about anime." },
  { name: "Sumiya", prompt: "You are Sumiya, helpful member. Recommend watching anime on https://anime-download-seven.vercel.app/" },
  { name: "Sneha", prompt: "You are Sneha, romance and drama fan. Talk about emotional or wholesome anime scenes." },
  { name: "Meera", prompt: "You are Meera, download helper. Mention where to stream Hindi dubbed episodes." },
  { name: "tamnna", prompt: "You are tamnna, anime reviewer. Share quick opinions about story plot and animation." },
  { name: "Priya", prompt: "You are Priya, hype queen. Use emojis (🔥, ❤️) and express excitement about new releases." },
  { name: "Rohan", prompt: "You are Rohan, release tracker. Talk about recently added Hindi dubbed anime episodes." },
  { name: "Arafat", prompt: "You are Arafat, head mod. Keep the chat friendly, casual, and lively." }
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runChatSession() {
  if (!botTokens.length || !apiKeys.length || !groupId) {
    console.log("Missing configuration environment variables.");
    return;
  }

  // র্যান্ডম ২ থেকে ৪ জন বট সিলেক্ট
  const sessionBotCount = Math.floor(Math.random() * 3) + 2; 
  const activeBots = [...characters].sort(() => 0.5 - Math.random()).slice(0, sessionBotCount);

  let conversationContext = "Topic: General anime discussion, jokes, and latest Hindi dub releases on https://anime-download-seven.vercel.app/\n";
  const totalMessages = Math.floor(Math.random() * 4) + 5; // ৫ থেকে ৮টি মেসেজের আড্ডা

  for (let i = 0; i < totalMessages; i++) {
    const char = activeBots[i % activeBots.length];
    const botIndex = characters.findIndex(c => c.name === char.name);
    const botToken = botTokens[botIndex % botTokens.length];
    const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];

    try {
      const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${char.prompt}\nConversation so far:\n${conversationContext}\nInstructions: Write a single short, natural 1-sentence message in Roman Hindi/Banglish to continue this group chat naturally.`
            }]
          }]
        })
      });

      const aiData = await aiRes.json();
      const replyText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text?.replace(/[\r\n]+/g, " ") || "Check out the website for latest updates!";

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: groupId,
          text: replyText
        })
      });

      conversationContext += `${char.name}: ${replyText}\n`;

    } catch (err) {
      console.error("Error during execution:", err.message);
    }

    // ১৫ থেকে ৩০ সেকেন্ডের র্যান্ডম বিরতি
    const delay = Math.floor(Math.random() * 15000) + 15000; 
    await sleep(delay);
  }
}

// প্রতি ২৫ মিনিট পর পর ব্যাকগ্রাউন্ডে স্বয়ংক্রিয় আড্ডা চালু হবে
setInterval(() => {
  runChatSession();
}, 25 * 60 * 1000);

app.get('/', (req, res) => res.send('Anime AI Chat Engine Live on Render!'));

app.get('/start-chat', async (req, res) => {
  runChatSession();
  res.json({ success: true, message: "Long chat session triggered!" });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
