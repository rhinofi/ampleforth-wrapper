import {expect} from 'chai';
import {createMockProvider, getWallets} from 'ethereum-waffle';
import {UFragmentsFactory} from '../build/contract-types/UFragmentsFactory';

describe('Ampleforth', () => {
  const provider = createMockProvider();
  const [wallet] = getWallets(provider);

  it('deploys correctly', async () => {
    const instance = await new UFragmentsFactory(wallet).deploy();
    expect(instance.address).to.be.a('string');
  });
});
