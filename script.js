const CONFIG = {
  name: "คุณเน",
  oldAge: 22,
  newAge: 23,
  birthDate: "2003-09-27T00:00:00"
};

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const scenes = $$(".scene");

try {
  localStorage.removeItem("birthdayWish");
} catch (e) {}

let wish = "";
let audioCtx, analyser, micStream, micRAF;
let storyBlob = null;


/* =========================================================
   BASIC SETUP
========================================================= */

$$("[data-name]").forEach(el => {
  el.textContent = CONFIG.name;
});

if ($("#ageOld")) {
  $("#ageOld").textContent = CONFIG.oldAge;
}

if ($("#closeAge")) {
  $("#closeAge").textContent = CONFIG.newAge;
}

if ($("#shareLink")) {
  $("#shareLink").value = location.href.split("#")[0];
}


/* =========================================================
   SCENE SYSTEM
========================================================= */

const NIGHT_IDS = new Set([
  "countdown",
  "cake",
  "lifetime",
  "star"
]);

function go(id) {
  const target = $("#" + id);

  if (!target) {
    console.warn("Scene not found:", id);
    return;
  }

  const current = $(".scene.active");
  const currentId = current?.id;

  const fromNight = NIGHT_IDS.has(currentId);
  const toNight = NIGHT_IDS.has(id);

  if (toNight) {
    document.body.classList.add("night-mode");
  }

  if (
    fromNight &&
    toNight &&
    current &&
    current !== target
  ) {
    current.classList.add("leaving");
    target.classList.add("active");

    target.scrollTop = 0;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        current.classList.remove("active", "leaving");
      });
    });

    document.body.style.overflow = "hidden";

  } else {
    scenes.forEach(scene => {
      scene.classList.remove("active", "leaving");
    });

    target.classList.add("active");
    target.scrollTop = 0;

    document.body.style.overflow =
      id === "memories"
        ? "auto"
        : "hidden";

    if (!toNight) {
      document.body.classList.remove("night-mode");
    }
  }
}


/* =========================================================
   TOAST
========================================================= */

function toast(text) {
  const el = $("#toast");

  if (!el) return;

  el.textContent = text;
  el.classList.add("show");

  setTimeout(() => {
    el.classList.remove("show");
  }, 1800);
}


/* =========================================================
   SOUND EFFECT
========================================================= */

function tone(
  freq = 520,
  duration = .08,
  type = "sine",
  volume = .05
) {
  try {
    audioCtx =
      audioCtx ||
      new (
        window.AudioContext ||
        window.webkitAudioContext
      )();

    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.value = freq;

    gain.gain.value = volume;

    oscillator.connect(gain);
    gain.connect(audioCtx.destination);

    oscillator.start();

    gain.gain.exponentialRampToValueAtTime(
      .001,
      audioCtx.currentTime + duration
    );

    oscillator.stop(
      audioCtx.currentTime + duration
    );

  } catch (e) {}
}


/* =========================================================
   PAPER SCRATCH SOUND
========================================================= */

function paperScratch(duration = .38, volume = .055) {
  try {
    audioCtx =
      audioCtx ||
      new (
        window.AudioContext ||
        window.webkitAudioContext
      )();

    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const sampleRate = audioCtx.sampleRate;

    const length = Math.max(
      1,
      Math.floor(sampleRate * duration)
    );

    const buffer = audioCtx.createBuffer(
      1,
      length,
      sampleRate
    );

    const data = buffer.getChannelData(0);

    let last = 0;

    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;

      last =
        last * .72 +
        white * .28;

      const envelope =
        Math.sin(
          Math.PI * (i / length)
        );

      data[i] =
        last * envelope;
    }

    const source =
      audioCtx.createBufferSource();

    const highpass =
      audioCtx.createBiquadFilter();

    const bandpass =
      audioCtx.createBiquadFilter();

    const gain =
      audioCtx.createGain();

    source.buffer = buffer;

    highpass.type = "highpass";
    highpass.frequency.value = 650;

    bandpass.type = "bandpass";
    bandpass.frequency.value = 1850;
    bandpass.Q.value = .7;

    gain.gain.setValueAtTime(
      .001,
      audioCtx.currentTime
    );

    gain.gain.linearRampToValueAtTime(
      volume,
      audioCtx.currentTime + .035
    );

    gain.gain.exponentialRampToValueAtTime(
      .001,
      audioCtx.currentTime + duration
    );

    source.connect(highpass);
    highpass.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(audioCtx.destination);

    source.start();

    source.stop(
      audioCtx.currentTime + duration
    );

  } catch (e) {}
}


/* =========================================================
   NORMAL NAVIGATION
========================================================= */

$$("[data-go]").forEach(button => {
  button.onclick = () => {
    go(button.dataset.go);
  };
});


/* =========================================================
   QUIZ
========================================================= */

$$(".choice.wrong").forEach(button => {
  let count = 0;

  button.onclick = () => {
    count++;

    tone(
      180,
      .09,
      "triangle",
      .025
    );

    button.classList.remove("shake");
    void button.offsetWidth;
    button.classList.add("shake");

    if ($("#tease")) {
      $("#tease").textContent =
        count > 1 &&
        button.classList.contains("escape")
          ? "บอกว่าไม่ให้ตอบอันนี้ไง 555"
          : button.dataset.msg;
    }

    if (
      button.classList.contains("escape") &&
      count > 1
    ) {
      button.style.transform =
        `translate(
          ${Math.random() * 80 - 40}px,
          ${Math.random() * 34 - 17}px
        )
        scale(
          ${Math.max(
            .7,
            1 - count * .08
          )}
        )`;
    }
  };
});


const correctChoice = $(".choice.correct");

if (correctChoice) {
  correctChoice.onclick = () => {
    tone(
      740,
      .18,
      "sine",
      .05
    );

    if ($("#tease")) {
      $("#tease").textContent = "ถูกต้อง!";
    }

    correctChoice.style.background = "#dca5aa";
    correctChoice.style.color = "#fff";

    setTimeout(() => {
      go("reveal");
    }, 650);
  };
}


/* =========================================================
   REVEAL
========================================================= */

let revealTimers = [];

function clearRevealTimers() {
  revealTimers.forEach(clearTimeout);
  revealTimers = [];
}


