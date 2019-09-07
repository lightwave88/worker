debugger;

self.onmessage = function (e) {
    debugger;

    let data = e.data;


    let fn = new Function(data.b);
    fn();

    console.dir(data);
}
