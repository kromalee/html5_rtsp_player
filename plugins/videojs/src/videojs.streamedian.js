import videojs from 'video.js';
import {getTagged} from 'streamedian/deps/bp_logger';
import {WSPlayer, StreamType} from 'streamedian/player';
import WebsocketTransport from 'streamedian/transport/websocket';
import RTSPClient from 'streamedian/client/rtsp/client';
import HLSClient from 'streamedian/client/hls/client';
import MediaError from 'streamedian/media_error'

const Log = getTagged("streamedian.video.js.plugin");

class StreamedianVideojs{
    initPlayer(source, tech, techOptions){
        var  player = videojs.getPlayer(techOptions.playerId);
        this.videojsPlayer_ = player;
        this.playerOptions_ = player.options_;
        this.tech_ = tech;
        this.streamedian_player_config_ = this.playerOptions_.streamedian_player_config;

        this.transport_ = {
            constructor: WebsocketTransport,
            options: this.streamedian_player_config_
        };

        var boundErrorHandler = this.onError.bind(this);
        this.player_ = new WSPlayer(tech.el(), {
            bufferDuration : this.streamedian_player_config_.bufferDuration,
            redirectNativeMediaErrors : false,
            errorHandler: boundErrorHandler,
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

    handleSource(source, tech, techOptions){
        if(this.player_) {
            this.player_.destroy();
            this.player_ = null;
        }

        this.initPlayer(source, tech, techOptions);
    }

    onError(error){
        Log.debug(error);
        this.tech_.reset();
        this.videojsPlayer_.error(error);
    }
}

let handle_ = new StreamedianVideojs;
class LiveSourceHandler {

    static canHandleSource(source) {
        if(source.type)
            return this.canPlayType(source.type);
        else if(source.src){
            const ext = Url.getFileExtension(source.src);
            return this.canPlayType(`video/${ext}`);
        }
        return '';
    }

    static handleSource(source, tech, options) {
        tech.setSrc(source.src);
        return handle_.handleSource(source, tech, options);
    }

    static canPlayType(type) {
        var canPlayType = '';
        if (WSPlayer.canPlayWithModules(type,[
                {
                    client: RTSPClient,
                    transport: WebsocketTransport
                },
                {
                    client: HLSClient,
                    transport: WebsocketTransport
                }
            ])) {
            canPlayType = 'probably';
        }
        return canPlayType;
    }

    static dispose(){
        Log.debug("dispose");
        handle_.player.dispose();
    }
};

const Html5Tech = videojs.getTech('Html5');
if(Html5Tech)
    Html5Tech.registerSourceHandler(LiveSourceHandler, 0);
else
    Log.error("Can't get Html5 Tech");
