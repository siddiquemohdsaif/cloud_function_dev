const WebSocket = require('ws');

/**
 * 
# Here the how server send message

// 1) connection creation
query pram read by server.


// 2) send message from server
ws.send("message");


// 3) closed connection by server after send message
ws.close(4390, 'success');
ws.close(4490, 'failed');



the client wait for closed connection of websocket from server then create response based on :
1) on receive it store the message in variable for future use like : this.message = message
2) on connection closed means the server is respond full then client integrate and create response by :
  if close-code 4390 => response {  status: 200 , message: this.message } ,
  if close-code 4490 => response {  status: 400 , message: 'failed' } 
*/


class WebSocketHttpClient {
    constructor(serverUrl) {
        this.serverUrl = serverUrl;
        this.message = null; // To store the message received from the server
    }

    request(queryParams) {
        return new Promise((resolve, reject) => {
            // Construct the WebSocket URL with the given parameters
            const wsUrl = `${this.serverUrl}?${this._encodeQueryParams(queryParams)}`;
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                //console.log('WebSocket connection opened');
            };

            ws.onmessage = (event) => {
                //console.log(this.message)
                this.message = event.data; // Store the received message
            };

            ws.onclose = (event) => {
                if (event.code === 4390) {
                    resolve({ status: 200, message: this.message });
                } else if (event.code === 4490) {
                    reject({ status: 400, message: event.reason });
                } else {
                    reject({ status: 400, message: 'WebSocket connection closed unexpectedly' });
                }
                this.message = null; // Reset stored message after processing
            };

            ws.onerror = (error) => {
                reject({ status: 400, message: 'WebSocket connection error', error });
            };
        });
    }

    _encodeQueryParams(data) {
        return Object.keys(data)
            .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
            .join('&');
    }
}

module.exports = WebSocketHttpClient;
