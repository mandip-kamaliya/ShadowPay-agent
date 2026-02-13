// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

interface IBiteSupplicant {
    function submitCTX(bytes calldata encryptedItem) external payable;
}

contract PrivateShop {
    address public immutable USDC;
    address public constant BITE_HELPER = 0x0E6C52D7A5C07639f7336109968bE488d017B805;
    uint256 public constant ITEM_PRICE = 1000000; // 1.0 USDC
    uint256 public constant BITE_FEE = 0.06 ether; // sFUEL

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

        // 3. Submit encrypted request to SKALE BITE
        IBiteSupplicant(BITE_HELPER).submitCTX{value: msg.value}(encryptedItem);
    }

    // Callback from BITE with decrypted data
    function onDecrypt(address buyer, string calldata decryptedItem) external {
        require(msg.sender == BITE_HELPER, "Only BITE Helper can call this");
        emit OrderRevealed(buyer, decryptedItem);
    }
}
