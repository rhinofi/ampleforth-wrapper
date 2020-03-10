import {ethers, Wallet} from 'ethers';
import {expect, use} from 'chai';
import {loadFixture, solidity} from 'ethereum-waffle';
import UFragments from '../build/UFragments.json';
import {AmpleforthWrapperProxyFactory} from '../build/contract-types/AmpleforthWrapperProxyFactory';
import {AmpleforthWrapperProxy} from '../build/contract-types/AmpleforthWrapperProxy';
import {UFragmentsFactory} from '../build/contract-types/UFragmentsFactory';
import {UFragments as Token} from '../build/contract-types/UFragments';

use(solidity);

describe('AmpleforthWrapper', () => {
  const INITIAL_SUPPLY = new ethers.utils.BigNumber('50000000000000000');

  const initialState = async (_, [owner, holder]: Wallet[]) => {
    const factory = new ethers.ContractFactory(UFragments.abi, UFragments.bytecode, owner);
    const token = await factory.deploy();
    await token['initialize(address)'](owner.address);
    const wrapper = await new AmpleforthWrapperProxyFactory(owner).deploy(token.address);
    await token.transfer(holder.address, 100);
    const asHolder = new UFragmentsFactory(holder).attach(token.address);
    await asHolder.approve(wrapper.address, new ethers.utils.BigNumber(2).pow(256).sub(1));
    return {
      wrapper: await new AmpleforthWrapperProxyFactory(holder).attach(wrapper.address),
      token: asHolder,
      owner: owner.address,
      ownerWallet: owner,
      holder: holder.address,
    };
  };

  const deposit = async (wrapper: AmpleforthWrapperProxy, value: number) => wrapper.deposit(value, 1);

  const withdraw = async (wrapper: AmpleforthWrapperProxy, holderAddress: string, owner: Wallet, value: number) => {
    const currentBlock = await wrapper.provider.getBlockNumber();
    const validUntil = currentBlock + 1000;
    const hash = await wrapper.keccak(holderAddress, wrapper.address, validUntil);
    const signature = await owner.signMessage(ethers.utils.arrayify(hash));
    const sig = ethers.utils.splitSignature(signature);
    return wrapper.withdraw(value, sig.v!, sig.r, sig.s, validUntil);
  };

  const rebase = async (token: Token, owner: Wallet, amount: ethers.utils.BigNumberish) => {
    await token.connect(owner).setMonetaryPolicy(owner.address);
    await token.connect(owner).rebase(0, amount);
  };

  it('deploys correctly', async () => {
    const {wrapper} = await loadFixture(initialState);
    expect(wrapper.address).to.be.a('string');
  });

  describe('Initial state – no supply changes', () => {
    it('balanceOf returns 0', async () => {
      const {wrapper, token, holder, owner} = await loadFixture(initialState);
      expect(await wrapper.balanceOf(holder)).to.equal(0);
      expect(await wrapper.balanceOf(owner)).to.equal(0);
      expect(await token.balanceOf(owner)).to.equal(INITIAL_SUPPLY.sub(100));
      expect(await token.balanceOf(holder)).to.equal(100);
    });

    it('after depositing 10 AMPL, balance in wrapper is 10 AMPL and balance in token is 10 AMPL smaller', async () => {
      const {wrapper, token, holder} = await loadFixture(initialState);
      await deposit(wrapper, 10);
      expect(await wrapper.balanceOf(holder)).to.equal(10);
      expect(await token.balanceOf(wrapper.address)).to.equal(10);
      expect(await token.balanceOf(holder)).to.equal(90);
    });

    it('total supply is calculated correctly', async () => {
      const {wrapper} = await loadFixture(initialState);
      await deposit(wrapper, 10);
      expect(await wrapper.totalSupply()).to.equal(10);
    });

    it('can withdraw correctly', async () => {
      const {wrapper, token, holder, ownerWallet} = await loadFixture(initialState);
      await deposit(wrapper, 10);

      await withdraw(wrapper, holder, ownerWallet, 3);
      expect(await wrapper.balanceOf(holder)).to.equal(7);
      expect(await wrapper.totalSupply()).to.equal(7);
      expect(await token.balanceOf(holder)).to.equal(93);

      await withdraw(wrapper, holder, ownerWallet, 7);
      expect(await wrapper.balanceOf(holder)).to.equal(0);
      expect(await token.balanceOf(holder)).to.equal(100);
      expect(await wrapper.totalSupply()).to.equal(0);
    });

    it('withdrawBalanceDifference works correctly', async () => {
      const {wrapper, token, owner, ownerWallet} = await loadFixture(initialState);
      await deposit(wrapper, 10);
      await token.transfer(wrapper.address, 25);

      expect(await token.balanceOf(owner)).to.equal(INITIAL_SUPPLY.sub(100));
      // Transfers 25 AMPL back to owner
      await wrapper.connect(ownerWallet).withdrawBalanceDifference();
      expect(await token.balanceOf(owner)).to.equal(INITIAL_SUPPLY.sub(75));
    });

    it('transferFrom works correctly', async () => {
      const {wrapper, holder, owner} = await loadFixture(initialState);
      await deposit(wrapper, 10);
      await wrapper.addProxy(holder);
      await wrapper.transferFrom(holder, owner, 3);
      expect(await wrapper.balanceOf(holder)).to.equal(7);
      expect(await wrapper.balanceOf(owner)).to.equal(3);
    });

    it('transfer doesnt do anything', async () => {
      const {wrapper, holder, owner} = await loadFixture(initialState);
      await deposit(wrapper, 10);
      await wrapper.transfer(owner, 3);
      expect(await wrapper.balanceOf(holder)).to.equal(10);
      expect(await wrapper.balanceOf(owner)).to.equal(0);
    });
  });

  describe('Supply increases twice', () => {
    it('10 AMPL transforms into 20 AMPL', async () => {
      const {wrapper, token, holder, ownerWallet} = await loadFixture(initialState);
      await deposit(wrapper, 10);
      await rebase(token, ownerWallet, INITIAL_SUPPLY);
      expect(await wrapper.balanceOf(holder)).to.equal(20);
      expect(await token.balanceOf(wrapper.address)).to.equal(20);
      expect(await token.balanceOf(holder)).to.equal(180);
    });

    it('total supply is calculated correctly', async () => {
      const {wrapper, token, ownerWallet} = await loadFixture(initialState);
      await deposit(wrapper, 10);
      await rebase(token, ownerWallet, INITIAL_SUPPLY);
      expect(await wrapper.totalSupply()).to.equal(20);
    });

    it('can withdraw correctly', async () => {
      const {wrapper, token, holder, ownerWallet} = await loadFixture(initialState);
      await deposit(wrapper, 10);
      await rebase(token, ownerWallet, INITIAL_SUPPLY);

      await withdraw(wrapper, holder, ownerWallet, 3);
      expect(await wrapper.balanceOf(holder)).to.equal(17);
      expect(await wrapper.totalSupply()).to.equal(17);
      expect(await token.balanceOf(holder)).to.equal(183);

      await withdraw(wrapper, holder, ownerWallet, 7);
      expect(await wrapper.balanceOf(holder)).to.equal(10);
      expect(await token.balanceOf(holder)).to.equal(190);
      expect(await wrapper.totalSupply()).to.equal(10);
    });

    it('withdrawBalanceDifference works correctly', async () => {
      const {wrapper, token, ownerWallet, owner} = await loadFixture(initialState);
      await deposit(wrapper, 10);
      await token.transfer(wrapper.address, 25);
      await rebase(token, ownerWallet, INITIAL_SUPPLY);

      expect(await token.balanceOf(owner)).to.equal(INITIAL_SUPPLY.mul(2).sub(200));
      // Transfers 50 AMPL back to owner
      await wrapper.connect(ownerWallet).withdrawBalanceDifference();
      expect(await token.balanceOf(owner)).to.equal(INITIAL_SUPPLY.mul(2).sub(150));
    });

    it('transferFrom works correctly', async () => {
      const {wrapper, token, holder, ownerWallet, owner} = await loadFixture(initialState);
      await deposit(wrapper, 10);
      await rebase(token, ownerWallet, INITIAL_SUPPLY);

      await wrapper.addProxy(holder);
      await wrapper.transferFrom(holder, owner, 3);
      expect(await wrapper.balanceOf(holder)).to.equal(17);
      expect(await wrapper.balanceOf(owner)).to.equal(3);
    });
  });

  describe('Supply shortens twice', () => {
    const DECREASE = `-${INITIAL_SUPPLY.div(2).toString()}`;

    it('25 AMPL transforms into 12 AMPL', async () => {
      const {wrapper, token, holder, ownerWallet} = await loadFixture(initialState);
      await deposit(wrapper, 25);
      await rebase(token, ownerWallet, DECREASE);

      expect(await wrapper.balanceOf(holder)).to.equal(12);
      expect(await token.balanceOf(wrapper.address)).to.equal(12);
      expect(await token.balanceOf(holder)).to.equal(37);
    });

    it('total supply is calculated correctly', async () => {
      const {wrapper, token, ownerWallet} = await loadFixture(initialState);
      await deposit(wrapper, 25);
      await rebase(token, ownerWallet, DECREASE);

      expect(await wrapper.totalSupply()).to.equal(12);
    });

    it('can withdraw correctly', async () => {
      const {wrapper, token, holder, ownerWallet} = await loadFixture(initialState);
      await deposit(wrapper, 25);
      await rebase(token, ownerWallet, DECREASE);

      expect(await wrapper.balanceOf(holder)).to.equal(12);
      await withdraw(wrapper, holder, ownerWallet, 3);
      expect(await wrapper.balanceOf(holder)).to.equal(9);
      expect(await wrapper.totalSupply()).to.equal(9);
      expect(await token.balanceOf(holder)).to.equal(40);

      await withdraw(wrapper, holder, ownerWallet, 7);
      expect(await wrapper.balanceOf(holder)).to.equal(2);
      expect(await token.balanceOf(holder)).to.equal(47);
      expect(await wrapper.totalSupply()).to.equal(2);
    });

    it('withdrawBalanceDifference works correctly', async () => {
      const {wrapper, token, owner, ownerWallet} = await loadFixture(initialState);
      await deposit(wrapper, 25);
      await token.transfer(wrapper.address, 30);
      await rebase(token, ownerWallet, DECREASE);

      expect(await token.balanceOf(owner)).to.equal(INITIAL_SUPPLY.div(2).sub(50));
      // Transfers 15 AMPL back to owner
      await wrapper.connect(ownerWallet).withdrawBalanceDifference();
      expect(await token.balanceOf(owner)).to.equal(INITIAL_SUPPLY.div(2).sub(35));
    });

    it('transferFrom works correctly', async () => {
      const {wrapper, token, holder, owner, ownerWallet} = await loadFixture(initialState);
      await deposit(wrapper, 10);
      await rebase(token, ownerWallet, DECREASE);

      await wrapper.addProxy(holder);
      await wrapper.transferFrom(holder, owner, 3);
      expect(await wrapper.balanceOf(holder)).to.equal(2);
      expect(await wrapper.balanceOf(owner)).to.equal(3);
    });
  });
});
