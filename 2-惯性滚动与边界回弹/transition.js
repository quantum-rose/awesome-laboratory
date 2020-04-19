(function (window, document) {
    let lockedX; // 是否锁定横向移动
    initToolsBar();

    /**
     * config 自定义配置
     */
    let acceleration = 2400, // 滚动时的加速度，总是与滚动方向相反，单位px/(s^2)
        throttle = 1000 / 60, // 节流延迟时间，用于控制touchmove事件的触发频率，单位ms
        momentumLimitTime = 300, // 符合惯性拖动的最大时间，单位ms
        momentumLimitDistance = 15, // 符合惯性拖动的最小拖动距离，单位px
        elasticConst = 300; // 弹性系数，值越大回弹越快

    /**
     * 程序运行所必要的数据
     */
    let myScroll = document.querySelector('.my-scroll'),
        myScrollContent = myScroll.firstElementChild, // myScroll只处理容器中第一个子元素的滚动
        offsetHeight = myScroll.offsetHeight,
        scrollHeight = myScroll.scrollHeight,
        bounceDirection = 0, // 回弹的方向，1向上，-1向下，数值上等于回弹反方向与x轴正方向的正弦
        overTop = 0, // 顶部回弹的距离，为正时有效
        overBottom = 0, // 底部回弹的距离，为正时有效
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
    myScroll.addEventListener('touchstart', function (e) {
        if (!isSingleTouch(e)) {
            return;
        }

        if (isScrolling) {
            let transformNumber = getComputedStyle(myScrollContent).transform.match(/-?\d+(\.\d+)?/g);
            myScrollTo((scrollLeft = transformNumber[4] - 0), (scrollTop = transformNumber[5] - 0), 0);
        }

        touchstartPoint = lastPoint = currentPoint = e.targetTouches[0];
        touchstartTime = lastTime = currentTime = Date.now();
    });

    /**
     * touchmove
     */
    myScroll.addEventListener('touchmove', function (e) {
        if (!isSingleTouch(e) || Date.now() - currentTime < throttle) {
            return;
        }

        lastPoint = currentPoint;
        currentPoint = e.targetTouches[0];
        lastTime = currentTime;
        currentTime = Date.now();

        overTop = scrollTop;
        overBottom = offsetHeight - scrollHeight - scrollTop;

        /**
         * 边界回弹条件成立后，如果继续往增大回弹距离的方向拖动，滚动距离与手指拖动距离的比值与回弹距离成反比，表现为难以拖动
         */
        if (lockedX && (overTop > 0 || overBottom > 0)) {
            let overHeight = Math.max(overTop, overBottom),
                rate = Math.max((100 - overHeight) / 100, 0.1),
                d = currentPoint.pageY - lastPoint.pageY;

            if ((overTop > 0 && d > 0) || (overBottom > 0 && d < 0)) {
                scrollTop += d * rate;
            } else {
                scrollTop += d;
            }
        } else {
            scrollLeft += currentPoint.pageX - lastPoint.pageX;
            scrollTop += currentPoint.pageY - lastPoint.pageY;
        }
        myScrollTo(scrollLeft, scrollTop, 0);
    });

    /**
     * touchend
     */
    myScroll.addEventListener('touchend', function (e) {
        if (!isSingleTouch(e)) {
            return;
        }

        overTop = scrollTop;
        overBottom = offsetHeight - scrollHeight - scrollTop;

        /**
         * 条件成立优先执行回弹动画
         */
        if (lockedX && (overTop > 0 || overBottom > 0)) {
            scrollSpeed = 0;
            bounceDirection = overTop > 0 ? 1 : -1;
            endBounce();
        } else if (
            ((e.changedTouches[0].pageX - touchstartPoint.pageX) ** 2 +
                (e.changedTouches[0].pageY - touchstartPoint.pageY) ** 2) **
                0.5 >=
                momentumLimitDistance ||
            Date.now() - touchstartTime <= momentumLimitTime
        ) {
            let deltaX = currentPoint.pageX - lastPoint.pageX,
                deltaY = currentPoint.pageY - lastPoint.pageY,
                deltaDistance = (deltaX ** 2 + deltaY ** 2) ** 0.5;

            scrollSpeed = deltaDistance / ((currentTime - lastTime) / 1000);
            scrollSpeed > 4000 && (scrollSpeed = 4000);
            scrollDirectionCos = deltaX / deltaDistance;
            scrollDirectionSin = deltaY / deltaDistance;
            momentumScroll();
        }
    });

    /**
     * transitionend
     */
    myScroll.addEventListener('transitionend', function (e) {
        isScrolling = false;
    });

    /**
     * 惯性滚动动画
     */
    function momentumScroll() {
        let d = scrollSpeed ** 2 / (2 * acceleration),
            transitionDuration = scrollSpeed / acceleration;
        scrollLeft += scrollDirectionCos * d;
        scrollTop += scrollDirectionSin * d;

        overTop = scrollTop;
        overBottom = offsetHeight - scrollHeight - scrollTop;
        if (lockedX && (overTop > 0 || overBottom > 0)) {
            bounceDirection = overTop > 0 ? 1 : -1;
            let overHeight = Math.max(overTop, overBottom);
            scrollTop -= bounceDirection * overHeight;
            myScrollTo(scrollLeft, scrollTop, transitionDuration, 'cubic-bezier(0,1.2,1,1.2)');
        } else {
            myScrollTo(scrollLeft, scrollTop, transitionDuration);
        }
    }

    /**
     * 边界回弹动画
     */
    function endBounce() {
        let overHeight = Math.max(overTop, overBottom),
            a = overHeight * elasticConst * 0.5, // 平均加速度
            transitionDuration = (2 * overHeight) ** 0.5 / a ** 0.5; // 已知位移距离、初速度为0、加速度求运动时长
        scrollTop -= bounceDirection * overHeight;
        myScrollTo(scrollLeft, scrollTop, transitionDuration);
    }

    /**
     * 滚动到指定位置
     * @param {Number} scrollLeft
     * @param {Number} scrollTop
     * @param {Number} transitionDuration
     */
    function myScrollTo(scrollLeft, scrollTop, transitionDuration, timingFunction = 'cubic-bezier(0.23, 1, 0.32, 1)') {
        isScrolling = transitionDuration !== 0;
        const style = myScrollContent.style;
        style.transitionTimingFunction = timingFunction;
        style.transitionDuration = `${transitionDuration}s`;
        style.transform = `translate3d(${lockedX ? (scrollLeft = 0) : scrollLeft}px, ${scrollTop}px, 0)`;
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
        lockX.addEventListener('input', function (e) {
            lockedX = e.target.checked;
            myScrollTo((scrollLeft = 0), scrollTop, 0.3);
        });
    }
})(window, document);
