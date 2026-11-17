#!/bin/sh
# index.html faylini src papkasidagi qismlardan yig'adi
cd "$(dirname "$0")" && cat src/head.html src/d1.js src/d2.js src/d3.js src/d4.js src/app.js > index.html
