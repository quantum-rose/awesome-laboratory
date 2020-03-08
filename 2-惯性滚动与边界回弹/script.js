(function(window, document) {
    let _eleScrollLeft = document.querySelector('.scroll-left'),
        _eleScrollTop = document.querySelector('.scroll-top'),
        _eleScrollVelocity = document.querySelector('.scroll-velocity'),
        _scrollLeft = 0,
        _scrollTop = 0,
        _scrollVelocity = 0;

    Object.defineProperty(window, 'scrollLeft', {
        get() {
            return _scrollLeft;
        },
        set(val) {
            _eleScrollLeft.innerHTML = 'scrollLeft: ' + val;
            _scrollLeft = val;
        }
    });

    Object.defineProperty(window, 'scrollTop', {
        get() {
            return _scrollTop;
        },
        set(val) {
            _eleScrollTop.innerHTML = 'scrollTop: ' + val;
            _scrollTop = val;
        }
    });

    Object.defineProperty(window, 'scrollVelocity', {
        get() {
            return _scrollVelocity;
        },
        set(val) {
            _eleScrollVelocity.innerHTML = 'velocity: ' + val;
            _scrollVelocity = val;
        }
    });

    /**
     * config 自定义配置
     */
    let a = 50, // 滚动时的加速度，总是与滚动方向相反，单位px/(s^2)
        throttle = 1000 / 60; // 节流延迟时间，用于控制touchmove事件的触发频率，单位ms

    /**
     * 程序运行所必要的数据
     */
    let myScroll = document.querySelector('.my-scroll'),
        touchIdentifier = null, // touch事件中触点的唯一标识，用于禁用多点触控
        lastPoint = null, // 上一次的触点
        currentPoint = null, // 当前触点
        lastTime = 0, // 上一个触点的时间戳
        currentTime = 0, // 当前触点的时间戳
        isScrolling = false; // 是否正在滚动的标识

    /**
     * touchstart
     */
    myScroll.addEventListener('touchstart', function(e) {
        if (!isSingleTouch(e)) {
            return;
        }
        isScrolling = false;

        lastPoint = currentPoint = e.targetTouches[0];
        lastTime = currentTime = Date.now();
    });

    /**
     * touchmove
     */
    myScroll.addEventListener('touchmove', function(e) {
        e.preventDefault();

        if (!isSingleTouch(e) || Date.now() - currentTime < throttle) {
            return;
        }

        lastPoint = currentPoint;
        currentPoint = e.targetTouches[0];
        lastTime = currentTime;
        currentTime = Date.now();

        scrollLeft += currentPoint.pageX - lastPoint.pageX;
        scrollTop += currentPoint.pageY - lastPoint.pageY;
        scrollTo(scrollLeft, scrollTop);
    });

    /**
     * touchend
     */
    myScroll.addEventListener('touchend', function(e) {
        if (!isSingleTouch(e) || lastTime === currentTime) {
            return;
        }
        let deltaX = currentPoint.pageX - lastPoint.pageX,
            deltaY = currentPoint.pageY - lastPoint.pageY,
            deltaD = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
            cos = deltaX / deltaD,
            sin = deltaY / deltaD,
            scrollVelocity = deltaD / ((currentTime - lastTime) / 1000);
        isScrolling = true;
        inertialRolling(cos, sin, scrollVelocity);
    });

    /**
     * 惯性滚动动画
     * @param {Number} cos 滑动方向与x轴正方向夹角的余弦
     * @param {Number} sin 滑动方向与x轴正方向夹角的正弦
     * @param {Number} scrollVelocity 滚动速度，标量，单位px/s
     */
    function inertialRolling(cos, sin, scrollVelocity) {
        if (!isScrolling) {
            return;
        }
        lastTime = currentTime;
        currentTime = Date.now();
        let t = (currentTime - lastTime) / 1000;
        let v = scrollVelocity - a;

        if (v <= 0) {
            scrollVelocity = 0;
            isScrolling = false;
            return;
        } else if (v > 4000) {
            scrollVelocity = 4000;
        } else {
            scrollVelocity = v;
        }

        let d = scrollVelocity * t - 0.5 * a * t * t;
        scrollLeft += cos * d;
        scrollTop += sin * d;
        scrollTo(scrollLeft, scrollTop);

        requestAnimationFrame(inertialRolling.bind(this, cos, sin, scrollVelocity));
    }

    /**
     * 滚动到指定位置
     * @param {Number} scrollLeft
     * @param {Number} scrollTop
     */
    function scrollTo(scrollLeft, scrollTop) {
        myScroll.style.transform = `translate3d(${scrollLeft}px, ${scrollTop}px, 0)`;
    }

    /**
     * 判断触摸事件是否为单点触控
     * @param {Event} e Touch Event
     * @return {Boolean} 是否是单点触控
     */
    function isSingleTouch(e) {
        if (e.changedTouches) {
            switch (e.type) {
                case 'touchstart':
                    if (touchIdentifier === null) {
                        touchIdentifier = e.changedTouches[0].identifier;
                        return true;
                    }
                    break;
                case 'touchmove':
                    for (let i = 0; i < e.changedTouches.length; i++) {
                        if (touchIdentifier === e.changedTouches[i].identifier) {
                            return true;
                        }
                    }
                    break;
                case 'touchend':
                    for (let i = 0; i < e.changedTouches.length; i++) {
                        if (touchIdentifier === e.changedTouches[i].identifier) {
                            touchIdentifier = null;
                            return true;
                        }
                    }
                    break;
            }
        }
        return false;
    }
})(window, document);
