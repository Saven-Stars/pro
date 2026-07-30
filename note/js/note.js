// 后端接口基础地址
let baseUrl = "https://note-system.up.railway.app"
// 标记当前模式：true登录 / false注册
let isLoginMode = true

// 页面DOM全部加载完成后，再绑定所有事件

    // 1. 登录/注册模式切换
    $("#switch_text").click(() => {
        isLoginMode = !isLoginMode
        if (isLoginMode) {
            $("#auth_title").text("登录")
            $("#auth_btn").text("登录")
            $("#switch_text").text("没有账号？去注册")
        } else {
            $("#auth_title").text("注册")
            $("#auth_btn").text("注册")
            $("#switch_text").text("已有账号？去登录")
        }
    })

    // 2. 登录/注册按钮点击事件
    $("#auth_btn").click(() => {
        let username = $("#username").val().trim()
        let password = $("#password").val().trim()

        // 前端非空校验
        if (!username || !password) {
            alert("用户名和密码不能为空")
            return
        }

        // 根据模式选择对应接口
        let reqUrl = isLoginMode ? "/auth/login" : "/auth/reg"
        $.ajax({
            url: baseUrl + reqUrl,
            type: "post",
            contentType: "application/json",
            // 跨域携带Cookie，维持登录状态
            xhrFields: { withCredentials: true },
            data: JSON.stringify({
                username: username,
                password: password
            }),
            success: (res) => {
                alert(res.msg)
                // 登录成功：切换页面并加载笔记列表
                if (res.code === 1 && isLoginMode) {
                    switchToNotePage(res.username)
                    getNoteList()
                }
                // 注册成功：切回登录表单，清空输入框
                if (res.code === 1 && !isLoginMode) {
                    isLoginMode = true
                    $("#auth_title").text("登录")
                    $("#auth_btn").text("登录")
                    $("#switch_text").text("没有账号？去注册")
                    $("#username").val("")
                    $("#password").val("")
                }
            }
        })
    })

    // 3. 添加笔记按钮
    $("#add_note_btn").click(() => {
        let title = $("#note_title").val().trim()
        let content = $("#note_content").val()

        if (!title) {
            alert("标题不能为空")
            return
        }

        $.ajax({
            url: baseUrl + "/note/add",
            type: "post",
            contentType: "application/json",
            xhrFields: { withCredentials: true },
            data: JSON.stringify({
                title: title,
                content: content
            }),
            success: (res) => {
                alert(res.msg)
                if (res.code === 1) {
                    // 清空输入框，刷新列表
                    $("#note_title").val("")
                    $("#note_content").val("")
                    getNoteList()
                }
            }
        })
    })

    // 4. 删除笔记（事件委托，支持动态生成的元素）
    $("#note_list").on("click", ".del_btn", function(){
        let nid = $(this).attr("data-id")
        if (!confirm("确定删除这条笔记？")) return

        $.ajax({
            url: baseUrl + "/note/del",
            type: "post",
            contentType: "application/json",
            xhrFields: { withCredentials: true },
            data: JSON.stringify({ id: nid }),
            success: (res) => {
                alert(res.msg)
                getNoteList()
            }
        })
    })

    // 5. 退出登录按钮
    $("#logout_btn").click(() => {
        $.ajax({
            url: baseUrl + "/auth/out",
            type: "get",
            xhrFields: { withCredentials: true },
            success: (res) => {
                alert(res.msg)
                // 切回登录页，清空内容
                $("#note_box").hide()
                $("#auth_box").show()
                $("#username").val("")
                $("#password").val("")
                $("#note_list").html("")
            }
        })
    })


/**
 * 切换展示笔记页面
 * @param {string} uname 登录用户名
 */
function switchToNotePage(uname) {
    $("#auth_box").hide()
    $("#note_box").show()
    $("#show_username").text(uname)
}

/**
 * 获取并渲染当前用户的笔记列表
 * 仅登录成功、新增、删除后调用
 */
function getNoteList() {
    $.ajax({
        url: baseUrl + "/note/note_list",
        type: "get",
        xhrFields: { withCredentials: true },
        success: (res) => {
            // 未登录则跳回登录页
            if (res.code === 0) {
                alert(res.msg)
                $("#note_box").hide()
                $("#auth_box").show()
                $("#note_list").html("")
                return
            }

            let htmlStr = ""
            res.data.forEach(item => {
                htmlStr += `
                <div class="note_item">
                    <div>
                        <h3>${item.title}</h3>
                        <p>${item.content || "无内容"}</p>
                        <div class="time">${item.time}</div>
                    </div>
                    <button class="del_btn" data-id="${item.id}">删除</button>
                </div>
                `
            })
            $("#note_list").html(htmlStr)
        }
    })
}