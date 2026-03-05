# 🎯 Episode URL Hunting Guide

## How to find the right episodes

### The Rest is History (YouTube)
Search: https://www.youtube.com/@TheRestIsHistoryPod/videos

Good episodes to grab for each century:
- **Pre-0 CE**: Search "Alexander the Great", "Julius Caesar", "Cleopatra"
- **1st Century**: Search "Jesus", "Roman Empire", "Nero", "Jerusalem"
- **2nd Century**: Search "Marcus Aurelius", "Hadrian", "Roman Britain"
- **3rd Century**: Search "fall of Rome", "barbarian invasions"
- **4th Century**: Search "Constantine", "Christianity Rome"
- **5th Century**: Search "Attila", "Visigoths", "sack of Rome"
- **6th Century**: Search "Justinian", "Byzantium", "plague"
- **7th Century**: Search "Islam", "Muhammad", "Arab conquests"
- **8th Century**: Search "Charlemagne", "Vikings", "Abbasid"

### Misquoting Jesus / Bart Ehrman (YouTube)
Search: https://www.youtube.com/@BartEhrman/videos
Or: https://www.youtube.com/@MisquotingJesus/videos

Best episodes:
- "Did Jesus Exist"
- "The Original Bible"
- "How the New Testament Was Written"
- "Paul and the Early Church"
- "The Council of Nicaea"
- "Lost Gospels"
- "Who Wrote the Bible"

---

## How to add URLs to the script

Open `extract-transcripts.js` and find the EPISODES array.
Add entries like this:

```javascript
const EPISODES = [
  {
    url: "https://www.youtube.com/watch?v=abc123xyz",
    show: "The Rest is History",
    century: "c4",           // use: prelude, c1, c2 ... c15
    title: "Constantine and the Rise of Christianity"
  },
  {
    url: "https://www.youtube.com/watch?v=def456uvw",
    show: "Misquoting Jesus",
    century: "c1",
    title: "Who Really Wrote the Gospels"
  },
];
```

## Century codes
| Code     | Period              |
|----------|---------------------|
| prelude  | Before 0 CE         |
| c1       | 1st Century CE      |
| c2       | 2nd Century CE      |
| c3       | 3rd Century CE      |
| c4       | 4th Century CE      |
| c5       | 5th Century CE      |
| c6       | 6th Century CE      |
| c7       | 7th Century CE      |
| c8       | 8th Century CE      |
| c9       | 9th Century CE      |
| c10      | 10th Century CE     |
| c11      | 11th Century CE     |
| c12      | 12th Century CE     |
| c13      | 13th Century CE     |
| c14      | 14th Century CE     |
| c15      | 15th Century CE     |
