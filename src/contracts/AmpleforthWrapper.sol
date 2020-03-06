pragma solidity 0.4.24;

import "./WrapperLock.sol";

contract AmpleforthWrapper is WrapperLock {
    constructor(address _originalToken) WrapperLock(_originalToken, "Ampleforth Wrapper", "AMPL", 9) {

    }
}
