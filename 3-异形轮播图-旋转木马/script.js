(function(window, document) {
    /**
     * config 配置
     */
    let swiperItems = [
            {
                id: 0, // 唯一标识
                style: {
                    backgroundColor: 'pink'
                },
                deg: 0, // 实时rotateY
                isCurrent: false // 是否是当前展示在最前方的swiperItem
            },
            {
                id: 1,
                style: {
                    backgroundColor: 'cyan'
                },
                deg: 0,
                isCurrent: false
            },
            {
                id: 2,
                style: {
                    backgroundColor: 'skyblue'
                },
                deg: 0,
                isCurrent: false
            },
            {
                id: 3,
                style: {
                    backgroundColor: 'hotpink'
                },
                deg: 0,
                isCurrent: false
            },
            {
                id: 4,
                style: {
                    backgroundColor: 'lightgreen'
                },
                deg: 0,
                isCurrent: false
            }
        ],
        swiperTransitionDuration = 0.3, // swiper动画的持续时间，单位s
        throttle = 1000 / 60, // 节流延迟时间，用于控制touchmove事件的触发频率，单位ms
        unitDeg = 0.5, // touchemove事件中，手指每移动1px，swiperItem转过的角度，单位deg
        sillTouchmoveSpeed = 800, // 滑动swiper的速度阈值，单位px/s，超过这个值时手指离开屏幕后swiper自动滑动到下一个swiperItem
        swiperInitCallback = function(item, index, array) {
            item.elem.style.backgroundImage = `linear-gradient(to bottom, ${item.style.backgroundColor}, transparent 50%)`;
        },
        animateSwiperCallback = function(item, index, array) {
            if (item.isCurrent) {
                let bgc = item.style.backgroundColor;
                document.body.style.backgroundImage = `linear-gradient(to bottom, rgba(255, 255, 255, 0.4) 0% 100%), linear-gradient(to bottom, ${bgc}, white, ${bgc})`;
            }
        };

    /**
     * 程序运行所必要的数据
     */
    let swiper = document.querySelector('.swiper'), // swiper容器
        touchIdentifier = null, // touch事件中触点的唯一标识，用于禁用多点触控
        lastSwiperTouchPoint = null, // 上一次的触点
        currentSwiperTouchPoint = null, // 当前的触点
        lastSwiperTouchTime = 0, // 上一次触点的时间戳
        currentSwiperTouchTime = 0, // 当前触点的时间戳
        swiperItemTranslateZ = `calc(var(--swiper-item-width) * 1rem / ${2 *
            Math.sin((2 * Math.PI) / swiperItems.length)})`, // swiperItem的translateZ，等于边长为swiperItem宽度的正n边形外接圆的半径，n为swiperItem的数量
        swiperItemGapDeg = 360 / swiperItems.length, // 相邻两个swiperItem的rotateY之差，等于360除以swiperItem的数量
        halfSwiperItemGapDeg = swiperItemGapDeg / 2; // rotateY之差的一半

    swiperInit(swiper, swiperInitCallback);

    /**
     * touchstart
     */
    swiper.addEventListener('touchstart', function(e) {
        if (!isSingleTouch(e)) {
            return;
        }
        lastSwiperTouchPoint = currentSwiperTouchPoint = e.targetTouches[0];
        lastSwiperTouchTime = currentSwiperTouchTime = Date.now();
    });

    /**
     * touchmove
     */
    swiper.addEventListener('touchmove', function(e) {
        if (!isSingleTouch(e) || Date.now() - currentSwiperTouchTime <= throttle) {
            return;
        }
        lastSwiperTouchPoint = currentSwiperTouchPoint;
        currentSwiperTouchPoint = e.targetTouches[0];
        lastSwiperTouchTime = currentSwiperTouchTime;
        currentSwiperTouchTime = Date.now();

        let deltaDeg = (currentSwiperTouchPoint.pageX - lastSwiperTouchPoint.pageX) * unitDeg;
        animateSwiper(deltaDeg, 0, animateSwiperCallback);
    });

    /**
     * touchend
     */
    swiper.addEventListener('touchend', function(e) {
        if (!isSingleTouch(e) || lastSwiperTouchTime === currentSwiperTouchTime) {
            return;
        }
        let touchmoveSpeed =
                (currentSwiperTouchPoint.pageX - lastSwiperTouchPoint.pageX) /
                ((currentSwiperTouchTime - lastSwiperTouchTime) / 1000),
            sample = swiperItems[0],
            degFloor = Math.floor(sample.deg / swiperItemGapDeg) * swiperItemGapDeg,
            degCeil = Math.ceil(sample.deg / swiperItemGapDeg) * swiperItemGapDeg,
            deltaDeg = 0;

        if (Math.abs(touchmoveSpeed) > sillTouchmoveSpeed) {
            deltaDeg = (touchmoveSpeed > 0 ? degCeil : degFloor) - sample.deg;
        } else {
            deltaDeg = (degCeil - sample.deg < sample.deg - degFloor ? degCeil : degFloor) - sample.deg;
        }

        animateSwiper(deltaDeg, swiperTransitionDuration, animateSwiperCallback);
    });

    /**
     * 初始化，插入swiperItem
     * @param {Element} swiperContainer swiper容器
     * @param {Function} callBack 回调函数，包含三个参数，同forEach，对于每一个swiperItem，回调函数都会执行一次
     */
    function swiperInit(swiperContainer, callBack = null) {
        swiperItems.forEach((item, index, array) => {
            let swiperItem = document.createElement('div'),
                style = swiperItem.style;

            swiperItem.classList.add('swiper-item');

            for (let key in item.style) {
                style[key] = item.style[key];
            }

            item.deg = swiperItemGapDeg * index;
            item.isCurrent = index === 0;
            item.elem = swiperItem;
            swiperContainer.appendChild(swiperItem);

            typeof callBack === 'function' && callBack(item, index, array);
        });
        animateSwiper(0, 0, animateSwiperCallback);
    }

    /**
     * 轮播图动画，用于更新视图层
     * @param {Number} deltaDeg swiper要转过的角度
     * @param {Number} swiperTransitionDuration swiper的动画持续时间，单位s
     * @param {Function} callBack 回调函数，包含三个参数，同forEach，对于每一个swiperItem，回调函数都会执行一次
     */
    function animateSwiper(deltaDeg, swiperTransitionDuration, callBack = null) {
        swiperItems.forEach((item, index, array) => {
            item.deg += deltaDeg;

            let degMod360 = item.deg % 360;
            item.isCurrent =
                degMod360 < halfSwiperItemGapDeg - 360 ||
                (degMod360 < halfSwiperItemGapDeg && degMod360 >= -halfSwiperItemGapDeg) ||
                degMod360 >= 360 - halfSwiperItemGapDeg;

            let style = item.elem.style;
            style.transform = `translateX(-50%) translateY(-50%) rotateY(${
                item.deg
            }deg) translateZ(${swiperItemTranslateZ}) rotateY(${-item.deg}deg)`;
            style.transitionDuration = `${swiperTransitionDuration}s`;

            typeof callBack === 'function' && callBack(item, index, array);
        });
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
