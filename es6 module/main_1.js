import { workerSettings } from './settings_1.js';
import { WorkerManager } from './workermanager_1.js';
import { JobForUser } from './job_1.js';

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

// 對外命令
function root() {
    let args = Array.from(arguments);
    let manager = WorkerManager.get_instance();

    return (new JobForUser(manager, args));
}

root.GModules = {
    workerSettings: workerSettings,
    WorkerManager: WorkerManager,
};

workerSettings.GModules["root"] = root;
WorkerManager.GModules["root"] = root;

export { root as webWorker };
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
    fn.setSourceScriptPath = function (path) {
        workerSettings.sourceScriptPath = path;
    };
    //----------------------------
    fn.setExtension1ScriptPath = function (path) {
        workerSettings.extension1ScriptPath = path;
    };
    //----------------------------
    fn.setMaxWorkers = function (num) {
        workerSettings.max_workers = num;
    };
    //----------------------------
    fn.setMinWorkers = function (num) {
        workerSettings.min_workers = num;
    };
    //----------------------------
    fn.setIdleTime = function (time) {
        workerSettings.idleTime = time;
    };
    //----------------------------
    fn.importScript = function (arg) {
        workerSettings.importScript(arg);
    };
    //----------------------------
    fn.getWorkers = function () {
        let manager = WorkerManager.get_instance();
        let workerList = Array.from(manager.workers);
        return workerList;
    };
    //----------------------------
    fn.getJobs = function () {
        let manager = WorkerManager.get_instance();
        manager.getJobs();
    };
    //----------------------------
    // 強制停止 worker
    // for node.js
    fn.terminateAllWorkers = function () {
        let manager = WorkerManager.get_instance();
        manager.terminateAllWorkers();
    };
})(root);

//----------------------------
function inject(_) {
    // 注入 _ 的工廠

    root.GModules["_"] = _;

    _.mixin({
        worker: root
    });
};

export { inject };
