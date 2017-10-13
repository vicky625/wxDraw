/*
 * @Author: Thunderball.Wu 
 * @Date: 2017-10-13 13:31:22 
 * @Last Modified by: Thunderball.Wu
 * @Last Modified time: 2017-10-13 14:41:08
 * cshape 用户自定义的图形
 */


import { util } from '../util/utils.js';


var cOption = {
    x: 10,
    y: 10,
    // r: 10,
    // sides: 7,
    fillStyle: "red",
    strokeStyle: "red",
    points:[[1,1],[20,0],[30,40]],
    rotate: 0,
}



function Point(x, y) {
    this.x = x;
    this.y = y;
}




export const Cshape = function (option) {
    var _temOption = util.extend(option, cOption);

    this.Option = _temOption;

    this.max = {
        maxX: 0,
        maxY: 0,
        minX: 0,
        minY: 0,
    };
    
    this.massCenter = this.genMassCenter(this.Option.points);// 拿到点位 先计算重心
    this.posPoints = this.genPointsPositiveLoc();
    this.getMax();
    this._isChoosed = false;

    this.rotateOrigin=null    
}

Cshape.prototype = {
    genPointsPositiveLoc: function () {
        // 计算出所有 点与中心的相对位置
        let _allPos = [];
        this.Option.points.forEach(function(item){
             _allPos.push([this.massCenter-item[0],this.massCenter-item[1]])
        },this);
        return _allPos;
    },
    genMassCenter:function(points) {
        //计算质心 
        let _allX = 0;
        let _allY = 0;
        points.forEach(function(item){
          _allX+=item[0];
          _allY+=item[1];
        });

        return {
          x: _allX/points.length,
          y:_allY/points.length
        }

    },
    getPoints:function(x,y){
        let _points = [];
        this.posPoints.forEach(function(){
          _points.push([x-item[0],y-item[1]]);
       });//计算点位
        return _points;
    },
    getMax: function () {
        //绘制 与检测 不能在统一个地方
        let _Points =this.getPoints();

        this.max = {
            maxX: 0,
            maxY: 0,
            minX: 0,
            minY: 0,
        };

        _Points.forEach(function (element) {
            if (element.x > this.max.maxX) {
                this.max.maxX = element.x;
            }
            if (!this.max.minX) {
                this.max.minX = element.x;
            }
            if (this.max.minX && element.x < this.max.minX) {
                this.max.minX = element.x;
            }



            if (element.y > this.max.maxY) {
                this.max.maxY = element.y;
            }
            if (!this.max.minY) {
                this.max.minY = element.y;
            }
            if (this.max.minY && element.y < this.max.minY) {
                this.max.minY = element.y;
            }
        }, this);


    },
    createPath: function (context, x, y) {
        //创建路径
        var points = this.getPoints(x, y);
      
        context.beginPath();
        context.moveTo(points[0][1], points[0][1]);
        for(var i =1;i<=points.length;i++){
          context.lineTo(points[i][0],points[i][1]);
        }
        context.closePath();
    },
    stroke: function (context) {
        context.save();
        this._draw(context);
        context.setStrokeStyle(this.Option.strokeStyle)
        context.stroke();
        context.restore();
    },
    fill: function (context) {
        context.save();
        this._draw(context);
        context.setFillStyle(this.Option.fillStyle);
        context.fill();
        context.restore();
    },
    _draw: function (context) {
        this.getMax();
        if (!this.rotateOrigin) {
            context.translate(this.massCenter[0], this.massCenter[1]);
            context.rotate(this.Option.rotate);
            this.createPath(context, 0, 0); //绘制时候得坐标 与检测点击时候的坐标 是不一样的！！！！！
        } else {
            /**
             * 这里需要注意  在设置 旋转中心后  旋转的 位置点将变为rect 左上角
             */
            // console.log('不按原点旋转');
            context.translate(this.rotateOrigin[0], this.rotateOrigin[1]);
            context.rotate(this.Option.rotate);
            this.createPath(context, this.massCenter[0] - this.rotateOrigin[0], this.massCenter[1] - this.rotateOrigin[1])
        }
    },
    move: function (x, y) {

        this.massCenter[0] = x;
        this.massCenter[1] = y;
        // console.log('---------------', this.Option);
    },
    detected: function (x, y) {
        // pnpoly 算法区域

        // 首先找到 最大x 最小x 最大y 最小y
        // console.log('多边形点击',x,y,this.max)
        if (x > this.max.minX && x < this.max.maxX && y > this.max.minY && y < this.max.maxY) {
            //在最小矩形里面才开始
            console.log('点中');
            this.points = this.getPoints(this.Option.x, this.Option.y);

            this._offsetX = this.Option.x - x;
            this._offsetY = this.Option.y - y;
            if (this._pnpolyTest(x, y)) {
                this._isChoosed = true;
                return true;
            }
        }

      return false;
    },
    moveDetect: function (x, y) {

        if (this._isChoosed == true) {
            this.move(x + this._offsetX, y + this._offsetY);
            this.getMax();
        }

    },
    upDetect: function () {
        this._isChoosed = false;
    },
    _pnpolyTest(x, y) {
        // 核心测试代码 理论源于  https://wrf.ecse.rpi.edu//Research/Short_Notes/pnpoly.html
        // var A = this.points[0];// 拿到前面两个点
        // var B = this.points[1];
        var ifInside = false;

        for (var i = 0, j = this.points.length - 1; i < this.points.length; j = i++) {
            /**
             * 0 4
               1 0
               2 1
               3 2
               4 3
             */
            var Xi = this.points[i].x, Yi = this.points[i].y;
            var Xj = this.points[j].x, Yj = this.points[j].y;

            var insect = ((Yi > y) != (Yj > y)) && (x < (Xj - Xi) * (y - Yi) / (Yj - Yi) + Xi);

            if (insect) ifInside = !ifInside;
        }

        console.log(ifInside);
        return ifInside;
    },
    updateOption: function (option) {
        this.Option = util.extend(this.Option,option);
        this.bus.dispatch('update', 'no');
    },
    setRotateOrigin:function(loc){
        this.rotateOrigin= loc;
    }


}

