import {expect} from 'chai';
import {createMockProvider, getWallets} from 'ethereum-waffle';
import {UFragmentsFactory} from '../build/contract-types/UFragmentsFactory';
import {AmpleforthWrapperFactory} from '../build/contract-types/AmpleforthWrapperFactory';

describe('AmpleforthWrapper', () => {
  const provider = createMockProvider();
  const [wallet] = getWallets(provider);

  it('deploys correctly', async () => {
    const wrappedToken = await new UFragmentsFactory(wallet).deploy();
    const instance = await new AmpleforthWrapperFactory(wallet).deploy(wrappedToken.address);
    expect(instance.address).to.be.a('string');
  });
});
