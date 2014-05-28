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

Usage instructions
============

* Start the server in development mode: `$ su - coinchance -c "node /path/to/app.js"`
* Start the server in production mode: `$ su - coinchance -c "NODE_ENV=production node /path/to/app.js"`

### Donate!
- Vertcoin `Vd4eFKqQwwgXNGAKFDnwPEe81XnH9nyGH`
- Bitcoin `1P5xWYDQya9KGfA51iZxSb7No8LuTFCKGL`
