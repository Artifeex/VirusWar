const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const app = express();
const bodyParser = require("body-parser");
const { futimesSync } = require("fs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var server = http.createServer(app);
var wss = new WebSocket.Server({server});

let players = [];
let moves = [];
let field = [];
let size = 10;
let gameStarted = false;
let winner = -1;
// 1. Подключился первый клиент ничего ему не отправляем
// 2. Подключился второй клеинт - отправляем обоим клиентам инфу о том, что игра началась, можно генерировать поле. Посылаем какой-то init, в котором понимаем, что это первый ход
// 3. Ожидаем 

//Состояния клеток:
// 0 - cвободная
// 1 - занято крестиком
// 2 - занято 0
// 3 - убитый крестик
// 4 - убитый нолик


wss.on("connection", function connection(ws, req) {
    clients.push(ws);
    // Инициализация игры
    if(gameStarted == false && clients.length == 2)
    {
        // Создаем поле для игры
        console.log("Два клиента готовы играть");
        for(let i = 0; i<size;i++) 
        {
            field[i] = new Array(size).fill(0);
        }
        moves[0] = 3;
        moves[1] = 3;
        // Иниализируем игры
        gameStarted = true;
        //Надо запомнить дату матча


        // Отправляем информацию первому пользователю
        players[0].send(JSON.stringify({
            gameStarted: true,
            turn: 0,
            id: 0
        }))
        // Отправляем информацию второму пользователю
        players[1].send(JSON.stringify({
            gameStarted: true,
            turn: 0,
            id: 1
        }))
    }
    // Игра идет, ждем сообщения о ходах от пользователей
    ws.on('message', function incoming(message) {
        // Определяю от какого пользователя пришел ход, чтобы понять, каким значение заполнить поле field.
        let data = JSON.parse(message);
        //Узнал от какого пользователя
        let curId = data.id;

        // Уменьшаем число шагов и обновляем число шагов аппоненту, если закончились шаги у врага
        moves[curId] -= 1;
        if(moves[curId] == 0)
            moves[1-curId] = 3;
        
        //Точка, которую поставил пользователей. Она 100% правильная, так как проверки правильности выбора точек осуществляются на клиенте
        let point = data.point;
        // Новое состояние клетки
        let value = data.value;
        field[point.y][point.x] = value;
        //Проверяем игру на окончание
        if(IsGameEnded())
        {
            //Завершаем игру
            
        }
        else
        {
            //отправляем данные о ходе соперника
            players[1 - curId].send(JSON.stringify({
                point: point,
                value: value,
                gameContinue: true,
                winner: winner,
                moves: moves[1-curId]
            }));
        }
        
       
    })


})

function IsGameEnded() 
{

}

server.listen(8080, function listen(err) {
    if(err)
    {
        console.log(err);
        return;
    }
    else
        console.log("Server is listenning on port: " + 8080);
});

app.get("/", function(req, res) {
    res.redirect(301, "index.html");
})



app.listen(3000);