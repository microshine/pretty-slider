//on ready
document.addEventListener("DOMContentLoaded", function (event) {
    var nodes = queryAll(".microsha-slider");
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        window.slider = new Slider(node);
        slider.run();
    }
});



function Slider() {
    extend(this, Element);
    var that = this;

    var texts, images, blank;

    var _items = new SliderItemCollection({ parent: this });
    this.items = function (i) {
        if (isNumber(i)) {
            return _items.items(i);
        }
        return _items;
    }

    this.defineProperty("stepCount", 5);

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    var simpleNums = [1, 2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
    var matrix = [];

    function getRandomItem() {
        var items = getBlankNeighbors();
        return items[getRandomInt(0, items.length)];
    }

    function compareLast(item) {
        //if (last.i == NaN || last.j == NaN)
        //    return false;
        return last.i == item.i && last.j == item.j
    }

    function getBlankNeighbors() {
        var res = [];
        var item;
        //left
        if (item = getBlankNeighbor(blank.i, blank.j - 1)) {
            if (!compareLast(item)) {
                item.type = "right";
                res.push(item);
            }
        }
        //bottom
        if (item = getBlankNeighbor(blank.i + 1, blank.j)) {
            if (!compareLast(item)) {
                item.type = "top";
                res.push(item);
            }
        }
        //right
        if (item = getBlankNeighbor(blank.i, blank.j + 1)) {
            if (!compareLast(item)) {
                item.type = "left";
                res.push(item);
            }
        }
        //top
        if (item = getBlankNeighbor(blank.i - 1, blank.j)) {
            if (!compareLast(item)) {
                item.type = "bottom";
                res.push(item);
            }
        }
        return res;
    }

    function getBlankNeighbor(i, j) {
        if (matrix[i] && matrix[i][j]) {
            //console.log("i", i, "j", j, "blank", blank);
            return matrix[i][j];
        }
        return null;
    }

    function countSize(n) {
        if (simpleNums.indexOf(n) >= 0)
            throw new Error(n + " is a simple number");
        var sqrt = Math.sqrt(n);
        if (sqrt % 1 == 0)
            return { i: sqrt, j: sqrt };
        var a = Math.ceil(sqrt);
        var res = null;
        for (var i = n; i >= a; i--)
            for (var j = 1; j < n; j++) {
                var r = i * j;
                if (r == n) {
                    //compare with res
                    if (!res || (res.i - res.j) > (i - j))
                        res = { i: i, j: j };
                }
                else if (r > n)
                    break;
            }
        return res;
    }

    function initMatrix() {
        images = _items.images();
        var matrix_size = countSize(images.length + 1);
        //get random for blank item
        blank = { i: getRandomInt(1, matrix_size.i), j: getRandomInt(1, matrix_size.j) };
        //console.log("Blank", blank);
        var imageHeight = images[0].height();
        var imageWidth = images[0].width();
        //console.log("Image.size:", imageWidth, imageHeight);

        this.size(imageWidth * matrix_size.i, imageHeight * matrix_size.j);
        var k = 0;
        for (var i = 0; i < matrix_size.i; i++) {
            matrix[i] = [];
            for (var j = 0; j < matrix_size.j; j++) {
                if (i == blank.i && j == blank.j) {
                    //console.log("Blank here");
                }
                else {
                    var image = images[k];
                    matrix[i][j] = image;
                    image.i = i;
                    image.j = j;
                    image.position({ x: (j * imageWidth), y: (i * imageHeight) });
                    k++;
                }
            }
        }
    }

    function getData(el) {
        var texts = [];
        for (var i = 0; i < el.children.length; i++) {
            var _el = el.children[i];
            if (_el.nodeName == "DIV")
                texts.push({ innerHTML: _el.innerHTML });
        }
        var res = {
            images: queryAll("img", el),
            texts: texts
        };
        return res;
    }

    this.stop = function () {
        isStop = true;
    }

    var isStop = false;
    var last = { i: NaN, j: NaN };
    var _stepCount = 0;
    var _lastText = -1;
    this.run = function () {
        if (_stepCount == 0) {
            _stepCount = that.stepCount();
            _lastText++;
            if (!(_lastText >= 0 && _lastText < that.items().texts().length))
                _lastText = 0;
            var text = that.items().texts()[_lastText];
            text.show();
            text.move(blank);
            window.setTimeout(function () {
                text.hide();
                setTimeout(function () {
                    that.run();
                },500)
            },5000)
        }
        else {
            _stepCount--;
            var item = getRandomItem();
            var done = false;
            function endTransition(e) {
                done = true;
                if (!isStop) {
                    that.run();
                }
                else {
                    isStop = false;
                }
                item.node().removeEventListener("webkitTransitionEnd", endTransition, false);
            }
            item.node().addEventListener("webkitTransitionEnd", endTransition, false);
            setTimeout(function () {
                if (!done) {
                    //console.log("timeout needed to call transition ended..");
                    endTransition();
                }
            }, 600);
            item.move(item.type);
            //console.log("blank", blank, "direct", item.type);
            matrix[blank.i][blank.j] = item;
            matrix[item.i][item.j] = null;
            var i = last.i = blank.i;
            var j = last.j = blank.j;
            blank.i = item.i;
            blank.j = item.j;
            item.i = i;
            item.j = j;
            //console.log("blank", blank);
        }
    }

    function init() {
        var node = arguments[0];
        this.node(node);
        this.class("microsha-slider");
        var data = getData(node);

        //Remove all elements
        this.html("");

        //Create images
        for (var i = 0; i < data.images.length; i++) {
            var image = new SliderImage({ src: data.images[i].src });
            this.items().add(image);
        }
        //Create texts
        for (var i = 0; i < data.texts.length; i++) {
            var text = new SliderText({ html: data.texts[i].innerHTML});
            this.items().add(text);
        }

        initMatrix.call(this);
        texts = _items.texts();
        //this.applyOptions(arguments[0]);


    }
    init.apply(this, arguments);
}

function SliderItemCollection() {
    extend(this, Collection);
    var that = this;

    this.defineProperty("parent");

    this.images = function () {
        var arr = [];
        for (var i = 0; i < this.length() ; i++)
            if (isType(this.items(i), SliderImage))
                arr.push(this.items(i));
        return arr;
    }

    this.texts = function () {
        var arr = [];
        for (var i = 0; i < this.length() ; i++)
            if (isType(this.items(i), SliderText))
                arr.push(this.items(i));
        return arr;
    }

    this.on("beforeAdd", function (e) {
        if (!isType(e.value, SliderItem))
            throw new TypeError("SliderItemCollection.add: Value must be SliderItem");
    })

    this.on("add", function (e) {
        this.parent().append(e.value);
    })

    function init() {
        this.applyOptions(arguments[0]);
    }
    init.apply(this, arguments);
}

function SliderItem() {
    extend(this, Element);
    var that = this;

    this.move = function (direction) {
        var x = this.x();
        var y = this.y();
        switch (direction) {
            case "top":
                y -= this.height();
                break;
            case "bottom":
                y += this.height();
                break;
            case "left":
                x -= this.width();
                break;
            case "right":
                x += this.width();
                break;
            default:
                throw new Error("Unknown direction");
        }
        this.node().style.left = x;
        this.node().style.top = y;
    }

    function init() {
        this.create();
        this.class("slider-item");
        this.applyOptions(arguments[0]);
    }
    init.apply(this, arguments);
}

function SliderImage() {
    extend(this, SliderItem);
    var that = this;

    this.defineProperty("src");

    this.on("change", function (e) {
        switch (e.name) {
            case "src":
                that.node().style.backgroundImage = "url(" + e.value + ")";
                break;
        }
    })

    function init() {
        this.addClass("slider-image");
        this.applyOptions(arguments[0]);
    }
    init.apply(this, arguments);
}

function SliderText() {
    extend(this, SliderItem);
    var that = this;

    this.move = function (position) {
        this.x(this.width() * position.j);
        this.y(this.height() * position.i);
    }

    function init() {
        this.addClass("slider-text");
        this.hide();
        this.applyOptions(arguments[0]);
    }
    init.apply(this, arguments);
}