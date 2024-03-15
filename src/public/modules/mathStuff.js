function aspectRatio(width, height) {
    function gcd(a, b) {
        return b === 0 ? a: gcd(b, a % b);
    }
    const divisor = gcd(width, height);
    return {x: width/divisor, y: height/divisor};
}

const mathStuff = Object.freeze({
    aspectRatio: (width, height) => aspectRatio(width, height)
})

export default mathStuff;