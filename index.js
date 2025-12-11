/* =========================================
   ⚙️ 自动化配置区 (请务必修改这里)
========================================= */
const config = {
    githubUsername: "hiyhp",      
    githubRepo: "MyWeb",      // 你的仓库名 (请确认是 opticfuns 还是 MyWeb)
    folderPath: "Music"           
};

/* =========================================
   🎵 全局变量
========================================= */
let songs = []; 
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

// 新增 DOM
const playlistPanel = document.getElementById('playlist-panel');
const playlistToggle = document.getElementById('playlist-toggle');
const closePlaylistBtn = document.getElementById('close-playlist');
const playlistList = document.getElementById('playlist-list');

/* =========================================
   🚀 核心：自动扫描 & 初始化
========================================= */
async function initMusicPlayer() {
    songTitle.innerText = "扫描歌曲...";
    songArtist.innerText = "连接 GitHub...";
    
    try {
        const apiUrl = `https://api.github.com/repos/${config.githubUsername}/${config.githubRepo}/contents/${config.folderPath}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) throw new Error("API连接失败");

        const files = await response.json();
        const mp3Files = files.filter(file => file.name.endsWith('.mp3'));
        
        if (mp3Files.length === 0) {
            songTitle.innerText = "未找到音乐";
            return;
        }

        songs = mp3Files.map(file => {
            const fileName = file.name.replace('.mp3', '');
            const parts = fileName.split('-'); 
            
            let artist = "未知歌手";
            let title = fileName;

            if (parts.length >= 2) {
                artist = parts[0].trim();
                title = parts[1].trim();
            }

            return {
                title: title,
                artist: artist,
                src: `./${config.folderPath}/${file.name}`,
                lrc: `./${config.folderPath}/${file.name.replace('.mp3', '.lrc')}`,
                fileName: file.name // 用于下载
            };
        });

        console.log("加载成功:", songs);
        
        // 渲染播放列表
        renderPlaylist();
        
        // 加载第一首
        loadSong(songs[0]);

    } catch (error) {
        console.error(error);
        songTitle.innerText = "加载失败";
        songArtist.innerText = "配置错误";
    }
}

initMusicPlayer();

/* =========================================
   📜 播放列表与下载逻辑 (新增)
========================================= */
function renderPlaylist() {
    playlistList.innerHTML = '';
    
    songs.forEach((song, index) => {
        const li = document.createElement('li');
        li.className = `playlist-item ${index === currentSongIndex ? 'active' : ''}`;
        
        // 列表点击切歌
        li.onclick = (e) => {
            // 如果点的是下载按钮，不切歌
            if(e.target.closest('.download-btn')) return;
            
            currentSongIndex = index;
            loadSong(songs[currentSongIndex]);
            audio.play();
            updatePlayBtn();
            updatePlaylistHighlight();
            
            // 手机端点击后自动收起列表
            if(window.innerWidth <= 768) {
                playlistPanel.classList.remove('show');
            }
        };

        li.innerHTML = `
            <div class="song-meta">
                <span class="song-name">${song.title}</span>
                <span class="song-artist-mini">${song.artist}</span>
            </div>
            <button class="download-btn" onclick="downloadSong('${song.src}', '${song.fileName}')" title="下载">
                <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
            </button>
        `;
        
        playlistList.appendChild(li);
    });
}

function updatePlaylistHighlight() {
    const items = document.querySelectorAll('.playlist-item');
    items.forEach((item, index) => {
        if (index === currentSongIndex) {
            item.classList.add('active');
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            item.classList.remove('active');
        }
    });
}

// 下载功能
window.downloadSong = function(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename; // 触发浏览器下载
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

// 侧边栏开关
playlistToggle.addEventListener('click', () => {
    playlistPanel.classList.add('show');
});

closePlaylistBtn.addEventListener('click', () => {
    playlistPanel.classList.remove('show');
});

// 点击背景关闭列表 (可选)
document.addEventListener('click', (e) => {
    if (!playlistPanel.contains(e.target) && !playlistToggle.contains(e.target) && playlistPanel.classList.contains('show')) {
        playlistPanel.classList.remove('show');
    }
});


/* =========================================
   🎵 基础播放控制
========================================= */
function loadSong(song) {
    songTitle.innerText = song.title;
    songArtist.innerText = song.artist;
    lyricsTitle.innerText = song.title;
    audio.src = song.src;

    fetchLyrics(song.lrc);
    updatePlaylistHighlight(); // 确保列表高亮同步
}

async function fetchLyrics(url) {
    lyricsList.innerHTML = '<li class="loading">歌词加载中...</li>';
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("无歌词");
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