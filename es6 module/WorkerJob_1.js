import { GModules } from './Gmodules_1.js';

///////////////////////////////////////////////////////////////////////////////
//
// 任務
//
///////////////////////////////////////////////////////////////////////////////
let jobUID = 0;

class WorkerJob {
    // args: 使用者給的參數
    constructor(manager, args, jobOptions) {
        this.id = jobUID++;

        // 整合者
        this.manager = manager;

        // 任務執行者
        this.worker;
        //------------------
        // 使用這對這次任務的操作設定
        this.jobOptions = jobOptions;

        // 使用者給的參數
        this.args;
        //------------------
        // 執行命令
        this.command;

        this.fnArgs = {};

        this.timeHandle;
        //------------------
        this._promise;
        this._resolve;
        this._reject;
        //------------------

        // 偵測箭頭符號函式
        this.reg_1 = /\((.*)\)(?:\s|\r|\n)*=>(?:\s|\r|\n)*{([\s\S]*)}/;

        // 偵測函式
        this.reg_2 = /^[^(]+\((.*?)\)(?:\s|\r|\n)*{([\s\S]*)}/;
        //------------------
        this._init(args);
    }
    //------------------------------------------------------------------
    _init(args) {
        const $this = this;

        if (!Array.isArray(args)) {
            throw new TypeError("job.args must be array");
        }

        this.command = args.shift();

        this.args = args;

        // 過濾 function
        // function 無法通過 worker
        this.args = this.args.map(function (arg, i) {

            if (typeof arg == "function") {
                this.fnArgs[i] = this._analyzeFunction(arg);
                return null;
            }
            return arg;
        }, this);


        this._promise = new Promise(function (res, rej) {
            $this._resolve = res;
            $this._reject = rej;
        });
    }
    //------------------------------------------------------------------
    // 分離出 function 的 參數，內文
    _analyzeFunction(fn) {
        debugger;

        fn = fn.toString();

        let regRes;

        regRes = this.reg_1.exec(fn);

        if (regRes == null) {
            regRes = this.reg_2.exec(fn);
        }

        if (regRes == null) {
            throw new TypeError("no support your function format");
        }

        let args = regRes[1];
        let fnContext = regRes[2];

        args = args.split(",");


        return {
            args: args,
            fnContext: fnContext
        };
    }
    //------------------------------------------------------------------
    // 要對 worker 發出命令
    getCommand2Worker() {
        let command = {
            command: (this.command),
            args: (this.args),
            fnArgs: (this.fnArgs),
            jobID: (this.id)
        };
        return command;
    };
    //------------------------------------------------------------------
    // worker 通知執行任務
    // 若需要，設置計時器
    start(worker) {

        // job 執行者
        this.worker = worker;


        console.log('worker(%s)接任務(%s)', this.worker.id, this.id);

        // 檢查是需否對任務設置時限
        let timeout = this.manager.settings.timeout;

        if (this.jobOptions.timeout != null) {
            timeout = jobOptions.timeout;
        }

        if (timeout == null) {
            return;
        }
        //-----------------------
        // 設置計時器
        let timeOutJob = (function () {

            // 超過時間，worker 直接作廢
            this.worker.leave();

            this.reject(new Error("timeout"));

        }).bind(this);

        console.log("為任務設置計時器(%sms),job(%s),worker(%s)", timeout, this.id, this.worker.id);

        this.timeHandle = setTimeout(timeOutJob, timeout);
    }
    //------------------------------------------------------------------
    resolve(data) {

        if (this.timeHandle) {
            console.log("job(%s) resolve 清除計時器", this.id);
            clearTimeout(this.timeHandle);
            this.timeHandle = undefined;
        }

        this._resolve(data);
    };
    //------------------------------------------------------------------
    reject(e) {

        if (this.timeHandle) {
            console.log("job(%s) reject 清除計時器", this.id);
            clearTimeout(this.timeHandle);
            this.timeHandle = undefined;
        }
        this._reject(e);
    };
    //------------------------------------------------------------------
    promise() {
        return this._promise;
    };
}



export { WorkerJob };
GModules["WorkerJob"] = WorkerJob;
