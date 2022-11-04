let testKey = "0x184d6d42334fa59845721081f7f7ee0e1929140ef64f8afaef5cb690d61fe3b1"
const { keccak256 } = require("ethers/lib/utils")
const ethers = require("ethers")
function getTestKeys(n) {
    let keys = []
    keys.push(testKey)
    for (var i = 1; i < n; i++) {
        let lastHash = keys[keys.length - 1]
        let nextHash = keccak256(lastHash)
        keys.push(nextHash)
    }

    const compare = function(k1, k2) {
        let address1 = new ethers.Wallet(k1).address
        let address2 = new ethers.Wallet(k2).address
        return ethers.BigNumber.from(address1).lt(address2) ? -1 : 1
    }

    keys.sort((k1, k2) => compare(k1, k2))

    let addresses = []
    for (const key of keys) {
        let wallet = new ethers.Wallet(key)
        addresses.push(wallet.address)
    }

    return {keys, addresses}
}

function getTestAddresses(n) {
    let ret = []
    let keys = getTestKeys(n)
    for (const key of keys) {
        let wallet = new ethers.Wallet(key)
        ret.push(wallet.address)
    }
    return ret
}


module.exports = {
    getTestKeys,
    getTestAddresses
}