console.log('解析网易歌单');


var Song = {
    index: 0,//integer
    name: "",
    singer: "",
    album: "",
    wangyi_id: "",
    xiami_id: "",
    available: ""
}

var SongList = {
    listName: "",
    list_id: '',
    list_from: ''
}


var songList = Object.create(SongList);

//获取iframe框架
var iframe = $('#g_iframe').contents();

//歌单名称
listName = $('h2.f-ff2:first', iframe).text();

if (listName == null || listName == '') {
    throw new Error("不是歌单页面");
}



//发送 歌单名称给 backGround 顺便获取url
chrome.extension.sendRequest({ greeting: "getListId", listName: listName }, function (response) {
    console.log(response.farewell);
    if (response.farewell == 'success') {
        songList.listName = listName;   //歌单名称
        songList.list_id = response.list_id;  //歌单id
        songList.list_from = 'wangyi_'; //歌单from
    } else {
        throw new Error("获取url错误");
    }
});


// 遍历网易云音乐列表的每一首歌
var songs = [];
var trs = $('tr', iframe);
//防止全部有版权 不触发存入数据库函数
$.ajax({
    url:'http://music.163.com'
})
trs.each(function () {
    if (typeof ($(this).attr('class')) != 'undefined') {    
        var song = Object.create(Song);
        //获取歌曲info
        song.index = Number($('span.num', this).text());
        song.name = $('b', this).text();
        song.singer = $($('td', this)[3].children[0].children[0].children[0]).text();
        song.album = $($('td', this)[4].children[0].children[0]).text();
        song.wangyi_id = $('a', $('td', this)[1]).attr('href').slice(9)


        //如果歌曲网易没版权
        if ($(this).attr('class').search("js-dis") != -1) {
            var tempSong = Object.create(Song);
            var flag = true;
            // 
            var xiamiQuerryUrl = "http://www.xiami.com/search?key=" + song.name + " " + song.singer + " " + song.album;
            $.ajax({
                async: true,
                url: xiamiQuerryUrl,
                success: function (data) {
                    data = $.parseHTML(data);
                    // 遍历一首歌的所有虾米有版权的结果
                    $(data).find("[checked='checked']").each(function () {
                        tempSong.xiami_id = $(this).attr('value');
                        let index = 0;
                        $(this).parent().parent().find("[target='_blank']").each(function () {
                            switch (index) {
                                case 0:
                                    tempSong.name = $.trim($(this).text());
                                    index++;
                                    break;
                                case 1:
                                    tempSong.singer = $.trim($(this).text());
                                    index++;
                                    break;
                                case 2:
                                    let txt_album = $.trim($(this).text());
                                    tempSong.album = txt_album.substring(1, txt_album.length - 1);
                                    if (flag) {
                                        flag = false;
                                        //覆盖信息
                                        song.name = tempSong.name;
                                        song.singer = tempSong.singer;
                                        song.album = tempSong.album;
                                        song.xiami_id = tempSong.xiami_id;
                                        song.available = 'xiami_';
                                    }
                                    break;
                            }
                        });
                    });

                }
            });
        } else {  //如果歌曲网易有版权
            song.available = 'wangyi_'
        }
        

        songs.push(song);

        // console.log(key);
        // songs.push({[key]:song});
    }


})

//所有ajax结束再执行
$(document).ajaxStop(function () {
    
    console.log(songs);


    if (!$.isEmptyObject(songs)) {
        var timestamp = Date.parse(new Date());
        var list = { [timestamp]: songList }
        //判断sync是否已存在歌单
        chrome.storage.sync.get(null, function (lists) {
            for (key in lists) {
                if (lists[key] == songList) {
                    console.log('歌单已存在')
                    chrome.storage.sync.remove(key); //删除 sync 中的list
                }
            }

        });
        //要求background将songs存入数据库
        chrome.extension.sendRequest({ greeting: "savaSongsInDB", listName: listName, songs: songs }, function (response) {
            console.log(response.farewell);
            if (response.farewell == 'success') {
                console.log('songs存入数据库');
                chrome.storage.sync.set(list, function () {
                    console.log("list存入sync");
                });
            }
        });

    }

});


