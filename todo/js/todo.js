
let baseUrl = "https://todo-system.up.railway.app";

//加载待办列表
function loadList() {
    $.ajax({
        url: baseUrl + '/to_do/get',
        type: 'get',
        data: {},
        success: function (res) {
            let htmlStr = '';
            if (res.mark != 0) {
                $.each(res.msg, function (index, item) {
                    htmlStr +=
                        `<div>${item.content}
                    <button class = "del_btn" index=${item.index}> 删除</button >
                    </div > `;
                })
            }
            else {
                htmlStr += `<div>${res.msg}</div > `;

            }
            $('#todo_contain').html(htmlStr);

        }
    })
}
//添加
$('#add_btn').click(() => {
    let inputText = $('input').val();
    if (!inputText) {
        alert("请输入内容！");
        return;
    }
    $.ajax({
        url: baseUrl + '/to_do/add',
        type: 'post',
        contentType: "application/json",
        data: JSON.stringify({
            content: inputText
        }),
        success: function (res) {
            alert(res.msg);
            loadList();
            $('input').val("");
        }
    })
})

//清空
$("#delAll_btn").click(() => {
    $.ajax({
        url: baseUrl + '/to_do/delete_all',
        type: 'get',
        data: {},
        success: (res) => {
            loadList();
            alert(res.msg);
        }
    })
})

//删除
$("#todo_contain").on('click', '.del_btn', function () {
    let idx = $(this).attr('index')
    $.ajax({
        url: baseUrl + "/to_do/delete",
        type: 'post',
        contentType: 'application/json',
        data: JSON.stringify({
            index: idx
        }),
        success: (res) => {
            alert(res.msg);
            loadList();
        }
    })
})


loadList(); 
