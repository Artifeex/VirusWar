
let date_format = {
    day: 'numeric',
    month: 'numeric',
    year: '2-digit',
    hour: 'numeric',
    minute: 'numeric'
};

function init() {
    var oReq = new XMLHttpRequest();

    //Настроили запрос
    oReq.open("GET", '/history')
    //отсылаем запрос
    oReq.send()
    //Этот код сработает после того, как мы получим ответ сервера
    oReq.onload = function() {
        if (oReq.status != 200) { // анализируем HTTP-статус ответа, если статус не 200, то произошла ошибка
            alert(`Ошибка ${oReq.status}: ${oReq.statusText}`);
        }
        else {
            let response = JSON.parse(oReq.response)
            let table = document.getElementById("table_data")
            table.innerHTML = ""
            let header = table.createTHead()
            let headerRow = header.insertRow()
            headerRow.insertCell().innerHTML = "Дата"
            headerRow.insertCell().innerHTML = "Продолжительность"
            headerRow.insertCell().innerHTML = "Результат"
            let body = table.createTBody()
            for(row of response) {
                let newRow = body.insertRow()
                for(let key in row) {
                    let cell = newRow.insertCell()
                    if(key == 'date') {
                        let a = new Date(row[key])
                        cell.innerHTML = a.toLocaleString("ru", date_format)
                    }
                    else {
                        cell.innerHTML = row[key]
                    }
                }
            }
        }
        
    }
}
   


