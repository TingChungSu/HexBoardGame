var newCanvas = function(){
	var canvasSelf = this;
	this.shapeObjs = [];
	this.timer = null;
	this.canvas  = document.createElement('canvas');
	canvasSelf.canvas.class = 'full';
	var body = document.getElementById('body');
	body.appendChild(canvasSelf.canvas);
	
	canvasSelf.canvas.width  = window.innerWidth;
	canvasSelf.canvas.height = window.innerHeight-100;
	
	this.ctx = canvasSelf.canvas.getContext("2d");
	
	this.x = canvasSelf.canvas.width/2;
	this.y = canvasSelf.canvas.height-30;
	this.dx = 0;
	this.dy = -1;
	
	this.image = new Image();
	canvasSelf.image.src="./Emoji/1f632.png";
	
	this.addObj = function(shape,color){
		canvasSelf.shapeObjs.push(new shapeObj(shape,color));
	};
	this.resize = function(){
		canvasSelf.canvas.width  = window.innerWidth;
		canvasSelf.canvas.height = window.innerHeight-100;
	};
	
	this.drawSmile = function (shapeObj) {
		/*
		var x = shapeObj.x;
		var y = shapeObj.y;
		canvasSelf.ctx.beginPath();
		canvasSelf.ctx.arc(x + 75, y, 50, 0, Math.PI * 2, true); // Outer circle
		canvasSelf.ctx.moveTo(x + 110, y);
		canvasSelf.ctx.fillStyle = "yellow";
		canvasSelf.ctx.fill();
		canvasSelf.ctx.arc(x+75, y, 35, 0, Math.PI, false);  // Mouth (clockwise)
		canvasSelf.ctx.moveTo(x+65, y-10);
		canvasSelf.ctx.arc(x+60, y-10, 5, 0, Math.PI * 2, true);  // Left eye
		canvasSelf.ctx.moveTo(x+95, y-10);
		canvasSelf.ctx.arc(x+90, y-10, 5, 0, Math.PI * 2, true);  // Right eye
		canvasSelf.ctx.stroke();
		*/
		
		var x = shapeObj.x-50;
		var y = shapeObj.y;
		
		canvasSelf.ctx.drawImage(canvasSelf.image,x,y);
		
	};
	this.drawTalk = function (shapeObj){
		var x = shapeObj.x;
		var y = shapeObj.y;
		canvasSelf.ctx.beginPath();
		canvasSelf.ctx.moveTo(x+75, y+25);
		canvasSelf.ctx.quadraticCurveTo(x+25, y+25, x+25, y+62.5);
		canvasSelf.ctx.quadraticCurveTo(x+25, y+100, x+50, y+100);
		canvasSelf.ctx.quadraticCurveTo(x+50, y+120, x+30, y+125);
		canvasSelf.ctx.quadraticCurveTo(x+60, y+120, x+65, y+100);
		canvasSelf.ctx.quadraticCurveTo(x+125, y+100, x+125, y+62.5);
		canvasSelf.ctx.quadraticCurveTo(x+125, y+25, x+75, y+25);
		canvasSelf.ctx.stroke();
	};
	
	this.drawHeart = function (shapeObj){
		var x = shapeObj.x;
		var y = shapeObj.y;
		canvasSelf.ctx.beginPath();
		canvasSelf.ctx.moveTo(x+37.5, y+40);
		canvasSelf.ctx.bezierCurveTo(x+37.5, y+37.5, x+32.5, y+25, x+12.5, y+25);
		canvasSelf.ctx.bezierCurveTo(x-17.5, y+25, x-17.5, y+62.5, x-17.5, y+62.5);
		canvasSelf.ctx.bezierCurveTo(x-17.5, y+80, x+2.5, y+102, x+37.5, y+120);
		canvasSelf.ctx.bezierCurveTo(x+72.5, y+102, x+92.5, y+80, x+92.5, y+62.5);
		canvasSelf.ctx.bezierCurveTo(x+92.5, y+62.5, x+92.5, y+25, x+62.5, y+25);
		canvasSelf.ctx.bezierCurveTo(x+47.5, y+25, x+37.5, y+37.5, x+37.5, y+40);
		canvasSelf.ctx.fillStyle = shapeObj.color;
		canvasSelf.ctx.fill();
	};
	this.draw = function () {
		canvasSelf.ctx.clearRect(0, 0, canvasSelf.canvas.width, canvasSelf.canvas.height);
		canvasSelf.shapeObjs.forEach(
			function (item, index) {
				if(item.shape == 'Heart'){
					canvasSelf.drawHeart(item);
				}
				if(item.shape == 'Smile'){
					canvasSelf.drawSmile(item);
				}
				if(item.shape == 'OOO'){
					canvasSelf.drawSmile(item);
				}
				item.x += item.dx;
				item.y += item.dy;
				item.dy -= 0.03;
				if(item.y < -100){
					//canvasSelf.stop();
					//canvasSelf.canvas.remove();
					canvasSelf.shapeObjs.shift();
				}
		});
	};
	this.start = function(){
		if(canvasSelf.timer == null)
		{
			canvasSelf.timer = setInterval(canvasSelf.draw, 10);
		}
	};
	this.stop = function (){
		if(canvasSelf.timer != null)
		{
			clearInterval(canvasSelf.timer);
			canvasSelf.timer = null;
		}
	};	
}
var shapeObj = function(type,color){
	this.x = (window.innerWidth-75) * Math.random() * 1.1;
	this.y = (window.innerHeight-150);
	this.dx = 0;
	this.dy = -1;
	this.shape = type;
	this.color = color;
}