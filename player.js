import { LogLevel, getTagged, setDefaultLogLevel } from './src/deps/bp_logger.js';
import * as streamedian from './src/player.js';
import WebsocketTransport from './src/transport/websocket.js';
import RTSPClient from './src/client/rtsp/client.js';
import { isSafari } from "./src/core/util/browser.js";


setDefaultLogLevel(LogLevel.Error);
getTagged("transport:ws").setLevel(LogLevel.Error);
getTagged("client:rtsp").setLevel(LogLevel.Debug);
getTagged("mse").setLevel(LogLevel.Debug);

window.Streamedian = {
    logger(tag) {
        return getTagged(tag)
    },
    player(node, opts) {
        if (!opts.socket) {
            throw new Error("socket parameter is not set");
        }

        let _options = {
            modules: [
                {
                    client: RTSPClient,
                    transport: {
                        constructor: WebsocketTransport,
                        options: {
                            socket: opts.socket
                        }
                    }
                }
            ],
            errorHandler(e) {
                if (opts.errorHandler) {
                    opts.errorHandler(e);
                } else {
                    alert(`Failed to start player: ${e.message}`);
                }
            },
            infoHandler(inf) {
                if (opts.infoHandler) {
                    opts.infoHandler(inf);
                }
            },
            dataHandler(data) {
                if (opts.dataHandler) {
                    opts.dataHandler(data);
                }
            },
            redirectNativeMediaErrors: opts.redirectNativeMediaErrors,
            bufferDuration: opts.bufferDuration,
            continuousFileLength: opts.continuousFileLength,
            eventFileLength: opts.eventFileLength,

            queryCredentials(client) {
                return new Promise((resolve, reject) => {
                    let c = prompt('input credentials in format user:password');
                    if (c) {
                        client.setCredentials.apply(client, c.split(':'));
                        resolve();
                    } else {
                        reject();
                    }
                });
            }
        };
        return new streamedian.WSPlayer(node, _options);
    }
};