function buildTypedTitle() {
  const title =
    document.getElementById(
      "revealTypedTitle"
    );

  if (!title) return;

  const text = "เก่งมาก";

  title.innerHTML = "";

  [...text].forEach(
    (character, index) => {
      const span =
        document.createElement("span");

      span.className = "v10-char";

      span.style.setProperty(
        "--i",
        index
      );

      span.innerHTML =
        character === " "
          ? "&nbsp;"
          : character;

      title.appendChild(span);
    }
  );
}


function playReveal() {
  clearRevealTimers();

  const upper =
    document.getElementById(
      "revealUpper"
    );

  const lower =
    document.getElementById(
      "revealLower"
    );

  if (!upper || !lower) return;

  upper.classList.remove(
    "play",
    "crossed"
  );

  lower.classList.remove("show");

  lower.style.opacity = "";
  lower.style.visibility = "";
  lower.style.transform = "";
  lower.style.pointerEvents = "";

  buildTypedTitle();

  void upper.offsetWidth;

  upper.classList.add("play");

  /*
   * 1.6 วินาที
   * X ขีดทับด้านบน
   */

  revealTimers.push(
    setTimeout(() => {
      upper.classList.add(
        "crossed"
      );

      paperScratch(.34, .052);

      revealTimers.push(
        setTimeout(() => {
          paperScratch(.3, .043);
        }, 115)
      );

    }, 1600)
  );

  /*
   * 2.15 วินาที
   * เฉลยส่วนล่าง
   */

  revealTimers.push(
    setTimeout(() => {
      lower.classList.add("show");
    }, 2150)
  );

  /*
   * fallback ป้องกันค้าง
   */

  revealTimers.push(
    setTimeout(() => {
      lower.style.opacity = "1";
      lower.style.visibility = "visible";
      lower.style.transform = "none";
      lower.style.pointerEvents = "auto";
    }, 2350)
  );
}


/* =========================================================
   LIFETIME STARS
========================================================= */

const lifeStars = $("#lifeStars");

if (lifeStars) {
  for (let i = 0; i < 48; i++) {
    const star =
      document.createElement("i");

    star.className = "life-star";

    star.style.left =
      Math.random() * 100 + "%";

    star.style.top =
      Math.random() * 100 + "%";

    star.style.animationDelay =
      Math.random() * 2.5 + "s";

    star.style.transform =
      `scale(
        ${.6 + Math.random() * 1.3}
      )`;

    lifeStars.appendChild(star);
  }
}


/* =========================================================
   LIFETIME VALUES
========================================================= */

function getLifetimeValues() {
  const born =
    new Date(CONFIG.birthDate);

  const now =
    new Date();

  const diff =
    Math.max(
      0,
      now - born
    );

  const total =
    Math.floor(
      diff / 1000
    );

  const days =
    Math.floor(
      total / 86400
    );

  const remainder =
    total % 86400;

  return {
    days,

    hours:
      Math.floor(
        remainder / 3600
      ),

    minutes:
      Math.floor(
        (
          remainder %
          3600
        ) /
        60
      ),

    seconds:
      remainder % 60
  };
}


function updateLifetime() {
  const value =
    getLifetimeValues();

  if ($("#lifeDays")) {
    $("#lifeDays").textContent =
      value.days.toLocaleString(
        "th-TH"
      );
  }

  if ($("#lifeHours")) {
    $("#lifeHours").textContent =
      String(
        value.hours
      ).padStart(
        2,
        "0"
      );
  }

  if ($("#lifeMinutes")) {
    $("#lifeMinutes").textContent =
      String(
        value.minutes
      ).padStart(
        2,
        "0"
      );
  }

  if ($("#lifeSeconds")) {
    $("#lifeSeconds").textContent =
      String(
        value.seconds
      ).padStart(
        2,
        "0"
      );
  }
}


/* =========================================================
   HOLD SEAL
========================================================= */

const seal = $("#seal");

let holdTimer;
let holding = false;

function startHold(event) {
  event.preventDefault();

  if (holding) return;

  holding = true;

  seal.classList.add("holding");

  tone(
    110,
    1.9,
    "sine",
    .012
  );

  if (navigator.vibrate) {
    navigator.vibrate([
      25,
      80,
      25,
      80,
      35
    ]);
  }

  holdTimer =
    setTimeout(
      unlockSeal,
      1800
    );
}


function stopHold() {
  if (!holding) return;

  holding = false;

  clearTimeout(holdTimer);

  seal.classList.remove(
    "holding"
  );
}


function unlockSeal() {
  holding = false;

  seal.classList.remove(
    "holding"
  );

  seal.classList.add(
    "burst"
  );

  if ($("#ageOld")) {
    $("#ageOld").textContent =
      CONFIG.newAge;
  }

  tone(
    420,
    .18,
    "sine",
    .05
  );

  setTimeout(() => {
    tone(
      690,
      .5,
      "sine",
      .04
    );
  }, 120);

  if ($("#envelope")) {
    $("#envelope").classList.add(
      "open"
    );
  }

  if ($("#holdHint")) {
    $("#holdHint").innerHTML =
      `${CONFIG.oldAge} → <b>${CONFIG.newAge}</b>
      <br>
      โตขึ้นอีกปีแล้วนะ`;
  }

  setTimeout(() => {
    go("wish");
  }, 1900);
}


if (seal) {
  seal.addEventListener(
    "pointerdown",
    startHold
  );

  [
    "pointerup",
    "pointerleave",
    "pointercancel"
  ].forEach(event => {
    seal.addEventListener(
      event,
      stopHold
    );
  });
}


/* =========================================================
   WISH
========================================================= */

const wishInput = $("#wishInput");
const wishCount = $("#count");
const saveWish = $("#saveWish");

if (wishInput) {
  wishInput.value = "";
}

if (wishCount) {
  wishCount.textContent = "0 / 140";
}

if (wishInput) {
  wishInput.oninput = event => {
    if (wishCount) {
      wishCount.textContent =
        `${event.target.value.length} / 140`;
    }
  };
}


if (saveWish) {
  saveWish.onclick = () => {
    wish =
      wishInput
        ?.value
        .trim() || "";

    if (!wish) {
      toast(
        "เขียนอะไรให้ตัวเองสักนิดก่อนนะ"
      );

      return;
    }

    try {
      localStorage.setItem(
        "birthdayWish",
        wish
      );
    } catch (e) {}

    if ($("#wishQuote")) {
      $("#wishQuote").textContent =
        `“${wish}”`;
    }

    if ($("#finalWish")) {
      $("#finalWish").textContent =
        `“${wish}”`;
    }

    if ($("#tinyStar")) {
      $("#tinyStar").style.display =
        "block";
    }

    tone(
      460,
      .12
    );

    playBirthdayCountdown();
  };
}


