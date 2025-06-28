//context Menu off
//  document.onkeydown = function (e) {
//     // F12
//     if (e.keyCode === 123) return false;
//     // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
//     if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) return false;
//     // Ctrl+U
//     if (e.ctrlKey && e.key.toUpperCase() === 'U') return false;
//   };

//scroll btns
{
  const leftBtns = document.querySelectorAll(".left-scrollbar-btn");
  const rightBtns = document.querySelectorAll(".right-scrollbar-btn");
  const cardContainers = document.querySelectorAll(".cards-container");
  const cardSections = document.querySelectorAll(".card-sections");

  const scrollAmount = 300;

  // Loop through each card section and attach event listeners
  cardContainers.forEach((container, index) => {
    const leftBtn = leftBtns[index];
    const rightBtn = rightBtns[index];

    function updateButtonVisibility() {
      const scrollLeft = container.scrollLeft;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;

      if (scrollLeft <= 0) {
        leftBtn.classList.add("hidden");
      } else {
        leftBtn.classList.remove("hidden");
        adjust;
      }

      if (scrollLeft >= maxScrollLeft - 1) {
        rightBtn.classList.add("hidden");
      } else {
        rightBtn.classList.remove("hidden");
      }
    }

    // Scroll buttons
    leftBtn.addEventListener("click", () => {
      container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    });

    rightBtn.addEventListener("click", () => {
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    });

    // Scroll visibility
    container.addEventListener("scroll", updateButtonVisibility);
    window.addEventListener("load", updateButtonVisibility);

    // Hover animations
    const section = cardSections[index];

    section.addEventListener("mouseenter", () => {
      leftBtn.style.transform = "translateX(20)";
      leftBtn.style.transition = "transform 0.3s ease";

      rightBtn.style.transform = "translateX(-20)";
      rightBtn.style.transition = "transform 0.3s ease";
    });

    section.addEventListener("mouseleave", () => {
      leftBtn.style.transform = "translateX(20)";
      rightBtn.style.transform = "translateX(-20)";
    });
  });
}

//fetch songs
let currentAudio = new Audio();
let songStore = [];
let currentIndex = 0;
let isRepeating = false;

async function getSongs() {
  const res = await fetch("http://127.0.0.1:5500/songs/");
  const html = await res.text();
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  const links = tempDiv.getElementsByTagName("a");

  for (let a of links) {
    if (a.href.endsWith(".mp3")) {
      songStore.push(a.href);
    }
  }
  return songStore;
}

