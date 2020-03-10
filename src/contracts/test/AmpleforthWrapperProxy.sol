pragma solidity 0.4.24;

import "../AmpleforthWrapper.sol";

/**
  *** Should not be deployed! ***
  Proxy contract aimed for transferFrom method testing.
*/
contract AmpleforthWrapperProxy is AmpleforthWrapper {
    constructor(address _originalToken) AmpleforthWrapper(_originalToken) {}

    function addProxy(address _addr) public {
        TRANSFER_PROXY_VEFX = _addr;
    }
}