/* =========================================================
   COUNTDOWN
========================================================= */

let countdownRunning = false;
let countdownTimers = [];

function clearCountdownTimers() {
  countdownTimers.forEach(
    clearTimeout
  );

  countdownTimers = [];
}


function countdownSound(number) {
  const frequencies = {
    3: 420,
    2: 510,
    1: 640
  };

  tone(
    frequencies[number] || 500,
    .34,
    "sine",
    .07
  );
}


function countdownFinalSound() {
  tone(
    760,
    .22,
    "sine",
    .055
  );

  setTimeout(() => {
    tone(
      980,
      .38,
      "sine",
      .04
    );
  }, 120);
}


function playBirthdayCountdown() {
  const scene =
    $("#countdown");

  const number =
    $("#countdownNumber");

  if (!scene || !number) {
    go("cake");
    return;
  }

  if (countdownRunning) return;

  countdownRunning = true;

  clearCountdownTimers();

  scene.classList.remove(
    "finish"
  );

  number.classList.remove(
    "tick"
  );

  number.textContent = "";

  go("countdown");

  const sequence = [
    3,
    2,
    1
  ];

  sequence.forEach(
    (value, index) => {
      const delay =
        520 +
        index * 950;

      countdownTimers.push(
        setTimeout(() => {
          number.textContent =
            value;

          number.classList.remove(
            "tick"
          );

          void number.offsetWidth;

          number.classList.add(
            "tick"
          );

          countdownSound(
            value
          );
        }, delay)
      );
    }
  );

  const finishTime =
    520 +
    sequence.length * 950;

  countdownTimers.push(
    setTimeout(() => {
      countdownFinalSound();

      scene.classList.add(
        "finish"
      );
    }, finishTime)
  );

  /*
   * เตรียม Cake ก่อนเปลี่ยนฉาก
   * เพื่อให้ค่อย ๆ ลอยเข้ามา
   */

  countdownTimers.push(
    setTimeout(() => {
      const cakeScene =
        $("#cake");

      cakeScene?.classList.add(
        "cake-pre-enter"
      );

      go("cake");

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          cakeScene?.classList.add(
            "cake-entering"
          );
        });
      });

      setTimeout(() => {
        cakeScene?.classList.remove(
          "cake-pre-enter",
          "cake-entering"
        );
      }, 2600);

    }, finishTime + 520)
  );

  countdownTimers.push(
    setTimeout(() => {
      scene.classList.remove(
        "finish"
      );

      number.classList.remove(
        "tick"
      );

      number.textContent = "";

      countdownRunning = false;

    }, finishTime + 1900)
  );
}
/* =========================================================
   MUSIC.MP3
   START AT 03:20
========================================================= */

const birthdayMusic =
  document.getElementById(
    "birthdayMusic"
  );

const musicButton =
  document.getElementById(
    "musicToggle"
  );

let musicEnabled = true;
let musicStarted = false;


function startCakeMusic() {
  if (
    !birthdayMusic ||
    !musicEnabled
  ) {
    return;
  }

  /*
   * ครั้งแรกเท่านั้น
   * เริ่ม 03:20 = 200 วินาที
   */

  if (!musicStarted) {
    const seekToStart = () => {
      try {
        birthdayMusic.currentTime = 0;
      } catch (e) {}
    };

    if (
      birthdayMusic.readyState >= 1
    ) {
      seekToStart();
    } else {
      birthdayMusic.addEventListener(
        "loadedmetadata",
        seekToStart,
        {
          once: true
        }
      );
    }

    birthdayMusic.volume = .35;
    musicStarted = true;
  }

  const playPromise =
    birthdayMusic.play();

  if (
    playPromise &&
    typeof playPromise.then ===
      "function"
  ) {
    playPromise
      .then(() => {
        musicButton
          ?.classList
          .add("playing");

        const label =
          musicButton
            ?.querySelector("span");

        if (label) {
          label.textContent = "on";
        }
      })

      .catch(error => {
        console.log(
          "Music waiting for interaction:",
          error
        );
      });
  }
}


if (musicButton) {
  musicButton.onclick = () => {
    if (!birthdayMusic) return;

    /*
     * ถ้ากำลังเล่น -> ปิด
     */

    if (!birthdayMusic.paused) {
      musicEnabled = false;

      birthdayMusic.pause();

      musicButton.classList.remove(
        "playing"
      );

      const label =
        musicButton.querySelector(
          "span"
        );

      if (label) {
        label.textContent = "music";
      }

      return;
    }

    /*
     * ถ้าปิดอยู่ -> เปิด
     */

    musicEnabled = true;
    startCakeMusic();
  };
}


/* =========================================================
   CAKE / CANDLE
========================================================= */

let candleFinished = false;

function extinguish() {
  if (candleFinished) return;

  candleFinished = true;

  const cakeScene = $("#cake");

  cakeScene?.classList.add(
    "candle-blown"
  );

  if ($("#flame")) {
    $("#flame").classList.add(
      "out"
    );
  }

  if ($("#smoke")) {
    $("#smoke").classList.add(
      "show"
    );
  }

  tone(
    90,
    .4,
    "sine",
    .03
  );

  stopMic();

  /*
   * รอให้ไฟดับและควันขึ้นก่อน
   * แล้วค่อยให้เค้กจาง
   */

  setTimeout(() => {
    cakeScene?.classList.add(
      "object-exit"
    );
  }, 520);

  /*
   * รอจนเค้กเกือบหาย
   * แล้วค่อยวาบเป็นเลขอายุ
   */

  setTimeout(() => {
    ageFlashThenLifetime();
  }, 1320);
}


const blowBtn = $("#blowBtn");

if (blowBtn) {
  blowBtn.onclick = extinguish;
}


/* =========================================================
   MICROPHONE BLOW
========================================================= */

const micBtn = $("#micBtn");

