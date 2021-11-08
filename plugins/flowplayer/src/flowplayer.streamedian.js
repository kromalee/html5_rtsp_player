import {LogLevel, getTagged} from 'bp_logger';
import * as streamedian_p from 'streamedian/player';
import WebsocketTransport from 'streamedian/transport/websocket';
import RTSPClient from 'streamedian/client/rtsp/client';
import HLSClient from 'streamedian/client/hls/client';

(function () {
    var extension = function (flowplayer) {

        var engineName = "streamedian",
            common = flowplayer.common,
            extend = flowplayer.extend,

            isHlsType = function (typ) {
                return typ.toLowerCase().indexOf("mpegurl") > -1;
            },
            isRTSPType = function (typ) {
                return typ.toLowerCase().indexOf("rtsp") > -1;
            },


            //root is div , player is video tag
            engineImpl = function hlsjsEngine(player, root) {
                var bean = flowplayer.bean,
                    videoTag,
                    streamedian,

                    engine = {
                        engineName: engineName,

                        pick: function (sources) {
                            var i,
                                source;

                            for (i = 0; i < sources.length; i += 1) {
                                source = sources[i];
                                if (isHlsType(source.type) || isRTSPType(source.type)) {
                                    if (typeof source.src === 'string') {
                                        source.src = common.createAbsoluteUrl(source.src);
                                    }
                                    return source;
                                }
                            }
                        },

                        load: function (video) {
                            var conf = player.conf,
                                EVENTS = {
                                    ended: "finish",
                                    loadeddata: "ready",
                                    pause: "pause",
                                    play: "resume",
                                    progress: "buffer",
                                    ratechange: "speed",
                                    seeked: "seek",
                                    timeupdate: "progress",
                                    volumechange: "volume"
                                },
                                autoplay = !!video.autoplay || !!conf.autoplay;

                            if (!streamedian) {
                                common.removeNode(common.findDirect("video", root)[0]
                                    || common.find(".fp-player > video", root)[0]);
                                videoTag = common.createElement("video", {
                                    "class": "fp-engine " + engineName + "-engine",
                                    "autoplay": autoplay
                                        ? "autoplay"
                                        : false,
                                    "preload": conf.clip.preload || "metadata",
                                    "x-webkit-airplay": "allow"
                                });

                                Object.keys(EVENTS).forEach(function (key) {
                                    var flow = EVENTS[key],
                                        type = key + "." + engineName,
                                        arg;

                                    bean.on(videoTag, type, function (e) {
                                        if (conf.debug && flow.indexOf("progress") < 0) {
                                            console.log(type, "->", flow, e.originalEvent);
                                        }
                                        if (!player.ready && flow.indexOf("ready") < 0) {
                                            return;
                                        }


                                        switch (flow) {
                                            case "ready":
                                                arg = extend(player.video, {
                                                    duration: videoTag.duration,
                                                    seekable: videoTag.seekable.end(null),
                                                    width: videoTag.videoWidth,
                                                    height: videoTag.videoHeight,
                                                    url: player.video.src
                                                });
                                                break;
                                            case "resume":
                                                if (player.poster) {
                                                    // timeout needed for Firefox
                                                    setTimeout(function () {
                                                        player.poster = false;
                                                        common.removeClass(root, posterClass);
                                                    }, 10);
                                                }
                                                break;
                                            case "seek":
                                            case "progress":
                                                arg = videoTag.currentTime;
                                                break;
                                            case "speed":
                                                arg = videoTag.playbackRate;
                                                break;
                                            case "volume":
                                                arg = videoTag.volume;
                                                break;
                                        }

                                        player.trigger(flow, [player, arg]);
                                    });
                                });


                                player.on("error." + engineName, function () {
                                    if (streamedian) {
                                        window.StreamedianPlayer = null;
                                        streamedian.destroy();
                                        streamedian = 0;
                                    }
                                });

                                common.prepend(common.find(".fp-player", root)[0], videoTag);

                            } else {
                                window.StreamedianPlayer = null;
                                streamedian.destroy();
                                if ((player.video.src && video.src !== player.video.src) || video.index) {
                                    common.attr(videoTag, "autoplay", "autoplay");
                                }

                            }

                            // #28 obtain api.video props before ready
                            player.video = video;
                            player.engine[engineName] = streamedian;

                            getTagged("transport:ws").setLevel(LogLevel.Error);
                            var source = null

                            for (var src of video.sources) {
                                if (streamedian_p.WSPlayer.canPlayWithModules(src.type,[
                                        {
                                            client: RTSPClient,
                                            transport: WebsocketTransport
                                        },
                                        {
                                            client: HLSClient,
                                            transport: WebsocketTransport
                                        }
                                    ])) {
                                    source = src;
                                    break;
                                }
                            }

                            if (!source) return;


                            this.transport = {
                                constructor: WebsocketTransport,
                                options: conf.streamedian_player_config
                            };
                            streamedian = new streamedian_p.WSPlayer(videoTag, {
                                url: video.sources[0].src,
                                type: streamedian_p.StreamType.fromMime(video.sources[0].type),
                                bufferDuration: conf.streamedian_player_config.bufferDuration,
                                modules: [
                                    {
                                        client: RTSPClient,
                                        transport: this.transport
                                    },
                                    {
                                        client: HLSClient,
                                        transport: this.transport
                                    }
                                ]
                            });
                            window.StreamedianPlayer = streamedian;

                            if (videoTag.paused && autoplay) {
                                videoTag.play();
                            }
                        },

                        resume: function () {
                            videoTag.play();
                        },

                        pause: function () {
                            videoTag.pause();
                        },

                        seek: function (time) {
                            videoTag.currentTime = time;
                        },

                        volume: function (level) {
                            if (videoTag) {
                                videoTag.volume = level;
                            }
                        },

                        speed: function (val) {
                            videoTag.playbackRate = val;
                            player.trigger('speed', [player, val]);
                        },

                        unload: function () {
                            if (streamedian) {
                                var listeners = "." + engineName;
                                window.StreamedianPlayer = null;
                                streamedian.destroy();
                                streamedian = 0;
                                player.off(listeners);
                                bean.off(root, listeners);
                                bean.off(videoTag, listeners);
                                common.removeNode(videoTag);
                                videoTag = 0;
                            }
                        }
                    };

                return engine;
            };


        // only load engine if it can be used
        engineImpl.engineName = engineName; // must be exposed

        engineImpl.canPlay = function (type, conf) {
            if (streamedian_p.WSPlayer.canPlayWithModules(type,[
                    {
                        client: RTSPClient,
                        transport: WebsocketTransport
                    },
                    {
                        client: HLSClient,
                        transport: WebsocketTransport
                    }
                ])) {
                return true;
            }
            return false;
        };
        // if browser not supported native hls add plugin
        flowplayer.engines.unshift(engineImpl);
    }
    if (window.flowplayer) {
        extension(window.flowplayer);
    }
}());