
var socket = new WebSocket("ws://localhost:8080/ws");
let init = false;
let firstTurn = true;
let field = [];
let size = 10;
let id = -1;
let point;
let turn = -1;
let table;
let moves = 3;
let thead
let tbody
let playerMark;
let enemyMark;
//Состояния клеток:
// -1 - cвободная
// 0 - занято крестиком
// 1 - занято 0
// 2 - убитый нолик
// 3 - убитый крестик




//открыли сокет
socket.onopen = function() {
    CreateField();
}

//Обработка сообщений с сервера
socket.onmessage = function(message) {
    let dataFromServer = JSON.parse(message.data);
    //Это первое сообщение от сервера, приходит, когда подключились 2 игрока
    if(!init) 
    {
        init = dataFromServer.gameStarted;
        id = dataFromServer.id;
        turn = dataFromServer.turn;
        //Убираем надпись "Ожидание игрока"
        if(id == 0)
        {
            playerMark = "x"
            enemyMark = "o"
        }
            
        else
        {
            playerMark = "o"
            enemyMark = "x"
        }
           
        //Делаем поле, которое создали при подключении к серверу - видимым
        
        // Производим инициализацию поля
        for(let i = 0; i<size;i++) 
        {
            field[i] = new Array(size).fill(-1);
        }
        //Смотрим на то, чей ход. Если мой, то вывожу, что мой ход  и число шагов в том месте, где было ожидание игрока
    }

    //if(!dataFromServer.gameContinue)
        //Завершить игру
        //window.location.href = "index.html"
    else 
    {
        
        field[dataFromServer.point.y][dataFromServer.point.x] = dataFromServer.value;
        //Обновить картинку для этой точки
        document.getElementById(dataFromServer.point.x.toString() + dataFromServer.point.y.toString()).innerHTML = enemyMark
        //Обновить число шагов
        moves = dataFromServer.moves;


    }
    
};

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
    console.log(result)
    return result
}

// -1 - cвободная
// 0 - занято крестиком
// 1 - занято 0
// 2 - убитый нолик
// 3 - убитый крестик

function IsCorrect(x, y) {
    //Выбранная клетка является клеткой моего хода или убитым крестиком или убитым ноликом id + 2 - это твой убитый враг
    if(field[y][x] == id || field[y][x] == id + 2)
        return false
    areas = GetAreas(x, y)
    for(point of areas) {
        // Если в окрестности точки оказалась моя точка или убитого мною врага(id + 2), то все хорошо
        if(field[point[1]][point[0]] == id || field[point[1]][point[0]] == id + 2)
            return true
    }
    return false
}


function CorrectFirstTurn(x, y) {
    if(id === 0) {
        if(x===0 && y===0)
            return true
    }
    else {
        if(x===9 && y === 9)
            return true
    }
    return false
}


function UpdateField(x, y) {
    moves -= 1
    let elem = document.getElementById(x.toString() + y.toString())
    // Значит свободная клетка
    if(field[y][x] == -1) {
        field[y][x] = id
        elem.innerHTML = playerMark
    }
    //Клетка врага
    else {
        field[y][x] = id + 2
        //поменять frontend
        elem.innerHTML = playerMark
    }

}


function Click() {
    point = this.id
    x = Number(point[0])
    y = Number(point[1])
    
    if(moves > 0) {
        if(firstTurn) {
            if(CorrectFirstTurn(x, y)) {
                UpdateField(x, y)
                socket.send(JSON.stringify( 
                    {
                        point: {x, y},
                        value: field[y][x]
                    }));
                firstTurn = false
            }
            else {
                if(id == 0)
                    alert("Крестики должны начинать с позиции (0,0)")
                else if(id == 1)
                    alert("Нолики должны начинать с позиции (9, 9)")
                return
            }   
        }
        else {
            if(IsCorrect(x, y)) {

                UpdateField(x, y)
                socket.send(JSON.stringify( {
                    point: {x, y},
                    value: field[y][x]
                    }))
            }   
            else {
                alert("Неправильный ход!")
                return
            }
        }
    }
    else {
        alert("Сейчас ход противника!")
    }
}

// Создание поля
function CreateField() {
    doby = document.getElementById('body_html')
    table = document.createElement('table')
    thead = document.createElement('thead')
    tbody = document.createElement('tbody')
    let row
    let td
    table.appendChild(thead)
    table.appendChild(tbody)
    document.getElementById('body_html').appendChild(table)
    for(let i = 0;i < size;i++) {
        row = document.createElement("tr")
        for(let j = 0; j< size; j++) {
            
            td = document.createElement("td")
            div = document.createElement('div')
            div.onclick = Click

            div.classList.add("cell")
            div.setAttribute('id', j.toString() + i.toString())
            td.appendChild(div)
            row.appendChild(td)
        }
        tbody.appendChild(row)
    }

}