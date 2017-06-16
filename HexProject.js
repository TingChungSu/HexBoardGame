var HexProject = HexProject || {};
HexProject.namespace = {
    url : '10.0.1.167:8080',
	//url : '140.116.247.163:8080',
	myColor : 'Red',
	myTurn : false,
	size : 12,
	game : [],
	r : 15,
	myText : null,
	ws : null,
	color : null,
	end : false,
	lastx : 0,
	lasty : 0,
	lastcolor : null,
	canUndo : false,
	btnUndo : null,
	btnSurrender : null,
	btnRestart : null,
	
    setDifficulty : function(){ 
		var num = parseInt(document.getElementById("number").value);
		if(num < 5 || num > 15)
			alert("set size between 5 and 20 please.");
		else
			HexProject.namespace.size = 2 + num;
	},
	redraw : function(){ 
		var size = HexProject.namespace.size;
		HexProject.namespace.r = Math.min((window.innerHeight-100)/(size-2)/3 * 0.75 , (window.innerWidth)/(size-1)/Math.sqrt(3) * 0.75);

		HexProject.namespace.end = false;
		document.getElementById("GameBoard").remove();
		var div = document.createElement('div');
		div.id = "GameBoard";
		document.getElementById("body").appendChild(div);
		
		HexProject.namespace.drawBoard(size);
	},
	resize : function(){ 
		var size = HexProject.namespace.size;
		console.log("resize");
		HexProject.namespace.redraw();
		for(var i=0;i<size;i++){
			for(j=0;j<size;j++){
				if(HexProject.namespace.game[i][j]!="")
					HexProject.namespace.fillColorFull(i,j,HexProject.namespace.game[i][j]);
			}		
		}
		
		if(HexProject.namespace.lastx != 0)
			HexProject.namespace.fillColor(HexProject.namespace.lastx,HexProject.namespace.lasty,HexProject.namespace.lastcolor);
	},
	initGame : function(){ 
		HexProject.namespace.color = 'Red';
		HexProject.namespace.btnUndo = document.getElementById("undo");
		HexProject.namespace.btnSurrender = document.getElementById("surrender");
		HexProject.namespace.btnRestart = document.getElementById("restart"); 
		
		HexProject.namespace.btnUndo.disabled = true; 
		HexProject.namespace.btnSurrender.disabled = true; 
		HexProject.namespace.btnRestart.disabled = true; 
		
		var size = HexProject.namespace.size;
		console.log("initGame");
		HexProject.namespace.redraw();
		
		HexProject.namespace.myText = document.getElementById("Title");
		HexProject.namespace.myText.style.color = "white";
		HexProject.namespace.myText.innerText = "NewGame or Enter.";
		
		HexProject.namespace.myColor = 'Red';
		HexProject.namespace.myTurn = false;

		HexProject.namespace.end = false;
		HexProject.namespace.lastx = 0;
		HexProject.namespace.lasty = 0;
		HexProject.namespace.lastcolor = null;
		HexProject.namespace.canUndo = false;

		HexProject.namespace.game = [];
		for(var i=0;i<size;i++){
			var tmp = [];
			for(j=0;j<size;j++){
				if(i==0 || i==size-1)
					tmp.push("Blue");
				else if(j==0 || j==size-1)
					tmp.push("Red");
				else
					tmp.push("");
			}
			HexProject.namespace.game.push(tmp);
		}
	},
	drawBoard : function(size){ 
		var r = HexProject.namespace.r;
		var oriX = 0, oriY = 60;
		var space = r/3;
		var x = oriX, y = 0;
		var xOffset = (window.innerWidth-3*r)/2;
		for(j=0;j<size;j++){
			for(i=0;i<size;i++){
				HexProject.namespace.drawHex(r,
				xOffset + x*Math.cos(1/3*Math.PI)-y*Math.sin(1/3*Math.PI),
				oriY - r + x*Math.sin(1/3*Math.PI)+y*Math.cos(1/3*Math.PI),
				i,j);
				x += Math.sqrt(3)*r+space;
			}
			y += Math.sqrt(2)*r+space;
			x = x - (size-0.5) * (Math.sqrt(3)* r + space);
		}
	}, 
	flash : function(color,target,times){ 
		var size = HexProject.namespace.size;
		times--;
		if(times > 0){
			for(var i=0;i<size;i++){
				for(j=0;j<size;j++){
					if(HexProject.namespace.game[i][j] == color){
						HexProject.namespace.game[i][j] = target;
						var canvas = document.querySelector("#pix"+i+"_"+j);
						if(canvas){
							var ctx = canvas.getContext('2d');
							ctx.fillStyle  = target;
							ctx.fill();
						}
					}
				}
			}
			
			setTimeout(function(){HexProject.namespace.flash(target,color,times);}, 400);
		}
	},
	drawHex : function(r, x, y, i, j){
		var r = HexProject.namespace.r;
		var size = HexProject.namespace.size;
		if((i==0 && j==0) || (i==size-1 && j==size-1)
		||(i==size-1 && j==0)||(i==0 && j==size-1)
		){
			return;
		}
		
		var canvas = document.createElement('canvas');
		canvas.id = "pix"+j+"_"+i;
		canvas.style="position:fixed; top:"+y+"px; left:"+x+"px;";
		canvas.width = 2*r+1;
		canvas.height = 2*r+1;
		var ctx = canvas.getContext('2d');
		
		
		ctx.save();
		ctx.translate(r,r);
		ctx.rotate(Math.PI/2);
		ctx.beginPath();
		for(var k = 0; k < 6; k++){
			ctx.lineTo(Math.cos(k/3*Math.PI)*r,

					Math.sin(k/3*Math.PI)*r);
		}
		if(i==0 || i==size-1){
			ctx.fillStyle  = "Red";
			ctx.fill();
		}
		if(j==0 || j==size-1){
			ctx.fillStyle  = "Blue";
			ctx.fill();
		}
		ctx.closePath();
		ctx.stroke();
		ctx.restore();
		canvas.addEventListener('click', function() {
			HexProject.namespace.click(j,i,canvas.id);
		}, false);
		div = document.getElementById('GameBoard');
		div.appendChild(canvas);
	},
	click : function (x,y,id){
		if(HexProject.namespace.end)
			return;
		if(HexProject.namespace.game[x][y] != "")
			return;
		if(HexProject.namespace.myTurn){
			HexProject.namespace.clicks(x,y,id,false);
			HexProject.namespace.ws.send("<Place>"+x+"_"+y);
		}
	},
	fillColor : function (x,y,color){
		var canvas = document.querySelector("#pix"+x+"_"+y);
		if(canvas){
			var ctx = canvas.getContext('2d');
			HexProject.namespace.game[x][y] = color;
			var my_gradient = ctx.createLinearGradient(0,0,170,170);
			my_gradient.addColorStop(0,"#eee");
			my_gradient.addColorStop(0.2,color);
			my_gradient.addColorStop(0.7,"#fff");
			ctx.fillStyle  = my_gradient;
			ctx.fill();
			if(HexProject.namespace.lastx != 0
			&& (HexProject.namespace.lastx != x 
			|| HexProject.namespace.lasty != y))
				HexProject.namespace.fillColorFull(HexProject.namespace.lastx,HexProject.namespace.lasty,HexProject.namespace.lastcolor);
			HexProject.namespace.lastx = x;
			HexProject.namespace.lasty = y;
			HexProject.namespace.lastcolor = color;
		}
	},
	fillColorFull : function (x,y,color){
		var canvas = document.querySelector("#pix"+x+"_"+y);
		if(canvas){
			var ctx = canvas.getContext('2d');
			ctx.fillStyle  = color;
			ctx.fill();
		}
	},
	clicks : function (x,y,id,canAction){
		if(HexProject.namespace.end)
			return;
		if(HexProject.namespace.game[x][y] != "")
			return;
		//var canvas=document.querySelector("#pix"+x+"_"+y);
		HexProject.namespace.fillColor(x,y,HexProject.namespace.color);
		if(HexProject.namespace.isEnd(x,y)){
			HexProject.namespace.gameEnd();
			HexProject.namespace.myText.style.color = HexProject.namespace.color;
			HexProject.namespace.myText.innerText = HexProject.namespace.color +" win!!!!"
			setTimeout(function(){ HexProject.namespace.flash(HexProject.namespace.color,"gray",11);}, 100);
		}
		else{
			if("Red" == HexProject.namespace.color){
				HexProject.namespace.color = "Blue";
			}else{
				HexProject.namespace.color = "Red";
			}
			var who = canAction?'your':'enemy';
			HexProject.namespace.myText.innerText ="It's "+ who +" turn.(" + HexProject.namespace.color + ")";
			if(!canAction){
				HexProject.namespace.canUndo = true;
				HexProject.namespace.btnUndo.disabled = false; 
			}else{
				HexProject.namespace.canUndo = false;
				HexProject.namespace.btnUndo.disabled = true; 
			}
		}
		HexProject.namespace.myTurn = canAction;
	},
	gameEnd : function (){
		HexProject.namespace.btnSurrender.disabled = true;
		HexProject.namespace.btnUndo.disabled = true;
		HexProject.namespace.end = true;
		HexProject.namespace.btnRestart.disabled = false;
	},
	isEnd : function (x,y){
		var size = HexProject.namespace.size;
		var tmpboard = [];
		for(var i=0;i<size;i++){
			var tmp = [];
			for(var j=0;j<size;j++){
				tmp.push("");
			}
			tmpboard.push(tmp);
		}
		var thisColor = HexProject.namespace.game[x][y];
		tmpboard[x][y] = thisColor;
		var checkQueue = new Array();
		checkQueue.push([x,y]);
		var top=false;
		var bottom=false;
		var left=false;
		var right=false;
		while(checkQueue.length > 0 ){
			var pos = checkQueue.pop();
			tmpboard[pos[0]][pos[1]] = thisColor;
			if(pos[0] == 0){
				top=true;
				continue;
			}
			if(pos[0] == size-1){
				bottom=true;
				continue;
			}
			if(pos[1]==0){
				left=true;
				continue;
			}
			if(pos[1] == size-1){
				right=true;
				continue;
			}
			if(tmpboard[pos[0]-1][pos[1]] == ""
			&& HexProject.namespace.game[pos[0]-1][pos[1]] == thisColor)
					checkQueue.push([pos[0]-1, pos[1]]);
			if(tmpboard[pos[0]-1][pos[1]+1] == ""
			&& HexProject.namespace.game[pos[0]-1][pos[1]+1] == thisColor)
					checkQueue.push([pos[0]-1, pos[1]+1]);
			if(tmpboard[pos[0]][pos[1]-1] == ""
			&& HexProject.namespace.game[pos[0]][pos[1]-1] == thisColor)
					checkQueue.push([pos[0], pos[1]-1]);
			if(tmpboard[pos[0]][pos[1]+1] == ""
			&& HexProject.namespace.game[pos[0]][pos[1]+1] == thisColor)
					checkQueue.push([pos[0], pos[1]+1]);
			if(tmpboard[pos[0]+1][pos[1]] == ""
			&& HexProject.namespace.game[pos[0]+1][pos[1]] == thisColor)
					checkQueue.push([pos[0]+1, pos[1]]);
			if(tmpboard[pos[0]+1][pos[1]-1] == ""
			&& HexProject.namespace.game[pos[0]+1][pos[1]-1] == thisColor)
					checkQueue.push([pos[0]+1, pos[1]-1]);
		}
		if(thisColor=="Red" && left && right)
			return true;
		if(thisColor=="Blue" && top && bottom)
			return true;
		return false;
	},
	showBoard : function(board){
		for(var i=0;i<board.lenth;i++)
			console.log(board[i]);
	},
	help : function(){
		var strText = 
		"Press NewGame to create a new GameRoom or search Enemy."
		+"\n\n"+
		"Press Enter to enter a GameRoom."
		+"\n\n"+
		"Players alternate placing stones on unoccupied spaces "
		+
		"in an attempt to link their opposite sides of "
		+
		"the board in an unbroken chain."
		+"\n\n"+
		"LeftClick an empty space to place your stones."
		+"\n\n";
		window.alert(strText);
	}, 
	createRoom : function (){
		HexProject.namespace.closeWS(HexProject.namespace.ws);
		HexProject.namespace.initGame();
		HexProject.namespace.myColor = "Red";
		HexProject.namespace.ws = new WebSocket('ws://'+HexProject.namespace.url);
		HexProject.namespace.ws.onopen=function(e){
			console.log("connection open. createRoom");
			HexProject.namespace.ws.send('<NewGame>'+HexProject.namespace.size);
		};
		HexProject.namespace.ws.onmessage=function(e){
			console.log(e.data);
			if(e.data.startsWith("#GameStart")){
				HexProject.namespace.myText.innerText ="You first.(Red)"
				HexProject.namespace.myTurn = true;
				HexProject.namespace.btnSurrender.disabled = false;
			}else if(e.data.startsWith("#NewGame")){
				HexProject.namespace.myText.innerText ="RoomId: " + e.data.substring(8);
			}
			HexProject.namespace.serverMsgCheck(e);
		};
		HexProject.namespace.ws.onerror = function(e){
			console.log(e.data);
		};
		HexProject.namespace.ws.onclose = function(e){
			console.log("connection closed.");
			console.log(e.data);
		};
	},
	enterRoom : function () {
		HexProject.namespace.closeWS(HexProject.namespace.ws);
		HexProject.namespace.ws = new WebSocket('ws://'+HexProject.namespace.url);
		HexProject.namespace.ws.onopen = function(e){
			console.log("connection open. enterRoom");
			HexProject.namespace.ws.send('<EnterGame>'+document.getElementById("roomId").value);
		};
		HexProject.namespace.ws.onmessage=function(e){
			console.log(e.data);
			if(e.data.startsWith("#GameStart")){
				HexProject.namespace.size = parseInt(e.data.substring(10));
				HexProject.namespace.initGame();
				HexProject.namespace.myText.innerText ="Enemy first.(Red)";
				HexProject.namespace.btnSurrender.disabled = false;
				HexProject.namespace.myColor = 'Blue';
			}
			HexProject.namespace.serverMsgCheck(e);
		};
		HexProject.namespace.ws.onerror = function(e){
			console.log(e.data);
		};
		HexProject.namespace.ws.onclose = function(e){
			console.log("connection closed.");
			console.log(e.data);
		};
	},
	serverMsgCheck : function (e) {
		if(e.data.startsWith("#Place")){
			var xxx = parseInt(e.data.substring(6, e.data.indexOf("_")));
			var yyy = parseInt(e.data.substring(1 + e.data.indexOf("_")));
			HexProject.namespace.clicks(xxx, yyy, "pix" + e.data.substring(6), true);
		}else if(e.data.startsWith("#Msg")){
			var msg = e.data.substring(4);
			if(msg == 'Heart'){
				if(HexProject.namespace.myColor == 'Blue')
					myCanvas.addObj('Heart','Red');
				else
					myCanvas.addObj('Heart','Blue');
			}
			if(msg == 'OOO'){
				myCanvas.addObj('Smile');
			}
			if(msg == 'InvalidRoomId'){
				HexProject.namespace.myText.innerText = 'Invalid RoomId!';
			}
		}else if(e.data.startsWith("#EnemyGiveUp")){
			HexProject.namespace.myText.innerText ="Enemy Leave.";
			HexProject.namespace.gameEnd();
			HexProject.namespace.btnRestart.disabled = true;
		}else if(e.data.startsWith("#Surrender")){
			HexProject.namespace.myText.innerText ="Enemy Give up.";
			HexProject.namespace.gameEnd();
		}else if(e.data.startsWith("#Undo")){
			HexProject.namespace.undo(false);
		}else if(e.data.startsWith("#ReStart")){
			HexProject.namespace.initGame();
			HexProject.namespace.myText.innerText ="Enemy first.(Red)";
			HexProject.namespace.btnSurrender.disabled = false;
			HexProject.namespace.myColor = 'Blue';
		}else if(e.data.startsWith("#RandomRoom")){
			HexProject.namespace.size = 12;
			HexProject.namespace.initGame();
			HexProject.namespace.myColor = e.data.substring(11);
			if(HexProject.namespace.myColor != 'Red'){
				HexProject.namespace.myText.innerText ="Enemy first.(Red)";
				HexProject.namespace.btnSurrender.disabled = false;
			}else{
				HexProject.namespace.myText.innerText ="You first.(Red)"
				HexProject.namespace.myTurn = true;
				HexProject.namespace.btnSurrender.disabled = false;
			}
		}
	},
	surrender : function(){
		HexProject.namespace.ws.send('<Surrender>' + HexProject.namespace.myColor);
		HexProject.namespace.myText.innerText = "You lose.";
		HexProject.namespace.gameEnd();
	},
	undo : function(isMe){
		console.log('undo');
		console.log(HexProject.namespace.lastx);
		console.log(HexProject.namespace.lasty);
		console.log(HexProject.namespace.game[HexProject.namespace.lastx][HexProject.namespace.lasty]);
		HexProject.namespace.game[HexProject.namespace.lastx][HexProject.namespace.lasty] = '';
		HexProject.namespace.fillColorFull(HexProject.namespace.lastx,HexProject.namespace.lasty,'#eee');
		HexProject.namespace.game[HexProject.namespace.lastx][HexProject.namespace.lasty] = '';
		console.log(HexProject.namespace.game[HexProject.namespace.lastx][HexProject.namespace.lasty]);
		HexProject.namespace.lastx = 0;
		HexProject.namespace.lasty = 0;
		if("Red" == HexProject.namespace.color){
			HexProject.namespace.color = "Blue";
		}else{
			HexProject.namespace.color = "Red";
		}
		if(isMe)
			HexProject.namespace.myText.innerText ="It's your turn.(" + HexProject.namespace.color + ")";
		else
			HexProject.namespace.myText.innerText="Enemy undo the move.";
		HexProject.namespace.myTurn = !HexProject.namespace.myTurn;
		HexProject.namespace.resize();
	},
	undoClick : function(){
		console.log("undoClick");
		if(!HexProject.namespace.canUndo)
			return;
		HexProject.namespace.btnUndo.disabled = true; 
		HexProject.namespace.ws.send('<Undo>'+HexProject.namespace.lastx+"_"+HexProject.namespace.lasty);
		HexProject.namespace.undo(true);
		HexProject.namespace.canUndo = false;
	},
	restart : function(){
		HexProject.namespace.ws.send('<ReStart>');
		HexProject.namespace.initGame();
		HexProject.namespace.myColor = "Red";
		HexProject.namespace.myText.innerText ="You first.(Red)";
		HexProject.namespace.myTurn = true;
		HexProject.namespace.btnSurrender.disabled = false;
	},
	msg : function(msg){
		if(HexProject.namespace.ws)
			HexProject.namespace.ws.send("<Msg>"+msg);
	},
	randomRoom : function(){
		HexProject.namespace.size = 12;
		HexProject.namespace.initGame();
		HexProject.namespace.closeWS(HexProject.namespace.ws);
		HexProject.namespace.myText.innerText ="Search Enemy...";
		HexProject.namespace.ws = new WebSocket('ws://'+HexProject.namespace.url);
		HexProject.namespace.ws.onopen = function(e){
			console.log("connection open. randomRoom");
			HexProject.namespace.ws.send("<RandomRoom>");
		};
		HexProject.namespace.ws.onmessage=function(e){
			console.log(e.data);
			HexProject.namespace.serverMsgCheck(e);
		};
		HexProject.namespace.ws.onerror = function(e){
			console.log(e.data);
		};
		HexProject.namespace.ws.onclose = function(e){
			console.log("connection closed.");
			console.log(e.data);
		};
	},
	closeWS : function(websocket){
		if(websocket != null){
			console.log("close socket");
			websocket.send('<Bye>');
		}
	}
};
