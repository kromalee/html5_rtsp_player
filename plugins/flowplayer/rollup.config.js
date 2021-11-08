import babel from 'rollup-plugin-babel';
import buble from 'rollup-plugin-buble';
import alias from 'rollup-plugin-alias';

const path = require('path');

export default {
    entry: path.join(__dirname, '/src/flowplayer.streamedian.js'),
    targets: [
        {dest: path.join(__dirname, 'example/streamedian.flowplayer.min.js'), format: 'umd'}
    ],
    sourceMap: true,
    plugins: [
       // babel({
            //exclude: 'node_modules/**'
        // }),
        alias({
            bp_logger: path.join(__dirname, 'node_modules/bp_logger/logger'),
            streamedian: path.join(__dirname, '../../src')
        })
    ]

}
