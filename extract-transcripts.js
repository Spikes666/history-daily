/**
 * ================================================
 * ECHOES OF HISTORY — YouTube Transcript Extractor
 * ================================================
 *
 * SETUP (one-time, ~2 minutes):
 *   npm install yt-dlp-exec @anthropic-ai/sdk fs-extra
 *
 * Also install yt-dlp binary:
 *   Mac:     brew install yt-dlp
 *   Windows: winget install yt-dlp
 *   Linux:   pip install yt-dlp
 *
 * USAGE:
 *   node extract-transcripts.js
 *
 * OUTPUT:
 *   - Raw transcripts saved to ./transcripts/
 *   - Extracted facts saved to ./extracted-facts.json
 *   - Ready-to-paste JSX card data printed to console
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

// ============================================================
// 🎯 ADD YOUR EPISODE URLs HERE
// Paste any YouTube URLs from:
//   - The Rest is History (podcast channel)
//   - Misquoting Jesus with Bart Ehrman
// ============================================================

const EPISODES = [
  // --- THE REST IS HISTORY ---
  // Add URLs like:
  // { url: "https://www.youtube.com/watch?v=XXXXXXXXXXX", show: "The Rest is History", century: "c1" },

  // EXAMPLES (replace with real episode URLs you find):
  { url: "https://www.youtube.com/watch?v=Co0cAzf46m0", show: "The Rest is History", century: "c1", title: "The Fall of the Roman Republic" },
  { url: "https://www.youtube.com/watch?v=4-6wkMv27Ts", show: "The Rest is History", century: "c4", title: "Justinian: Making Rome Great Again" },


  // --- MISQUOTING JESUS / BART EHRMAN ---
  // { url: "https://www.youtube.com/watch?v=XXXXXXXXXXX", show: "Misquoting Jesus", century: "c1" },
];

// ============================================================
// CENTURY LABELS (for context when extracting facts)
// ============================================================

const CENTURY_LABELS = {
  prelude: "Before 0 CE — Ancient Middle East",
  c1:  "1st Century CE — Rome, Jesus & The Early Church",
  c2:  "2nd Century CE — Imperial Rome at Its Height",
  c3:  "3rd Century CE — Crisis, Chaos & Transformation",
  c4:  "4th Century CE — Constantine & Christianity's Triumph",
  c5:  "5th Century CE — The Fall of Rome",
  c6:  "6th Century CE — Justinian, Plague & the Birth of Islam",
  c7:  "7th Century CE — The Rise of Islam",
  c8:  "8th Century CE — Charlemagne & the Abbasid Golden Age",
  c9:  "9th Century CE — Vikings, Feudalism & the Fragmentation of Empire",
  c10: "10th Century CE — The Ottoman Predecessors & Medieval Consolidation",
  c11: "11th Century CE — The Crusades Begin",
  c12: "12th Century CE — Saladin, Richard & the Medieval World",
  c13: "13th Century CE — Mongols, Magna Carta & Gothic Cathedrals",
  c14: "14th Century CE — The Black Death & the Hundred Years War",
  c15: "15th Century CE — The Renaissance & Age of Exploration",
};

// ============================================================
// STEP 1: DOWNLOAD CAPTIONS WITH yt-dlp
// ============================================================

function downloadTranscript(episode) {
  const outputDir = './transcripts';
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  const safeTitle = episode.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const outputPath = path.join(outputDir, `${safeTitle}.txt`);

  // Skip if already downloaded
  if (fs.existsSync(outputPath)) {
    console.log(`  ✓ Already downloaded: ${episode.title}`);
    return fs.readFileSync(outputPath, 'utf8');
  }

  console.log(`  ⬇️  Downloading captions: ${episode.title}`);

  try {
    // Download auto-generated subtitles as VTT, then convert to plain text
    const tmpPath = path.join(outputDir, safeTitle);

    execSync(
      `yt-dlp --skip-download --write-auto-sub --sub-format vtt --sub-lang en -o "${tmpPath}" "${episode.url}"`,
      { stdio: 'pipe' }
    );

    // Find the downloaded VTT file
    const vttFile = fs.readdirSync(outputDir).find(f => f.startsWith(safeTitle) && f.endsWith('.vtt'));
    if (!vttFile) throw new Error('No VTT file found');

    const vttContent = fs.readFileSync(path.join(outputDir, vttFile), 'utf8');
    const plainText = vttToPlainText(vttContent);

    fs.writeFileSync(outputPath, plainText);
    fs.unlinkSync(path.join(outputDir, vttFile)); // Clean up VTT

    console.log(`  ✅ Saved: ${outputPath} (${plainText.length} chars)`);
    return plainText;

  } catch (err) {
    console.error(`  ❌ Failed to download ${episode.title}:`, err.message);
    return null;
  }
}

// Convert VTT subtitle format to clean plain text
function vttToPlainText(vtt) {
  return vtt
    .split('\n')
    .filter(line => {
      // Remove VTT headers, timestamps, and blank lines
      if (line.startsWith('WEBVTT')) return false;
      if (line.match(/^\d{2}:\d{2}:\d{2}/)) return false;
      if (line.match(/^[\d]+$/)) return false;
      if (line.trim() === '') return false;
      return true;
    })
    .map(line => line.replace(/<[^>]+>/g, '').trim()) // Strip HTML tags
    .filter((line, i, arr) => line !== arr[i - 1]) // Remove duplicate consecutive lines
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================
// STEP 2: EXTRACT FACTS WITH CLAUDE AI
// ============================================================

async function extractFacts(transcript, episode) {
  const client = new Anthropic();
  const centuryLabel = CENTURY_LABELS[episode.century] || episode.century;

  console.log(`  🤖 Extracting facts from: ${episode.title}`);

  const prompt = `You are building an educational history flashcard app. 

I have a transcript from the podcast episode "${episode.title}" from "${episode.show}".

The episode relates to this historical period: ${centuryLabel}

Extract exactly 5 of the most interesting, educational, and specific historical facts from this transcript. Focus on:
- Specific dates, names, places, and events
- Surprising or counterintuitive facts
- Facts that are well-explained in the transcript
- Direct insights from the host/guest (Tom Holland, Dominic Sandbrook, Bart Ehrman, etc.)

Return ONLY a JSON array with this exact structure, no other text:
[
  {
    "title": "Short memorable title (4-7 words)",
    "fact": "The educational fact in 2-3 sentences. Be specific and interesting.",
    "source": "${episode.show}"
  }
]

TRANSCRIPT:
${transcript.slice(0, 12000)}`; // Claude can handle ~12k chars comfortably

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text.trim();
    const clean = text.replace(/```json|```/g, '').trim();
    const facts = JSON.parse(clean);

    console.log(`  ✅ Extracted ${facts.length} facts`);
    return facts;

  } catch (err) {
    console.error(`  ❌ Extraction failed:`, err.message);
    return [];
  }
}

// ============================================================
// STEP 3: FORMAT AS JSX FOR THE FLASHCARD APP
// ============================================================

function formatAsJSX(allResults) {
  console.log('\n\n' + '='.repeat(60));
  console.log('📋 COPY-PASTE THIS INTO history-flashcards.jsx');
  console.log('='.repeat(60));
  console.log('Add these cards to the appropriate century in HISTORY_DATA:\n');

  // Group by century
  const byCentury = {};
  allResults.forEach(({ episode, facts }) => {
    if (!byCentury[episode.century]) byCentury[episode.century] = [];
    byCentury[episode.century].push(...facts);
  });

  Object.entries(byCentury).forEach(([century, facts]) => {
    console.log(`\n// ─── ${CENTURY_LABELS[century] || century} ───`);
    facts.forEach(f => {
      console.log(`      { title: ${JSON.stringify(f.title)}, fact: ${JSON.stringify(f.fact)}, source: ${JSON.stringify(f.source)} },`);
    });
  });

  console.log('\n' + '='.repeat(60));
}

// ============================================================
// MAIN RUNNER
// ============================================================

async function main() {
  console.log('🏛️  ECHOES OF HISTORY — Transcript Extractor');
  console.log('─'.repeat(50));

  const realEpisodes = EPISODES.filter(e => !e.url.includes('PLACEHOLDER'));

  if (realEpisodes.length === 0) {
    console.log('\n⚠️  No real YouTube URLs found in EPISODES array.');
    console.log('\nTo get started:');
    console.log('1. Open extract-transcripts.js');
    console.log('2. Find the EPISODES array near the top');
    console.log('3. Add YouTube URLs from The Rest is History or Misquoting Jesus');
    console.log('4. Run again: node extract-transcripts.js');
    console.log('\nExample entry:');
    console.log('  { url: "https://www.youtube.com/watch?v=abc123", show: "The Rest is History", century: "c4", title: "Constantine and Christianity" },');
    return;
  }

  const allResults = [];

  for (const episode of realEpisodes) {
    console.log(`\n📼 Processing: ${episode.title}`);

    const transcript = downloadTranscript(episode);
    if (!transcript) continue;

    const facts = await extractFacts(transcript, episode);
    if (facts.length > 0) {
      allResults.push({ episode, facts });
    }
  }

  // Save extracted facts to JSON
  fs.writeFileSync('./extracted-facts.json', JSON.stringify(allResults, null, 2));
  console.log(`\n💾 Saved all facts to extracted-facts.json`);

  // Print JSX-ready output
  formatAsJSX(allResults);

  console.log('\n✅ Done! Paste the output above into history-flashcards.jsx');
}

main().catch(console.error);
