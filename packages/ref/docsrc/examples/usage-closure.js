const { ref } = require("@esfx/ref");

function f() {
    let x = 1;
    return [ref(() => x, _ => x = _), () => print(x)];
}

const [r, p] = f();
p(); // 1
r.value = 2;
p(); // 2