// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "../lib/DTOUpgradeableBase.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

contract Vesting is DTOUpgradeableBase, PausableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeMathUpgradeable for uint256;

    IERC20Upgradeable public tokenAddress;
    uint256 public tokenPerMonth;

    address[] public users;
    mapping(address => bool) public mappingUser;
    mapping(address => uint256) public lastUserTimeVesting;

    uint256 public startVestingTime;


    modifier onlyUser() {
        require(mappingUser[msg.sender], "!invalid user");
        _;
    }

    event Vesting(address user, uint256 amount);


    function initialize(
        IERC20Upgradeable _tokenAddress,
        uint256 _tokenPerMonth,
        uint256 _startVestingTime
    ) external initializer {
        __UpgradeableBase_initialize();
        __Pausable_init();
        tokenAddress = _tokenAddress;
        tokenPerMonth = _tokenPerMonth;
        startVestingTime = _startVestingTime == 0 ? block.timestamp : _startVestingTime;
    }

    function setTokenAddress(IERC20Upgradeable _token) public onlyOwner {
        tokenAddress = _token;
    }

    function setUsersVesting(address[] memory _users, bool isSet) public onlyOwner {
        for (uint256 i = 0; i < _users.length; i++) {
            address user = _users[i];
            if  (isSet) {
                if (!mappingUser[user]) {
                    mappingUser[user] = isSet;
                    users.push(user);
                }
            } else {
                if (mappingUser[user]) {
                    mappingUser[user] = isSet;
                    for (uint256 j =0; j < users.length; j++) {
                        if (users[j] == user) {
                            users[j] = users[users.length - 1];
                            users.pop();
                            break;
                        }
                    }
                }
            }
        }
    }

    function setPause() public onlyOwner whenNotPaused {
        _pause();
    }
    function setUnpause() public onlyOwner whenPaused {
        _unpause();
    }

    function vesting() public onlyUser whenNotPaused {
        require(block.timestamp > startVestingTime);
        if (lastUserTimeVesting[msg.sender] != 0) {
            require(block.timestamp - lastUserTimeVesting[msg.sender] >= 30 days, "not enough 1 month");
        }
        uint256 amount = tokenPerMonth.div(users.length);
        require(tokenAddress.balanceOf(address(this)) >= amount, "out of token amount");

        lastUserTimeVesting[msg.sender] = block.timestamp;
        tokenAddress.safeTransferFrom(address(this), msg.sender, amount);

        emit Vesting(msg.sender, amount);
    }

    function getNextClaim(address user) public view returns (uint256) {
        if (!mappingUser[user]) {
            return 0;
        }
        if (lastUserTimeVesting[msg.sender] == 0) {
            return 0;
        }
        return lastUserTimeVesting[msg.sender] + 30 days;
    }

}
