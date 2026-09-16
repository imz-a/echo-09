const path=require('path');const {JSDOM}=require('jsdom');
(async()=>{const dom=await JSDOM.fromFile(path.join("D:/2atools/Workboddy/wig-echo","index.html"),{runScripts:"dangerously",resources:"usable",pretendToBeVisual:true});
const doc=dom.window.document;
await new Promise(r=>setTimeout(r,4000));
const sheets=Array.from(doc.styleSheets);
let all="";sheets.forEach(s=>{try{all+=Array.from(s.cssRules).map(r=>r.cssText).join("\n")+"\n";}catch(e){}});
const idx=all.indexOf("win-dots i::before");
require("fs").writeFileSync("D:/2atools/Workboddy/wig-echo/_css_dbg.txt","sheets="+sheets.length+"\nFOUND="+(idx>=0)+"\n"+(idx>=0?all.slice(idx-10,idx+400):"")+"\n","utf8");
dom.window.close();})();
