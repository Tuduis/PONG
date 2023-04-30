const canvas = document.querySelector('#gameCanvas');
const ctx = canvas.getContext('2d');

//Constants
const CANVAS_HEIGHT = canvas.height; //wysokość płótna
const CANVAS_WIDTH = canvas.width; //szerokość płótna

const BOARD_Y = 50; // y obydwu punktacji
const BOARD_P1_X = 300; //x punktacji gracza 1
const BOARD_P2_X = 500; // x punktacji gracza 2

const PADDLE_WIDTH = 20; // szerokość paletki
const PADDLE_HEIGHT = 100; //wysokość paletki
const PADDLE_P1_X = 10; // pozycja x paletki gracza 1
const PADDLE_P2_X = 770; // pozycja x paletki gracza 2
const PADDLE_START_Y = (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2; // początkowa pozycja paletek
const PADDLE_STEP = 3;

const BALL_R = 15; //promień piłeczki
const BALL_START_X = CANVAS_WIDTH / 2; // pozycja początkowa x środka piłeczki
const BALL_START_Y = CANVAS_HEIGHT / 2; //pozycja początkowa y środka piłeczki
const BALL_START_DX = 4.5; //początkowa prędkość lotu piłeczki na współrzędnej x
const BALL_START_DY = 1.5; // początkowa prędkość lotu piłeczki na współrzędnej y

const STATE_CHANGE_INTERVAL = 20;

const UP_ACTION = 'up';
const DOWN_ACTION = 'down';
const STOP_ACTION = 'stop';

const P1_UP_BUTTON = 'KeyQ';
const P1_DOWN_BUTTON = 'KeyA';
const P2_UP_BUTTON = 'KeyP';
const P2_DOWN_BUTTON = 'KeyL';
const PAUSE_BUTTON = 'KeyB';

const coerceIn = (value, min, max) => {
	if (value <= min) {
		return min;
	} else if (value >= max) {
		return max;
	} else {
		return value;
	}
};

function isInBetween(value, min, max) {
	return value >= min && value <= max;
}

ctx.font = '30px Arial';

function drawPaddle(x, y) {
	ctx.fillRect(x, y, PADDLE_WIDTH, PADDLE_HEIGHT);
}

const drawPoints = (text, x) => {
	ctx.fillText(text, x, BOARD_Y);
};

const drawCircle = (x, y, r) => {
	ctx.beginPath();
	ctx.arc(x, y, r, 0, Math.PI * 2, true);
	ctx.closePath();
	ctx.fill();
};

const drawBall = (x, y) => {
	drawCircle(x, y, BALL_R);
};

const clearCanvas = () => {
	ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
};

//Input
let p1Action = STOP_ACTION;
let p2Action = STOP_ACTION;
let paused = false;

window.addEventListener('keydown', function (event) {
	let code = event.code;
	if (code === P1_UP_BUTTON) {
		p1Action = UP_ACTION;
	} else if (code === P1_DOWN_BUTTON) {
		p1Action = DOWN_ACTION;
	} else if (code === P2_UP_BUTTON) {
		p2Action = UP_ACTION;
	} else if (code === P2_DOWN_BUTTON) {
		p2Action = DOWN_ACTION;
	} else if (code === PAUSE_BUTTON) {
		paused = !paused;
	}
});

window.addEventListener('keyup', function (event) {
	let code = event.code;
	if (
		(code === P1_UP_BUTTON && p1Action === UP_ACTION) ||
		(code === P1_DOWN_BUTTON && p1Action === DOWN_ACTION)
	) {
		p1Action = STOP_ACTION;
	} else if (
		(code === P2_UP_BUTTON && p2Action === UP_ACTION) ||
		(code === P2_DOWN_BUTTON && p2Action === DOWN_ACTION)
	) {
		p2Action = STOP_ACTION;
	}
});

// State

const ball = {
	x: BALL_START_X,
	y: BALL_START_Y,
	dx: BALL_START_DX,
	dy: BALL_START_DY,
	moveByStep: function() {
		this.x += this.dx;
		this.y += this.dy;
	},
	shouldBounceFromTopWall: function() {
		return this.y < BALL_R && this.dy < 0;
	},
	shouldBounceFromBottomWall: function() {
		return this.y + BALL_R > CANVAS_HEIGHT && this.dy > 0;
	},
	bounceFromWall: function() {
		this.dy = -this.dy;
	},
	bounceFromPaddle: function() {
		this.dx = -this.dx;
	},
	moveToStart: function() {
		this.x = BALL_START_X;
		this.y = BALL_START_Y;
	},
	isOutsideOnLeft: function() {
		return this.x + BALL_R < 0;
	},
	isOutsideOnRight: function() {
		return this.x - BALL_R > CANVAS_WIDTH;
	},
	isOnTheSameHeightAsPaddle:function(paddleY) {
		return isInBetween(this.y, paddleY, paddleY + PADDLE_HEIGHT);
	},
	shouldBounceFromLeftPaddle: function() {
		return (
			this.dx < 0 &&
			isInBetween(this.x - BALL_R, PADDLE_P1_X, PADDLE_P1_X + PADDLE_WIDTH) &&
			this.isBallOnTheSameHeightAsPaddle(p1PaddleY)
		);
	},
	shouldBounceFromRightPaddle: function() {
		return (
			this.dx > 0 &&
			isInBetween(this.x + BALL_R, PADDLE_P2_X, PADDLE_P2_X + PADDLE_WIDTH) &&
			this.isBallOnTheSameHeightAsPaddle(p2PaddleY)
		);
	}
};

let p1PaddleY = PADDLE_START_Y;
let p2PaddleY = PADDLE_START_Y;
let p1Points = 0;
let p2Points = 0;

function coercePaddle(paddleY) {
	const minPaddleY = 0;
	const maxPaddleY = CANVAS_HEIGHT - PADDLE_HEIGHT;
	return coerceIn(paddleY, minPaddleY, maxPaddleY);
}

function movePaddles() {
	if (p1Action === UP_ACTION) {
		p1PaddleY = coercePaddle(p1PaddleY - PADDLE_STEP);
	} else if (p1Action === DOWN_ACTION) {
		p1PaddleY = coercePaddle(p1PaddleY + PADDLE_STEP);
	}
	if (p2Action === UP_ACTION && p2PaddleY >= 0) {
		p2PaddleY = coercePaddle(p2PaddleY - PADDLE_STEP);
	} else if (p2Action === DOWN_ACTION) {
		p2PaddleY = coercePaddle(p2PaddleY + PADDLE_STEP);
	}
}


function moveBall() {
	if (ball.shouldBounceFromTopWall() || ball.shouldBounceFromBottomWall()) {
		ball.bounceFromWall();
	}
	if (ball.shouldBounceFromLeftPaddle() || ball.shouldBounceFromRightPaddle()) {
		ball.bounceBallFromPaddle();
	}

	if (ball.isOutsideOnLeft()) {
		ball.moveToStart();
		p2Points++;
	} else if (ball.isOutsideOnRight()) {
		ball.moveToStart();
		p1Points++;
	}

	ball.moveByStep();
}

const updateState = () => {
	moveBall();
	movePaddles();
};

const drawState = () => {
	clearCanvas();
	drawPoints(p1Points.toString(), BOARD_P1_X);
	drawPoints(p2Points.toString(), BOARD_P2_X);
	drawBall(ball.x, ball.y);
	drawPaddle(PADDLE_P1_X, p1PaddleY);
	drawPaddle(PADDLE_P2_X, p2PaddleY);
};

const updateAndDrawState = () => {
	if (paused) return;
	updateState();
	drawState();
};

setInterval(updateAndDrawState, STATE_CHANGE_INTERVAL);
