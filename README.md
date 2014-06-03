coin-chance
===========

An open source crypto currency play-and-invest gambling site

Requirements
===========

* [node.js](http://nodejs.org/) installed
* A running wallet that has a [JSON-RPC api compatible with that of bitdoind](https://en.bitcoin.it/wiki/Original_Bitcoin_client/API_calls_list)
* [Mongodb](https://www.mongodb.org/) installed and running
* Server SSL certificates

Installation instructions
===========

1. Unpack source to any empty directory.
2. Modify config.js (Details coming soon)
3. Setup service user: `$ useradd -m -s /bin/bash coinchance`
4. Configure secret values in /home/coinchance/.bash_profile : 

    ```bash 
    # /home/coinchance/.bash_profile 
    export COIN_CHANCE_CONNSTR=mongodb://localhost/test 
    export COIN_CHANCE_SSLKEY=/path/to/ssl.key  
    export COIN_CHANCE_SSLCERT=/path/to/ssl.crt 
    export COIN_CHANCE_COOKIESECRET=my_cookie_secret 
    export COIN_CHANCE_RPCPORT=18332 
    export COIN_CHANCE_RPCHOST=localhost 
    export COIN_CHANCE_RPCUSER=user 
    export COIN_CHANCE_RPCPASSWORD=password
    ```
5. Keep configuration private to service user: `$ chmod 700 /home/coinchance/.bashrc`

Configuration instructions
============
Modify config.js to configure site.
All below variables must be present unless otherwise specified.
Configuration file format will be changed with the 1.0.0 version (whenever that comes out).

* `exports.DECIMAL_PLACES` -  *format:Number* How many decimal places the site's currency uses. Bitcoin has 8, for instance. **This must be the exact number of decimal places for that coin. Unexpected results may occur, especially if it is set too high.**
* `exports.COIN_NETWORK_FEE` - *format:BigNumber* Put the fee your bitcoind-like is set up to charge per transaction here. **This must exactly match the transaction fee your bitcoind-like will charge for transactions!! Withdraws may fail or even worse, bookeeping may fail in unexpected ways!** 
* `exports.TOTAL_WITHDRAW_FEE` - *format:BigNumber* Put the total fee withdrawals have here. This must be greater than or equal to `COIN_NETWORK_FEE`.
* `exports.INVESTMENT_DECIMAL_PLACES` - *format:Number* How precise investment calculations are. Longer is better, 16 is suggested.
* `exports.SRC_LINK` - *format:String* A link for where to download (or purchase) the source of the site being run. If it is set as an empty string (i.e., ""), the server will serve its own source as a .tar.gz file.
* `exports.SESSION_STORE_TYPE` - *format:String* The session store method used. The only valid values for this option are `"REDIS"` and `"MEMORY"`. Memory is recommended only for development.
    * `exports.SESSION_STORE_OPTIONS` - *format:Object* Options for the session store. For `"REDIS"`, it takes the same format as [Options](https://github.com/visionmedia/connect-redis#options).
* `exports.SITE_NAME` - *optional* Currently unused.
* `exports.SITE_TITLE` - *format:String* The name of the site. Used in the upper-left corner and in the website title.
* `exports.SITE_DESCRIPTION` - *format:String* A description of the site. Used in the website title.
* `exports.CURRENCY_SYMBOL` - *format:String* The site's currency's symbol or designator.
* `exports.BASE_URL` - *optional* Currently unused.
* `exports.SOCKETIOPORT` - *optional* Currently unused.
* `exports.LISTENPORT` - *format:Number* The port the site is served on. Recommended `80` for http and `443` for https.
* `exports.SSL_ENABLED` - *format:Boolean* Turns SSL/HTTPS on or off. The only valid values are `true` and `false`.
* `exports.MINIFY_CACHE_DIR` - *optional* Currently unused.
* `exports.HOUSE_CUT` - *format:BigNumber* The portion of wagers that the house takes from investor profits.
* `exports.MINIMUM_BET` - *format:BigNumber* The minimum stake a user can place. A user will always be able to place a bet of 0.
* `exports.DELAY_BET_AMOUNT` - *optional* Currently unused.
* `exports.MINIMUM_BETS_BEFORE_RANDOMIZE` - *optional* Currently unused.
* `exports.HOUSE_EDGE` - *format:BigNumber* House edge.
* `exports.HOUSE_MAX_USER_PROFIT_PORTION_OF_BANKROLL` - *format:BigNumber* The portion of the house bankroll that a user can have as a profit. **For best results, do not go over** `HOUSE_EDGE`**!**
* `exports.MIN_DEPOSIT_CONFIRMATIONS` - *format:Number* How many confirmations required for deposits.
* `exports.CHAT_MESSAGE_HISTORY_LENGTH` - *format:Number* How many chat messages that are displayed from history when a user loads the page.


**The below options should be changed carefully. This file is covered by the AGPL and must be considered sharable**
* `exports.MONGO_CONN_STR` - *format:String* Where to find the MongoDB connection string. 
* `exports.SSLKEY` - *format:String* *optional only if* `SSL_ENABLED` *is false*. The location of the SSL key file.
* `exports.SSLCERT` - *format:String* *optional only if* `SSL_ENABLED` *is false*. The location of the SSL cert file.
* `exports.COOKIE_SECRET` - *format:String* A secret passphrase for encrypting  cookies
* Coin rpc info:
    * `exports.COIN_RPC_PORT` - *format:String* Port of the coin JSON RPC service
    * `exports.COIN_RPC_HOST` - *format:String* Host of the coin JSON RPC service
    * `exports.COIN_RPC_USER` - *format:String* User of the coin JSON RPC service
    * `exports.COIN_RPC_PASSWORD` - *format:String* User of the coin JSON RPC service



Usage instructions
============

* Start the server in development mode: `$ su - coinchance -c "node /path/to/app.js"`
* Start the server in production mode: `$ su - coinchance -c "NODE_ENV=production node /path/to/app.js"`

### Donate!
- Vertcoin `Vd4eFKqQwwgXNGAKFDnwPEe81XnH9nyGH`
- Bitcoin `1P5xWYDQya9KGfA51iZxSb7No8LuTFCKGL`
