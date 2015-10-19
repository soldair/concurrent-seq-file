# concurrent-seq-file

makes it safe to work on multiple jobs identified by a sequence at the same time.

or more technically.. 

extends `seq-file` to save the lowest completed sequence number from active async processes.

```js
var seq = require('concurrent-seq-file')('./test.seq')
var importantJob = require('some imaginary important job')

// stream that emits {seq:numeric id,doc:{}}
var follower = ... 

follower.on('data',function(obj){
  var done = seq(obj.seq)
  importantJob(function(){
    done()
  })
})

```


## api


- seq = module.exports(file[,options])
  - file - the file name to read the sequence from
  - options, optional 
  - returns the seq function.
  
- done = seq(sequenceId)
 - sequenceId is the next incrementing id number of the job you are starting.
 - returns done. call this when you are done with the job.

  
### notes

job timeouts should be implemented on top of this module.




