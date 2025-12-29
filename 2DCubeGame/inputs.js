const inputs = {};
const inputQueue = [];

document.addEventListener('keydown', (event) => {
    inputs[event.key.toLowerCase()] = true;
    inputQueue.push({ key: event.key.toLowerCase(), pressed: true });
});

document.addEventListener('keyup', (event) => {
    inputs[event.key.toLowerCase()] = false;
    inputQueue.push({ key: event.key.toLowerCase(), pressed: false });
});

export function getInputs() {
    return inputs;
}

export function isKeyPressed(key) {
    return inputs[key] || false;
}

export async function waitForInput(key) {
    return new Promise((resolve) => {
        const checkInput = setInterval(() => {
            if (inputs[key.toLowerCase()]) {
                clearInterval(checkInput);
                resolve();
            }
        }, 16);
    });
}

export async function getInputQueue() {
    const queue = [...inputQueue];
    inputQueue.length = 0;
    return queue;
}