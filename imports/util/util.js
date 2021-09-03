// TODO - makeId should really check to see if id already
// exists in the database; if so keep making new ones til
// we find one that's available
export const makeId = function(length) {
	if (length === undefined) {
		length = 4;
	}
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

