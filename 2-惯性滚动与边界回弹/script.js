(function(window, document) {
    let myScroll = document.querySelector('.my-scroll');
    let eleScrollLeft = document.querySelector('.scroll-left');
    let eleScrollTop = document.querySelector('.scroll-top');
    let eleScrollVelocity = document.querySelector('.scroll-velocity');

    let _scrollLeft = 0;
    let _scrollTop = 0;
    let _scrollVelocity = 0;

    Object.defineProperty(window, 'scrollLeft', {
        get() {
            return _scrollLeft;
        },
        set(val) {
            eleScrollLeft.innerHTML = 'scrollLeft: ' + val;
            _scrollLeft = val;
        }
    });

    Object.defineProperty(window, 'scrollTop', {
        get() {
            return _scrollTop;
        },
        set(val) {
            eleScrollTop.innerHTML = 'scrollTop: ' + val;
            _scrollTop = val;
        }
    });

    Object.defineProperty(window, 'scrollVelocity', {
        get() {
            return _scrollVelocity;
        },
        set(val) {
            eleScrollVelocity.innerHTML = 'velocity: ' + val;
            _scrollVelocity = val;
        }
    });

    let lastPoint = { x: 0, y: 0 }, // 上一次的触点
        currentPoint = { x: 0, y: 0 }, // 当前触点
        lastTime = 0, // 上一个触点的时间戳
        currentTime = 0, // 当前触点的时间戳
        a = 50, // 加速度
        t = 1 / 60, // 惯性滚动的时间间隔
        timer = null,
        touchIdentifier = null;

    myScroll.addEventListener('touchstart', function(e) {
        if (!isSingleTouch(e)) {
            return;
        }

        if (timer) {
            clearInterval(timer);
        }

        let { pageX: x, pageY: y } = e.targetTouches[0];
        lastPoint = { x, y };
        currentPoint = { x, y };
        lastTime = Date.now();
        currentTime = Date.now();
    });

    myScroll.addEventListener('touchmove', function(e) {
        if (!isSingleTouch(e)) {
            return;
        }

        e.preventDefault();

        let { pageX: x, pageY: y } = e.targetTouches[0];
        lastPoint = currentPoint;
        currentPoint = { x, y };
        lastTime = currentTime;
        currentTime = Date.now();

        scrollLeft += x - lastPoint.x;
        scrollTop += y - lastPoint.y;
        scrollTo(scrollLeft, scrollTop);
    });

    myScroll.addEventListener('touchend', function(e) {
        if (!isSingleTouch(e) || lastTime === currentTime) {
            return;
        }

        let deltaX = currentPoint.x - lastPoint.x;
        let deltaY = currentPoint.y - lastPoint.y;
        let deltaD = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        scrollVelocity = deltaD / ((currentTime - lastTime) / 1000);
        let cos = deltaX / deltaD;
        let sin = deltaY / deltaD;

        timer = setInterval(() => {
            let v = scrollVelocity - a;

            if (v <= 0) {
                scrollVelocity = 0;
                clearInterval(timer);
            } else if (v > 4000) {
                scrollVelocity = 4000;
            } else {
                scrollVelocity = v;
            }

            let d = scrollVelocity * t - 0.5 * a * t * t;
            scrollLeft += cos * d;
            scrollTop += sin * d;
            scrollTo(scrollLeft, scrollTop);
        }, t * 1000);
    });

    function scrollTo(scrollLeft, scrollTop) {
        myScroll.style.transform = `translate3d(${scrollLeft}px, ${scrollTop}px, 0)`;
    }

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
