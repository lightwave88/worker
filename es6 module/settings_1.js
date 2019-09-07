///////////////////////////////////////////////////////////////////////////////
//
// 預設 worker 會彈性隨效能在(max_workers, min_workers)之間調整數量
//
// 但若不想 worker 的數量自動彈性調整，可以設定(max_workers = min_workers)
//
///////////////////////////////////////////////////////////////////////////////



const defaultSetting = {};

(function () {
    const $d = defaultSetting;

    // 同時能運行最大的 worker 數量
    $d.max_workers = 2;

    // idle 時要維持幾個 workers 待命
    $d.min_workers = 0;

    // 當 worker 沒任務可接時
    // 閒置多久後會被銷毀
    $d.idleTime = (1000 * 30);

    // (uderscore, lodash) url
    $d.sourceScriptPath;

    // extension1.url
    $d.extension1ScriptPath;

    // 要被 import 的 script
    $d.importScriptList = [];
})();
//--------------------------------------
const SettingProxy = {
    addImportScript: function (script) {

        if (!Array.isArray(script)) {
            script = [script];
        }
        script.forEach(function (s) {
            defaultSetting.importScriptList.push(s);
        });
    },    
};

SettingProxy.GModules = {};

export { SettingProxy as workerSettings };


(function () {

    Object.defineProperty(SettingProxy, 'max_workers', {
        enumerable: true,
        configurable: false,
        // writable: false,
        get: function () {
            return defaultSetting.max_workers;
        },
        set: function (count) {

            if (count < defaultSetting.min_workers) {
                throw new Error(`worker maxWorkersCount < minWorkersCount(${defaultSetting.min_workers})`);
            }

            if (count < 1) {
                errorList.push('max_workers must >= 1');
            }

            defaultSetting.max_workers = count;
        }
    });

    //------------------
    Object.defineProperty(SettingProxy, 'min_workers', {
        enumerable: true,
        configurable: false,
        // writable: false,
        get: function () {
            return defaultSetting.min_workers;
        },
        set: function (count) {
            if (count > defaultSetting.max_workers) {
                throw new Error(`workers count > maxWorkersNum(${defaultSetting.max_workers})`);
            }
            workerSettings.min_workers = count;
        }
    });
    //------------------
    Object.defineProperty(SettingProxy, 'idleTime', {
        enumerable: true,
        configurable: false,
        // writable: false,
        get: function () {
            return defaultSetting.idleTime;
        },
        set: function (time) {

            if (time < 0) {
                throw new Error("idleTime must be >= 0");
            }
            defaultSetting.idleTime = time;
        }
    });
    //------------------
    Object.defineProperty(SettingProxy, 'sourceScriptPath', {
        enumerable: true,
        configurable: false,
        // writable: false,
        get: function () {
            const root = SettingProxy.GModules["root"];
            const _ = root.GModules["_"];

            let info = _.$extension1.info;

            let path = (defaultSetting.sourceScriptPath != null) ?
                defaultSetting.sourceScriptPath : info.sourceScriptPath;

            return path;
        },
        set: function (path) {
            defaultSetting.sourceScriptPath = path;
        }
    });
    //------------------
    Object.defineProperty(SettingProxy, 'extension1ScriptPath', {
        enumerable: true,
        configurable: false,
        // writable: false,
        get: function () {
            // debugger;
            const root = SettingProxy.GModules["root"];
            const _ = root.GModules["_"];

            let info = _.$extension1.info;

            let path = (defaultSetting.extension1ScriptPath != null) ?
                defaultSetting.extension1ScriptPath : info.extension1ScriptPath;

            return path;
        },
        set: function (path) {
            defaultSetting.extension1Path = path;
        }
    });

    //------------------
    Object.defineProperty(SettingProxy, 'importScriptList', {
        enumerable: true,
        configurable: false,
        // writable: false,
        get: function () {
            return defaultSetting.importScriptList;
        },
        set: function () {

        }
    });

}());