document.addEventListener("DOMContentLoaded", async () => {
  songStore = await getSongs();
  currentAudio.volume = 1;

  document.querySelectorAll(".song-name").forEach((e, i) => {
    e.innerText = songStore[i]?.split("/").pop().replaceAll("%20", " ") || "";
  });

  setupPrevNext();
  setupRepeat();
  setupShuffle();
  selectCards();
  setupSeekbar();
  SongEndTIme(currentAudio);
  volumeControl(currentAudio);

  currentAudio.addEventListener("timeupdate", () => {
    const current = currentAudio.currentTime;
    const duration = currentAudio.duration || 1;
    const percent = (current / duration) * 98;

    const circle = document.querySelector(".playing-circle");
    const startTime = document.querySelector(".start-time");

    if (circle) circle.style.left = `${percent}%`;
    if (startTime) {
      const minutes = Math.floor(current / 60);
      const seconds = Math.floor(current % 60);
      startTime.innerText = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
  });
});

function playSongByIndex(index) {
  currentIndex = index;
  currentAudio.pause();
  currentAudio.src = songStore[index];
  currentAudio.load();

  currentAudio.oncanplay = () => {
    currentAudio.play().catch(console.warn);
    updateMainPlayerInfo(index);
    updateCardIcons(index);
  };
}

function selectCards() {
  const cards = document.querySelectorAll(".cards");
  cards.forEach((card, i) => {
    card.addEventListener("click", () => {
      if (currentIndex === i && !currentAudio.paused) {
        currentAudio.pause();
      } else {
        playSongByIndex(i);
      }
      updateCardIcons(i);
    });
  });

  setupSecondaryPlayButton();
  updateArtists();
}

function setupSecondaryPlayButton() {
  const playBtn2 = document.querySelector(".play-button");
  const playIcon2 = document.querySelector(".play-button-icon2");
  if (!playBtn2 || !playIcon2) return;

  const togglePlayback = () => {
    if (!currentAudio.src) {
      playSongByIndex(0);
    } else if (currentAudio.paused) {
      currentAudio.play().catch(console.warn);
    } else {
      currentAudio.pause();
    }
    updateCardIcons(currentIndex);
  };

  playBtn2.addEventListener("click", togglePlayback);
  playIcon2.addEventListener("click", (e) => {
    e.stopPropagation();
    togglePlayback();
  });
}

function setupPrevNext() {
  const prev = document.querySelector(".previous");
  const next = document.querySelector(".next");

  if (prev) {
    prev.addEventListener("click", () => {
      const i = (currentIndex - 1 + songStore.length) % songStore.length;
      playSongByIndex(i);
    });
  }

  if (next) {
    next.addEventListener("click", () => {
      const i = (currentIndex + 1) % songStore.length;
      playSongByIndex(i);
    });
  }
}

function setupShuffle() {
  const shuffleBtn = document.querySelector(".shuffle");
  if (!shuffleBtn) return;

  shuffleBtn.addEventListener("click", () => {
    if (songStore.length === 0) return;

    let randomIdx;
    do {
      randomIdx = Math.floor(Math.random() * songStore.length);
    } while (randomIdx === currentIndex);

    playSongByIndex(randomIdx);
  });
}

function setupRepeat() {
  const repeatBtn = document.querySelector(".repeat");
  if (!repeatBtn) return;

  repeatBtn.addEventListener("click", () => {
    currentAudio.loop = true;
    isRepeating = true;
    currentAudio.currentTime = 0;
  });
}

function setupSeekbar() {
  const circle = document.querySelector(".playing-circle");
  const seekbarContainer = document.querySelector("#line");

  if (!circle || !seekbarContainer) return;

  seekbarContainer.addEventListener("click", (e) => {
    const rect = seekbarContainer.getBoundingClientRect();
    const cappedRatio = Math.min((e.clientX - rect.left) / rect.width, 0.98);

    circle.style.left = `${cappedRatio * 100}%`;
    if (!isNaN(currentAudio.duration)) {
      currentAudio.currentTime = currentAudio.duration * cappedRatio;
    }
  });
}

function volumeControl(audioRef) {
  const volumeIcon = document.querySelector(".sound");
  const volumeLine = document.querySelector("#volume-line");
  const volumeCircle = document.querySelector(".volume-circle");

  if (!volumeIcon || !volumeLine || !volumeCircle) {
    console.warn("🔧 Missing volume controls.");
    return;
  }

  // Position the circle to match initial volume
  volumeCircle.style.left = `${audioRef.volume * 100}%`;

  // Toggle mute
  volumeIcon.addEventListener("click", () => {
    audioRef.muted = !audioRef.muted;
    const isMuted = audioRef.muted;

    const newIcon = isMuted
      ? "assets/sound-mute-button-icon.png"
      : "assets/sound-button-icon.png";

    volumeIcon.setAttribute("src", `${newIcon}?t=${Date.now()}`);
    
  });

  // Volume bar click
  volumeLine.addEventListener("click", (e) => {
    const rect = volumeLine.getBoundingClientRect();
    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);

    audioRef.volume = ratio;
    audioRef.muted = false;

    volumeCircle.style.left = `${ratio * 100}%`;

    // Force-set sound icon
    volumeIcon.setAttribute("src", `assets/sound-button-icon.png?t=${Date.now()}`);
   
  });
}

function SongEndTIme(audioRef) {
  const endTime = document.querySelector(".end-time");

  audioRef.addEventListener("loadedmetadata", () => {
    if (isNaN(audioRef.duration)) return;

    const minutes = Math.floor(audioRef.duration / 60);
    const seconds = Math.floor(audioRef.duration % 60);
    if (endTime)
      endTime.innerText = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  });

  audioRef.addEventListener("ended", () => {
    if (!isRepeating) {
      document.querySelector(".play-button-icon2").src = "assets/play-button-icon.png";
      updateCardIcons(currentIndex);
    }
  });
}

function updateMainPlayerInfo(index) {
  const name = document.querySelector(".playing-song-name > a");
  const artist = document.querySelector(".playing-song-artist > a");
  const thumb = document.querySelector(".playing-song-image");
  const cards = document.querySelectorAll(".cards");
  const artistNames = document.querySelectorAll(".artist-name");
  const cardImage = cards[index]?.querySelector(".card-images");

  name.innerText = decodeURIComponent(songStore[index].split("/").pop());
  artist.innerText = artistNames[index]?.innerText || "Unknown Artist";
  if (cardImage && thumb) {
    thumb.src = cardImage.src.replace("http://127.0.0.1:5500/", "");
  }
}

function updateCardIcons(activeIndex) {
  const cards = document.querySelectorAll(".cards");
  cards.forEach((card, i) => {
    const icon = card.querySelector(".play-button-icon");
    if (icon) {
      icon.src = i === activeIndex && !currentAudio.paused
        ? "assets/pause-button-icon.png"
        : "assets/play-button-icon.png";
    }
  });

  const icon2 = document.querySelector(".play-button-icon2");
  if (icon2) {
    icon2.src = currentAudio.paused
      ? "assets/play-button-icon.png"
      : "assets/pause-button-icon.png";
  }
}

function updateArtists() {
  const popularArtists = document.querySelectorAll(".popular-artist");
  const names = document.querySelectorAll(".artist-name");

  popularArtists.forEach((artist, i) => {
    if (names[i]) names[i].innerText = artist.innerText;
  });
}
