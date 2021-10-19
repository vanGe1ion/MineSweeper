let gParams = {};
let field = [];


let startSound = new Audio('media/vol/start.mp3');
let ambient = new Audio('media/vol/ambient.mp3');
let endSound = new Audio();

startSound.addEventListener('ended', ()=>{
	ambient.currentTime = 0;
	ambient.play()
});
ambient.addEventListener('ended', ()=>ambient.play());


let img = document.querySelectorAll('img')[0];
img.addEventListener('click', HideMedia);


const DIFFICULTY = {
    EASY:0,
    MEDIUM:1,
    HARD:2,
    CUSTOM:3
};


function GetGameParams(difficulty) {
    switch (difficulty){
    case 0:
        return {
            height: 9,
            width: 9,
            mines: 10
        };
	case 1:
		return {
			height: 16,
			width: 16,
			mines: 40
		};
	case 2:
		return {
			height: 16,
			width: 30,
			mines: 99
		};
	case 3:
		return GetFieldParam();
    }
}


function GetFieldParam() {
    let width  = +document.getElementById('fWidth').value;
    let height = +document.getElementById('fHeight').value;
    let mines =  +document.getElementById('cMine').value;
    let mineRule = Math.ceil(width*height*0.85);
    return {
        height:height ? height : 5,
        width:width ? width : 5,
        mines:mines > mineRule ? mineRule : mines
    }
}


function SetDifficulty(difficulty) {
    gParams = GetGameParams(difficulty);
}


function CreateField() {
    field = new Array(gParams.height);
    for(let i = 0; i < gParams.height; ++i){
        field[i] = new Array(gParams.width);
    }
}


function FillFieldRandom() {
    for(let i = 0; i < gParams.mines; ++i){
        let mine = {
            x:0,
            y:0
        };

        do {
            mine.x = Math.floor(Math.random() * (gParams.height));
            mine.y = Math.floor(Math.random() * (gParams.width));
        }while (!(typeof(field[mine.x][mine.y]) === 'undefined'));
        field[mine.x][mine.y] = -1;
    }

    for(let i = 0; i < gParams.height; ++i){
        for(let j = 0; j < gParams.width; ++j){
            if (typeof(field[i][j]) === 'undefined')
                field[i][j] = SetSatelliteMineCount({x:i, y:j});
        }
    }
}


function SetSatelliteMineCount(coord){
    let mines = 0;

    EachCellSatellite(coord, (i, j) => {
        if ((field[i][j]) === -1)
            ++mines;
    });

    return mines;
}


function DrawField() {
    let score = document.getElementsByClassName('mcount')[0];
    score.innerHTML = gParams.mines;

    let board = document.getElementsByClassName('board')[0];
    board.style.display = 'flex';
    board.innerHTML = '';
    for (let i = 0; i < gParams.height; ++i) {
        let row = document.createElement('div');
        row.className = 'row';
        for (let j = 0; j < gParams.width; ++j) {
            let cell = document.createElement('div');
            cell.className = 'cell digit';
            cell.dataset.coord = i.toString() + ';' + j.toString();
            cell.addEventListener('contextmenu', RightClickHandler);
            cell.addEventListener('click', ClickHandler);

            row.appendChild(cell);
        }
        board.appendChild(row);
    }
}


function RightClickHandler(event){
    event.preventDefault();
    let scorespan = document.getElementsByClassName('mcount')[0];

    let cell = this;
    if(!cell.className.includes('n-bg')) {
        if (cell.className.includes('flag')) {
            cell.className = cell.className.replace('flag', '').trim();
            scorespan.innerHTML = +scorespan.innerHTML + 1;
        }
         else {
            cell.className += ' flag';
            scorespan.innerHTML = +scorespan.innerHTML - 1;
        }
    }

    VictoryCheck();
}


function ClickHandler(event){
    let cell = event.target;
    let coord = {
        x:+cell.dataset.coord.split(';')[0],
        y:+cell.dataset.coord.split(';')[1]
    };
    let value = field[coord.x][coord.y];

    if (!(cell.className.includes('n-bg') || cell.className.includes('flag'))){//
        cell.className += ' n-bg';

        if (value > 0){
            cell.className += ' ' + GetDigit(value);
            cell.innerHTML = value;
        }

        if (value === 0) {
            EmptyExpanding(coord);
        }

        if(value < 0) {
            cell.className += ' mine boom';
            GameOver();
        }
    }

    VictoryCheck();
}


