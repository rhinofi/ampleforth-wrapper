pragma solidity 0.4.24;

import "./WrapperLock.sol";

contract AmpleforthWrapper is WrapperLock {
    using SafeMath for uint256;

    /**
      Constants copied from UFragments.sol
    */
    uint256 private constant DECIMALS = 9;
    uint256 private constant MAX_UINT256 = ~uint256(0);
    uint256 private constant INITIAL_FRAGMENTS_SUPPLY = 50 * 10**6 * 10**DECIMALS;
    uint256 private constant TOTAL_GONS = MAX_UINT256 - (MAX_UINT256 % INITIAL_FRAGMENTS_SUPPLY);

    constructor(address _originalToken) WrapperLock(_originalToken, "Ampleforth Wrapper", "AMPL", DECIMALS) {}

    // @override
    function balanceOf(address _owner) public constant returns (uint256) {
        return fromGon(super.balanceOf(_owner));
    }

    // @override
    function totalSupply() public view returns (uint256) {
        return fromGon(super.totalSupply());
    }

    // @override
    function transferFrom(address _from, address _to, uint _value) public {
        return super.transferFrom(_from, _to, toGon(_value));
    }

    // @override
    function addToBalance(uint256 _value) internal {
        return super.addToBalance(toGon(_value));
    }

    // @override
    function subtractFromBalance(uint256 _value) internal {
        return super.subtractFromBalance(toGon(_value));
    }

    // @override
    function withdrawBalanceDifference() public onlyOwner returns (bool success) {
        uint256 balance = IERC20(originalToken).balanceOf(address(this));
        require(balance.sub(totalSupply()) > 0);
        IERC20(originalToken).safeTransfer(msg.sender, balance.sub(totalSupply()));

        return true;
    }

    function gonsPerFragment() internal view returns (uint256) {
        return TOTAL_GONS.div(IERC20(originalToken).totalSupply());
    }

    function toGon(uint256 value) internal view returns (uint256) {
        return value.mul(gonsPerFragment());
    }

    function fromGon(uint256 value) internal view returns (uint256) {
        return value.div(gonsPerFragment());
    }
}
