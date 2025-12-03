  /* --- JavaScript 功能部分 --- */

   console.log("音乐播放器脚本已加载");
        // 1. 获取页面元素
        const audio = document.getElementById('audio-element');
        const playBtn = document.getElementById('play-btn');
        const progressContainer = document.getElementById('progress-container');
        const progressBar = document.getElementById('progress-bar');

        // 2. 播放/暂停功能
        function togglePlay() {
            if (audio.paused) {
                audio.play();
                playBtn.innerHTML = '❚❚'; // 切换图标为暂停
                playBtn.title = "暂停";
            } else {
                audio.pause();
                playBtn.innerHTML = '▶'; // 切换图标为播放
                playBtn.title = "播放";
            }
        }

        // 绑定点击事件
        playBtn.addEventListener('click', togglePlay);

        // 3. 更新进度条
        function updateProgress(e) {
            const { duration, currentTime } = e.srcElement;
            const progressPercent = (currentTime / duration) * 100;
            progressBar.style.width = `${progressPercent}%`;
        }

        audio.addEventListener('timeupdate', updateProgress);

        // 4. 点击进度条跳转
        function setProgress(e) {
            const width = this.clientWidth;
            const clickX = e.offsetX;
            const duration = audio.duration;
            audio.currentTime = (clickX / width) * duration;
        }

        progressContainer.addEventListener('click', setProgress);

        // 5. 音乐播放结束时重置按钮
        audio.addEventListener('ended', () => {
            playBtn.innerHTML = '▶';
            progressBar.style.width = '0%';
        });