function EndGame(){
	let cells = document.getElementsByClassName('cell');
    for(let cell of cells){
        cell.removeEventListener('contextmenu', RightClickHandler);
        cell.removeEventListener('click', ClickHandler);
    }
	
	startSound.pause();
	ambient.pause();
}


function GameOver(){
    EndGame();

    for(let i = 0; i < gParams.height; ++i){
        for(let j = 0; j < gParams.width; ++j)
            if (field[i][j] === -1) {
                let cell = document.querySelector(`[data-coord='${i};${j}']`);
                if (!cell.className.includes('flag'))
                    cell.className += ' mine'
            }
    }

    let flags = document.getElementsByClassName('flag');
    for(let flag of flags){
        let coord = {
            x:+flag.dataset.coord.split(';')[0],
            y:+flag.dataset.coord.split(';')[1]
        };
        if(field[coord.x][coord.y] !== -1)
            flag.className = flag.className += ' miss';
    }
	
	GetMedia(false);
}


function Victory(){
	EndGame();
	GetMedia(true);
}


function VictoryCheck() {
    let flags = document.getElementsByClassName('flag');
    let shoots = 0;

    let mcounter = +(document.getElementsByClassName('mcount')[0]).innerHTML;
    if (mcounter === 0){
        for(let flag of flags){
            let coord = {
                x:+flag.dataset.coord.split(';')[0],
                y:+flag.dataset.coord.split(';')[1]
            };
            if(field[coord.x][coord.y] === -1)
                ++shoots;
        }
        let freeFieldsTarget = gParams.width * gParams.height - gParams.mines;
        let freFeeldsCurrent = document.getElementsByClassName('n-bg').length;
        if (shoots === gParams.mines && freeFieldsTarget === freFeeldsCurrent)
            Victory();
    }
}


function EmptyExpanding(coord){
    EachCellSatellite(coord, (i, j)=>{
        if (!(coord.x === i && coord.y === j)) {
            let elem = document.querySelector(`[data-coord='${i};${j}']`);
            elem.dispatchEvent(new Event('click'));
        }
    });
}


function EachCellSatellite(coord, callback) {
    for (let i = coord.x - 1; i < coord.x + 2; ++i)
        if (i >= 0 && i < gParams.height)
            for (let j = coord.y - 1; j < coord.y + 2; ++j)
                if (j >= 0 && j < gParams.width)
                    callback(i, j);
}


function GetDigit(num){
    return (['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'])[num];
}


const radios = document.querySelectorAll('input[name="difficulty"]');
radios.forEach(radio => {
    radio.addEventListener('change', RadioHandler);
});


function RadioHandler(event){
    let radio = event.target;
    let customPanel = document.getElementsByClassName('custom')[0];
    if (radio.id === 'dCustom')
        customPanel.style.display = 'block';
    else
        customPanel.style.display = 'none';
}


const startButton = document.getElementById('bStart');
startButton.addEventListener("click", StartHandler);

function StartHandler(){
	HideMedia();
	startSound.currentTime = 0;
	startSound.play();
	
    let difficulty = +document.querySelector('input[type="radio"]:checked').value;
    SetDifficulty(difficulty);
    CreateField();
    FillFieldRandom();
    DrawField();
}


function HideMedia(){
	endSound.pause();
	if(!img.className.includes('d-none'))
		img.className += 'd-none';
}


function GetMedia(state){
	endSound = new Audio('media/vol/' + (state ? 'succ' : 'fail') + '/' + (GetRnd(0, 5)) + '.mp3');
	endSound.play();
	
	img.src = 'media/pic/' + (state ? 'succ' : 'fail') + '/' + (GetRnd(0, 7)) + '.jpg';
	setTimeout(()=>{
		img.style.marginLeft = -img.width/2+'px';
		img.style.marginTop = -img.height/2+'px';
		img.className = img.className.replace('d-none', '');
	}, 50);

}


function GetRnd(min, max){
	return Math.floor(Math.random() * (max - min)) + min
}






