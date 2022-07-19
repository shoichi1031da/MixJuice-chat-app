
const express = require("express");
const app = express();
const fs = require('fs');
const http = require("http");
const { receiveMessageOnPort } = require("worker_threads");
const server = http.createServer(app);
const io = require("socket.io")(server);

//herokuサーバーにCORSのヘッダー追加ができなかったためコメントアウト
    // const cors = require('cors');
    // app.use(cors());
    // const corsOption = {
    //     origin: [
    //       "https://fukuno.jig.jp"
    //     ],
    //     credentials: true,
    //   };
    //   app.use(cors(corsOption));

const PORT = process.env.PORT || 3000;
const IchigoJamEncoder = require("./public/js/IchigoJamEncoder");

//publicディレクトリ内のファイルをロードできるようになる
app.use(express.static('public'));

app.get("/",(req,res) => {
    console.log(req.headers);
    app.set("sendMsg","");
    let cliantType = req.headers["user-agent"];
        console.log("\n クライアントタイプ:" + cliantType);
    let recMsg = req.query.msg;
        console.log(" エンコード前:" + recMsg);
    let encodedUri = encodeURI(recMsg); 
        console.log(" ユニコード化:" + encodedUri);

    //パラメータで受け取った文字列をエンコード
    if(recMsg){
        const sendMsg = IchigoJamEncoder(recMsg);
        
        if(cliantType.substr(0,8) == "MixJuice" || cliantType.substr(0,7) == "Mozilla"){
            io.emit("chat message", sendMsg);
            app.set("sendMsg",sendMsg);
            console.log(" ブラウザ表示:" + sendMsg);
        }else{
            app.set("sendMsg",recMsg);
        }
    }

    //MixJuice側へのHTMLレスポンスを強制終了させるためにリダイレクトエラーを起こす
    if(req.query.redirect){
        console.log(" リダイレクト:" + req.query.redirect);
        res.redirect('https://google.com');
    }

    res.sendFile(__dirname + "/index.html");
});

//WebSocketの接続
io.on("connection", (socket) => {
    console.log("ユーザーが接続しました");
    let sendMsg = app.get("sendMsg")
    if(sendMsg){
        io.emit("chat message",sendMsg);
        console.log(" ブラウザ表示:" + sendMsg);
    }
});

server.listen(PORT, () => {
    console.log("listening on " + PORT);
});


