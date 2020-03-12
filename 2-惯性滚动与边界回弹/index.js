(function(window, document) {
    let lockedX; // 是否锁定横向移动
    initToolsBar();
    /**
     * config 自定义配置
     */
    let acceleration = 2400, // 滚动时的加速度，总是与滚动方向相反，单位px/(s^2)
        throttle = 1000 / 60, // 节流延迟时间，用于控制touchmove事件的触发频率，单位ms
        momentumLimitTime = 300, // 符合惯性拖动的最大时间，单位ms
        momentumLimitDistance = 15; // 符合惯性拖动的最小拖动距离，单位px

    /**
     * 程序运行所必要的数据
     */
    let myScroll = document.querySelector('.my-scroll'),
        touchIdentifier = null, // touch事件中触点的唯一标识，用于禁用多点触控
        touchstartTime = 0, // 触摸开始的时间
        touchstartPoint = null, // 触摸开始的触点
        lastPoint = null, // 上一次的触点
        currentPoint = null, // 当前触点
        lastTime = 0, // 上一个触点的时间戳
        currentTime = 0, // 当前触点的时间戳
        isScrolling = false, // 是否正在滚动的标识
        scrollLeft = 0, // 滚动主体的translateX
        scrollTop = 0, // 滚动主体的translateY
        scrollSpeed = 0, // 滚动速度，标量，单位px/s
        scrollDirectionCos = 0, // 滚动方向与x轴正方向夹角的余弦
        scrollDirectionSin = 0; // 滚动方向与x轴正方向夹角的正弦

    /**
     * touchstart
     */
    myScroll.addEventListener('touchstart', function(e) {
        if (!isSingleTouch(e)) {
            return;
        }
        isScrolling = false;

        touchstartPoint = lastPoint = currentPoint = e.targetTouches[0];
        touchstartTime = lastTime = currentTime = Date.now();
    });

    /**
     * touchmove
     */
    myScroll.addEventListener('touchmove', function(e) {
        if (!isSingleTouch(e) || Date.now() - currentTime < throttle) {
            return;
        }

        lastPoint = currentPoint;
        currentPoint = e.targetTouches[0];
        lastTime = currentTime;
        currentTime = Date.now();

        scrollLeft += currentPoint.pageX - lastPoint.pageX;
        scrollTop += currentPoint.pageY - lastPoint.pageY;
        myScrollTo(scrollLeft, scrollTop, 0);
    });

    /**
     * touchend
     */
    myScroll.addEventListener('touchend', function(e) {
        if (
            !isSingleTouch(e) ||
            ((e.changedTouches[0].pageX - touchstartPoint.pageX) ** 2 +
                (e.changedTouches[0].pageY - touchstartPoint.pageY) ** 2) **
                0.5 <
                momentumLimitDistance ||
            Date.now() - touchstartTime > momentumLimitTime
        ) {
            return;
        }
        let deltaX = currentPoint.pageX - lastPoint.pageX,
            deltaY = currentPoint.pageY - lastPoint.pageY,
            deltaDistance = (deltaX ** 2 + deltaY ** 2) ** 0.5;

        scrollSpeed = deltaDistance / ((currentTime - lastTime) / 1000);
        scrollSpeed > 4000 && (scrollSpeed = 4000);
        scrollDirectionCos = deltaX / deltaDistance;
        scrollDirectionSin = deltaY / deltaDistance;
        isScrolling = true;
        momentumScroll();
    });

    /**
     * 惯性滚动动画
     */
    function momentumScroll() {
        if (!isScrolling) {
            scrollSpeed = 0;
            return;
        }
        lastTime = currentTime;
        currentTime = Date.now();
        let t = (currentTime - lastTime) / 1000;
        let v = scrollSpeed - acceleration * t;

        if (v <= 0) {
            scrollSpeed = 0;
            isScrolling = false;
            return;
        } else {
            scrollSpeed = v;
        }

        let d = scrollSpeed * t - 0.5 * acceleration * t * t;
        scrollLeft += scrollDirectionCos * d;
        scrollTop += scrollDirectionSin * d;
        myScrollTo(scrollLeft, scrollTop, 0);

        requestAnimationFrame(momentumScroll);
    }

    /**
     * 滚动到指定位置
     * @param {Number} scrollLeft
     * @param {Number} scrollTop
     * @param {Number} transitionDuration
     */
    function myScrollTo(scrollLeft, scrollTop, transitionDuration) {
        myScroll.style.transitionDuration = `${transitionDuration}s`;
        myScroll.style.transform = `translate3d(${lockedX ? (scrollLeft = 0) : scrollLeft}px, ${scrollTop}px, 0)`;
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

    function initToolsBar() {
        let lockX = document.getElementById('lock-x');
        lockedX = lockX.checked;
        lockX.addEventListener('input', function(e) {
            lockedX = e.target.checked;
            myScrollTo((scrollLeft = 0), scrollTop, 0.3);
        });
    }
})(window, document);