if (micBtn) {
  micBtn.onclick =
    async () => {
      if (
        !navigator
          .mediaDevices
          ?.getUserMedia
      ) {
        if ($("#micStatus")) {
          $("#micStatus").textContent =
            "เบราว์เซอร์นี้ไม่รองรับไมค์ กดปุ่มเป่าเทียนได้เลย";
        }

        return;
      }

      try {
        micStream =
          await navigator
            .mediaDevices
            .getUserMedia({
              audio: true
            });

        audioCtx =
          audioCtx ||
          new (
            window.AudioContext ||
            window.webkitAudioContext
          )();

        analyser =
          audioCtx.createAnalyser();

        analyser.fftSize = 256;

        const source =
          audioCtx
            .createMediaStreamSource(
              micStream
            );

        source.connect(analyser);

        if ($("#micStatus")) {
          $("#micStatus").textContent =
            "ลองเป่าใส่ไมค์ได้เลย...";
        }

        const data =
          new Uint8Array(
            analyser.frequencyBinCount
          );

        let hits = 0;

        const listen = () => {
          analyser
            .getByteFrequencyData(
              data
            );

          const average =
            data.reduce(
              (a, b) => a + b,
              0
            ) /
            data.length;

          hits =
            average > 48
              ? hits + 1
              : Math.max(
                  0,
                  hits - 1
                );

          if (hits > 5) {
            extinguish();
            return;
          }

          micRAF =
            requestAnimationFrame(
              listen
            );
        };

        listen();

      } catch (e) {
        if ($("#micStatus")) {
          $("#micStatus").textContent =
            "เปิดไมค์ไม่ได้ กดปุ่มเป่าเทียนแทนได้เลย";
        }
      }
    };
}


function stopMic() {
  if (micRAF) {
    cancelAnimationFrame(
      micRAF
    );

    micRAF = null;
  }

  if (micStream) {
    micStream
      .getTracks()
      .forEach(track => {
        track.stop();
      });

    micStream = null;
  }
}


/* =========================================================
   AGE FLASH
========================================================= */

function ageFlashThenLifetime() {
  const flash =
    $("#ageFlash");

  const number =
    $("#ageFlashNumber");

  const cakeScene =
    $("#cake");

  /*
   * fallback
   */

  if (!flash) {
    go("lifetime");

    cakeScene?.classList.remove(
      "object-exit",
      "candle-blown"
    );

    candleFinished = false;

    return;
  }

  if (number) {
    number.textContent =
      CONFIG.newAge;
  }

  flash.classList.remove(
    "show"
  );

  void flash.offsetWidth;

  flash.classList.add(
    "show"
  );

  /*
   * เสียงวาบ
   */

  tone(
    220,
    .16,
    "sine",
    .03
  );

  setTimeout(() => {
    tone(
      760,
      .38,
      "sine",
      .045
    );
  }, 120);

  /*
   * เปลี่ยนไป Lifetime
   * ตอนเลขกำลังละลาย
   *
   * สำคัญ:
   * ยังไม่เอา object-exit ออกจาก Cake
   * เพื่อไม่ให้เค้กกระพริบกลับมา
   */

/*
 * ปล่อยให้ animation เลขอายุเล่นจนจบก่อน
 */

setTimeout(() => {
  flash.classList.remove("show");
}, 2200);


/*
 * รอเลขหายสนิทอีกนิด
 * แล้วค่อยเปิด Lifetime
 */

setTimeout(() => {

  const lifetime = $("#lifetime");

  // ซ่อน content ก่อนเปิด scene ป้องกัน flash 1 frame
  lifetime?.classList.add("lifetime-pre-enter");

  go("lifetime");

  // รอให้ browser วาด scene ก่อน 2 frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {

      playLifetimeEntrance();

      lifetime?.classList.add("lifetime-reveal");

      setTimeout(() => {
        lifetime?.classList.remove(
          "lifetime-pre-enter",
          "lifetime-reveal"
        );
      }, 2600);

    });
  });

}, 2650);

  /*
   * reset Cake หลังจาก Lifetime
   * เข้ามาเรียบร้อยแล้วเท่านั้น
   */

  setTimeout(() => {
    cakeScene?.classList.remove(
      "object-exit",
      "candle-blown"
    );

    candleFinished = false;

  }, 3800);
}


/* =========================================================
   LIFETIME COUNTER 0 -> REAL
========================================================= */

let lifetimeRolling = false;


function animateCounter(
  element,
  target,
  duration
) {
  if (!element) return;

  const start =
    performance.now();

  element.textContent = "0";

  function frame(now) {
    const progress =
      Math.min(
        1,
        (
          now - start
        ) /
        duration
      );

    const eased =
      1 -
      Math.pow(
        1 - progress,
        4
      );

    const value =
      Math.floor(
        target * eased
      );

    element.textContent =
      value.toLocaleString(
        "th-TH"
      );

    if (progress < 1) {
      requestAnimationFrame(
        frame
      );
    } else {
      element.textContent =
        target.toLocaleString(
          "th-TH"
        );
    }
  }

  requestAnimationFrame(frame);
}


/* =========================================================
   LIFETIME HEART RAIN
   ไม่มีดาวตก
========================================================= */

function spawnLifetimeHeart() {
  if (
    !$("#lifetime")
      ?.classList
      .contains("active")
  ) {
    return;
  }

  const heart =
    document.createElement("i");

  heart.className =
    "life-v10-heart";

  heart.textContent =
    Math.random() > .22
      ? "♡"
      : "✦";

  heart.style.left =
    Math.random() * 100 +
    "vw";

  heart.style.fontSize =
    (
      8 +
      Math.random() * 11
    ) +
    "px";

  heart.style.setProperty(
    "--drift",
    (
      Math.random() * 90 -
      45
    ) +
    "px"
  );

  heart.style.setProperty(
    "--rot",
    (
      Math.random() * 180 -
      90
    ) +
    "deg"
  );

  heart.style.setProperty(
    "--fall",
    (
      5 +
      Math.random() * 2.5
    ) +
    "s"
  );

  document.body.appendChild(
    heart
  );

  setTimeout(() => {
    heart.remove();
  }, 8000);
}


