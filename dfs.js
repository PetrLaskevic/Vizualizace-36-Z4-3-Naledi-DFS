class Stack{
  constructor() {
	this.elements = [];
  }
  put(element) { //enqueue
    this.elements.push(element);
  }
  get() { //dequeue
    return this.elements.pop();
  }
  get length() {
  	return this.elements.length;
  }
  get empty() { //isEmpty
    return this.elements.length === 0;
  }
}


document.getElementById("fakefileinput").addEventListener("keydown", function(event){
	console.log(event.key);
	if(event.key == "Enter"){
		document.getElementById("inputfile").click();
	}
});

let mazeAppClassHolderVariable; //the instance of the maze app
let zasobnik;
let animationDelay = document.getElementById("visualisationDelayPicker");

document.getElementById("resume").addEventListener("click", function(){
	mazeAppClassHolderVariable.zcelaHotovo = false;
	animationDelay.value = 0;
	mazeAppClassHolderVariable.runBFS();
});

class BFSMazeApp{
	constructor() {
		this.zasobnik = new Stack();
		this.pocetColumns = 0;
		this.pocetRows = 0;
		this.maze = [];
		this.startCoordinates = [];
		this.endCoordinates = [];
		this.zcelaHotovo = false;
		this.poleVidena = {};
		this.zJakehoPoleJsmeSemPrisli = {};
		this.delkaCesty = 0;
	}
	hideMaze(){
		this.graphicalMaze.hidden = true;
		document.getElementById("funFact").classList.add("hiddenWithNoHeight");
	}
	createMaze(){
		let table = document.createElement("table");
		let tbody = document.createElement("tbody");
		table.appendChild(tbody);
		document.getElementById("tableContainer").appendChild(table);
		this.graphicalMaze = tbody;
	}
	handleTabletChange(e) {
		// Check if the media query is true
		//solved with  this.handleTabletChange.bind(this) //which gave the function the necessary value of this as a reference of the class (and thus the possibility to call this. handleTabletChange, and give it this.graphicalMaze) and instead of the MediaQueryList value (which is passed as the e parameter)
		//previously: THE VALUE OF this WHEN CALLED FROM this.handleTabletChange(mediaQuery); => IS THE CLASS BFSMazeApp, AS EXPECTED
		//HOWEVER, THE VALUE OF this WHEN CALLED FROM mediaQuery.addListener(this.handleTabletChange); IS MediaQueryList!!!!!!
		//MediaQueryList { media: "(max-width: 954px)", matches: false, onchange: null }
		// matches: false
		// media: "(max-width: 954px)"
		let tableElement = this.graphicalMaze.parentElement;
		if (e.matches) {
		// Then log the following message to the console
		console.log('Media Query Matched!');
		tableElement.className = "useFullWidthForMobile"; //same as document.getElementById("tableParent")

		}else{
			console.log("media query not matched");
			tableElement.className = "";
		}
	}

