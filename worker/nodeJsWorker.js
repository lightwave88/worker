//////////////////////////////////////////////
//
// node.js worker 的本體
//
//////////////////////////////////////////////

const { parentPort, workerData } = require('worker_threads');


const self = this;


const data = workerData;

console.dir(workerData);

parentPort.on('message', function (event) {

    console.log('recieve msg');
    console.dir(arguments);

    parentPort.postMessage('Hi ' + event.data);
    // self.close();
});

console.log(`i am worker(%s)`, __dirname);


parentPort.postMessage("I'm working before postMessage('ali').");