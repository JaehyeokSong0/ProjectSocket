import {
    socket
} from './socket.js';
var roomInfo = [1, "roomTitle", "host", "guest", 2];

class Player {
    constructor(nickname) {
        this.nickname = nickname;
        this.turn = [];
    }
    // Function to move character
    move(testCard) {
        if (testCard.type == "move") {
            var fromField = getFieldByNum(this.location);
            // Get toField
            var toField;
            if (testCard.up > 0) {
                if ((this.location - 1) - testCard.up * 4 > 0) {
                    toField = this.location - testCard.up * 4;
                } else {
                    toField = ((this.location - 1) % 4) + 1;
                }
            } else if (testCard.down > 0) {
                if (this.location + testCard.down * 4 <= 12) {
                    toField = this.location + testCard.down * 4;
                } else {
                    if (this.location % 4 == 0) {
                        toField = 12;
                    } else {
                        toField = this.location % 4 + 8;
                    }
                }
            } else if (testCard.left > 0) {
                if ((this.location - 1) % 4 >= testCard.left) {
                    toField = this.location - testCard.left;
                } else {
                    toField = Math.floor((this.location - 1) / 4) * 4 + 1;
                }
            } else if (testCard.right > 0) {
                if (this.location + testCard.right <= (Math.floor((this.location - 1) / 4) + 1) * 4) {
                    toField = this.location + testCard.right;
                } else {
                    toField = (Math.floor((this.location - 1) / 4) + 1) * 4;
                }
            } else {
                console.error("[ERROR] Something went wrong : Wrong params in move card.");
            }
            this.location = toField;

            toField = getFieldByNum(toField);
            var dx = toField.left - fromField.left;
            var dy = fromField.top - toField.top;
            if (dx >= 0) {
                this.character.animate('left', '+=' + dx, {
                    onChange: canvas.renderAll.bind(canvas)
                });
            } else {
                this.character.animate('left', '-=' + Math.abs(dx), {
                    onChange: canvas.renderAll.bind(canvas)
                });
            }
            if (dy >= 0) {
                this.character.animate('top', '-=' + dy, {
                    onChange: canvas.renderAll.bind(canvas)
                });
            } else {
                this.character.animate('top', '+=' + Math.abs(dy), {
                    onChange: canvas.renderAll.bind(canvas)
                });
            }
        } else {
            console.error("[ERROR] Something went wrong : Not a move card.");
        }
    }

    attack(testCard) {
        if (testCard.type == "attack") {
            var attackRange = [];
            testCard.range.forEach((_field) => {
                var chkPos = checkRange(this.location, _field);
                if (chkPos != -1) {
                    attackRange.push(chkPos);
                }
            });
            attackRange.forEach((_field) => {
                if (this.id == 'p1') {
                    if (_field == player2.location) {
                        player2.hp -= testCard.damage;
                        console.log("Player2 got", testCard.damage, ", HP became ", player2.hp);
                    }
                } else if (this.id == 'p2') {
                    if (_field == player1.location) {
                        player1.hp -= testCard.damage;
                        console.log("Player1 got", testCard.damage, ", HP became ", player1.hp);
                    }
                } else {
                    console.error("[ERROR] Something went wrong : Wrong player id.");
                }
            });
        } else {
            console.error("[ERROR] Something went wrong : Not a attack card.");
        }
    }
}
var player1, player2;

socket.on('startGame', (room) => {
    $('#roomModal').fadeOut();
    roomInfo = room;
    initPlayer();
});

var canvas = new fabric.Canvas('game_canvas', {
    backgroundColor: "white"
});
fabric.Object.prototype.selectable = false;
window.addEventListener('resize', resizeCanvas, false);

function resizeCanvas() {
    canvas.setWidth(window.innerWidth);
    canvas.setHeight(window.innerHeight);
    console.info("canvas resized to w : ", canvas.width, ", h : ", canvas.height);
}

// initialize size of the canvas
resizeCanvas();

// Make field
var fieldWidth = canvas.width / 6;
var fieldHeight = canvas.height / 5;

function drawField(width, height) {
    for (var i = 1; i <= 3; i++) {
        for (var j = 1; j <= 4; j++) {
            canvas.add(new fabric.Rect({
                objType: 'field',
                left: j * width,
                top: i * height,
                width: width,
                height: height,
                fill: '',
                strokeWidth: 8,
                stroke: 'grey',
                fieldNum: (i - 1) * 4 + j
            }));
        }
    }
}

function initPlayer() {
    player1 = new Player(roomInfo[2]);
    player1.id = 'p1';
    player1.hp = 100;
    player1.location = 5;
    player1.character = setCharacter('magenta', 5, 'player1');

    player2 = new Player(roomInfo[3]);
    player2.id = 'p2';
    player2.hp = 100;
    player2.location = 8;
    player2.character = setCharacter('cyan', 8, 'player2');

    canvas.add(player1.character, player2.character);
}

function setCharacter(color, location, playerNum) {
    var fieldDiv;
    if (playerNum === 'player1') {
        fieldDiv = 1;
    } else if (playerNum === 'player2') {
        fieldDiv = 3;
    } else {
        console.error("[ERROR] Something went wrong : Wrong playerNum.");
    }
    var _field = getFieldByNum(location);
    var _radius = fieldHeight / 6;
    return new fabric.Circle({
        objType: 'character',
        radius: _radius,
        left: _field.left + (fieldWidth / 4) * fieldDiv - _radius,
        top: _field.top + (fieldHeight / 2) - _radius,
        fill: color,
    });
}

