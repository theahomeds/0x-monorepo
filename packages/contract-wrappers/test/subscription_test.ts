import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { DoneCallback } from '@0xproject/types';
import * as _ from 'lodash';
import 'mocha';
import * as Sinon from 'sinon';

import { ContractWrappers, ERC20TokenApprovalEventArgs, ERC20TokenEvents } from '../src';
import { DecodedLogEvent } from '../src/types';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';
import { tokenUtils } from './utils/token_utils';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('SubscriptionTest', () => {
    let contractWrappers: ContractWrappers;
    const config = {
        networkId: constants.TESTRPC_NETWORK_ID,
    };
    before(async () => {
        contractWrappers = new ContractWrappers(provider, config);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('#subscribe', () => {
        const indexFilterValues = {};
        let tokenAddress: string;
        let stubs: Sinon.SinonStub[] = [];
        before(() => {
            const tokenAddresses = tokenUtils.getDummyERC20TokenAddresses();
            tokenAddress = tokenAddresses[0];
        });
        afterEach(() => {
            contractWrappers.erc20Token.unsubscribeAll();
            _.each(stubs, s => s.restore());
            stubs = [];
        });
        it('Should allow unsubscribeAll to be called successfully after an error', (done: DoneCallback) => {
            (async () => {
                const callback = (err: Error | null, _logEvent?: DecodedLogEvent<ERC20TokenApprovalEventArgs>) =>
                    _.noop.bind(_);
                contractWrappers.erc20Token.subscribe(
                    tokenAddress,
                    ERC20TokenEvents.Approval,
                    indexFilterValues,
                    callback,
                );
                stubs = [
                    Sinon.stub((contractWrappers as any)._web3Wrapper, 'getBlockIfExistsAsync').throws(
                        new Error('JSON RPC error'),
                    ),
                ];
                contractWrappers.erc20Token.unsubscribeAll();
                done();
            })().catch(done);
        });
    });
});
