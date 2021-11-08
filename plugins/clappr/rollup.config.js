import babel from 'rollup-plugin-babel';
import alias from 'rollup-plugin-alias';
import uglify from 'rollup-plugin-uglify';

const path = require('path');

export default {
    entry: path.join(__dirname, 'src/streamedian.clappr.js'),
    targets: [
        {
            dest: path.join(__dirname, 'example/streamedian.clappr.min.js'),
            format: 'iife',
            name: 'streamedian.clappr'
        }
    ],
    sourceMap: true,
    plugins: [
        babel({
            // exclude: 'node_modules/**',
        }),
        alias({
            streamedian: path.join(__dirname,'../../src')
        })
    ]
}