function getFieldByNum(fieldNum) {
    var ret = null;
    canvas.getObjects('rect').forEach((obj) => {
        if (obj.fieldNum == fieldNum) {
            ret = obj;
            return ret;
        }
    })
    return ret;
}

function checkRange(location, target) {
    var ret = -1;
    switch (target) {
        // Top Left
        case 1:
            if ((location <= 4) || (location % 4 == 1)) {
                ret = -1;
            } else {
                ret = location - 5;
            }
            break;
            // Top
        case 2:
            if (location <= 4) {
                ret = -1;
            } else {
                ret = location - 4;
            }
            break;
            // Top Right
        case 3:
            if ((location <= 4) || (location % 4 == 0)) {
                ret = -1;
            } else {
                ret = location - 3;
            }
            break;
            // Left
        case 4:
            if (location % 4 == 1) {
                ret = -1;
            } else {
                ret = location - 1;
            }
            break;
            // Center
        case 5:
            ret = location;
            break;
            // Right
        case 6:
            if (location % 4 == 0) {
                ret = -1;
            } else {
                ret = location + 1;
            }
            break;
            // Bottom Left
        case 7:
            if ((location >= 9) || (location % 4 == 1)) {
                ret = -1;
            } else {
                ret = location + 3;
            }
            break;
            // Bottom
        case 8:
            if (location >= 9) {
                ret = -1;
            } else {
                ret = location + 4;
            }
            break;
            // Bottom Right
        case 9:
            if ((location >= 9) || (location % 4 == 0)) {
                ret = -1;
            } else {
                ret = location + 5;
            }
            break;
        default:
            console.error("[ERROR] Something went wrong : Wrong input in checkRange().");
    }
    return ret;
}

drawField(fieldWidth, fieldHeight);
initPlayer();

// var card;
// $.getJSON('json/card.json', (data) => {
//     card = data;
//     canvas.on('mouse:down', (evt) => player2.attack(testCard2));

//     var testCard = card[0];
//     var testCard2 = card[1];
//     var testCard3 = card[2];
//     setTimeout(() => player1.move(testCard3), 1000);
//     setTimeout(() => player2.move(testCard), 2000);
//     setTimeout(() => player1.attack(testCard2), 3000);
//     setTimeout(() => player2.attack(testCard2), 4000);
//     setTimeout(() => player1.attack(testCard2), 5000);
// });

function selectPhase() {
    var gaugeHeight = canvas.height / 24;
    var gaugeWidth = canvas.width / 3;
    //나중에 따로 함수로 빼자
    player1.hpGauge = new fabric.Rect({
        objType: 'gauge',
        left: gaugeWidth / 2,
        top: 0,
        width: gaugeWidth,
        height: gaugeHeight,
        fill: 'IndianRed',
        stroke: 'CornflowerBlue',
        strokeWidth: 4,
        rx: 10,
    });
    player2.hpGauge = new fabric.Rect({
        objType: 'gauge',
        left: gaugeWidth * 3 / 2,
        top: 0,
        width: gaugeWidth,
        height: gaugeHeight,
        fill: 'IndianRed',
        stroke: 'CornflowerBlue',
        strokeWidth: 4,
        rx: 10,
    });
    player1.enGauge = new fabric.Rect({
        objType: 'gauge',
        left: gaugeWidth / 2,
        top: gaugeHeight,
        width: gaugeWidth,
        height: gaugeHeight,
        fill: 'LemonChiffon',
        stroke: 'CornflowerBlue',
        strokeWidth: 4,
        rx: 10,
    });
    player2.enGauge = new fabric.Rect({
        objType: 'gauge',
        left: gaugeWidth * 3 / 2,
        top: gaugeHeight,
        width: gaugeWidth,
        height: gaugeHeight,
        fill: 'LemonChiffon',
        stroke: 'CornflowerBlue',
        strokeWidth: 4,
        rx: 10,
    });
    player1.info = new fabric.Group([
        new fabric.Rect({
            objType: 'info',
            left: gaugeWidth / 16,
            top: 0,
            width: gaugeWidth / 4,
            height: gaugeWidth / 4,
            fill: 'AliceBlue',
            stroke: 'LightSkyBlue',
            strokeWidth: 4,
            rx: 10,
        }),
        new fabric.Text(player1.nickname, {
            fontFamily:'Papyrus',
            fontSize: 48,
            textAlign: 'center',
            originX : 'center',
            originY : 'center',
            left: gaugeWidth / 16 * 3,
            top : gaugeWidth / 8,
        }), 
    ]);

    player2.info = new fabric.Group([
        new fabric.Rect({
            objType: 'info',
            left: gaugeWidth / 16 * 43,
            top: 0,
            width: gaugeWidth / 4,
            height: gaugeWidth / 4,
            fill: 'AliceBlue',
            stroke: 'LightSkyBlue',
            strokeWidth: 4,
            rx: 10,
        }),
        new fabric.Text(player2.nickname, {
            fontFamily:'Papyrus',
            fontSize: 48,
            textAlign: 'center',
            originX : 'center',
            originY : 'center',
            left: gaugeWidth / 16 * 45,
            top : gaugeWidth / 8,
        })
    ]);

    canvas.add(player1.hpGauge, player2.hpGauge, player1.enGauge, player2.enGauge, player1.info, player2.info);
}

selectPhase();