	tryToFitTheMazeOnScreen(){

		const tdMinWidthInclPadding = 12; //10 + 1px padding
		const tableBorderSpacing = 1.5;
		let calculateMinWidth = tdMinWidthInclPadding * this.pocetColumns;
		calculateMinWidth += 30;
		calculateMinWidth += (this.pocetColumns - 1) * tableBorderSpacing;
		const mediaQuery = window.matchMedia('(max-width:'+ calculateMinWidth +'px)');
		
		// Register event listener

		//for the callback event listener, i.e. handleTabletChange will be the value of *this* MediaQueryList and not BFSMAzeApp
		//therefore it is not possible to write: mediaQuery.addListener(this.handleTabletChange); //(will raise TypeError)
		//mediaQuery.addListener(function(){alert(this)}) //the value of this is a MediaQueryList, so  this.handleTabletChange cannot be called from here with the tableElement parameter 
		//mediaQuery.addListener(function(){this.handleTabletChange(tableElement)}) //exactly: Uncaught TypeError: this.handleTabletChange is not a function
		//=> so doint it like this:
		mediaQuery.addListener(this.handleTabletChange.bind(this)); //nice, src bind fix https://stackoverflow.com/questions/36794934/pass-argument-to-matchmedia-addlistener-callback-function

		// Initial check
		this.handleTabletChange(mediaQuery);
	}
	renderMaze(text){
		this.createMaze()
		//odebrani prazdneho radku na konci
	    if(text[text.length - 1].trim() == ""){
	    	text.pop();
	    }
	    [this.pocetRows,this.pocetColumns] = text[0].split(' ').map(Number);
	    console.log(text)
	   
	    this.tryToFitTheMazeOnScreen();
	    let mapText = document.getElementById("mapText");
	    mapText.textContent = "";
	    for(let x = 1; x < text.length; x++){

	    	let row = text[x].split("")
	    	console.log(row)
	    	const tr = this.graphicalMaze.insertRow();
	    	
	    	//the 2D array, storing the maze in place
			this.maze.push(row); 
	    	mapText.textContent += row + "\n";

	    	for(let y = 0; y < text[1].length; y++){
				let character = row[y];
				const td = tr.insertCell();
				const div = document.createElement("div");
				div.className = "s";
				td.appendChild(div);
	  			if(character == "#"){
	  				td.classList.add("green");
	  			}else if(character == "S"){
					this.startCoordinates = [x-1,y];
				}else if(character == "C"){
					this.endCoordinates = [x-1, y];
				}
	    	}
		}
	    console.log("this.endCoordinates", this.endCoordinates);
	    console.log("this.startCoordinates", this.startCoordinates);
	  }
	  presentResult(){
	  	let row = this.graphicalMaze.insertRow()
	  	let holder = row.insertCell();
	  	holder.colSpan = 77; //this.pocetColumns
	  	holder.className = "presentResult";
	  	holder.innerHTML = "<span class='pathText'>Path</span> length from <span class='startText'>start</span> to end is " + this.delkaCesty + " cells long";

	  	document.getElementById("funFact").classList.remove("hiddenWithNoHeight");
	  }
	  async startBFS(){ //async so I can use wait function
			for(let x of this.checkOkolniPole(this.startCoordinates[0], this.startCoordinates[1], 'A')){
				this.zasobnik.put(x);
			}
			this.addClassToCell(this.startCoordinates, "start");
			this.addClassToCell(this.endCoordinates, "end");
			this.runBFS();
		}
		computeEndField(x,y,direction){
			if(direction == 'D'){
				return [this.pocetRows, y];
			}else if(direction == 'N'){
				return [-1, y];
			}else if(direction == 'P'){
				return [x, this.pocetColumns];
			}else if(direction == 'L'){
				return [x,-1];
			}
		}
		checkOkolniPole(xZastaveni,yZastaveni, directionPohybu){
			let volnaOkolniPole = [];
			let moznaPolicka = [
				[xZastaveni-1, yZastaveni, 'N'],
				[xZastaveni+1, yZastaveni, 'D'], 
				[xZastaveni, yZastaveni+1, 'P'],
				[xZastaveni, yZastaveni-1, 'L']
			];
			let opacneSmery = {
				'N': 'D',
				'D': 'N',
				'P': 'L',
				'L': 'P',
				'A' : '' //A jako all directions, abych mohl u startovaciho pole podivat do vsech smeru
			}
			let smerOdkudJsmePrijeli = opacneSmery[directionPohybu];
			let x1,y1,smer;
			for([x1, y1, smer] of moznaPolicka){
				//podle JS totiz 0 <= -1 <= 6 je true (v Pythonu je to ofc false) => Python je jediný jazyk co kombinuje porovnávací operátory tímto způsobem
				//proto takto prepis, misto 0 < y < 6 se musi 0 < y && y < 6
				if((0 <= x1 && x1 < this.pocetRows) && (0 <= y1 && y1 < this.pocetColumns)){
					if(y1 < 0){
						console.error("I DONT KNOW IF STATEMENTS IN JS!!!!!!!");
					}
					try{
						if(this.maze[x1][y1] != '#' && smer != smerOdkudJsmePrijeli){
							volnaOkolniPole.push([xZastaveni, yZastaveni, smer]);
						}
					}catch(e){
						console.error(e, "with value:",x1,y1);
					}
				}
			}
			return volnaOkolniPole;
		}
		obarviPolePoCeste(x,y,direction){
			let lastBeforeWall = this.computeEndField(x,y,direction);
			while(String([x,y]) != String(lastBeforeWall)){
				if(this.maze[x][y] == '#' || this.maze[x][y] == 'C'){
					break;
				}
				this.addClassToCell([x,y], "cesta");
				this.addClassToCell([x,y], direction);
				// this.addClassToCell([x,y], `cesta ${direction}`);
				if (direction == 'D'){
					x += 1;
				} else if (direction == 'N'){
					x -= 1;
				} else if (direction == 'P'){
					y += 1;
				} else if (direction == 'L'){
					y -= 1;
				}
			}
		}
		vypisCestu(x,y){
			let pole = [x,y];
			let sled = [];
			let x1,y1, smer;
			while(String(pole) != String(this.startCoordinates)){
				[x1,y1,smer] = this.zJakehoPoleJsmeSemPrisli[pole];
				this.obarviPolePoCeste(x1, y1, smer);
				pole = [x1,y1];
				if(smer != 'NO'){
					sled.push(smer);
				}else{
					console.log("skip, propojka");
				}
			}
			let cesta = "";
			let index = sled.length - 1;
			while(index > -1){
				cesta += sled[index];
				index -= 1;
			}
			
			document.getElementById("presentResult").innerHTML = "<span class='pathText'>Path</span> from <span class='startText'>start</span> to end is " + cesta;
			return cesta;
		}
		async runBFS(){
			let x,y;
			let direction;
			console.log(this.zasobnik);
			let seenDirection = new Set();
			let zJakehoPoleJsmeSemPrisli = {};
			while(this.zasobnik.empty == false && this.zcelaHotovo == false){
				[x,y, direction] = this.zasobnik.get();
				//dalsi pitfall JS, pokud do Setu davam Arraye, tak to porovnava jejich reference, tedy kde jsou v pameti, nikoliv hodnoty
				//takze:
				// set.add([3, 4]);
				// set.has([3, 4]); // false
				//=> proto to proste konvertuju na String, lepsi zpusob neni, src: https://stackoverflow.com/questions/29760644/storing-arrays-in-es6-set-and-accessing-them-by-value
				if(!seenDirection.has(String([x,y,direction]))){
					console.log("ADD DIRECTION in seenDirection");
					seenDirection.add(String([x,y,direction]));
				}else{
					console.log("jho", x,y, direction);
					continue;
				}
				console.error("compare field", x,y, "with end", this.endCoordinates) //just for aestetic purposes, not an error
				
				let lastBeforeWall = this.computeEndField(x,y,direction);
				console.log("lastBeforeWall",lastBeforeWall);
				console.log("should be defined",x,y);
				let zacatekLajnyX, zacatekLajnyY;
				[zacatekLajnyX, zacatekLajnyY] = [x,y];
				let previousField;
				let stopLoopImmediatelyFlag = false;
				//=>IN JS, that would compare memory locations, so I use String()
				//performance OK, the arrays have 2 items each
				while(String([x,y]) != String(lastBeforeWall)){
					console.log("hello?!!")
					this.addClassToCell([x,y], "considered");
					await wait(parseInt(animationDelay.value));
					this.removeClassFromCell([x,y], "considered");
					if(this.cellHasClass([x,y], "visited")){
						this.addClassToCell([x,y], "skipped");
					}else{
						this.addClassToCell([x,y], "visited");
					}
					if(this.maze[x][y] == '#'){
						[x,y] = previousField;
						break;
					}else if(this.maze[x][y] == 'C'){
						console.log('yo');
						 if(!(String([x,y]) in this.zJakehoPoleJsmeSemPrisli)){
							if(String([x,y]) != String([zacatekLajnyX, zacatekLajnyY])){
								this.zJakehoPoleJsmeSemPrisli[String([x,y])] = [zacatekLajnyX, zacatekLajnyY, direction];
							}
						 }
						 console.log("nalezen cil")
						 console.log(this.vypisCestu(x,y));
						 stopLoopImmediatelyFlag = true;
						 this.zcelaHotovo = true;
						 break;
					}
					previousField = [x,y];
					if (direction == 'D'){
						x += 1;
					} else if (direction == 'N'){
						x -= 1;
					} else if (direction == 'P'){
						y += 1;
					} else if (direction == 'L'){
						y -= 1;
					}
				}
				if(stopLoopImmediatelyFlag){
					console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
					break;
				}

				if(!(String(previousField) in this.zJakehoPoleJsmeSemPrisli)){
					console.log("probehl zJakehoPoleJsmeSemPrisli ")
					this.zJakehoPoleJsmeSemPrisli[String(previousField)] = [zacatekLajnyX, zacatekLajnyY, direction];
					console.log(this.zJakehoPoleJsmeSemPrisli)
				}
				let kamJit = this.checkOkolniPole(previousField[0],previousField[1], direction);
				for(let moznost of kamJit){
					if(!(seenDirection.has(String(moznost)))){
						this.zasobnik.put(moznost);
					}
				}
			}
		}
		addClassToCell(coordinates, className){
			//coordinates are row : column
			//tables (tbody) support only rows : column (cells is the method of td only, not tbody) 
			let row, column;
			[row, column] = coordinates;
			try{
				this.graphicalMaze.rows[row].cells[column].classList.add(className);
			}catch(TypeError){
				console.warn("TypeError caught", "row", row, "column", column);
			}
		}
		removeClassFromCell(coordinates, className){
			let row, column;
			[row, column] = coordinates;
			try{
				this.graphicalMaze.rows[row].cells[column].classList.remove(className);
			}catch(TypeError){
				console.warn("TypeError caught", "row", row, "column", column);
			}
		}
		cellHasClass(coordinates, className){
			let row, column;
			[row, column] = coordinates;
			try{
				return this.graphicalMaze.rows[row].cells[column].classList.contains(className);
			}catch(TypeError){
				console.warn("TypeError caught", "row", row, "column", column);
			}
		}

}

