const fn = (function(){

    function g(){
        console.log('ok');
    }
    return g;
})();

export { fn as X };