function playLifetimeEntrance() {
  const scene =
    $("#lifetime");

  if (!scene) return;

  const value =
    getLifetimeValues();

  lifetimeRolling = true;

  scene.classList.remove(
    "v10-enter"
  );

  void scene.offsetWidth;

  scene.classList.add(
    "v10-enter"
  );

  if ($("#lifeDays")) {
    $("#lifeDays").textContent = "0";
  }

  if ($("#lifeHours")) {
    $("#lifeHours").textContent = "0";
  }

  if ($("#lifeMinutes")) {
    $("#lifeMinutes").textContent = "0";
  }

  if ($("#lifeSeconds")) {
    $("#lifeSeconds").textContent = "0";
  }

  setTimeout(() => {
    animateCounter(
      $("#lifeDays"),
      value.days,
      1600
    );

    animateCounter(
      $("#lifeHours"),
      value.hours,
      950
    );

    animateCounter(
      $("#lifeMinutes"),
      value.minutes,
      1100
    );

    animateCounter(
      $("#lifeSeconds"),
      value.seconds,
      1250
    );
  }, 420);

  /*
   * ฝนหัวใจเบา ๆ
   */

  for (
    let i = 0;
    i < 9;
    i++
  ) {
    setTimeout(
      spawnLifetimeHeart,
      i * 180
    );
  }

  setTimeout(() => {
    lifetimeRolling = false;
    updateLifetime();
  }, 2200);
}


updateLifetime();

setInterval(() => {
  if (
    $("#lifetime")
      ?.classList
      .contains("active") &&
    !lifetimeRolling
  ) {
    updateLifetime();
  }
}, 1000);


/* =========================================================
   NORMAL STAR BACKGROUND
========================================================= */

const stars = $("#stars");

if (stars) {
  for (let i = 0; i < 65; i++) {
    const star =
      document.createElement("i");

    star.className =
      "star-dot";

    star.style.left =
      Math.random() * 100 +
      "%";

    star.style.top =
      Math.random() * 100 +
      "%";

    star.style.animationDelay =
      Math.random() * 2 +
      "s";

    stars.appendChild(star);
  }
}


/* =========================================================
   MOVING STARS
========================================================= */

const movingStars =
  $("#movingStars");

if (movingStars) {
  for (let i = 0; i < 68; i++) {
    const star =
      document.createElement("i");

    const random =
      Math.random();

    star.className =
      "mv-star" +
      (
        random > .88
          ? " warm"
          : random > .72
            ? " bright"
            : ""
      );

    const size =
      (
        random > .88
          ? 2.4
          : 1
      ) +
      Math.random() * 1.8;

    star.style.width =
      size + "px";

    star.style.height =
      size + "px";

    star.style.left =
      Math.random() * 100 +
      "%";

    star.style.top =
      Math.random() * 100 +
      "%";

    star.style.setProperty(
      "--mx",
      (
        Math.random() * 100 -
        50
      ) +
      "px"
    );

    star.style.setProperty(
      "--my",
      (
        Math.random() * 90 -
        45
      ) +
      "px"
    );

    star.style.setProperty(
      "--dur",
      (
        3.8 +
        Math.random() * 4.5
      ) +
      "s"
    );

    star.style.animationDelay =
      (
        -Math.random() * 8
      ) +
      "s";

    movingStars.appendChild(
      star
    );
  }
}


/* =========================================================
   WISH STAR
========================================================= */

if ($("#wishQuote")) {
  $("#wishQuote").textContent =
    wish
      ? `“${wish}”`
      : "“คำอธิษฐานของแก”";
}

if ($("#finalWish")) {
  $("#finalWish").textContent =
    wish
      ? `“${wish}”`
      : "“คำอธิษฐานของแก”";
}


/* =========================================================
   MEMORY HEART RAIN
========================================================= */

let memoryRainTimer = null;


function spawnMemoryHeart() {
  if (
    !$("#memories")
      ?.classList
      .contains("active")
  ) {
    return;
  }

  const element =
    document.createElement("i");

  element.className =
    "memory-heart";

  element.textContent =
    Math.random() > .25
      ? "♡"
      : "✦";

  element.style.left =
    Math.random() * 100 +
    "vw";

  element.style.fontSize =
    (
      9 +
      Math.random() * 17
    ) +
    "px";

  element.style.setProperty(
    "--drift",
    (
      Math.random() * 130 -
      65
    ) +
    "px"
  );

  element.style.setProperty(
    "--rot",
    (
      Math.random() * 260 -
      130
    ) +
    "deg"
  );

  element.style.setProperty(
    "--fall",
    (
      5 +
      Math.random() * 4
    ) +
    "s"
  );

  document.body.appendChild(
    element
  );

  setTimeout(() => {
    element.remove();
  }, 9500);
}


function startMemoryRain() {
  if (memoryRainTimer) {
    return;
  }

  for (
    let i = 0;
    i < 12;
    i++
  ) {
    setTimeout(
      spawnMemoryHeart,
      i * 120
    );
  }

  memoryRainTimer =
    setInterval(
      spawnMemoryHeart,
      430
    );
}


function stopMemoryRain() {
  clearInterval(
    memoryRainTimer
  );

  memoryRainTimer = null;
}


/* =========================================================
   SEND WISH TO STAR
========================================================= */

const sendStarButton =
  $("#sendStar");

if (sendStarButton) {
  sendStarButton.onclick = () => {
    sendStarButton.disabled = true;

    $("#shooting")
      ?.classList
      .add("go");

    tone(
      280,
      .8,
      "sine",
      .025
    );

    setTimeout(() => {
      tone(
        920,
        .55,
        "sine",
        .04
      );
    }, 850);

    $("#received")
      ?.classList
      .add("show");

    /*
     * เปลี่ยนไป Memories
     */

    setTimeout(() => {
      const shell =
        $("#star .star-shell");

      if (
        shell &&
        shell.animate
      ) {
        shell.animate(
          [
            {
              opacity: 1,
              transform:
                "translateY(0)"
            },

            {
              opacity: 0,
              transform:
                "translateY(-30px)",
              filter:
                "blur(5px)"
            }
          ],

          {
            duration: 700,
            easing: "ease",
            fill: "forwards"
          }
        );
      }

      setTimeout(() => {
        scenes.forEach(scene => {
          scene.classList.remove(
            "active",
            "leaving"
          );
        });

        $("#memories")
          ?.classList
          .add(
            "active",
            "memory-enter"
          );

        document.body
          .classList
          .add(
            "night-mode",
            "memory-night"
          );

        document.body.style.overflow =
          "auto";

        window.scrollTo(
          0,
          0
        );

        startMemoryRain();

        /*
         * รอหน้า Memories เข้ามาก่อน
         * แล้วเริ่ม cinematic auto scroll
         */

        
          playMemoryCinematic();
      
      }, 420);

    }, 1400);
  };
}


/* =========================================================
   TINY STAR
========================================================= */

if ($("#tinyStar")) {
  $("#tinyStar").onclick = () => {
    toast(
      wish
        ? `คำอธิษฐาน: ${wish}`
        : "ดาวของปีนี้"
    );
  };
}


