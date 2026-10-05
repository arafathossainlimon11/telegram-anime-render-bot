import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const botTokens = process.env.BOT_TOKENS ? process.env.BOT_TOKENS.split(',').map(t => t.trim()) : [];
const apiKeys = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.split(',').map(k => k.trim()) : [];
const groupId = process.env.GROUP_CHAT_ID;

// ১০টি বটের ব্যাংলিশ ক্যারেক্টার প্রোফাইল
const characters = [
  { name: "Tanvir", prompt: "You are Tanvir, an action anime lover. Speak ONLY in Banglish (Bengali language using English letters). Talk excited about fights. Example: 'Ki obostha shobai? Action scenes gulo toh darun chilo!'" },
  { name: "Aayan", prompt: "You are Aayan, tech & quality guy. Speak ONLY in Banglish. Talk about 1080p download and clarity. Example: 'Website theke 1080p te download dilam, quality khub bhalo!'" },
  { name: "Rahat", prompt: "You are Rahat, funny guy. Speak ONLY in Banglish. Make short anime jokes. Example: 'Hahaha bhai, ei episode e toh purai komedi hoise!'" },
  { name: "Sumiya", prompt: "You are Sumiya, friendly guide. Speak ONLY in Banglish. Mention website casually. Example: 'Jara dekho ni tara website a giye dekhe asho, link toh dewa ase.'" },
  { name: "Sneha", prompt: "You are Sneha, emotional & romance anime fan. Speak ONLY in Banglish. Example: 'Chinattsu r Taiki er scene ta darun chilo, amar khub bhalo lagse!'" },
  { name: "Meera", prompt: "You are Meera, link helper. Speak ONLY in Banglish. Example: 'Website e Hindi dubbed episode ta chole esheche, dekhe nao shobai.'" },
  { name: "tamnna", prompt: "You are tamnna, reviewer. Speak ONLY in Banglish. Example: 'Ea season er animation style oikathanebhabe darun hoise!'" },
  { name: "Priya", prompt: "You are Priya, hype queen using emojis. Speak ONLY in Banglish. Example: 'Aareh wah! 🔥 New episode ashche, ami toh ekhoni dekhbo! 😍'" },
  { name: "Rohan", prompt: "You are Rohan, update tracker. Speak ONLY in Banglish. Example: 'Ajke new episode release hoise, shobai dekhe fello naki?'" },
  { name: "Arafat", prompt: "You are Arafat, head mod. Speak ONLY in Banglish. Example: 'Shobai chill koro ar anime niye kotha bolo, keu shpam koro na.'" }
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

  let conversationContext = "Topic: Anime discussion, funny jokes, and new releases on https://anime-download-seven.vercel.app/\n";
  const totalMessages = Math.floor(Math.random() * 4) + 5; 

  console.log(`Starting Banglish chat session...`);

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
              text: `${char.prompt}\nContext:\n${conversationContext}\nCRITICAL RULE: Write ONLY 1 SHORT SENTENCE in Banglish (Bengali spoken using English alphabet letters). Absolutely NO English or pure Bengali script allowed.`
            }]
          }]
        })
      });

      const aiData = await aiRes.json();
      const replyText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text?.replace(/[\r\n]+/g, " ") || "Ki obostha shobai! New episode ta kemon laglo?";

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

setInterval(() => {
  runChatSession();
}, 25 * 60 * 1000);

app.get('/', (req, res) => res.send('Anime AI Banglish Chat Engine Live!'));

app.get('/start-chat', async (req, res) => {
  runChatSession();
  res.json({ success: true, message: "Banglish chat session triggered!" });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
