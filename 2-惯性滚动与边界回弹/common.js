(function(window, document) {
    let scroll = document.querySelector('.my-scroll').firstElementChild;
    for (let i = 0; i < 100; i++) {
        let div = document.createElement('div');
        div.style.backgroundColor = `hsla(${i * 3.6}, 100%, 75%, 1)`;
        div.innerText = div.dataset.index = i;
        scroll.appendChild(div);
    }
})(window, document);
