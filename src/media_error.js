function SMediaError(data) {
    if(data instanceof SMediaError) {
        return data;
    }

    if (typeof data === 'number') {
        this.code = data;
    } else if (typeof value === 'string') {
        this.message = data;
    }

    if (!this.message) {
        this.message = SMediaError.defaultMessages[this.code] || '';
    }
}

SMediaError.prototype.code = 0;
SMediaError.prototype.message = '';

SMediaError.errorTypes = [
    'MEDIA_ERR_CUSTOM',
    'MEDIA_ERR_ABORTED',
    'MEDIA_ERR_NETWORK',
    'MEDIA_ERR_DECODE',
    'MEDIA_ERR_SRC_NOT_SUPPORTED',
    'MEDIA_ERR_ENCRYPTED',
    'MEDIA_ERR_TRANSPORT'
];

SMediaError.defaultMessages = {
    1: 'The fetching of the associated resource was aborted by the user\'s request.',
    2: 'Some kind of network error occurred which prevented the media from being successfully fetched, despite having previously been available.',
    3: 'Despite having previously been determined to be usable, an error occurred while trying to decode the media resource, resulting in an error.',
    4: 'The associated resource or media provider object (such as a MediaStream) has been found to be unsuitable.',
    5: 'The media is encrypted and we do not have the keys to decrypt it.',
    6: 'Transport error'
};

for (let errIndex = 0; errIndex < SMediaError.errorTypes.length; errIndex++) {
    SMediaError[SMediaError.errorTypes[errIndex]] = errIndex;
    SMediaError.prototype[SMediaError.errorTypes[errIndex]] = errIndex;
}
export default SMediaError;