document.addEventListener("DOMContentLoaded", () => {
const callback = (...args) => {
        console.count('callback throttled with arguments');
}
const debounce = (callback, delay) => {
        let timeoutHandler = null;
        return (...args) => {
                if (timeoutHandler) {
                        clearTimeout(timeoutHandler);
                }
                timeoutHandler = setTimeout(() => {
                        callback(...args);
                        timeoutHandler = null;

                }, delay);
        }
}

document.querySelector("input").addEventListener("input", debounce(callback, 100));
}); 