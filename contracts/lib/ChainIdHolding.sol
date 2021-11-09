pragma solidity >=0.5.16;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

abstract contract ChainIdHolding is Initializable {
    uint256 public chainId;
    	function __ChainIdHolding_init() internal initializer {
        uint256 _cid;
        assembly {
            _cid := chainid()
        }
        chainId = _cid;
    }
    // constructor() internal {
        
    // }
}
