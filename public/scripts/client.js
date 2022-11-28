var socket = new WebSocket("ws://localhost:8080/ws");
let init = false;
let firstTurn = true;
let field = [];
let size = 10;
let id = -1;

let turn = -1;

let moves = 3;
//открыли сокет
socket.onopen = function() {
    CreateField();
}

//пришло сообщение с сервера
socket.onmessage = function(message) {
    let dataFromServer = JSON.parse(message);
    //Это первое сообщение от сервера, приходит, когда подключились 2 игрока
    if(!init) 
    {
        init = dataFromServer.gameStarted;
        id = dataFromServer.id;
        turn = dataFromServer.turn;
        //Убираем надпись "Ожидание игрока"

        //Делаем поле, которое создали при подключении к серверу - видимым
        
        // Производим инициализацию поля
        field = new Array(size).fill(0);
        //Смотрим на то, чей ход. Если мой, то вывожу, что мой ход  и число шагов в том месте, где было ожидание игрока
    }
    //Дальше сообщение от сервера о ходах врага или об окончании игры
    if(!dataFromServer.gameContinue)
    {
        //Завершить игру
    }
    else 
    {
        //Добавил новое значение статуса точки
        field[dataFromServer.point.x][dataFromServer.point.y] = dataFromServer.value;
        //Обновить картинку для этой точки
        
        //Обновить число шагов
        moves = dataFromServer.moves;
        
    }
    
};


function Click(x, y) {

}

// Создание поля
function CreateField() {
    console.log("ok");
}