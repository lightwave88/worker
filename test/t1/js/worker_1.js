debugger;

self.onmessage = function (e) {
    // debugger;

    console.log('start(%s)', e.data);

    setTimeout(function() {
        // body
        console.log('end(%s)', e.data);
        self.postMessage(e.data)
    }, 800);
    
}
