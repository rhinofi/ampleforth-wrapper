import {expect} from 'chai';
import {createMockProvider, getWallets, deployContract} from 'ethereum-waffle';
import {WrapperLockFactory} from '../build/contract-types/WrapperLockFactory';

describe('WrapperLock', () => {
  const provider = createMockProvider();
  const [wallet] = getWallets(provider);

  it('deploys correctly', async () => {
    const instance = await new WrapperLockFactory(wallet).deploy(
      '0x0000000000000000000000000000000000000000',
      '',
      '',
      ''
    )
    expect(instance.address).to.be.properAddress;
  });
});
