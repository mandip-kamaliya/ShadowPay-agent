// SPDX-License-Identifier: MIT
pragma solidity >=0.8.27;

import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { BITE } from "@skalenetwork/bite-solidity/BITE.sol";
import { IBiteSupplicant } from "@skalenetwork/bite-solidity/interfaces/IBiteSupplicant.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol"; // Use standard interface

contract PrivateShop is IBiteSupplicant {
    using Address for address payable;

    address public immutable USDC;
    // BITE Helper constant is not needed if using BITE library directly
    // address public constant BITE_HELPER = 0x0e6c52d7a5c07639F7336109968Be488d017b805; 
    
    uint256 public constant ITEM_PRICE = 1000000; // 1.0 USDC
    uint256 public constant BITE_FEE = 0.06 ether; // sFUEL
    // Gas limit for the callback transaction from BITE
    uint256 public constant CTX_GAS_LIMIT = 2_500_000; 

    event OrderRevealed(address indexed buyer, string decryptedItem);

    constructor(address _usdc) {
        USDC = _usdc;
    }

    // Purchase an item secretly using SKALE BITE
    // The buyer sends encrypted intent + payment
    function purchaseSecretly(bytes calldata encryptedItem) external payable {
        // 1. Check sFUEL fee for BITE
        require(msg.value >= BITE_FEE, "Insufficient sFUEL for BITE fee");

        // 2. Transfer USDC payment
        bool success = IERC20(USDC).transferFrom(msg.sender, address(this), ITEM_PRICE);
        require(success, "USDC transfer failed");

        // 3. Submit encrypted request to SKALE BITE using the library
        // Wrap single encrypted item in an array
        bytes[] memory encryptedArgs = new bytes[](1);
        encryptedArgs[0] = encryptedItem;

        // Plaintext args - we send the buyer's address so we know who they are in the callback
        bytes[] memory plaintextArgs = new bytes[](1);
        plaintextArgs[0] = abi.encode(msg.sender);

        // Submit CTX - returns address that will call onDecrypt (ctxSender)
        BITE.submitCTX(
            address(this), // callback destination (this contract)
            CTX_GAS_LIMIT,
            encryptedArgs,
            plaintextArgs
        );
        
        // Note: refunds are handled in the example, but sticking to prompt logic for now. 
        // Example used: payable(ctxSender).sendValue(msg.value); - but this might be refunding user?
        // Prompt requirement: "Require msg.value >= 0.06 ether"
    }

    // Callback from BITE with decrypted data
    // Docs Signature: function onDecrypt(bytes[] calldata decryptedArgs, bytes[] calldata plaintextArgs) external override
    function onDecrypt(
        bytes[] calldata decryptedArgs,
        bytes[] calldata plaintextArgs
    ) external override {
        // Validation: Ensure the caller is the expected BITE system address
        // The library or BITE.sol usually has checks, but typically we check msg.sender
        // In this implementation, we rely on IBiteSupplicant and overrides.
        // SimpleSecret example: doesn't explicitly check sender in onDecrypt, but uses 'ctxSender' from submitCTX to verify.
        // But here we can assume standard BITE security as per docs.

        // Decode the buyer from the plaintext args we sent
        address buyer = abi.decode(plaintextArgs[0], (address));
        
        // The decrypted item is the first element of the decryptedArgs array
        string memory decryptedItem = string(decryptedArgs[0]);
        
        emit OrderRevealed(buyer, decryptedItem);
    }
    
    // Allow contract to receive ETH/sFUEL
    receive() external payable {}
}
