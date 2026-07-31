"use strict";
// 后端接口基础地址
// 本地开发时用 127.0.0.1:5100
// 如果以后后端部署到 Railway，只需要改这里
let baseUrl = "http://127.0.0.1:5100";
// 使用 Vue2 的 new Vue 写法
let vm = new Vue({
    el: "#app",
    data: {
        // 登录注册
        isLoginMode: true,
        username: "",
        password: "",
        currentUser: null,
        // 当前显示哪个区域
        pageName: "music",
        // 搜索条件
        keyword: "",
        category: "",
        categoryList: [],
        // 音乐数据
        musicList: [],
        favoriteList: [],
        currentMusic: null,
        // 播放列表数据
        playlistList: [],
        newPlaylistName: "",
        newPlaylistDesc: "",
        currentPlaylist: {
            id: 0,
            name: "",
            description: "",
            cover: "",
            musics: []
        }
    },
    methods: {
        /**
         * get 请求
         * 这里封装一下，后面代码会少写很多重复的 $.ajax
         */
        getAjax(url, successFn) {
            $.ajax({
                url: baseUrl + url,
                type: "get",
                xhrFields: { withCredentials: true },
                success: (res) => {
                    successFn(res);
                },
                error: () => {
                    alert("请求失败，请确认后端是否启动");
                }
            });
        },
        /**
         * post 请求
         */
        postAjax(url, data, successFn) {
            $.ajax({
                url: baseUrl + url,
                type: "post",
                contentType: "application/json",
                xhrFields: { withCredentials: true },
                data: JSON.stringify(data),
                success: (res) => {
                    successFn(res);
                },
                error: () => {
                    alert("请求失败，请确认后端是否启动");
                }
            });
        },
        /**
         * 切换登录 / 注册
         */
        switchAuthMode() {
            this.isLoginMode = !this.isLoginMode;
            this.password = "";
        },
        /**
         * 登录或注册
         */
        authUser() {
            let username = this.username.trim();
            let password = this.password.trim();
            if (!username || !password) {
                alert("用户名和密码不能为空");
                return;
            }
            let reqUrl = this.isLoginMode ? "/login" : "/register";
            this.postAjax(reqUrl, {
                username: username,
                password: password
            }, (res) => {
                alert(res.msg || "操作完成");
                // 登录成功
                if (res.code === 1 && this.isLoginMode) {
                    this.currentUser = res.data;
                    this.password = "";
                    this.getAllData();
                }
                // 注册成功后，切回登录
                if (res.code === 1 && !this.isLoginMode) {
                    this.isLoginMode = true;
                    this.username = "";
                    this.password = "";
                }
            });
        },
        /**
         * 检查当前是否已经登录
         * 如果浏览器里还有后端 session，就直接进入音乐页面
         */
        checkLogin() {
            this.getAjax("/info", (res) => {
                if (res.code === 1) {
                    this.currentUser = res.data;
                    this.getAllData();
                }
            });
        },
        /**
         * 退出登录
         */
        logout() {
            this.getAjax("/logout", (res) => {
                alert(res.msg || "已退出");
                this.currentUser = null;
                this.username = "";
                this.password = "";
                this.musicList = [];
                this.favoriteList = [];
                this.playlistList = [];
                this.currentMusic = null;
                this.pageName = "music";
            });
        },
        /**
         * 登录后一次性加载页面需要的数据
         */
        getAllData() {
            this.getCategoryList();
            this.getMusicList();
            this.getFavoriteList();
            this.getPlaylistList();
        },
        /**
         * 显示音乐库
         */
        showMusicPage() {
            this.pageName = "music";
            this.getMusicList();
        },
        /**
         * 显示收藏页
         */
        showFavoritePage() {
            this.pageName = "favorite";
            this.getFavoriteList();
        },
        /**
         * 显示播放列表页
         */
        showPlaylistPage() {
            this.pageName = "playlist";
            this.getPlaylistList();
        },
        /**
         * 获取音乐列表
         */
        getMusicList() {
            let url = "/list";
            let params = [];
            if (this.keyword.trim()) {
                params.push("keyword=" + encodeURIComponent(this.keyword.trim()));
            }
            if (this.category) {
                params.push("category=" + encodeURIComponent(this.category));
            }
            if (params.length > 0) {
                url += "?" + params.join("&");
            }
            this.getAjax(url, (res) => {
                if (res.code === 1) {
                    // 给每一首歌补一个 selectPlaylistId，方便页面 select 使用
                    res.data.forEach((item) => {
                        item.selectPlaylistId = "";
                    });
                    this.musicList = res.data;
                }
                else {
                    alert(res.msg || "音乐列表加载失败");
                }
            });
        },
        /**
         * 获取分类
         */
        getCategoryList() {
            this.getAjax("/categories", (res) => {
                if (res.code === 1) {
                    this.categoryList = res.data;
                }
            });
        },
        /**
         * 清空搜索
         */
        clearSearch() {
            this.keyword = "";
            this.category = "";
            this.getMusicList();
        },
        /**
         * 获取收藏列表
         */
        getFavoriteList() {
            this.getAjax("/favorite/list", (res) => {
                if (res.code === 1) {
                    this.favoriteList = res.data;
                }
            });
        },
        /**
         * 判断某首歌是否已经收藏
         */
        isFavorite(musicId) {
            let result = false;
            this.favoriteList.forEach((item) => {
                if (item.id === musicId) {
                    result = true;
                }
            });
            return result;
        },
        /**
         * 收藏 / 取消收藏
         */
        toggleFavorite(music) {
            if (this.isFavorite(music.id)) {
                this.removeFavorite(music.id);
            }
            else {
                this.addFavorite(music.id);
            }
        },
        /**
         * 添加收藏
         */
        addFavorite(musicId) {
            this.postAjax("/favorite/add", {
                music_id: musicId
            }, (res) => {
                alert(res.msg || "操作完成");
                if (res.code === 1) {
                    this.getFavoriteList();
                }
            });
        },
        /**
         * 取消收藏
         */
        removeFavorite(musicId) {
            this.postAjax("/favorite/remove", {
                music_id: musicId
            }, (res) => {
                alert(res.msg || "操作完成");
                if (res.code === 1) {
                    this.getFavoriteList();
                }
            });
        },
        /**
         * 获取播放列表
         */
        getPlaylistList() {
            this.getAjax("/playlist/list", (res) => {
                if (res.code === 1) {
                    this.playlistList = res.data;
                }
            });
        },
        /**
         * 新建播放列表
         */
        createPlaylist() {
            let name = this.newPlaylistName.trim();
            if (!name) {
                alert("播放列表名称不能为空");
                return;
            }
            this.postAjax("/playlist/create", {
                name: name,
                description: this.newPlaylistDesc
            }, (res) => {
                alert(res.msg || "操作完成");
                if (res.code === 1) {
                    this.newPlaylistName = "";
                    this.newPlaylistDesc = "";
                    this.getPlaylistList();
                }
            });
        },
        /**
         * 删除播放列表
         */
        deletePlaylist(playlistId) {
            if (!confirm("确定删除这个播放列表？")) {
                return;
            }
            this.postAjax("/playlist/delete/" + playlistId, {}, (res) => {
                alert(res.msg || "操作完成");
                if (res.code === 1) {
                    this.getPlaylistList();
                }
            });
        },
        /**
         * 获取播放列表详情
         */
        getPlaylistDetail(playlistId) {
            this.getAjax("/playlist/detail/" + playlistId, (res) => {
                if (res.code === 1) {
                    this.currentPlaylist = res.data;
                    this.pageName = "playlistDetail";
                }
                else {
                    alert(res.msg || "详情加载失败");
                }
            });
        },
        /**
         * 添加歌曲到播放列表
         */
        addToPlaylist(music) {
            if (!music.selectPlaylistId) {
                alert("请先选择一个歌单");
                return;
            }
            this.postAjax("/playlist/add_music", {
                playlist_id: music.selectPlaylistId,
                music_id: music.id
            }, (res) => {
                alert(res.msg || "操作完成");
                if (res.code === 1) {
                    music.selectPlaylistId = "";
                    this.getPlaylistList();
                }
            });
        },
        /**
         * 从播放列表移除歌曲
         */
        removeFromPlaylist(musicId) {
            if (!confirm("确定从播放列表移除这首歌？")) {
                return;
            }
            this.postAjax("/playlist/remove_music", {
                playlist_id: this.currentPlaylist.id,
                music_id: musicId
            }, (res) => {
                alert(res.msg || "操作完成");
                if (res.code === 1) {
                    this.getPlaylistDetail(this.currentPlaylist.id);
                    this.getPlaylistList();
                }
            });
        },
        /**
         * 播放音乐
         */
        playMusic(music) {
            this.currentMusic = music;
            // 等页面上的 audio 标签更新 src 后再播放
            this.$nextTick(() => {
                let audio = document.getElementById("audio_player");
                if (audio) {
                    audio.play();
                }
            });
        },
        /**
         * 秒数转成 分:秒
         */
        formatTime(seconds) {
            if (!seconds) {
                return "--:--";
            }
            let min = Math.floor(seconds / 60);
            let sec = Math.floor(seconds % 60);
            let secText = sec < 10 ? "0" + sec : String(sec);
            return min + ":" + secText;
        }
    },
    mounted() {
        this.checkLogin();
    }
});
