window.onmessage = function (e) {
    if (e.data && (typeof e.data === 'string' || e.data instanceof String)) {
        document.querySelector('#noter-text-area').value = e.data;
    }
};