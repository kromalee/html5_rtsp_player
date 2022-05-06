import {MP4} from '../iso-bmff/mp4-generator.js';

export class MediaDownloader {
    static DEFAULT_FILE_LENGTH = 180000; /*download every 3 minutes*/

    constructor(parent) {
        this.parent = parent;
        this.remuxer;
        this.header;
        this.firstBuffer = new Uint8Array(0);
        this.secondBuffer = new Uint8Array(0);
        this.byteBuffer = this.firstBuffer;
        this.isSwaped = false;
        this.isPaused = false;
        this.isRecording = false;

        this.fileLength = this.DEFAULT_FILE_LENGTH;
    }

    init(event) {
        let tracks = event.detail;
        let tracks_list = [];
        for (let key in tracks) {
            let type = tracks[key].mp4track.type;
            if (type === "video" || type === "audio") {
                tracks_list.push(tracks[key].mp4track);
            }
        }

        this.header = MP4.initSegment(tracks_list, tracks[1].duration*tracks[1].timescale, tracks[1].timescale)
    }

    pushData(event) {
        if (this.isRecording) {
            if (this.byteBuffer.length == 0) {
                this.setBuffer(this.header);
            }

            this.setBuffer(event.detail[0]);
            this.setBuffer(event.detail[1]);
        }
    }

    record(recordvalue) {
        if (recordvalue) {
            if (!this.isRecording) {
                this.flushInterval = setInterval(this.flush.bind(this), this.fileLength);
            }
        } else {
            clearInterval(this.flushInterval);
            this.flush();
        }

        this.isRecording = recordvalue;
    }

    pause(value) {
        if (this.isRecording || this.isPaused) { 
            this.record(!value);
            this.isPaused = value;
        }
    }

    setBuffer(data) {
        if (this.isRecording) {
            let tmp = new Uint8Array(this.byteBuffer.byteLength + data.byteLength);
            tmp.set(new Uint8Array(this.byteBuffer), 0);
            tmp.set(new Uint8Array(data), this.byteBuffer.byteLength);
            this.byteBuffer = tmp;
        }
    }

    swapBuffer() {
        this.isSwaped = !this.isSwaped;

        if (this.isSwaped) {
            this.byteBuffer = this.secondBuffer;
            this.firstBuffer = new Uint8Array(0);
        } else {
            this.byteBuffer = this.firstBuffer;
            this.secondBuffer = new Uint8Array(0);
        }
    }

    flush() {
        let byteBuffer = this.byteBuffer;
        this.swapBuffer();
        if (this.header && byteBuffer.length > this.header.length) {
            this.parent.mediadata(byteBuffer);
        }
    }

    attachSource(remuxer) {
        this.remuxer = remuxer;
        this.remuxer.eventSource.addEventListener('mp4initsegement', this.init.bind(this));
        this.remuxer.eventSource.addEventListener('mp4payload', this.pushData.bind(this));
    }

    dettachSource() {
        if (this.remuxer) {
            this.remuxer.eventSource.removeEventListener('mp4initsegement');
            this.remuxer.eventSource.removeEventListener('mp4payload');
            this.remuxer = null;
        }
    }

    destroy() {
        this.record(false);
        this.dettachSource();
    }
}

