const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const app = express();
const bodyParser = require("body-parser");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var server = http.createServer(app);
var wss = new WebSocket.Server({server});
let db = require("./db");
const { start } = require("repl");
let players = [];
let moves = [];
let field = [];
let size = 10;
let gameStarted = false;
let winner = -1;
let curTurnId = -1;
let curId = -1
let firstTurn = true
let startTime;
// 1. Подключился первый клиент ничего ему не отправляем
// 2. Подключился второй клеинт - отправляем обоим клиентам инфу о том, что игра началась, можно генерировать поле. Посылаем какой-то init, в котором понимаем, что это первый ход
// 3. Ожидаем 

//Состояния клеток:
// -1 - cвободная
// 0 - занято крестиком
// 1 - занято 0
// 2 - убитый нолик
// 3 - убитый крестик


wss.on("connection", function connection(ws, req) {
    players.push(ws);
    // Инициализация игры
    if(gameStarted == false && players.length == 2)
    {

        // Создаем поле для игры
        console.log("Два клиента готовы играть");
        for(let i = 0; i<size;i++) 
        {
            field[i] = new Array(size).fill(-1);
        }
        moves[0] = 3;
        moves[1] = 0;
        // Иниализируем игры
        gameStarted = true;
        //Надо запомнить дату матча
        curTurnId = 0

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
        startTime = new Date()
    }




    // Пришло сообщение от игрока(от игрока мы передаем только координаты хода)
    ws.on('message', function incoming(message) {
        // Определяю от какого пользователя пришел ход, чтобы понять, каким значение заполнить поле field.
        let data = JSON.parse(message);
        //Узнал от какого пользователя
        
        if(players[0] === ws)
            curId = 0
        else {
            curId = 1
            firstTurn = false
        }
            

        // Уменьшаем число шагов и обновляем число шагов аппоненту, если закончились шаги у врага
        moves[curId] -= 1;
        if(moves[curId] == 0) {
            moves[1-curId] = 3;
            curTurnId = 1 - curId
        }
        
        
        //Точка, которую поставил пользователей. Она 100% правильная, так как проверки правильности выбора точек осуществляются на клиенте
        let point = data.point;
        // Новое состояние клетки
        field[point.y][point.x] = data.value;
        //отправла сообщения о ходе врага
        players[1 - curId].send(JSON.stringify({
            point: point,
            value: data.value,
            gameContinue: true,
            isSkipTurn:false,
            winner: winner,
            moves: moves[1-curId],
            curTurnId: curTurnId
        }));

        //Проверяем игру на окончание
        if(IsGameEnded() && !firstTurn) {
           players[0].send(JSON.stringify(
            {
                gameContinue:false,
                winner: winner
            }
           ))
           players[1].send(JSON.stringify(
            {
                gameContinue:false,
                winner: winner
            }
           ))
           players[0].close()
           players[1].close()
           players=[]
           let endTime = new Date()
           let result
           let duration = Math.floor((endTime- startTime) / 60000)
           if(winner == 0) {
                result = "Победа крестиков"
           }
           else {
                result = "Победа ноликов"
           }

           db.query("INSERT INTO games (date, duration, result) VALUES (?, ?, ?);", 
           [startTime, duration, result], function (error) {
            if (error) {
                console.log(error);
                return;
                }
            })
        }

        if(IsSkipTurn()) {
            curTurnId = 1 - curTurnId
            moves[curTurnId] = 3;
            if(moves[1-curTurnId] != 0)
                players[1-curTurnId].send(JSON.stringify( 
                    {
                        isSkipTurn:true,
                        point: point,
                        value: data.value,
                        gameContinue: true,
                        moves: 0,
                        curTurnId: curTurnId
                    }
            ))
            players[curTurnId].send(JSON.stringify(
                {
                    isSkipTurn: false,
                    point: [-1, -1],
                    moves: moves[curTurnId],
                    curTurnId: curTurnId,
                    gameContinue: true
                }
            ))
        }
              
    })

})


function GetAreas(x, y) {
    result = []
    for(let x_i= x-1; x_i < x + 2; x_i++) {
        if(x_i < 0 || x_i > 9)
            continue
        for(let y_i = y-1; y_i < y + 2;y_i++) {
            if(y_i < 0 || y_i > 9 || (x_i == x && y_i == y))
                continue
            result.push([x_i , y_i])
        }
    }
    return result
}


function IsSkipTurn() {
    let potentialPoints = []
    for(let i = 0; i < size; i++) {
        for(let j = 0; j < size; j++) {
            if(field[i][j] == curTurnId || field[i][j] == curTurnId + 2)
                potentialPoints.push([i, j])
        }
    }
    if(potentialPoints.length === 0)
        return false
    for(point of potentialPoints) {
        let areas = GetAreas(point[1], point[0])
        for(let areasPoint of areas) { 
            // Проверили, что в доступности есть свободная клетка или клетка врага, которую можно съесть
            if(field[areasPoint[1]][areasPoint[0]] == -1 || field[areasPoint[1]][areasPoint[0]] == 1 - curTurnId) 
                return false
        }
    }
    return true
} 

function IsGameEnded() {
    let countAlifeX = 0
    let countAlifeO = 0
    for(let i = 0; i < size; i++) {
        for(let j = 0; j < size; j++) {
            if(field[i][j] == 0)
                countAlifeX++
            else if(field[i][j] == 1)
                countAlifeO++
        }
    }
    if(countAlifeO == 0) {
        winner = 0
        return true
    }
    else if(countAlifeX == 0) {
        winner = 1
        return true
    }
    else {
        return false
    }
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


app.get("/history", function(req, res) {
    db.query("select * from games;", function(err, rows) {
        if(err) {
            console.log(err)
            return
        }
        res.end(JSON.stringify(rows))
    })
})

app.get("/", function(req, res) {
    res.redirect(301, "index.html");
})



app.listen(3000);