# ampleforth-wrapper
[Ampleforth token](https://github.com/ampleforth/uFragments) wrapper for DeversiFi.

The wrapper has been created in the following way:
1. The `WrapperLock.sol` contract's code has been taken from the wrapper on Tether Gold deployed under https://etherscan.io/address/0x134c16be1e0f19ce41855b71e0e29fba539728e9#code and uses GONS as internally held tokens
2. Two changes have been made in `WrapperLock.sol`:
    - Extract lines 363-364 into the `addToBalance` method
    - Extract lines 386-387 into the `subtractFromBalance` method
3. `AmpleforthWrapper.sol` provides decorators for all public methods converting AMPLs to/from GONS so that all public interfaces get and return token values in AMPLs.

To learn more, see [tests](https://github.com/DeversiFi/ampleforth-wrapper/blob/master/test/AmpleforthWrapper.ts).
