const roomManager=require('../room/room-manager');

function chapterRule(index){return roomManager.chapterRule(index);}
function chapterIndex(room){return Math.max(0,Math.min(2,Number(room?.areaIndex||0)));}
function chapterLabel(room){return chapterRule(chapterIndex(room)).label;}
function isFinalChapter(room){return chapterIndex(room)>=Math.max(0,(room?.selectedAreas?.length||1)-1);}
function advanceChapter(room){return roomManager.beginNextArea(room);}
module.exports={chapterRule,chapterIndex,chapterLabel,isFinalChapter,advanceChapter};
