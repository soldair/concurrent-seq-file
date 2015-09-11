var SF = require('seq-file')

module.exports  = function(file,options){

  options = options||{}

  // save at a max rate of every second by default
  var throttleTime = options.throttleTime||1000

  var seqFile = new SF(file,options)
  var seqValue = seqFile.readSync()

  var leastActive = 0
  var leastDone = seqValue
  var activeSeqs = {}
  var doneSeqs = {}

  var o = {
    seqFile:seqFile,
    getSeq:function(){
      return seqValue
    },
    done:function(seq){
      delete activeSeqs[seq]
      doneSeqs[seq] = 1;

      if(leastDone > seq) leastDone = least(doneSeqs)
      if(leastActive === seq) leastActive = least(activeSeqs)

      updated = false;
      while(leastDone < leastActive) {
        seqValue = leastDone
        delete doneSeqs[leastValue]
        leastDone = least(doneSeqs)
        updated = true
      }
  
      if(updated) persistSeq()
    },
    start:function(seq){
      if(!leastActive || leastActive > seq) leastActive = seq 
      activeSequences[seq] = 1  
    }    
  }

  var persisting;
  function persistSeq(){
    if(persisting) return persisting++;
    persisting = 1
    seqFile.save(seqValue) 
  }

  // patch onSave for save callback
  var orig = seqFile.onSave
  seqFile.onSave = function(){
    var ret = orig.apply(this,arguments)
    setTimeout(function(){  
      if(persisting > 1) {
        persisting = 0
        persistSeq()
      } else persisting = 0
    },throttleTime).unref()
    return ret;
  }
  
}

function least(obj){
  var v = false;
  Object.keys(obj).forEach(function(k){
    if(v === false || k < v) v = k
  })
  return v;
}