function whichLineEnding(source) {
	var temp = source.indexOf('\n');
	if (source[temp - 1] === '\r')
		return 'CRLF' //Windows
	return 'LF' //Linux
}

let mazePicker = document.getElementById("mazePicker");
mazePicker.addEventListener("change", function(e){
	let mazeSelected = mazePicker.value;
	if(mazeSelected != ""){
		let mazeUrl = ""

		if(window.location.protocol == "file:"){
			//Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at file:///C:/Users/Andrey/Documents/ksp/84.txt. (Reason: CORS request not http).
			//=> that is on purpose: 
			//	https://amp.thehackernews.com/thn/2019/07/firefox-same-origin-policy-hacking.html 
			//	https://bugzilla.mozilla.org/show_bug.cgi?id=1558299
			//so show user an alert
			document.getElementById("loadOnLocalServer").classList.remove("hidden");
			document.getElementById("loadOnLocalServerOK").focus();
			return;
		}else{
			mazeUrl = "./"  + mazeSelected;	
		}
		
		fetch(mazeUrl)
		.then( r => r.text() )
   	.then( t => {
   		//Fun fact: when I don't stop the previous instance, I can have 5 mazes running at the same time no problem, and even responsive design works :)
   		if(mazeAppClassHolderVariable != undefined){
   			mazeAppClassHolderVariable.zcelaHotovo = true;
   			mazeAppClassHolderVariable.hideMaze();
   		}
   		mazeAppClassHolderVariable = new BFSMazeApp();
		let lineEnding = whichLineEnding(t);
		if(lineEnding == "CRLF"){
			mazeAppClassHolderVariable.renderMaze(t.split("\r\n"));
		}else if(lineEnding == "LF"){
			mazeAppClassHolderVariable.renderMaze(t.split("\n"));
		}
   		mazeAppClassHolderVariable.startBFS();
   	});
	}
});

//reading and parsing the input into a table to display as well as the correspoding 2D Array
document.getElementById('inputfile').addEventListener('change', function(event) {
	console.log(event);
	let text = "";
    var fr=new FileReader();
    fr.onload=function(){
		let lineEnding = whichLineEnding(fr.result);
		if(lineEnding == "CRLF"){
			text = fr.result.split("\r\n");
		}else if(lineEnding == "LF"){
			text = fr.result.split("\n");
		}
        if(mazeAppClassHolderVariable != undefined){
			mazeAppClassHolderVariable.zcelaHotovo = true;
			mazeAppClassHolderVariable.hideMaze();
	   	}
		mazeAppClassHolderVariable = new BFSMazeApp();
		mazeAppClassHolderVariable.renderMaze(text);
        mazeAppClassHolderVariable.startBFS(); //entry point to our actual program
    }
    fr.readAsText(this.files[0]);
    document.getElementById("selectedFileLabel").textContent = this.files[0].name;
});

//https://stackoverflow.com/a/53452241/11844784
function wait(ms) {
	if(ms > 0){
		return new Promise((resolve, reject) => {
	    setTimeout(() => {
	      resolve(ms)
	    }, ms )
	  })
	}else{
		return;
	}
}