/* =========================================================
   MEMORY INTERSECTION EFFECTS
========================================================= */

function heartBurst(
  count = 18
) {
  const box =
    $("#heartRain");

  if (!box) return;

  for (
    let i = 0;
    i < count;
    i++
  ) {
    const element =
      document.createElement("i");

    element.className =
      "rain-heart";

    element.textContent =
      Math.random() > .3
        ? "♡"
        : "✦";

    element.style.left =
      Math.random() * 100 +
      "vw";

    element.style.fontSize =
      (
        10 +
        Math.random() * 18
      ) +
      "px";

    element.style.opacity =
      .18 +
      Math.random() * .42;

    element.style.setProperty(
      "--drift",
      (
        Math.random() * 120 -
        60
      ) +
      "px"
    );

    element.style.animationDuration =
      (
        3.5 +
        Math.random() * 3
      ) +
      "s";

    element.style.animationDelay =
      (
        Math.random() * .7
      ) +
      "s";

    box.appendChild(element);

    setTimeout(() => {
      element.remove();
    }, 7500);
  }
}


if (
  "IntersectionObserver" in window
) {
  const premiumObserver =
    new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (
            !entry.isIntersecting
          ) {
            return;
          }

          entry.target
            .classList
            .add("in-view");

          if (
            entry.target
              .classList
              .contains("memory-card")
          ) {
            heartBurst(7);
          }
        });
      },

      {
        threshold: .28
      }
    );

  $$(".memory-card")
    .forEach(element => {
      premiumObserver.observe(
        element
      );
    });

  if ($(".memory-end")) {
    premiumObserver.observe(
      $(".memory-end")
    );
  }
}


/* =========================================================
   MEMORY PARALLAX + PROGRESS
========================================================= */

window.addEventListener(
  "scroll",
  () => {
    if (
      !$("#memories")
        ?.classList
        .contains("active")
    ) {
      return;
    }

    const max =
      Math.max(
        1,
        document.documentElement
          .scrollHeight -
        innerHeight
      );

    if ($("#memoryProgress")) {
      $("#memoryProgress").style.width =
        Math.min(
          100,
          scrollY / max * 100
        ) +
        "%";
    }

    $$(".polaroid")
      .forEach(polaroid => {
        const rect =
          polaroid
            .getBoundingClientRect();

        const value =
          rect.top +
          rect.height / 2 -
          innerHeight / 2;

        polaroid.style.translate =
          `0 ${
            Math.max(
              -20,
              Math.min(
                20,
                -value * .035
              )
            )
          }px`;
      });
  },

  {
    passive: true
  }
);


/* =========================================================
   MEMORY DRIVE MODE V2
   Auto scroll ช้า ๆ + user ยังเลื่อนเองได้
========================================================= */

let memoryDriveRunning = false;
let memoryDriveRAF = null;
let memoryDriveDelay = null;
let memoryDrivePosition = 0;
let memoryLastTime = 0;

/*
 * px / second
 * 10 = ช้ามาก
 * 15 = ช้า
 * 22 = กลาง ๆ
 */
const MEMORY_DRIVE_SPEED = 25;


/*
 * หา element ที่ scroll จริง
 * รองรับทั้ง window และ #memories
 */
function getMemoryScroller() {
  const memories = $("#memories");

  if (!memories) return null;

  const style =
    getComputedStyle(memories);

  const canScrollItself =
    (
      style.overflowY === "auto" ||
      style.overflowY === "scroll"
    ) &&
    memories.scrollHeight >
    memories.clientHeight + 5;

  return canScrollItself
    ? memories
    : document.scrollingElement;
}


function getMemoryScrollTop(scroller) {
  if (!scroller) return 0;

  return scroller ===
    document.scrollingElement
      ? window.scrollY
      : scroller.scrollTop;
}


function setMemoryScrollTop(
  scroller,
  value
) {
  if (!scroller) return;

  if (
    scroller ===
    document.scrollingElement
  ) {
    window.scrollTo(0, value);
  } else {
    scroller.scrollTop = value;
  }
}


function getMemoryMaxScroll(
  scroller
) {
  if (!scroller) return 0;

  if (
    scroller ===
    document.scrollingElement
  ) {
    return Math.max(
      0,
      document.documentElement.scrollHeight -
      window.innerHeight
    );
  }

  return Math.max(
    0,
    scroller.scrollHeight -
    scroller.clientHeight
  );
}


function memoryDriveFrame(time) {
  if (!memoryDriveRunning) return;

  const memories =
    $("#memories");

  if (
    !memories ||
    !memories.classList.contains("active")
  ) {
    stopMemoryCinematic();
    return;
  }


  const scroller =
    getMemoryScroller();

  if (!scroller) {
    stopMemoryCinematic();
    return;
  }


  if (!memoryLastTime) {
    memoryLastTime = time;

    memoryDrivePosition =
      getMemoryScrollTop(scroller);
  }


  const delta =
    Math.min(
      50,
      time - memoryLastTime
    );

  memoryLastTime = time;


  /*
   * ถ้า user เลื่อนเอง
   * ให้ sync ตำแหน่งใหม่ทันที
   *
   * ดังนั้น user สามารถ
   * เร่งลง / ย้อนขึ้น ได้
   * แล้ว auto-scroll จะทำงานต่อ
   */
  const realPosition =
    getMemoryScrollTop(scroller);

  if (
    Math.abs(
      realPosition -
      memoryDrivePosition
    ) > 3
  ) {
    memoryDrivePosition =
      realPosition;
  }


  /*
   * เดินหน้าช้า ๆ
   * ใช้ค่าทศนิยมภายใน
   * ทำให้ไม่ติดปัญหา scroll ทีละ < 1px
   */
  memoryDrivePosition +=
    MEMORY_DRIVE_SPEED *
    delta /
    1000;


  const maxScroll =
    getMemoryMaxScroll(
      scroller
    );


  if (
    memoryDrivePosition >=
    maxScroll - 2
  ) {
    setMemoryScrollTop(
      scroller,
      maxScroll
    );

    stopMemoryCinematic();
    return;
  }


  setMemoryScrollTop(
    scroller,
    memoryDrivePosition
  );


  memoryDriveRAF =
    requestAnimationFrame(
      memoryDriveFrame
    );
}


