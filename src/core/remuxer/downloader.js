import {MP4} from '../iso-bmff/mp4-generator.js';

export class MediaDownloader {
    constructor(parent) {
        this.parent = parent;
        this.header;
        this.byteBuffer = new Uint8Array(0);
        this.isRecording = false;

        this.DEFAULT_FILE_LENGTH = 180000; /*download every 3 minutes*/
        this.fileLength = this.DEFAULT_FILE_LENGTH;
    }

    init(tracks) {
        let tracks_list = [];
        for (let key in tracks) {
            let type = tracks[key].mp4track.type;
            if (type === "video" || type === "audio") {
                tracks_list.push(tracks[key].mp4track);
            }
        }

        this.header = MP4.initSegment(tracks_list, tracks[1].duration*tracks[1].timescale, tracks[1].timescale)
    }

    pushData(track, pay) {
        this.setBuffer(MP4.moof(track.seq, track.scaled(track.firstDTS), track.mp4track));
        this.setBuffer(MP4.mdat(pay));
    }

    record(recordvalue) {
        if (recordvalue) {
            if (!this.isRecording) {
                this.setBuffer(this.header);
                this.downloadInterval = setInterval(this.download.bind(this), this.fileLength);
            }
        } else {
            clearInterval(this.downloadInterval);
            this.download();
        }

        this.isRecording = recordvalue;
    }

    setFileLength(milliseconds) {
        this.fileLength = milliseconds;
    }

    setBuffer(data) {
        if (this.isRecording) {
            let tmp = new Uint8Array(this.byteBuffer.byteLength + data.byteLength);
            tmp.set(new Uint8Array(this.byteBuffer), 0);
            tmp.set(new Uint8Array(data), this.byteBuffer.byteLength);
            this.byteBuffer = tmp;
        }
    }


    download() {
        if (this.byteBuffer.length) {
            this.parent.eventSource.dispatchEvent('mediadata', this.byteBuffer);
            this.byteBuffer = new Uint8Array(0);
            this.setBuffer(this.header);
        }
    }

    destroy() {
        this.record(false);
    }
}

