/* =========================================
   🎵 歌曲配置区
========================================= */
const songs = [
    {
        title: "Liekkas",
        artist: "Sofia Jannok",
        src: "./Music/Sofia Jannok - Liekkas.mp3",
        lrc: "./Music/Sofia Jannok - Liekkas.lrc"
    },
    {
        title: "无言感激",
        artist: "谭咏麟",
        src: "./Music/谭咏麟 - 无言感激.mp3",
        lrc: "./Music/谭咏麟 - 无言感激.lrc"
    },
    {
        title: "追梦赤子心",
        artist: "GALA",
        src: "./Music/GALA - 追梦赤子心.mp3",
        lrc: "./Music/GALA - 追梦赤子心.lrc"
    }
];

let currentSongIndex = 0;
let lyricsData = [];

/* DOM 元素 */
const audio = document.getElementById('audio-element');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const progressBar = document.getElementById('progress-bar');
const progressContainer = document.getElementById('progress-container');
const songTitle = document.getElementById('song-title');
const songArtist = document.getElementById('song-artist');
const lyricsList = document.querySelector('.lyrics-list');
const lyricsTitle = document.getElementById('lyrics-title');

/* 初始化 */
loadSong(songs[currentSongIndex]);

function loadSong(song) {
    songTitle.innerText = song.title;
    songArtist.innerText = song.artist;
    lyricsTitle.innerText = song.title;
    audio.src = song.src;

    if (song.lrc) {
        fetchLyrics(song.lrc);
    } else {
        lyricsList.innerHTML = '<li>暂无歌词</li>';
        lyricsData = [];
    }
}

async function fetchLyrics(url) {
    lyricsList.innerHTML = '<li class="loading">加载歌词...</li>';
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("歌词文件丢失");
        const text = await response.text();
        lyricsData = parseLRC(text);
        renderLyrics(lyricsData);
    } catch (error) {
        lyricsList.innerHTML = '<li>暂无歌词 / 纯音乐</li>';
        lyricsData = [];
    }
}

function parseLRC(lrcString) {
    const lines = lrcString.split('\n');
    const result = [];
    lines.forEach(line => {
        const parts = line.split(']');
        const timeStr = parts[0].substring(1);
        const text = parts[1];
        if (timeStr && text) {
            const timeParts = timeStr.split(':');
            const min = parseInt(timeParts[0]);
            const sec = parseFloat(timeParts[1]);
            const time = min * 60 + sec;
            result.push({ time, text: text.trim() });
        }
    });
    return result;
}

function renderLyrics(data) {
    lyricsList.innerHTML = '';
    const placeholderTop = document.createElement('li');
    placeholderTop.style.height = '50%';
    lyricsList.appendChild(placeholderTop);

    data.forEach((line, index) => {
        const li = document.createElement('li');
        li.innerText = line.text;
        li.dataset.index = index;
        lyricsList.appendChild(li);
    });

    const placeholderBottom = document.createElement('li');
    placeholderBottom.style.height = '50%';
    lyricsList.appendChild(placeholderBottom);
}

/* 播放控制 */
function updatePlayBtn() {
    if (audio.paused) {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    } else {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    }
}

function togglePlay() {
    if (audio.paused) {
        audio.play();
    } else {
        audio.pause();
    }
    updatePlayBtn();
}

function prevSong() {
    currentSongIndex--;
    if (currentSongIndex < 0) currentSongIndex = songs.length - 1;
    loadSong(songs[currentSongIndex]);
    audio.play();
    updatePlayBtn();
}

function nextSong() {
    currentSongIndex++;
    if (currentSongIndex > songs.length - 1) currentSongIndex = 0;
    loadSong(songs[currentSongIndex]);
    audio.play();
    updatePlayBtn();
}

playBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);
audio.addEventListener('ended', nextSong);

/* 进度与歌词同步 */
audio.addEventListener('timeupdate', () => {
    const { duration, currentTime } = audio;
    if (duration) {
        const percent = (currentTime / duration) * 100;
        progressBar.style.width = `${percent}%`;
    }
    syncLyrics(currentTime);
});

function syncLyrics(currentTime) {
    if (lyricsData.length === 0) return;
    let activeIndex = -1;
    for (let i = 0; i < lyricsData.length; i++) {
        if (currentTime >= lyricsData[i].time) {
            activeIndex = i;
        } else {
            break;
        }
    }
    const activeLi = lyricsList.querySelectorAll('li[data-index]')[activeIndex];
    if (activeLi && !activeLi.classList.contains('active')) {
        const prevActive = lyricsList.querySelector('.active');
        if (prevActive) prevActive.classList.remove('active');
        activeLi.classList.add('active');
        activeLi.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

progressContainer.addEventListener('click', (e) => {
    const width = progressContainer.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    audio.currentTime = (clickX / width) * duration;
});