function playMemoryCinematic() {
  stopMemoryCinematic();

  memoryDriveRunning = true;
  memoryLastTime = 0;

  const scroller =
    getMemoryScroller();

  memoryDrivePosition =
    getMemoryScrollTop(
      scroller
    );

  document.body.classList.add(
    "memory-auto"
  );


  /*
   * หน้า "มีรูปมาฝาก"
   * อยู่เฉย ๆ ก่อน 2.2 วิ
   * แล้วค่อยเข้าเกียร์ D
   */
  memoryDriveDelay =
    setTimeout(() => {

      if (!memoryDriveRunning) {
        return;
      }

      memoryLastTime = 0;

      memoryDriveRAF =
        requestAnimationFrame(
          memoryDriveFrame
        );

    }, 2200);
}


function stopMemoryCinematic() {
  memoryDriveRunning = false;
  memoryLastTime = 0;

  if (memoryDriveDelay) {
    clearTimeout(
      memoryDriveDelay
    );

    memoryDriveDelay = null;
  }

  if (memoryDriveRAF) {
    cancelAnimationFrame(
      memoryDriveRAF
    );

    memoryDriveRAF = null;
  }

  document.body.classList.remove(
    "memory-auto"
  );
}




/* =========================================================
   MEMORY SURPRISE PHOTO
========================================================= */

const memoryVideoSection =
  $("#memoryVideoSection");

const surprisePhoto =
  $("#surprisePhoto");

const showSurpriseBtn =
  $("#showSurpriseBtn");

const videoEnding =
  $("#videoEnding");


/* =========================================================
   SECTION REVEAL
========================================================= */

if (
  memoryVideoSection &&
  "IntersectionObserver" in window
) {

  const surpriseObserver =
    new IntersectionObserver(
      entries => {

        entries.forEach(entry => {

          if (entry.isIntersecting) {

            memoryVideoSection
              .classList
              .add("in-view");

          }

        });

      },

      {
        threshold: .25
      }
    );

  surpriseObserver.observe(
    memoryVideoSection
  );
}


/* =========================================================
   SHOW LAST PHOTO
========================================================= */

if (
  showSurpriseBtn &&
  surprisePhoto
) {

  showSurpriseBtn.onclick = () => {

    /*
     * หยุด Auto Scroll
     * เมื่อเจ้าตัวกดดูรูป
     */

    stopMemoryCinematic();


    const frame =
      surprisePhoto.closest(
        ".photo-surprise-frame"
      );

    frame?.classList.add(
      "show"
    );


    /*
     * ซ่อนปุ่ม
     */

    showSurpriseBtn
      .classList
      .add("video-playing");


    /*
     * ค้างรูปให้ดูประมาณ 4 วิ
     * แล้วค่อยขึ้นข้อความสุดท้าย
     */

    setTimeout(() => {

      videoEnding
        ?.classList
        .add("show");

    }, 4000);

  };
}


/* =========================================================
   FINAL FROM MEMORIES
========================================================= */

$$(
  '[data-go="final"]'
).forEach(button => {

  button.addEventListener(
    "click",
    () => {

      stopMemoryCinematic();
      stopMemoryRain();

      setTimeout(() => {

        document.body
          .classList
          .remove(
            "memory-night",
            "memory-auto"
          );

      }, 500);
    },

    {
      capture: true
    }
  );
});


/* =========================================================
   STORY IMAGE
========================================================= */

async function loadImage(src) {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      const image =
        new Image();

      image.onload =
        () => resolve(image);

      image.onerror =
        reject;

      image.src = src;
    }
  );
}


function roundRect(
  ctx,
  x,
  y,
  width,
  height,
  radius
) {

  ctx.beginPath();

  if (ctx.roundRect) {

    ctx.roundRect(
      x,
      y,
      width,
      height,
      radius
    );

  } else {

    ctx.rect(
      x,
      y,
      width,
      height
    );
  }

  ctx.fill();
}


function drawImageCover(
  ctx,
  image,
  x,
  y,
  width,
  height
) {
  const imageRatio =
    image.width / image.height;

  const boxRatio =
    width / height;

  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = image.width;
  let sourceHeight = image.height;

  if (imageRatio > boxRatio) {
    // รูปกว้างเกิน → crop ซ้ายขวา
    sourceWidth =
      image.height * boxRatio;

    sourceX =
      (image.width - sourceWidth) / 2;

  } else {
    // รูปสูงเกิน → crop บนล่าง
    sourceHeight =
      image.width / boxRatio;

    sourceY =
      (image.height - sourceHeight) / 2;
  }

  ctx.drawImage(
    image,

    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,

    x,
    y,
    width,
    height
  );
}

const generateStory =
  $("#generateStory");

