import { workerSettings } from './settings_1.js';
import { WorkerManager } from './workermanager_1.js';

////////////////////////////////////////////////////////////////////////////
//
// 使用方式
// _.worker(原本 _ 的命令, 原本的參數...)
//
// 參數設定
// maxWorkers: 同時最多能跑 worker 的數量
// idleTime: worker 沒工作後多久會被銷毀
// sourceScriptPath: 告訴 worker _ 的路徑在哪
// extension1Path: 告訴 worker _.extension1 的路徑在哪
// settings: 得知所有設定的數值(唯讀)
//
////////////////////////////////////////////////////////////////////////////

function root() {
    let args = Array.from(arguments);
    let manager = WorkerManager.get_instance(root);

    // debugger;
    let p = manager.addJob(args);

    return p;
}

root.GModules = {};

// webWorker 為了是怕與 window.Worker 撞名
export { root };

workerSettings.GModules["root"] = root;
WorkerManager.GModules["root"] = root;
//----------------------------
// 對外的設定
(function (fn) {
    // 取得設定
    Object.defineProperty(fn, 'settings', {
        enumerable: true,
        configurable: false,
        writable: false,
        value: workerSettings,
    });
    //----------------------------
    // 要初始化幾個 workers
    // 預設是只有啟動 _.worker() 才會建立 worker
    fn.initWorkers = function (count) {
        let manager = WorkerManager.get_instance();
        manager.initWorkers(count);
    };
    //----------------------------
    fn.setSourceScriptPath = function () {

    };
    //----------------------------
    fn.setExtension1ScriptPath = function () {

    };
    //----------------------------
    fn.setMaxWorkers = function () {

    };
    //----------------------------
    fn.setMinWorkers = function () {

    };
    //----------------------------
    fn.setIdleTime = function () {

    };
    //----------------------------
    fn.addImportScript = function () {

    };
    //----------------------------
    fn.getWorkers = function () {
        let manager = WorkerManager.get_instance();
        let workerList = Array.from(manager.workers);
        return workerList;
    };
    //----------------------------
    fn.getJobs = function () {

    };
})(root);

//----------------------------
(function () {
    // 注入 _ 的工廠
    let _;

    if (typeof (window) == "undefined" || typeof (document) == "undefined") {
        // es6 只能在 browser 下跑
        return;
    }

    if (typeof (window._) != "undefined") {
        _ = window._;
    }

    root.GModules["_"] = _;

    // 限制作用環境

    Object.defineProperty(root, '_', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: _,
    });

    _.mixin({
        worker: root
    });
})();
