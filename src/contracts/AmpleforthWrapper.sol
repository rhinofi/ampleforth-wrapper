pragma solidity 0.4.24;

import "./WrapperLock.sol";

contract AmpleforthWrapper is WrapperLock {
    constructor(address _originalToken) WrapperLock(_originalToken, "Ampleforth Wrapper", "AMPL", 9) {

    }

    // @override
    function balanceOf(address _owner) public constant returns (uint256) {
        revert("Should return balance in AMPL (not gons)");
    }

    // @override
    function transfer(address _to, uint256 _value) public returns (bool) {
        revert("Value should be in AMPL (not gons)");
    }

    // @override
    function transferFrom(address _from, address _to, uint _value) public {
        revert("Value should be in AMPL (not gons)");
    }
}
