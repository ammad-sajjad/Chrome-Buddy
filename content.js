(() => {
  if (window.__dpbInjected) return;
  window.__dpbInjected = true;

  if (window.self !== window.top) return;

  const FRAMES = [
    chrome.runtime.getURL("pet1.png"),
    chrome.runtime.getURL("pet2.png"),
    chrome.runtime.getURL("pet3.png"),
  ];
  let currentFrame = 0;

  const STORAGE_KEY = "dpb_state_v1";

  // ===== State =====
  const state = {
    x: 24,
    y: window.innerHeight - 120,
    behavior: "idle",
    facing: 1,
    happy: 80,
    hunger: 30,
    energy: 80,
    lastInteraction: Date.now(),
  };

  // ===== DOM =====
  const root = document.createElement("div");
  root.id = "dpb-pet-root";
  root.innerHTML = `
    <div id="dpb-stats">
      <div class="dpb-stat"><span class="dpb-stat-label">😊 Happy</span><div class="dpb-stat-bar"><div class="dpb-stat-fill dpb-fill-happy" id="dpb-bar-happy"></div></div></div>
      <div class="dpb-stat"><span class="dpb-stat-label">🍖 Hunger</span><div class="dpb-stat-bar"><div class="dpb-stat-fill dpb-fill-hunger" id="dpb-bar-hunger"></div></div></div>
      <div class="dpb-stat"><span class="dpb-stat-label">⚡ Energy</span><div class="dpb-stat-bar"><div class="dpb-stat-fill dpb-fill-energy" id="dpb-bar-energy"></div></div></div>
    </div>
    <div id="dpb-bubble"></div>
    <div id="dpb-zzz">z</div>
    <div id="dpb-pet" role="button" aria-label="Desktop Pet Buddy">
      <img src="${FRAMES[0]}" alt="pet" draggable="false" />
    </div>
  `;

  function mount() {
    if (document.body) document.body.appendChild(root);
    else document.addEventListener("DOMContentLoaded", () => document.body.appendChild(root));
  }
  mount();

  const petImg = root.querySelector("#dpb-pet img");
  const pet    = root.querySelector("#dpb-pet");
  const bubble = root.querySelector("#dpb-bubble");

  // ===== Persistence =====
  try {
    chrome.storage?.local.get([STORAGE_KEY], (res) => {
      const saved = res?.[STORAGE_KEY];
      if (saved) Object.assign(state, saved, { lastInteraction: Date.now() });
      render();
    });
  } catch {}

  let saveTimer;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        chrome.storage?.local.set({
          [STORAGE_KEY]: {
            happy: state.happy,
            hunger: state.hunger,
            energy: state.energy,
          },
        });
      } catch {}
    }, 500);
  }

  // ===== Render =====
  function render() {
    pet.classList.toggle("dpb-flipped",         state.facing === -1);
    pet.classList.toggle("dpb-sleeping",        state.behavior === "sleeping");
    pet.classList.toggle("dpb-excited",         state.behavior === "excited");
    root.classList.toggle("dpb-state-sleeping", state.behavior === "sleeping");

    root.style.left = state.x + "px";
    root.style.top  = state.y + "px";

    const clamp = (v) => Math.max(0, Math.min(100, v));
    state.happy  = clamp(state.happy);
    state.hunger = clamp(state.hunger);
    state.energy = clamp(state.energy);

    document.getElementById("dpb-bar-happy").style.width  = state.happy  + "%";
    document.getElementById("dpb-bar-hunger").style.width = state.hunger + "%";
    document.getElementById("dpb-bar-energy").style.width = state.energy + "%";
  }

  function say(text, duration = 1800) {
    bubble.textContent = text;
    bubble.classList.add("dpb-show");
    clearTimeout(say._t);
    say._t = setTimeout(() => bubble.classList.remove("dpb-show"), duration);
  }

  // ===== Movement (horizontal only, Y stays where dragged) =====
  function walkTo(targetX, speed = 40) {
    return new Promise((resolve) => {
      targetX = Math.max(0, Math.min(window.innerWidth - 96, targetX));
      state.facing   = targetX > state.x ? 1 : -1;
      state.behavior = "walking";
      render();

      const start    = state.x;
      const dist     = targetX - start;
      const duration = (Math.abs(dist) / speed) * 1000;
      const t0       = performance.now();

      function step(t) {
        const p = Math.min(1, (t - t0) / duration);
        state.x = start + dist * p;
        root.style.left = state.x + "px";
        if (p < 1 && state.behavior === "walking") {
          requestAnimationFrame(step);
        } else {
          if (state.behavior === "walking") state.behavior = "idle";
          render();
          resolve();
        }
      }
      requestAnimationFrame(step);
    });
  }

  // ===== Drag — full viewport (top to bottom, left to right) =====
  let isDragging  = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let didDrag     = false; // tells click handler if mouse actually moved

  pet.addEventListener("mousedown", (e) => {
    isDragging  = true;
    didDrag     = false;
    dragOffsetX = e.clientX - state.x;
    dragOffsetY = e.clientY - state.y;
    state.behavior   = "idle";
    pet.style.cursor = "grabbing";
    e.preventDefault();
    e.stopPropagation();
  });

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    state.lastInteraction = Date.now();

    if (!isDragging) return;
    didDrag = true;

    // allow full viewport — 0,0 (top-left) to innerWidth/innerHeight (bottom-right)
    state.x = Math.max(0, Math.min(window.innerWidth  - 96, e.clientX - dragOffsetX));
    state.y = Math.max(0, Math.min(window.innerHeight - 96, e.clientY - dragOffsetY));

    root.style.left = state.x + "px";
    root.style.top  = state.y + "px";
  });

  document.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging       = false;
    pet.style.cursor = "grab";
    if (didDrag) say("Wheee!");
    save();
  });

  // ===== Click — cycle pet1 → pet2 → pet3 → pet1 =====
  pet.addEventListener("click", (e) => {
    e.stopPropagation();
    if (didDrag) return; // ignore if user was dragging

    currentFrame = (currentFrame + 1) % FRAMES.length;
    petImg.src   = FRAMES[currentFrame];

    state.lastInteraction = Date.now();
    state.happy  += 5;
    state.energy -= 2;

    pet.classList.remove("dpb-jumping");
    void pet.offsetWidth;
    pet.classList.add("dpb-jumping");
    setTimeout(() => pet.classList.remove("dpb-jumping"), 600);

    const greetings = ["Yip!", "Hi!", "♥", "Pet me!", "Wag wag!", "Hehe!"];
    say(greetings[Math.floor(Math.random() * greetings.length)]);
    save();
    render();
  });

  // ===== Mouse tracking =====
  let mouseX = 0;
  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    state.lastInteraction = Date.now();
    if (state.behavior === "sleeping" && !isDragging) {
      state.behavior = "idle";
      say("*yawn*");
      render();
    }
  });

  // ===== Behavior loop =====
  setInterval(() => {
    state.hunger += 0.4;
    if (state.hunger > 70) state.happy -= 0.3;
    if (state.behavior === "sleeping") state.energy += 0.8;
    else state.energy -= 0.1;

    const idleTime = Date.now() - state.lastInteraction;

    if (state.energy < 15 && state.behavior !== "sleeping") {
      state.behavior = "sleeping";
      say("Zzz...", 2500);
    } else if (idleTime > 30000 && state.behavior === "idle") {
      state.behavior = "sleeping";
      say("Zzz...", 2000);
    } else if (state.behavior === "sleeping" && state.energy > 90) {
      state.behavior = "idle";
      say("*stretch*");
    }

    save();
    render();
  }, 2000);

  // ===== Random behaviors =====
  setInterval(() => {
    if (state.behavior !== "idle") return;
    const r = Math.random();
    if (r < 0.4) {
      const target = state.x + (Math.random() * 300 - 150);
      walkTo(target);
    } else if (r < 0.55) {
      pet.classList.add("dpb-jumping");
      setTimeout(() => pet.classList.remove("dpb-jumping"), 600);
      say("Boing!");
    } else if (r < 0.7) {
      walkTo(mouseX - 48, 60);
    } else if (r < 0.78) {
      const moods = ["♪ ~ ♪", "*sniff*", "Hi there!", "*tail wag*"];
      say(moods[Math.floor(Math.random() * moods.length)]);
    } else if (r < 0.85) {
      pet.classList.add("dpb-spinning");
      setTimeout(() => pet.classList.remove("dpb-spinning"), 500);
      say("Spin!");
    }
  }, 7000);

  // ===== Resize =====
  window.addEventListener("resize", () => {
    state.x = Math.min(state.x, window.innerWidth  - 96);
    state.y = Math.min(state.y, window.innerHeight - 96);
    render();
  });

  // ===== Popup messages =====
  chrome.runtime.onMessage?.addListener((msg) => {
    if (!msg?.type) return;
    state.lastInteraction = Date.now();
    if (state.behavior === "sleeping" && msg.type !== "sleep") {
      state.behavior = "idle";
    }
    if (msg.type === "feed") {
      state.hunger -= 30;
      state.happy  += 10;
      say("Yum!");
      pet.classList.add("dpb-jumping");
      setTimeout(() => pet.classList.remove("dpb-jumping"), 600);
    } else if (msg.type === "play") {
      if (state.energy < 20) {
        say("Too tired...");
      } else {
        state.happy  += 20;
        state.energy -= 15;
        state.behavior = "excited";
        say("Yay!");
        setTimeout(() => { state.behavior = "idle"; render(); }, 2500);
      }
    } else if (msg.type === "pet") {
      state.happy += 8;
      say("♥ ♥ ♥");
    } else if (msg.type === "sleep") {
      state.behavior = "sleeping";
      say("Goodnight...");
    }
    save();
    render();
  });

  render();
})();
