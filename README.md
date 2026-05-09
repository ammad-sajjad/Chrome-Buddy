# 🐾 Desktop Pet Buddy

A cute floating pet companion that lives at the bottom of every webpage. Drag it around, click it, feed it, and watch it roam — your browser will never feel lonely again.

---

## ✨ Features

- **Lives on every page** — your pet follows you across the entire web
- **Draggable** — pick it up and drop it anywhere on the screen
- **Click to interact** — cycles through pet sprites and triggers a little jump
- **Behavior system** — the pet wanders, jumps, spins, and chases your cursor on its own
- **Stat tracking** — Happiness, Hunger, and Energy update in real time (hover to reveal)
- **Speech bubbles** — the pet reacts with fun little messages
- **Sleep mode** — if left alone long enough (or low on energy), it dozes off with floating Zzz's
- **Popup controls** — Feed 🍖, Play 🎾, Pet ✋, or put it to Sleep 😴 from the extension popup
- **Persistent state** — stats are saved via `chrome.storage` and restored when you return

---

## 📂 Project Structure

```
desktop-pet-buddy/
├── manifest.json      # Extension manifest (Manifest V3)
├── content.js         # Main pet logic injected into every page
├── pet.css            # Styles and CSS animations for the pet
├── popup.html         # Extension popup UI
├── popup.js           # Popup button → content script messaging
├── icon.png           # Extension icon
├── pet1.png           # Pet sprite frame 1
├── pet2.png           # Pet sprite frame 2
└── pet3.png           # Pet sprite frame 3
```

---

## 🚀 Installation (Load Unpacked)

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top right).
4. Click **Load unpacked** and select the `desktop-pet-buddy` folder.
5. Visit any webpage — your pet will appear! 🎉

---

## 🎮 How to Interact

| Action | How |
|---|---|
| **Click** | Cycles sprite & makes the pet jump |
| **Drag** | Move the pet anywhere on the page |
| **Hover** | Reveals the Happy / Hunger / Energy stat bars |
| **Feed** | Open the popup → click 🍖 Feed |
| **Play** | Open the popup → click 🎾 Play |
| **Pet** | Open the popup → click ✋ Pet |
| **Sleep** | Open the popup → click 😴 Sleep |

---

## ⚙️ How It Works

The extension uses a **Manifest V3** content script (`content.js`) that injects the pet's DOM into every webpage at `document_idle`. The pet's state (happiness, hunger, energy, position) is managed in memory and persisted to `chrome.storage.local` so stats survive across page loads.

**Behavior loop** — runs every 2 seconds:
- Hunger slowly increases over time
- High hunger gradually drains happiness
- Sleep restores energy; activity drains it
- The pet falls asleep if energy drops below 15, or if idle for 30+ seconds

**Random behaviors** — fire every 7 seconds when idle:
- Walk to a random position (40% chance)
- Jump and say "Boing!" (15% chance)
- Walk toward the cursor (15% chance)
- Say a random mood message (8% chance)
- Spin (7% chance)

**Popup messaging** — the popup sends commands via `chrome.tabs.sendMessage`, and the content script's `chrome.runtime.onMessage` listener updates state accordingly.

---

## 🛠️ Customization

- **Swap sprites** — replace `pet1.png`, `pet2.png`, `pet3.png` with your own 96×96 images.
- **Adjust stats** — tweak the decay/gain values at the top of `content.js` (e.g. `state.hunger += 0.4` per tick).
- **Change speed** — the default walk speed is `40px/s`; pass a different value to `walkTo(target, speed)`.
- **Add behaviors** — extend the random behavior `setInterval` block in `content.js`.

---

## ✨ Preview
<img width="651" height="245" alt="image" src="https://github.com/user-attachments/assets/51ad3527-4af5-4570-9c1a-da02a1e476af" />
<img width="647" height="232" alt="image" src="https://github.com/user-attachments/assets/88beb54b-6cea-42b2-a9d3-1d9c74bb55af" />
<img width="637" height="247" alt="image" src="https://github.com/user-attachments/assets/21d1d9de-86a4-40ba-889c-34c11a462f58" />



## 🔒 Permissions

| Permission | Reason |
|---|---|
| `storage` | Save and restore pet stats across page loads |
| `activeTab` | Send messages from the popup to the current tab |

---

## 📜 License

MIT — do whatever you like with it. If you make something cool, feel free to share!