if (generateStory) {

  generateStory.onclick =
    async () => {

      const canvas =
        $("#storyCanvas");

      if (!canvas) return;

      const ctx =
        canvas.getContext(
          "2d"
        );

      const W =
        canvas.width;

      const H =
        canvas.height;

      /*
       * Background
       */

      ctx.fillStyle =
        "#f7e4de";

      ctx.fillRect(
        0,
        0,
        W,
        H
      );


      /*
       * HAPPY BIRTHDAY
       */

      ctx.fillStyle =
        "#3b302e";

      ctx.font =
        "700 56px DM Sans, sans-serif";

      ctx.textAlign =
        "left";

      ctx.fillText(
        "HAPPY",
        38,
        82
      );

      ctx.fillText(
        "BIRTHDAY",
        38,
        138
      );


      /*
       * Name
       */

      ctx.font =
        "600 18px Noto Sans Thai, sans-serif";

      ctx.fillStyle =
        "#a87378";

      ctx.fillText(
        `TO ${CONFIG.name}`,
        41,
        173
      );


      /*
       * Load 3 photos
       */

      let images;

      try {

        images =
          await Promise.all(
            [
              "1.jpg",
              "2.jpg",
              "3.jpg"
            ].map(loadImage)
          );

      } catch (error) {

        console.error(
          "Story image load error:",
          error
        );

        toast(
          "โหลดรูปสำหรับ Story ไม่สำเร็จ"
        );

        return;
      }


      /*
       * Polaroid positions
       */

      const cards = [

        {
          x: 42,
          y: 220,
          w: 260,
          h: 320,
          r: -.06
        },

        {
          x: 278,
          y: 335,
          w: 220,
          h: 275,
          r: .07
        },

        {
          x: 74,
          y: 555,
          w: 245,
          h: 300,
          r: .04
        }
      ];


      cards.forEach(
        (card, index) => {

          ctx.save();

          ctx.translate(
            card.x +
            card.w / 2,

            card.y +
            card.h / 2
          );

          ctx.rotate(
            card.r
          );


          /*
           * Polaroid shadow
           */

          ctx.shadowColor =
            "rgba(70,40,35,.16)";

          ctx.shadowBlur =
            22;

          ctx.fillStyle =
            "#fff";


          roundRect(
            ctx,
            -card.w / 2,
            -card.h / 2,
            card.w,
            card.h,
            8
          );


          ctx.shadowColor =
            "transparent";


          /*
           * Photo
           */

          drawImageCover(
          ctx,
          images[index],

          -card.w / 2 + 10,
          -card.h / 2 + 10,

          card.w - 20,
          card.h - 48
        );


          ctx.restore();
        }
      );


      /*
       * Link area
       */

      ctx.fillStyle =
        "#3b302e";

      ctx.font =
        "500 14px DM Sans";

      ctx.fillText(
        "MY BIRTHDAY WISH  ✦",
        335,
        690
      );


      ctx.fillStyle =
        "#fff8f5";

      roundRect(
        ctx,
        335,
        715,
        165,
        70,
        18
      );


      ctx.fillStyle =
        "#a9827f";

      ctx.font =
        "500 12px DM Sans";

      ctx.fillText(
        "ADD LINK HERE",
        360,
        757
      );


      /*
       * Footer
       */

      ctx.font =
        "500 11px DM Sans";

      ctx.fillStyle =
        "#9d7774";

      ctx.fillText(
        "made with tikki.card",
        38,
        925
      );


      /*
       * Hide placeholder
       */

      if (
        $("#storyPlaceholder")
      ) {

        $("#storyPlaceholder")
          .style
          .display =
          "none";
      }


      /*
       * Create PNG
       */

      canvas.toBlob(
        blob => {

          storyBlob = blob;

          if (
            $("#shareStory")
          ) {

            $("#shareStory")
              .disabled =
              false;
          }

          toast(
            "สร้าง Story แล้ว"
          );

        },

        "image/png"
      );
    };
}


/* =========================================================
   DOWNLOAD STORY
========================================================= */

const shareStory =
  $("#shareStory");

if (shareStory) {

  shareStory.onclick = () => {

    if (!storyBlob) return;

    const url =
      URL.createObjectURL(
        storyBlob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      `happy-birthday-${
        CONFIG.name ||
        "story"
      }.png`;

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();


    setTimeout(() => {

      URL.revokeObjectURL(
        url
      );

    }, 1200);


    toast(
      "ดาวน์โหลดรูปลงเครื่องแล้ว"
    );
  };
}


/* =========================================================
   COPY LINK
========================================================= */

const copyLink =
  $("#copyLink");

if (copyLink) {

  copyLink.onclick =
    async () => {

      const input =
        $("#shareLink");

      if (!input) return;

      try {

        await navigator
          .clipboard
          .writeText(
            input.value
          );

        toast(
          "คัดลอกลิงก์แล้ว"
        );

      } catch (e) {

        input.select();

        document.execCommand(
          "copy"
        );

        toast(
          "คัดลอกลิงก์แล้ว"
        );
      }
    };
}


/* =========================================================
   CLOSE
========================================================= */

const closeGift =
  $("#closeGift");

if (closeGift) {

  closeGift.onclick = () => {

    /*
     * หยุดระบบ Memories
     * เผื่อผู้ใช้กดปิดหลังดูรูป
     */

    stopMemoryCinematic();
    stopMemoryRain();

    go("closed");


    setTimeout(() => {

      try {

        window.close();

      } catch (e) {}

    }, 1800);
  };
}


/* =========================================================
   SCENE HOOKS
========================================================= */

/*
 * เก็บ go() ตัวจริงไว้
 */

const originalGo = go;


/*
 * ครอบ go() เพิ่ม event เฉพาะบางหน้า
 */

go = function(id) {

  originalGo(id);


  /* ---------------------------------------------------------
     REVEAL
  --------------------------------------------------------- */

  if (id === "reveal") {

    setTimeout(
      playReveal,
      60
    );
  }


  /* ---------------------------------------------------------
     CAKE
     เพลงเริ่มเมื่อ Cake เข้ามา
  --------------------------------------------------------- */

  if (id === "cake") {

    setTimeout(
      startCakeMusic,
      180
    );
  }





  /* ---------------------------------------------------------
     LEAVE MEMORIES
  --------------------------------------------------------- */

  if (id !== "memories") {

    if (
      !$("#memories")
        ?.classList
        .contains("active")
    ) {

      stopMemoryCinematic();
    }
  }
};


/* =========================================================
   INITIAL STATE
========================================================= */

/*
 * ให้หน้าแรกเริ่มสะอาด
 * และป้องกัน class จากการ refresh ค้าง
 */

document.body.classList.remove(
  "night-mode",
  "memory-night",
  "memory-auto"
);


/*
 * Reset Countdown
 */

const countdownScene =
  $("#countdown");

const countdownNumber =
  $("#countdownNumber");

if (countdownScene) {

  countdownScene.classList.remove(
    "finish"
  );
}

if (countdownNumber) {

  countdownNumber.classList.remove(
    "tick"
  );

  countdownNumber.textContent = "";
}


/*
 * Reset Cake
 */

const cakeScene =
  $("#cake");

if (cakeScene) {

  cakeScene.classList.remove(
    "cake-pre-enter",
    "cake-entering",
    "candle-blown",
    "object-exit"
  );
}


if ($("#flame")) {

  $("#flame").classList.remove(
    "out"
  );
}


if ($("#smoke")) {

  $("#smoke").classList.remove(
    "show"
  );
}


/*
 * Reset Age Flash
 */

if ($("#ageFlash")) {

  $("#ageFlash").classList.remove(
    "show"
  );
}


/*
 * Reset Memories
 */

if ($("#memoryProgress")) {

  $("#memoryProgress").style.width =
    "0%";
}


/*
 * ป้องกัน browser restore scroll position
 * แล้วเปิดเว็บมากลางหน้า Memories
 */

if (
  "scrollRestoration" in history
) {

  history.scrollRestoration =
    "manual";
}


window.scrollTo(
  0,
  0
);


/* =========================================================
   READY
========================================================= */

console.log(
  "Birthday mini program ready"
);