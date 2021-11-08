import Clappr from 'clappr';

import * as streamedian from 'streamedian/player';
import WebsocketTransport from 'streamedian/transport/websocket';
import RTSPClient from 'streamedian/client/rtsp/client';
import HLSClient from 'streamedian/client/hls/client';

export class ClapprLive extends Clappr.HTML5Video {
    constructor(options) {
        super(options);
        this.transport_ = {
            constructor: WebsocketTransport,
            options: options.streamedian_player_config_,
        };
        this.player_ = new streamedian.WSPlayer(this.el, {
            bufferDuration : options.streamedian_player_config_.bufferDuration,
            url: options.sources[0].source,
            modules: [
                {
                    client: RTSPClient,
                    transport: this.transport_
                },
                {
                    client: HLSClient,
                    transport: this.transport_
                }
            ]
        });
        window.StreamedianPlayer = this.player_;
    }

    play(){
        this.el.play();
    }

    destroy() {
        super.destroy();
        this.player_.destroy();
        this.player_ = null;
        window.StreamedianPlayer = null;
    }
}

ClapprLive.canPlay = function (resourceUrl, mimeType) {
    let canPlay = streamedian.WSPlayer.canPlayWithModules(mimeType,[
        {
            client: RTSPClient,
            transport: WebsocketTransport
        },
        {
            client: HLSClient,
            transport: WebsocketTransport
        }]);
    return canPlay;
};

// global export user will can use it
window.ClapprLive = ClapprLive;