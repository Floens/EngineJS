(function(global, undefined) {
'use strict';

global.UIButton = function(text, x, y, w, h) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;

    this.color = '#000';
    this.overlayColor = 'rgb(17, 169, 207)';

    this.align = 'center';
    this.size = 18;

    this.pressed = false;
    this.wasDown = false;
    this.wasDownHere = false;
}

UIButton.prototype.setColor = function(color) {
    this.color = color;
}

UIButton.prototype.setOverlayColor = function(color) {
    this.overlayColor = color;
}

UIButton.prototype.setAlign = function(align) {
    this.align = align;
}

UIButton.prototype.setSize = function(size) {
    this.size = size;
}

UIButton.prototype.render = function(c) {
    var x = this.align == 'center' ? this.x - c.measureText(this.text, this.size) / 2 : this.x;

    if (this._getMouseOver()) {
        c.fillText(this.text, x, this.y, this.overlayColor, this.size);
    } else {
        c.fillText(this.text, x, this.y, this.color, this.size);
    }
}

UIButton.prototype._getMouseOver = function() {
    var mx = Input.getMousePosition()[0],
        my = Input.getMousePosition()[1];

    var x = this.align == 'center' ? this.x - Canvas.measureText(this.text, this.size) / 2 : this.x;
    if (mx < x || mx > x + this.w || my < this.y || my > this.y + this.h) return false;
    return true;
}

UIButton.prototype._getMousePressed = function() {
    return Input.getMousePressed(Input.BUTTON_LEFT);
}

UIButton.prototype.getClicked = function() {
    return this.pressed;
}

UIButton.prototype.update = function() {
    this.mouseover = this._getMouseOver();

    var down = this._getMousePressed();
    if (!this.wasDown && down) {
        this.wasDown = true;
        if (this._getMouseOver()) {
            this.wasDownHere = true;
        }
    } else if (this.wasDown && !down) {
        if (this.wasDownHere && this._getMouseOver()) {
            this.pressed = true;
        }
        this.wasDown = false;
        this.wasDownHere = false;
    }
}



})(global);
