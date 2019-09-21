import { GModules } from './Gmodules_1.js';

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

    // 任務的時限，預設無時限
    $d.timeout = null;
})();
//--------------------------------------
// defaultSetting 的包覆者
const SettingProxy = {
    importScript: function (script) {

        if (!Array.isArray(script)) {
            script = [script];
        }
        script.forEach(function (s) {
            defaultSetting.importScriptList.push(s);
        });
    },
};


export { SettingProxy as workerSettings };
GModules["workerSettings"] = SettingProxy;


(function () {

    Object.defineProperty(SettingProxy, 'max_workers', {
        enumerable: true,
        configurable: false,
        // writable: false,
        get: function () {
            return defaultSetting.max_workers;
        },
        set: function (count) {
            const errorList = [];

            if (count < defaultSetting.min_workers) {
                errorList.push(`max_workers < min_workers(${defaultSetting.min_workers})`);
            }

            if (count < 1) {
                errorList.push('max_workers must < 1');
            }

            if (errorList.length) {
                let msg = errorList.join("\n");
                throw new Error(msg);
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
            const errorList = [];

            if (count > defaultSetting.max_workers) {
                errorList.push(`min_workers > max_workers(${defaultSetting.max_workers})`);
            }

            if (count < 0) {
                errorList.push('min_workers < 0');
            }

            if (errorList.length) {
                let msg = errorList.join("\n");
                throw new Error(msg);
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

            const _ = GModules["_"];

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

            const _ = GModules["_"];

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
    //------------------
    Object.defineProperty(SettingProxy, 'timeout', {
        enumerable: true,
        configurable: false,
        // writable: false,
        get: function () {

            if (typeof defaultSetting.timeout != "number") {
                defaultSetting.timeout = null;
            }

            return defaultSetting.timeout;
        },
        set: function (timeout) {
            if (typeof timeout != "number") {
                timeout = null;
            }
            defaultSetting.timeout = timeout;
        }
    });
}());
