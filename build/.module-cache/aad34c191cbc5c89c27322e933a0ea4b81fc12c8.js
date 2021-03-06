//清空sync存储
function clearList() {
    chrome.storage.sync.clear(function() {
        console.log('sync以清空');
    });
};


var SongBox = React.createClass({displayName: "SongBox",
    getInitialState: function() {
        return { data: [] };
    },
    componentDidMount: function() {

        var songBox=this;
        var songs = [];
        chrome.extension.sendRequest({ greeting: "hello" }, function(response) {
            console.log(response.songs);
            songBox.setState({ data: response.songs });
        });

    },
    render: function() {
        return (
            React.createElement(SongList, {data: this.state.data})
        );
    }
});


var SongList = React.createClass({displayName: "SongList",

    render: function() {
        var songNodes = this.props.data.map(function(song) {
            return (
                React.createElement(SongInfo, {songFrom: song.from, songId: song.id, songName: song.name, songSinger: song.singer})
            );
        });
        console.log(songNodes);
        if (songNodes == null || songNodes == undefined || songNodes.length == 0) {
            songNodes = "列表空,请打开歌单页面右键添加歌曲";
        }
        return (
            React.createElement("div", null, 
                songNodes
            )
        );
    }
});

var SongInfo = React.createClass({displayName: "SongInfo",
    playMusic: function(songFrom, songId) {
        console.log(songFrom + songId);
    },
    render: function() {
        return (
            React.createElement("div", {onClick: this.playMusic.bind(this, this.props.songFrom, this.props.songId), id: this.props.songId, className: "SongInfo"}, 
                React.createElement("h4", {clasName: "SongName"}, 
                    this.props.songName
                ), 
                this.props.songSinger
            )
        );
    }
});

function playMusic(id) {
    id.innerHTML = 'hello!';
    console.log("播放音乐");
}



ReactDOM.render(
    React.createElement(SongBox, null),
    document.getElementById('musicList')
);

