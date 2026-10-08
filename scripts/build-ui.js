const path=require('node:path');
require('esbuild').buildSync({entryPoints:[path.join(__dirname,'../client/js/ui/notifications.jsx')],bundle:true,minify:true,target:['safari15','chrome100'],outfile:path.join(__dirname,'../client/vendor/notifications.js'),legalComments:'eof'});
